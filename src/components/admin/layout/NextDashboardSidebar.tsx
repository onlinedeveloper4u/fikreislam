'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Clock,
  FileText,
  Users,
  BarChart3,
  Home,
  LogOut,
  BookOpen,
  Building2,
  Mic2,
  Globe,
  Music,
  LayoutGrid,
} from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
}

export function NextDashboardSidebar({ activeTab }: DashboardSidebarProps) {
  const { signOut } = useAuth();
  const { dir } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const systemItems = [
    { id: 'analytics', title: "تجزیات", icon: BarChart3, path: '/admin/analytics' },
    { id: 'users', title: "صارفین", icon: Users, path: '/admin/users' },
  ];

  const taxonomyItems = [
    { id: 'speakers', title: "مقرر", icon: Mic2, path: '/admin/speakers' },
    { id: 'authors', title: "مصنفین", icon: BookOpen, path: '/admin/authors' },
    { id: 'publishers', title: "ناشرین", icon: Building2, path: '/admin/publishers' },
    { id: 'languages', title: "زبان", icon: Globe, path: '/admin/languages' },
    { id: 'media-types', title: "میڈیا کی قسم", icon: Music, path: '/admin/media-types' },
    { id: 'categories', title: "زمرہ", icon: LayoutGrid, path: '/admin/categories' },
  ];

  const contentItems = [
    { id: 'media', title: "تمام میڈیا", icon: FileText, path: '/admin/media' },
    { id: 'books', title: "کتب کا انتظام", icon: BookOpen, path: '/admin/books' },
    { id: 'uploads', title: "شامل کرنے کی صورتحال", icon: Clock, path: '/admin/uploads' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <Sidebar collapsible="icon" side={dir === 'rtl' ? 'right' : 'left'}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center px-2 py-2">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="font-display text-sm font-semibold text-sidebar-foreground">
                  {"ڈیش بورڈ"}
                </span>
                <span className="text-xs text-sidebar-foreground/70 capitalize flex items-center gap-1">
                  {"منتظم"}
                </span>
              </div>
            </Link>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:block" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{"تجزیات اور نظام"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={pathname === item.path}
                    asChild
                    tooltip={item.title}
                  >
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>{"میٹا ڈیٹا اور زمرہ جات"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {taxonomyItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={pathname === item.path}
                    asChild
                    tooltip={item.title}
                  >
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{"میڈیا کا انتظام"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={pathname === item.path}
                    asChild
                    tooltip={item.title}
                  >
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={"واپس ہوم پیج پر جائیں"}>
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>{"واپس ہوم پیج پر جائیں"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={"باہر نکلیں"}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span>{"باہر نکلیں"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
