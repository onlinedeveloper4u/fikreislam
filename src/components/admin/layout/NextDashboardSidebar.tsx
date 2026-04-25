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
  Settings,
  ChevronUp,
  UserCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

interface DashboardSidebarProps {
  activeTab: string;
}

export function NextDashboardSidebar({ activeTab }: DashboardSidebarProps) {
  const { user, signOut } = useAuth();
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
      <SidebarHeader className="border-b border-sidebar-border h-20 flex items-center justify-center">
        <div className="flex items-center justify-between w-full px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <Link href="/admin" className="flex items-center gap-3 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="relative h-12 w-12 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0 pt-1">
              <span className="text-lg text-sidebar-foreground/60 font-medium uppercase tracking-wider">
                {"انتظامی پینل"}
              </span>
            </div>
          </Link>
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{"تجزیات اور نظام"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems
                .filter(item => item.id !== 'users' || user?.isSuperAdmin)
                .map((item) => (
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

        {user?.isSuperAdmin && (
          <>
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
          </>
        )}

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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div className="grid flex-1 text-right text-sm leading-tight group-data-[collapsible=icon]:hidden mr-2">
                    <span className="truncate font-semibold">{user?.fullName || "صارف"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronUp className="ms-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center gap-2 w-full cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>{"ترتیبات"}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2 w-full cursor-pointer">
                    <Home className="h-4 w-4" />
                    <span>{"واپس ہوم پیج پر جائیں"}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                  <span>{"باہر نکلیں"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
