import { useMemo } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function Dashboard() {
    const { user, role, loading } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();

    const activeTab = useMemo(() => {
        const path = location.pathname.split('/').pop() || 'analytics';
        return path === 'admin' ? 'analytics' : path;
    }, [location.pathname]);

    const tabTitles: Record<string, string> = useMemo(() => ({
        'analytics': t('dashboard.analytics'),
        'content': t('dashboard.allContent'),
        'users': t('dashboard.users'),
        'uploads': t('dashboard.uploads.title', { defaultValue: 'Upload Status' }),
        'speakers': t('dashboard.taxonomyManagement.types.speaker'),
        'languages': t('dashboard.taxonomyManagement.types.language'),
        'audio-types': t('dashboard.taxonomyManagement.types.audio_type'),
        'categories': t('dashboard.taxonomyManagement.types.category'),
    }), [t]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return (
        <DashboardLayout
            activeTab={activeTab}
            pageTitle={tabTitles[activeTab] || t('nav.dashboard')}
            isDashboard={true}
        >
            <Outlet />
        </DashboardLayout>
    );
}
