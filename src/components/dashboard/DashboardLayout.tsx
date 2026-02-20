import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange?: (tab: string) => void;
  pageTitle: string;
  isDashboard?: boolean;
}

export function DashboardLayout({ children, activeTab, onTabChange, pageTitle, isDashboard }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar activeTab={activeTab} onTabChange={onTabChange} />
      <SidebarInset>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
