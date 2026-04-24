import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, Eye, Download, Play, FileText, Music, Video,
  TrendingUp, Loader2, Calendar
} from 'lucide-react';

import { getAnalytics } from '@/actions/analytics';

interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalPlays: number;
  totalMedia: number;
  bookCount: number;
  audioCount: number;
  videoCount: number;
  recentActivity: { date: string; count: number }[];
  topMedia: { id: string; title: string; type: string; views: number }[];
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
        return undefined;
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();
      const res = await getAnalytics(dateFilter);
      if (res.data) {
        setAnalytics(res.data);
      }
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
        {"تجزیات لوڈ کرنے میں ناکامی"}
      </div>
    );
  }

  const statCards = [
    { label: "کل مناظر", value: analytics.totalViews, icon: Eye, color: 'text-blue-500' },
    { label: "حاصل شدہ", value: analytics.totalDownloads, icon: Download, color: 'text-green-500' },
    { label: "سنے گئے", value: analytics.totalPlays, icon: Play, color: 'text-purple-500' },
    { label: "کل میڈیا", value: analytics.totalMedia, icon: FileText, color: 'text-primary' },
  ];

  const typeIcons = {
    book: FileText,
    'آڈیو': Music,
    'ویڈیو': Video,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {"تجزیات کا خلاصہ"}
        </h2>
        <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
          <SelectTrigger className="w-32 md:w-44">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{"گزشتہ 7 دن"}</SelectItem>
            <SelectItem value="30d">{"گزشتہ 30 دن"}</SelectItem>
            <SelectItem value="90d">{"گزشتہ 90 دن"}</SelectItem>
            <SelectItem value="all">{"تمام وقت"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-muted ${stat.color} shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl sm:text-3xl font-bold truncate">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-urdu">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">{"میڈیا کی تفصیل"}</CardTitle>
            <CardDescription>{"قسم کے لحاظ سے"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>{"کتب"}</span>
                </div>
                <Badge variant="secondary">{analytics.bookCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-green-500" />
                  <span>{"آڈیو"}</span>
                </div>
                <Badge variant="secondary">{analytics.audioCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-500" />
                  <span>{"ویڈیو"}</span>
                </div>
                <Badge variant="secondary">{analytics.videoCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {"مقبول میڈیا"}
            </CardTitle>
            <CardDescription>{"سب سے زیادہ دیکھا جانے والا میڈیا"}</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topMedia.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {"ابھی تک کوئی ڈیٹا دستیاب نہیں ہے"}
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.topMedia.map((item, index) => {
                  const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || FileText;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{item.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {`${item.views} مناظر`}
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