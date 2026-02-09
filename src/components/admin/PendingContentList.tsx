import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  FileText, Music, Video, Check, X, Loader2, 
  Clock, User, Calendar, ExternalLink 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ContentStatus = 'pending' | 'approved' | 'rejected';
type ContentType = 'book' | 'audio' | 'video';

interface Content {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  type: ContentType;
  status: ContentStatus;
  language: string | null;
  tags: string[] | null;
  file_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  contributor_id: string;
  signed_file_url?: string | null;
  signed_cover_url?: string | null;
}

const typeIcons: Record<ContentType, React.ElementType> = {
  book: FileText,
  audio: Music,
  video: Video,
};

export function PendingContentList() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Generate signed URLs for files and covers
      const contentWithSignedUrls = await Promise.all(
        ((data as Content[]) || []).map(async (item) => {
          const [signedFileUrl, signedCoverUrl] = await Promise.all([
            getSignedUrl(item.file_url),
            getSignedUrl(item.cover_image_url)
          ]);
          return { ...item, signed_file_url: signedFileUrl, signed_cover_url: signedCoverUrl };
        })
      );
      
      setContent(contentWithSignedUrls);
    } catch (error: any) {
      console.error('Error fetching pending content:', error);
      toast.error('Failed to load pending content');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: Content) => {
    setActionLoading(item.id);
    try {
      const { error } = await supabase
        .from('content')
        .update({ 
          status: 'approved' as ContentStatus,
          published_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`"${item.title}" has been approved`);
      setContent(prev => prev.filter(c => c.id !== item.id));
    } catch (error: any) {
      console.error('Error approving content:', error);
      toast.error('Failed to approve content');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (item: Content) => {
    setSelectedContent(item);
    setAdminNotes('');
    setRejectDialogOpen(true);
  };

  const MAX_ADMIN_NOTES_LENGTH = 5000;

  const handleReject = async () => {
    if (!selectedContent) return;

    // Validate admin notes length
    if (adminNotes.length > MAX_ADMIN_NOTES_LENGTH) {
      toast.error(`Admin notes must be less than ${MAX_ADMIN_NOTES_LENGTH} characters`);
      return;
    }

    setActionLoading(selectedContent.id);
    try {
      const { error } = await supabase
        .from('content')
        .update({ 
          status: 'rejected' as ContentStatus,
          admin_notes: adminNotes.trim() || null
        })
        .eq('id', selectedContent.id);

      if (error) throw error;

      toast.success(`"${selectedContent.title}" has been rejected`);
      setContent(prev => prev.filter(c => c.id !== selectedContent.id));
      setRejectDialogOpen(false);
      setSelectedContent(null);
    } catch (error: any) {
      console.error('Error rejecting content:', error);
      toast.error('Failed to reject content');
    } finally {
      setActionLoading(null);
    }
  };

  const TypeIcon = (type: ContentType) => {
    const Icon = typeIcons[type];
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No Pending Content</h3>
          <p className="text-sm text-muted-foreground mt-1">
            All submissions have been reviewed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {content.length} item{content.length !== 1 ? 's' : ''} pending review
          </p>
        </div>

        {content.map((item) => (
          <Card key={item.id} className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {(item.signed_cover_url || item.cover_image_url) ? (
                    <img 
                      src={item.signed_cover_url || item.cover_image_url || ''} 
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center">
                      {TypeIcon(item.type)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.title}
                      <Badge variant="outline" className="capitalize">
                        {TypeIcon(item.type)}
                        <span className="ml-1">{item.type}</span>
                      </Badge>
                    </CardTitle>
                    {item.author && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {item.author}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.language && (
                  <span className="bg-muted px-2 py-1 rounded">{item.language}</span>
                )}
                {item.tags?.map((tag, i) => (
                  <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {(item.signed_file_url || item.file_url) && (
                    <a 
                      href={item.signed_file_url || item.file_url || ''} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View File
                    </a>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRejectDialog(item)}
                    disabled={actionLoading === item.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(item)}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Provide feedback for the contributor about why this content was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Content: {selectedContent?.title}</p>
              <Textarea
                placeholder="Enter reason for rejection (optional but recommended)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {adminNotes.length}/5000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
