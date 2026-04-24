import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { NextDashboardSidebar } from './NextDashboardSidebar';
import { Separator } from '@/components/ui/separator';

interface DashboardLayoutProps {
  children: ReactNode;
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

export function NextDashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <NextDashboardSidebar activeTab={activeTab} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-sm font-bold font-urdu truncate">
            {tabTitles[activeTab] || "ڈیش بورڈ"}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
