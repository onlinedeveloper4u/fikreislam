import { useState, useEffect } from 'react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { getMedia, updateMediaStatus } from '@/actions/media';
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
import { MediaUploadForm } from './MediaUploadForm';
import { MediaEditDialog } from './MediaEditDialog';
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

type MediaStatus = 'شائع شدہ' | 'غیر شائع شدہ';
type MediaType = 'آڈیو' | 'ویڈیو';

interface Media {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  language: string | null;
  file_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  signed_file_url?: string | null;
  // Specialized metadata
  duration?: string | null;
  venue?: string | null;
  speaker?: string | null;
  media_type?: string | null;
  categories?: string[] | null;
  lecture_date_gregorian?: string | null;
  hijri_date_day?: number | null;
  hijri_date_month?: string | null;
  hijri_date_year?: number | null;
}

export function MediaList() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MediaStatus | 'تمام'>('تمام');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'تمام'>('تمام');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<MediaType>('آڈیو');
  const [editingItem, setEditingItem] = useState<Media | null>(null);
  const { activeUploads, uploadMedia, editMedia, deleteMedia, cancelUpload } = useUpload();

  const statusConfig: Record<MediaStatus, { icon: React.ElementType; color: string; label: string }> = {
    'غیر شائع شدہ': { icon: Clock, color: 'bg-amber-500/10 text-amber-600', label: "غیر شائع شدہ" },
    'شائع شدہ': { icon: CheckCircle, color: 'bg-green-500/10 text-green-600', label: "شائع شدہ" },
  };

  const typeIcons: Record<MediaType, React.ElementType> = {
    'آڈیو': Music,
    'ویڈیو': Video,
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data, error } = await getMedia();

      if (error) throw error;

      setMedia(data as unknown as Media[] || []);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      toast.error("آپ کا میڈیا لوڈ کرنے میں ناکامی");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: MediaStatus) => {
    setActionLoading(id);
    try {
      const item = media.find(m => m.id === id);
      if (newStatus === 'غیر شائع شدہ' && item?.file_url?.startsWith('ia://')) {
        const identifier = extractIAIdentifier(item.file_url);
        if (identifier) await deleteIAItem(identifier);
      }

      const { error } = await updateMediaStatus(id, newStatus);

      if (error) throw error;

      setMedia(prev => prev.map(m =>
        m.id === id ? { ...m, status: newStatus } : m
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
    const item = media.find(m => m.id === id);
    if (!item) return;

    await deleteMedia(item.id, item.title, item.file_url, item.cover_image_url);
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'تمام' || item.status === statusFilter;
    const matchesType = typeFilter === 'تمام' || item.type === typeFilter;
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
        <h2 className="text-lg font-semibold">{"تمام میڈیا"}</h2>
        <div className="flex gap-2">
          <Button className="gradient-primary" onClick={() => { setUploadType('آڈیو'); setIsUploadOpen(true); }}>
            <Plus className="ml-2 h-4 w-4" />
            {"نیا میڈیا شامل کریں"}
          </Button>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {"نیا میڈیا شامل کریں"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {"نیا میڈیا شامل کرنے کے لیے فارم پُر کریں"}
                </DialogDescription>
              </DialogHeader>

              {(uploadType === 'آڈیو' || uploadType === 'ویڈیو') && (
                <MediaUploadForm
                  initialType={uploadType}
                  onSuccess={() => {
                    setIsUploadOpen(false);
                    fetchMedia();
                  }}
                />
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
            <SelectItem value="تمام">{"تمام حالات"}</SelectItem>
            <SelectItem value="شائع شدہ">{"شائع شدہ"}</SelectItem>
            <SelectItem value="غیر شائع شدہ">{"غیر شائع شدہ"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={"قسم"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="تمام">{"تمام"}</SelectItem>
            <SelectItem value="آڈیو">{"آڈیو"}</SelectItem>
            <SelectItem value="ویڈیو">{"ویڈیو"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {`${media.length} میں سے ${filteredMedia.length} اشیاء دکھائی جا رہی ہیں`}
      </p>

      {/* Media List */}
      <div className="space-y-3">
        {filteredMedia.map((item) => {
          const statusCfg = statusConfig[item.status];
          const StatusIcon = statusCfg.icon;
          const TypeIcon = typeIcons[item.type];

          return (
            <Card key={item.id} className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate sm:whitespace-normal">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'آڈیو'
                        ? (item.speaker || "مقرر")
                        : "ویڈیو"}
                      • {item.language}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <Badge className={cn("text-[10px] sm:text-xs px-2 py-0", statusCfg.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusCfg.label}
                  </Badge>

                  <div className="flex items-center gap-1">
                    {item.file_url && (
                      <Button variant="ghost" size="icon" asChild title={"فائل دیکھیں"} className="h-8 w-8">
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
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Select
                      value={item.status}
                      onValueChange={(v: MediaStatus) => handleStatusChange(item.id, v)}
                      disabled={actionLoading === item.id}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        {actionLoading === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="شائع شدہ">{"شائع شدہ"}</SelectItem>
                        <SelectItem value="غیر شائع شدہ">{"غیر شائع شدہ"}</SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" title={"حذف کریں"}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{"حذف کریں"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`کیا آپ واقعی "${item.title}" کو حذف کرنا چاہتے ہیں؟`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row gap-2 justify-end mt-4">
                          <AlertDialogCancel className="mt-0">{"منسوخ"}</AlertDialogCancel>
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
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredMedia.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{"کوئی ڈیٹا دستیاب نہیں ہے"}</p>
          </div>
        )}
      </div>

      {/* Media Edit Dialog */}
      {(editingItem?.type === 'آڈیو' || editingItem?.type === 'ویڈیو') && (
        <MediaEditDialog
          media={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={fetchMedia}
        />
      )}
    </div>
  );
}
