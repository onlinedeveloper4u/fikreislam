import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl, deleteFromGoogleDrive, resolveExternalUrl } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  FileText, Music, Video, Check, X, Loader2,
  Clock, CheckCircle, XCircle, Search, ExternalLink,
  Trash2, Plus, Globe, Pencil
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ContentUploadForm } from './ContentUploadForm';
import { ContentEditDialog } from './ContentEditDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ContentStatus = 'pending' | 'approved' | 'rejected';
type ContentType = 'book' | 'audio' | 'video';

interface Content {
  id: string;
  title: string;
  author: string | null;
  type: ContentType;
  status: ContentStatus;
  language: string | null;
  file_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  signed_file_url?: string | null;
  // Audio specialized metadata
  duration?: string | null;
  venue?: string | null;
  speaker?: string | null;
  audio_type?: string | null;
  categories?: string[] | null;
  lecture_date_gregorian?: string | null;
  hijri_date_day?: number | null;
  hijri_date_month?: string | null;
  hijri_date_year?: number | null;
}

export function AllContentList() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Content | null>(null);
  const { t } = useTranslation();

  const statusConfig: Record<ContentStatus, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-500/10 text-amber-600', label: t('dashboard.unpublishedContent') },
    approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600', label: t('dashboard.published') },
    rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-600', label: t('dashboard.unpublishedContent') },
  };

  const typeIcons: Record<ContentType, React.ElementType> = {
    book: FileText,
    audio: Music,
    video: Video,
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contentWithSignedUrls = await Promise.all(
        ((data as Content[]) || []).map(async (item) => {
          const signedUrl = await getSignedUrl(item.file_url);
          return { ...item, signed_file_url: signedUrl };
        })
      );

      setContent(contentWithSignedUrls);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error(t('dashboard.myContent.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContentStatus) => {
    setActionLoading(id);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'approved') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setContent(prev => prev.map(c =>
        c.id === id ? { ...c, status: newStatus } : c
      ));

      // If rejected, trash from Google Drive if applicable
      if (newStatus === 'rejected') {
        const item = content.find(c => c.id === id);
        if (item?.file_url?.startsWith('google-drive://')) {
          await deleteFromGoogleDrive(item.file_url);
        }
      }

      toast.success(t('common.success'));
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(t('dashboard.roleUpdateFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    const item = content.find(c => c.id === id);
    if (!item) {
      setActionLoading(null);
      return;
    }

    const deletePromise = async () => {
      // 1. Delete associated files from storage
      if (item.file_url) {
        if (item.file_url.startsWith('google-drive://')) {
          const success = await deleteFromGoogleDrive(item.file_url);
          if (!success) console.warn('Google Drive deletion returned failure status');
        } else {
          // Supabase Storage
          await supabase.storage
            .from('content-files')
            .remove([item.file_url]);
        }
      }

      // 2. Delete cover image if it exists
      if (item.cover_image_url) {
        await supabase.storage
          .from('content-files')
          .remove([item.cover_image_url]);
      }

      // 3. Delete related records (Analytics, Favorites, etc.)
      await Promise.all([
        supabase.from('content_analytics').delete().eq('content_id', id),
        supabase.from('favorites').delete().eq('content_id', id),
        supabase.from('playlist_items').delete().eq('content_id', id)
      ]);

      // 4. Finally delete the content record
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContent(prev => prev.filter(c => c.id !== id));
      return item.title;
    };

    toast.promise(deletePromise(), {
      loading: t('dashboard.myContent.deleting', { title: item.title, defaultValue: `Deleting ${item.title}...` }),
      success: (title) => t('dashboard.myContent.deleteSuccess', { title }),
      error: (err) => {
        console.error('Delete error:', err);
        return t('dashboard.myContent.deleteFailed');
      },
      finally: () => setActionLoading(null),
    });
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold">{t('dashboard.allContent')}</h2>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.upload.title')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('dashboard.upload.title')}</DialogTitle>
            </DialogHeader>
            <ContentUploadForm onSuccess={() => {
              setIsUploadOpen(false);
              fetchContent();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t('common.filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('dashboard.myContent.allStatus')}</SelectItem>
            <SelectItem value="approved">{t('dashboard.published')}</SelectItem>
            <SelectItem value="rejected">{t('dashboard.unpublishedContent')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t('dashboard.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="book">{t('dashboard.books')}</SelectItem>
            <SelectItem value="audio">{t('dashboard.audio')}</SelectItem>
            <SelectItem value="video">{t('dashboard.video')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('dashboard.myContent.itemsCount', { count: filteredContent.length, total: content.length })}
      </p>

      {/* Content List */}
      <div className="space-y-3">
        {filteredContent.map((item) => {
          const statusCfg = statusConfig[item.status];
          const StatusIcon = statusCfg.icon;
          const TypeIcon = typeIcons[item.type];

          return (
            <Card key={item.id} className="border-border/50 bg-card/50">
              <CardContent className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'audio'
                        ? (item.speaker || t('dashboard.taxonomyManagement.types.speaker', { defaultValue: 'Speaker' }))
                        : (item.author || t('common.noAuthor'))}
                      • {t(`common.languages.${item.language?.toLowerCase().trim() || 'en'}`, { defaultValue: item.language })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusCfg.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusCfg.label}
                  </Badge>

                  {(item.signed_file_url || item.file_url) && (
                    <Button variant="ghost" size="icon" asChild title={t('dashboard.myContent.viewFile')}>
                      <a href={resolveExternalUrl(item.signed_file_url || item.file_url)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingItem(item)}
                    title={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Select
                    value={item.status}
                    onValueChange={(v: ContentStatus) => handleStatusChange(item.id, v)}
                    disabled={actionLoading === item.id}
                  >
                    <SelectTrigger className="w-28">
                      {actionLoading === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">{t('dashboard.published')}</SelectItem>
                      <SelectItem value="rejected">{t('dashboard.unpublishedContent')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t('common.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('common.confirmDelete', { title: item.title })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredContent.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('common.noData')}</p>
          </div>
        )}
      </div>

      <ContentEditDialog
        content={editingItem as any}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSuccess={() => {
          fetchContent();
          setEditingItem(null);
        }}
      />
    </div>
  );
}
