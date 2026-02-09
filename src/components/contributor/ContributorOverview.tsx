import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ContributorStats } from './ContributorStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, TrendingUp, Eye } from 'lucide-react';

export function ContributorOverview() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['contributor-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: content, error } = await supabase
        .from('content')
        .select('id, status, type')
        .eq('contributor_id', user.id);

      if (error) throw error;

      const total = content?.length || 0;
      const pending = content?.filter(c => c.status === 'pending').length || 0;
      const approved = content?.filter(c => c.status === 'approved').length || 0;
      const rejected = content?.filter(c => c.status === 'rejected').length || 0;

      // Get content types breakdown
      const books = content?.filter(c => c.type === 'book').length || 0;
      const audio = content?.filter(c => c.type === 'audio').length || 0;
      const video = content?.filter(c => c.type === 'video').length || 0;

      // Get view counts for approved content
      const approvedContentIds = content?.filter(c => c.status === 'approved').map(c => c.id) || [];
      let totalViews = 0;

      if (approvedContentIds.length > 0) {
        const { count } = await supabase
          .from('content_analytics')
          .select('*', { count: 'exact', head: true })
          .in('content_id', approvedContentIds)
          .eq('action_type', 'view');
        
        totalViews = count || 0;
      }

      return { total, pending, approved, rejected, books, audio, video, totalViews };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Your content contribution statistics</p>
      </div>

      <ContributorStats
        total={stats.total}
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Content Breakdown
            </CardDescription>
            <CardTitle className="text-lg">By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Books</span>
                <span className="font-medium">{stats.books}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Audio</span>
                <span className="font-medium">{stats.audio}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Video</span>
                <span className="font-medium">{stats.video}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Engagement
            </CardDescription>
            <CardTitle className="text-lg">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.approved} approved content
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </CardDescription>
            <CardTitle className="text-lg">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.total > 0 
                ? Math.round((stats.approved / stats.total) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approved} of {stats.total} approved
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
