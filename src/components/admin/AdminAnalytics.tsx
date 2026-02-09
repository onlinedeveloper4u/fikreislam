import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, Eye, Download, Play, FileText, Music, Video, 
  Users, TrendingUp, Loader2, Calendar
} from 'lucide-react';

interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalPlays: number;
  totalContent: number;
  totalContributors: number;
  bookCount: number;
  audioCount: number;
  videoCount: number;
  recentActivity: { date: string; count: number }[];
  topContent: { id: string; title: string; type: string; views: number }[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case '30d':
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case '90d':
        return new Date(now.setDate(now.getDate() - 90)).toISOString();
      default:
        return null;
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Fetch analytics counts
      let analyticsQuery = supabase.from('content_analytics').select('action_type');
      if (dateFilter) {
        analyticsQuery = analyticsQuery.gte('created_at', dateFilter);
      }
      const { data: analyticsData } = await analyticsQuery;

      const views = analyticsData?.filter(a => a.action_type === 'view').length || 0;
      const downloads = analyticsData?.filter(a => a.action_type === 'download').length || 0;
      const plays = analyticsData?.filter(a => a.action_type === 'play').length || 0;

      // Fetch content counts
      const { data: contentData } = await supabase
        .from('content')
        .select('type, status')
        .eq('status', 'approved');

      const totalContent = contentData?.length || 0;
      const bookCount = contentData?.filter(c => c.type === 'book').length || 0;
      const audioCount = contentData?.filter(c => c.type === 'audio').length || 0;
      const videoCount = contentData?.filter(c => c.type === 'video').length || 0;

      // Fetch contributor count
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'contributor');

      const totalContributors = rolesData?.length || 0;

      // Fetch top content by views
      let topQuery = supabase
        .from('content_analytics')
        .select('content_id');
      if (dateFilter) {
        topQuery = topQuery.gte('created_at', dateFilter);
      }
      const { data: topData } = await topQuery;

      // Count views per content
      const viewCounts: Record<string, number> = {};
      topData?.forEach(item => {
        viewCounts[item.content_id] = (viewCounts[item.content_id] || 0) + 1;
      });

      const topContentIds = Object.entries(viewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      let topContent: { id: string; title: string; type: string; views: number }[] = [];
      if (topContentIds.length > 0) {
        const { data: topContentData } = await supabase
          .from('content')
          .select('id, title, type')
          .in('id', topContentIds);

        topContent = (topContentData || []).map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          views: viewCounts[c.id] || 0,
        })).sort((a, b) => b.views - a.views);
      }

      setAnalytics({
        totalViews: views,
        totalDownloads: downloads,
        totalPlays: plays,
        totalContent,
        totalContributors,
        bookCount,
        audioCount,
        videoCount,
        recentActivity: [],
        topContent,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Unable to load analytics
      </div>
    );
  }

  const statCards = [
    { label: 'Total Views', value: analytics.totalViews, icon: Eye, color: 'text-blue-500' },
    { label: 'Downloads', value: analytics.totalDownloads, icon: Download, color: 'text-green-500' },
    { label: 'Plays', value: analytics.totalPlays, icon: Play, color: 'text-purple-500' },
    { label: 'Content', value: analytics.totalContent, icon: FileText, color: 'text-primary' },
    { label: 'Contributors', value: analytics.totalContributors, icon: Users, color: 'text-orange-500' },
  ];

  const typeIcons = {
    book: FileText,
    audio: Music,
    video: Video,
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Overview
        </h2>
        <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Content Breakdown */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Content Breakdown</CardTitle>
            <CardDescription>Approved content by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Books</span>
                </div>
                <Badge variant="secondary">{analytics.bookCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-green-500" />
                  <span>Audio</span>
                </div>
                <Badge variant="secondary">{analytics.audioCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-500" />
                  <span>Video</span>
                </div>
                <Badge variant="secondary">{analytics.videoCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Content */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Content
            </CardTitle>
            <CardDescription>Most viewed content</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topContent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity data yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.topContent.map((item, index) => {
                  const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || FileText;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{item.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.views} views
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}