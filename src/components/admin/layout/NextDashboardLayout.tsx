'use client';

import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { NextDashboardSidebar } from './NextDashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
}

export function NextDashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <NextDashboardSidebar activeTab={activeTab} />
      <SidebarInset>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
