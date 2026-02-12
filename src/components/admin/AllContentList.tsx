import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/lib/storage';
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
  Trash2
} from 'lucide-react';
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
  created_at: string;
  signed_file_url?: string | null;
}

export function AllContentList() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const { t } = useTranslation();

  const statusConfig: Record<ContentStatus, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-500/10 text-amber-600', label: t('moderation.pending') },
    approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600', label: t('dashboard.published') },
    rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-600', label: t('moderation.reject') },
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
        .select('id, title, author, type, status, language, file_url, created_at')
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
      toast.error(t('moderation.loadPendingFailed'));
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
      toast.success(t('moderation.statusUpdated'));
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(t('dashboard.roleUpdateFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContent(prev => prev.filter(c => c.id !== id));
      toast.success(t('moderation.contentDeleted'));
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast.error(t('moderation.deleteFailed'));
    } finally {
      setActionLoading(null);
    }
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('moderation.searchContent')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t('moderation.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('moderation.allStatus')}</SelectItem>
            <SelectItem value="pending">{t('moderation.pending')}</SelectItem>
            <SelectItem value="approved">{t('dashboard.published')}</SelectItem>
            <SelectItem value="rejected">{t('moderation.reject')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t('moderation.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('moderation.allTypes')}</SelectItem>
            <SelectItem value="book">{t('dashboard.books')}</SelectItem>
            <SelectItem value="audio">{t('dashboard.audio')}</SelectItem>
            <SelectItem value="video">{t('dashboard.video')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('moderation.itemsCount', { current: filteredContent.length, total: content.length })}
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
                      {item.author || t('moderation.noAuthor')} • {t(`common.languages.${item.language}`)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusCfg.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusCfg.label}
                  </Badge>

                  {(item.signed_file_url || item.file_url) && (
                    <Button variant="ghost" size="icon" asChild title={t('moderation.viewFile')}>
                      <a href={item.signed_file_url || item.file_url || ''} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

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
                      <SelectItem value="pending">{t('moderation.pending')}</SelectItem>
                      <SelectItem value="approved">{t('dashboard.published')}</SelectItem>
                      <SelectItem value="rejected">{t('moderation.reject')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t('moderation.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('moderation.deleteContent')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('moderation.deleteConfirm', { title: item.title })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('moderation.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('moderation.delete')}
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
            <p>{t('moderation.noContentFound')}</p>
          </div>
        )}
      </div>
    </div >
  );
}
