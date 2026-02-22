import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FolderOpen,
  Clock,
  FileText,
  Users,
  BarChart3,
  MessageCircle,
  Home,
  LogOut,
  Shield,
  Tags,
  Mic2,
  Globe,
  Music,
  LayoutGrid,
} from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { role, signOut } = useAuth();
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = role === 'admin';

  const systemItems = [
    { id: 'analytics', title: t('dashboard.analytics'), icon: BarChart3 },
    { id: 'users', title: t('dashboard.users'), icon: Users },
  ];

  const taxonomyItems = [
    { id: 'speakers', title: t('dashboard.taxonomyManagement.types.speaker'), icon: Mic2 },
    { id: 'languages', title: t('dashboard.taxonomyManagement.types.language'), icon: Globe },
    { id: 'audio-types', title: t('dashboard.taxonomyManagement.types.audio_type'), icon: Music },
    { id: 'categories', title: t('dashboard.taxonomyManagement.types.category'), icon: LayoutGrid },
  ];


  const contentItems = [
    { id: 'content', title: t('dashboard.allContent'), icon: FileText },
    { id: 'uploads', title: t('dashboard.uploads.title', { defaultValue: 'Upload Status' }), icon: Clock },
  ];


  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" side={dir === 'rtl' ? 'right' : 'left'}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center px-2 py-2">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="Fikr-e-Islam" className="w-12 h-12 object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="font-display text-sm font-semibold text-sidebar-foreground">
                  {t('nav.dashboard')}
                </span>
                <span className="text-xs text-sidebar-foreground/70 capitalize flex items-center gap-1">
                  {t('auth.admin')}
                </span>
              </div>
            </Link>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:block" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* System & Analytics */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.system') || 'System'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    asChild
                    tooltip={item.title}
                  >
                    <Link to={`/admin/${item.id}`}>
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

        {/* Taxonomy Management */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('dashboard.metadata') || 'Metadata'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {taxonomyItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    asChild
                    tooltip={item.title}
                  >
                    <Link to={`/admin/${item.id}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Management Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.contentManagement')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    asChild
                    tooltip={item.title}
                  >
                    <Link to={`/admin/${item.id}`}>
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
            <SidebarMenuButton asChild tooltip={t('common.backToHome')}>
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>{t('common.backToHome')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={t('nav.signOut')}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span>{t('nav.signOut')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
