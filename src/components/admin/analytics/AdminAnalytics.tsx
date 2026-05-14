'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpload } from '@/contexts/UploadContextTypes';
import {
  AlertCircle,
  BarChart3,
  BookCopy,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  ImageOff,
  Loader2,
  Music,
  Play,
  Plus,
  Shield,
  TrendingUp,
  UploadCloud,
  Users,
  Video,
} from 'lucide-react';

import { getAnalytics } from '@/actions/analytics';
import { cn } from '@/lib/utils';

interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalPlays: number;
  totalMedia: number;
  totalWorks: number;
  totalPublications: number;
  bookCount?: number;
  audioCount: number;
  videoCount: number;
  recentActivity: { date: string; views: number; downloads: number; plays: number; count: number }[];
  topMedia: { id: string; title: string; type: string; views: number }[];
  attention: {
    unpublishedMedia: number;
    missingCover: number;
    missingMetadata: number;
    missingFile: number;
  };
  users: {
    owners: number;
    admins: number;
    users: number;
  };
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const numberFormat = new Intl.NumberFormat('ur-PK');

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { activeUploads } = useUpload();

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
      const res = await getAnalytics(getDateFilter());
      if (res.data) setAnalytics(res.data as AnalyticsSummary);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadCounts = useMemo(() => {
    const active = activeUploads.filter(upload =>
      ['preparing', 'uploading', 'database', 'deleting'].includes(upload.status)
    ).length;
    const failed = activeUploads.filter(upload =>
      upload.status === 'error' || upload.status === 'interrupted'
    ).length;
    const completed = activeUploads.filter(upload => upload.status === 'completed').length;
    return { active, failed, completed };
  }, [activeUploads]);

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
    { label: "کل مناظر", value: analytics.totalViews, icon: Eye, color: 'text-sky-600', bg: 'bg-sky-500/10' },
    { label: "حاصل شدہ", value: analytics.totalDownloads, icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: "سنے گئے", value: analytics.totalPlays, icon: Play, color: 'text-violet-600', bg: 'bg-violet-500/10' },
    { label: "کل میڈیا", value: analytics.totalMedia, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const attentionCards = [
    {
      label: "غیر شائع شدہ میڈیا",
      value: analytics.attention.unpublishedMedia,
      icon: AlertCircle,
      href: '/admin/media?status=unpublished',
      className: analytics.attention.unpublishedMedia > 0 ? 'text-amber-600 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: "کور تصویر غائب",
      value: analytics.attention.missingCover,
      icon: ImageOff,
      href: '/admin/media?issue=missing-cover',
      className: analytics.attention.missingCover > 0 ? 'text-orange-600 bg-orange-500/10' : 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: "میٹا ڈیٹا نامکمل",
      value: analytics.attention.missingMetadata,
      icon: FileText,
      href: '/admin/media?issue=missing-metadata',
      className: analytics.attention.missingMetadata > 0 ? 'text-rose-600 bg-rose-500/10' : 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: "اپلوڈ مسائل",
      value: uploadCounts.failed,
      icon: UploadCloud,
      href: '/admin/uploads',
      className: uploadCounts.failed > 0 ? 'text-red-600 bg-red-500/10' : 'text-emerald-600 bg-emerald-500/10',
    },
  ];

  const mediaBreakdown = [
    { name: 'آڈیو', count: analytics.audioCount, fill: 'hsl(158 64% 32%)' },
    { name: 'ویڈیو', count: analytics.videoCount, fill: 'hsl(222 72% 56%)' },
    { name: 'کتب', count: analytics.totalWorks, fill: 'hsl(43 80% 48%)' },
  ];

  const typeIcons = {
    book: FileText,
    'آڈیو': Music,
    'ویڈیو': Video,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {"انتظامی خلاصہ"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {"مواد، صارفین، اپلوڈز اور سرگرمی کا ایک ہی مقام پر جائزہ"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gradient-primary">
            <Link href="/admin/media">
              <Plus className="ml-2 h-4 w-4" />
              {"نیا میڈیا"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/books">
              <BookOpen className="ml-2 h-4 w-4" />
              {"نئی تصنیف"}
            </Link>
          </Button>
          <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
            <SelectTrigger className="w-36 md:w-44">
              <Calendar className="h-4 w-4 ml-2" />
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/50 bg-card/70">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-lg shrink-0', stat.bg, stat.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold truncate">{numberFormat.format(stat.value)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-urdu">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {attentionCards.map((item) => {
          const Icon = item.icon;
          const isClear = item.value === 0;
          return (
            <Link href={item.href} key={item.label} className="block">
              <Card className="border-border/50 bg-card/70 transition-colors hover:bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-xl font-bold mt-1">{numberFormat.format(item.value)}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-lg shrink-0', item.className)}>
                      {isClear ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6">
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-lg">{"سرگرمی کا رجحان"}</CardTitle>
            <CardDescription>{"منتخب مدت میں مناظر، ڈاؤنلوڈز اور پلے"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {analytics.recentActivity.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  {"ابھی تک کوئی سرگرمی دستیاب نہیں ہے"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.recentActivity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="playsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Area type="monotone" dataKey="views" name="مناظر" stroke="hsl(199 89% 48%)" fill="url(#viewsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="plays" name="پلے" stroke="hsl(262 83% 58%)" fill="url(#playsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="downloads" name="ڈاؤنلوڈز" stroke="hsl(158 64% 32%)" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-lg">{"مواد کی تقسیم"}</CardTitle>
            <CardDescription>{"آڈیو، ویڈیو اور کتب"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mediaBreakdown} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.45)' }}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" name="تعداد" radius={[6, 6, 0, 0]}>
                    {mediaBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/70 xl:col-span-2">
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
                    <div key={item.id} className="flex items-center gap-3 rounded-md border bg-background/40 px-3 py-2">
                      <span className="text-sm font-bold text-muted-foreground w-7">
                        #{index + 1}
                      </span>
                      <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate text-sm font-medium">{item.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {`${numberFormat.format(item.views)} مناظر`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-lg">{"نظام کا خلاصہ"}</CardTitle>
            <CardDescription>{"کتب، اشاعتیں، صارفین اور اپلوڈز"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow icon={BookOpen} label="تصانیف" value={analytics.totalWorks} />
            <SummaryRow icon={BookCopy} label="اشاعتیں" value={analytics.totalPublications} />
            <SummaryRow icon={Shield} label="منتظمین" value={analytics.users.owners + analytics.users.admins} />
            <SummaryRow icon={Users} label="عام صارفین" value={analytics.users.users} />
            <SummaryRow icon={UploadCloud} label="فعال اپلوڈز" value={uploadCounts.active} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <Badge variant="secondary">{numberFormat.format(value)}</Badge>
    </div>
  );
}
