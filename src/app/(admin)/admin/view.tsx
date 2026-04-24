'use client';

import { Suspense, lazy } from 'react';
import { NextDashboardLayout } from '@/components/admin/layout/NextDashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AdminAnalytics = lazy(() => import("@/components/admin/analytics/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));
const MediaList = lazy(() => import("@/components/admin/media/MediaList").then(m => ({ default: m.MediaList })));
const UserManagement = lazy(() => import("@/components/admin/users/UserManagement").then(m => ({ default: m.UserManagement })));
const SpeakerManagement = lazy(() => import("@/components/admin/metadata/SpeakerManagement").then(m => ({ default: m.SpeakerManagement })));
const AuthorManagement = lazy(() => import("@/components/admin/metadata/AuthorManagement").then(m => ({ default: m.AuthorManagement })));
const PublisherManagement = lazy(() => import("@/components/admin/metadata/PublisherManagement").then(m => ({ default: m.PublisherManagement })));
const LanguageManagement = lazy(() => import("@/components/admin/metadata/LanguageManagement").then(m => ({ default: m.LanguageManagement })));
const MediaTypeManagement = lazy(() => import("@/components/admin/media/MediaTypeManagement").then(m => ({ default: m.MediaTypeManagement })));
const CategoryManagement = lazy(() => import("@/components/admin/metadata/CategoryManagement").then(m => ({ default: m.CategoryManagement })));
const BookManagement = lazy(() => import("@/components/admin/books/BookManagement").then(m => ({ default: m.BookManagement })));
const UploadTracker = lazy(() => import("@/components/admin/layout/UploadTracker").then(m => ({ default: m.UploadTracker })));

interface DashboardViewProps {
  activeTab: string;
}

const tabTitles: Record<string, string> = {
  'analytics': "تجزیات",
  'media': "تمام میڈیا",
  'users': "صارفین",
  'uploads': "شامل کرنے کی صورتحال",
  'speakers': "مقرر",
  'authors': "مصنفین",
  'publishers': "ناشرین",
  'languages': "زبان",
  'media-types': "میڈیا کی قسم",
  'categories': "زمرہ",
  'books': "کتب کا انتظام",
};

export function DashboardView({ activeTab }: DashboardViewProps) {
  const TabContent = () => {
    switch (activeTab) {
      case 'analytics': return <AdminAnalytics />;
      case 'media': return <MediaList />;
      case 'users': return <UserManagement />;
      case 'uploads': return <UploadTracker />;
      case 'speakers': return <SpeakerManagement />;
      case 'authors': return <AuthorManagement />;
      case 'publishers': return <PublisherManagement />;
      case 'languages': return <LanguageManagement />;
      case 'media-types': return <MediaTypeManagement />;
      case 'categories': return <CategoryManagement />;
      case 'books': return <BookManagement />;
      default: return <AdminAnalytics />;
    }
  };

  return (
    <NextDashboardLayout activeTab={activeTab}>
      <div className="space-y-6 w-full overflow-x-hidden">
        <h1 className="text-2xl font-bold font-urdu hidden md:block">
          {tabTitles[activeTab] || "ڈیش بورڈ"}
        </h1>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <TabContent />
        </Suspense>
      </div>
    </NextDashboardLayout>
  );
}
