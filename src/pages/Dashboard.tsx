import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ContentUploadForm } from '@/components/contributor/ContentUploadForm';
import { MyContentList } from '@/components/contributor/MyContentList';
import { ContributorOverview } from '@/components/contributor/ContributorOverview';
import { PendingContentList } from '@/components/admin/PendingContentList';
import { AllContentList } from '@/components/admin/AllContentList';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { PendingAnswersList } from '@/components/admin/PendingAnswersList';
import { UploadTracker } from '@/components/dashboard/UploadTracker';

export default function Dashboard() {
    const { user, role, loading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isAdmin = role === 'admin';

    const tabTitles: Record<string, string> = useMemo(() => ({
        'stats': t('dashboard.stats'),
        'upload': t('dashboard.upload'),
        'uploads': t('dashboard.uploads.title', { defaultValue: 'Upload Status' }),
        'my-content': t('dashboard.myContent'),
        'analytics': t('dashboard.analytics'),
        'pending': t('dashboard.pending'),
        'pending-answers': t('dashboard.qaAdmin'),
        'all-content': t('dashboard.allContent'),
        'users': t('dashboard.users'),
    }), [t]);

    const [activeTab, setActiveTab] = useState(() => {
        return searchParams.get('tab') || (isAdmin ? 'analytics' : 'stats');
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
            const defaultTab = role === 'admin' ? 'analytics' : 'stats';
            setActiveTab(defaultTab);
        }
    }, [role, loading, searchParams]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    useEffect(() => {
        if (!loading && (!user || (role !== 'contributor' && role !== 'admin'))) {
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

    if (!user || (role !== 'contributor' && role !== 'admin')) {
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'stats':
                return <ContributorOverview />;
            case 'upload':
                return (
                    <div className="max-w-2xl">
                        <ContentUploadForm />
                    </div>
                );
            case 'uploads':
                return <UploadTracker />;
            case 'my-content':
                return <MyContentList />;
            case 'analytics':
                return isAdmin ? <AdminAnalytics /> : <ContributorOverview />;
            case 'pending':
                return isAdmin ? <PendingContentList /> : null;
            case 'pending-answers':
                return isAdmin ? <PendingAnswersList /> : null;
            case 'all-content':
                return isAdmin ? <AllContentList /> : null;
            case 'users':
                return isAdmin ? <UserManagement /> : null;
            default:
                return isAdmin ? <AdminAnalytics /> : <ContributorOverview />;
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
