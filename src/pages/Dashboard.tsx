import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AllContentList } from '@/components/admin/AllContentList';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { UploadTracker } from '@/components/dashboard/UploadTracker';
import { TaxonomyManagement } from '@/components/admin/TaxonomyManagement';

export default function Dashboard() {
    const { user, role, loading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const tabTitles: Record<string, string> = useMemo(() => ({
        'analytics': t('dashboard.analytics'),
        'all-content': t('dashboard.allContent'),
        'users': t('dashboard.users'),
        'uploads': t('dashboard.uploads.title', { defaultValue: 'Upload Status' }),
        'taxonomies': t('dashboard.taxonomies', { defaultValue: 'Metadata & Categories' }),
    }), [t]);

    const [activeTab, setActiveTab] = useState(() => {
        return searchParams.get('tab') || 'analytics';
    });

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tabTitles[tab]) {
            setActiveTab(tab);
        }
    }, [searchParams, tabTitles]);

    // Update default tab when role becomes available
    useEffect(() => {
        if (!loading && role && !searchParams.get('tab')) {
            const defaultTab = 'analytics';
            setActiveTab(defaultTab);
        }
    }, [role, loading, searchParams]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    useEffect(() => {
        if (!loading && (!user || role !== 'admin')) {
            navigate('/login');
        }
    }, [user, role, loading, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || role !== 'admin') {
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AdminAnalytics />;
            case 'all-content':
                return <AllContentList />;
            case 'users':
                return <UserManagement />;
            case 'uploads':
                return <UploadTracker />;
            case 'taxonomies':
                return <TaxonomyManagement />;
            default:
                return <AdminAnalytics />;
        }
    };

    return (
        <DashboardLayout
            activeTab={activeTab}
            onTabChange={handleTabChange}
            pageTitle={tabTitles[activeTab] || t('nav.dashboard')}
            isDashboard={true}
        >
            {renderContent()}
        </DashboardLayout>
    );
}
