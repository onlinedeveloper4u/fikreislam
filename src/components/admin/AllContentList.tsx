import { useState, useEffect } from 'react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { getContent, updateContentStatus } from '@/actions/content';
import { resolveItemPageUrl } from '@/lib/storage';
import { extractIAIdentifier } from '@/lib/ia-utils';
import { deleteIAItem } from '@/actions/internetArchive';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  FileText, Music, Video, Loader2,
  Clock, CheckCircle, XCircle, Search, ExternalLink,
  Trash2, Plus, Pencil
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AudioUploadForm } from './AudioUploadForm';
import { BookUploadForm } from './BookUploadForm';
import { VideoUploadForm } from './VideoUploadForm';
import { AudioEditDialog } from './AudioEditDialog';
import { BookEditDialog } from './BookEditDialog';
import { VideoEditDialog } from './VideoEditDialog';
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
  const [uploadType, setUploadType] = useState<ContentType>('audio');
  const [editingItem, setEditingItem] = useState<Content | null>(null);
  const { activeUploads, uploadContent, editContent, deleteContent, cancelUpload } = useUpload();

  const statusConfig: Record<ContentStatus, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-500/10 text-amber-600', label: "غیر شائع شدہ" },
    approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600', label: "شائع شدہ" },
    rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-600', label: "غیر شائع شدہ" },
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
      const { data, error } = await getContent();

      if (error) throw error;

      setContent(data as unknown as Content[] || []);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error("آپ کا مواد لوڈ کرنے میں ناکامی");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContentStatus) => {
    setActionLoading(id);
    try {
      // If rejected, remove from Internet Archive first as requested
      const item = content.find(c => c.id === id);
      if (newStatus === 'rejected' && item?.file_url?.startsWith('ia://')) {
        const identifier = extractIAIdentifier(item.file_url);
        if (identifier) await deleteIAItem(identifier);
      }

      const publishedAt = newStatus === 'approved' ? new Date().toISOString() : undefined;
      const { error } = await updateContentStatus(id, newStatus, publishedAt);

      if (error) throw error;

      setContent(prev => prev.map(c =>
        c.id === id ? { ...c, status: newStatus } : c
      ));

      toast.success("کامیاب");
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error("کردار تبدیل کرنے میں ناکامی");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    const item = content.find(c => c.id === id);
    if (!item) return;

    await deleteContent(item.id, item.title, item.file_url, item.cover_image_url);
    setContent(prev => prev.filter(c => c.id !== id));
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
        <h2 className="text-lg font-semibold">{"تمام مواد"}</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                {"نیا مواد شامل کریں"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setUploadType('audio'); setIsUploadOpen(true); }}>
                {"آڈیو"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setUploadType('book'); setIsUploadOpen(true); }}>
                {"کتب"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setUploadType('video'); setIsUploadOpen(true); }}>
                {"ویڈیو"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {"نیا مواد شامل کریں"} - {(uploadType === "book" ? "کتب" : uploadType === "audio" ? "آڈیو" : "ویڈیو")}
                </DialogTitle>
              </DialogHeader>

              {uploadType === 'audio' && (
                <AudioUploadForm onSuccess={() => {
                  setIsUploadOpen(false);
                  fetchContent();
                }} />
              )}
              {uploadType === 'book' && (
                <BookUploadForm onSuccess={() => {
                  setIsUploadOpen(false);
                  fetchContent();
                }} />
              )}
              {uploadType === 'video' && (
                <VideoUploadForm onSuccess={() => {
                  setIsUploadOpen(false);
                  fetchContent();
                }} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={"تلاش"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={"فلٹر"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"تمام حالات"}</SelectItem>
            <SelectItem value="approved">{"شائع شدہ"}</SelectItem>
            <SelectItem value="rejected">{"غیر شائع شدہ"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={"قسم"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"تمام"}</SelectItem>
            <SelectItem value="book">{"کتب"}</SelectItem>
            <SelectItem value="audio">{"آڈیو"}</SelectItem>
            <SelectItem value="video">{"ویڈیو"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {`${content.length} میں سے ${filteredContent.length} اشیاء دکھائی جا رہی ہیں`}
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
                        ? (item.speaker || "مقرر")
                        : (item.author || "نامعلوم مصنف")}
                      • {item.language}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusCfg.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusCfg.label}
                  </Badge>

                  {item.file_url && (
                    <Button variant="ghost" size="icon" asChild title={"فائل دیکھیں"}>
                      <a href={resolveItemPageUrl(item.file_url)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingItem(item)}
                    title={"ترمیم"}
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
                      <SelectItem value="approved">{"شائع شدہ"}</SelectItem>
                      <SelectItem value="rejected">{"غیر شائع شدہ"}</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={"حذف کریں"}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{"حذف کریں"}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {`کیا آپ واقعی "${item.title}" کو حذف کرنا چاہتے ہیں؟`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{"منسوخ"}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {"حذف کریں"}
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
            <p>{"کوئی ڈیٹا دستیاب نہیں ہے"}</p>
          </div>
        )}
      </div>

      {/* Specialized Edit Dialogs */}
      {editingItem?.type === 'audio' && (
        <AudioEditDialog
          content={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={fetchContent}
        />
      )}
      {editingItem?.type === 'book' && (
        <BookEditDialog
          content={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={fetchContent}
        />
      )}
      {editingItem?.type === 'video' && (
        <VideoEditDialog
          content={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={fetchContent}
        />
      )}
    </div>
  );
}
