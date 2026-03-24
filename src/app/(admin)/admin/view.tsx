'use client';

import { Suspense, lazy } from 'react';
import { NextDashboardLayout } from '@/components/admin_dashboard/NextDashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AdminAnalytics = lazy(() => import("@/components/admin/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));
const AllContentList = lazy(() => import("@/components/admin/AllContentList").then(m => ({ default: m.AllContentList })));
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const SpeakerManagement = lazy(() => import("@/components/admin/SpeakerManagement").then(m => ({ default: m.SpeakerManagement })));
const LanguageManagement = lazy(() => import("@/components/admin/LanguageManagement").then(m => ({ default: m.LanguageManagement })));
const AudioTypeManagement = lazy(() => import("@/components/admin/AudioTypeManagement").then(m => ({ default: m.AudioTypeManagement })));
const CategoryManagement = lazy(() => import("@/components/admin/CategoryManagement").then(m => ({ default: m.CategoryManagement })));
const UploadTracker = lazy(() => import("@/components/admin_dashboard/UploadTracker").then(m => ({ default: m.UploadTracker })));

interface DashboardViewProps {
  activeTab: string;
}

const tabTitles: Record<string, string> = {
  'analytics': "تجزیات",
  'content': "تمام مواد",
  'users': "صارفین",
  'uploads': "شامل کرنے کی صورتحال",
  'speakers': "مقرر",
  'languages': "زبان",
  'audio-types': "آڈیو کی قسم",
  'categories': "زمرہ",
};

export function DashboardView({ activeTab }: DashboardViewProps) {
  const TabContent = () => {
    switch (activeTab) {
      case 'analytics': return <AdminAnalytics />;
      case 'content': return <AllContentList />;
      case 'users': return <UserManagement />;
      case 'uploads': return <UploadTracker />;
      case 'speakers': return <SpeakerManagement />;
      case 'languages': return <LanguageManagement />;
      case 'audio-types': return <AudioTypeManagement />;
      case 'categories': return <CategoryManagement />;
      default: return <AdminAnalytics />;
    }
  };

  return (
    <NextDashboardLayout activeTab={activeTab}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-urdu">
          {tabTitles[activeTab] || "ڈیش بورڈ"}
        </h1>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <TabContent />
        </Suspense>
      </div>
    </NextDashboardLayout>
  );
}
