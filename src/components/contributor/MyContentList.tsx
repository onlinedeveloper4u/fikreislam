import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Music, Video, Clock, CheckCircle, XCircle, Trash2, Loader2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ContributorStats } from './ContributorStats';
import { ContentEditDialog } from './ContentEditDialog';

type ContentStatus = 'pending' | 'approved' | 'rejected';
type ContentType = 'book' | 'audio' | 'video';

interface Content {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  author: string | null;
  language: string | null;
  tags: string[] | null;
  status: ContentStatus;
  admin_notes: string | null;
  created_at: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Rejected' },
};

const typeIcons = {
  book: FileText,
  audio: Music,
  video: Video,
};

export function MyContentList() {
  const { user } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('contributor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load your content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setContent(content.filter(c => c.id !== id));
      toast.success('Content deleted successfully');
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (item: Content) => {
    setEditingContent(item);
    setEditDialogOpen(true);
  };

  const stats = {
    total: content.length,
    pending: content.filter(c => c.status === 'pending').length,
    approved: content.filter(c => c.status === 'approved').length,
    rejected: content.filter(c => c.status === 'rejected').length,
  };

  const filteredContent = statusFilter === 'all' 
    ? content 
    : content.filter(c => c.status === statusFilter);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ContributorStats {...stats} />

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>My Uploads</CardTitle>
              <CardDescription>
                Track and manage your submitted content
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchContent}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {statusFilter === 'all' 
                ? "You haven't uploaded any content yet."
                : `No ${statusFilter} content found.`}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => {
                const TypeIcon = typeIcons[item.type];
                const status = statusConfig[item.status];
                const StatusIcon = status.icon;
                const canEdit = item.status === 'pending' || item.status === 'rejected';
                const canDelete = item.status === 'pending' || item.status === 'rejected';

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TypeIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                      </div>
                      {item.author && (
                        <p className="text-sm text-muted-foreground">by {item.author}</p>
                      )}
                      {item.status === 'rejected' && item.admin_notes && (
                        <p className="text-sm text-red-600 mt-2 p-2 bg-red-500/10 rounded">
                          Admin feedback: {item.admin_notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted on {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ContentEditDialog
        content={editingContent}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchContent}
      />
    </div>
  );
}
