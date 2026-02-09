import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ContentUploadForm } from '@/components/contributor/ContentUploadForm';
import { MyContentList } from '@/components/contributor/MyContentList';
import { ContributorOverview } from '@/components/contributor/ContributorOverview';
import { PendingContentList } from '@/components/admin/PendingContentList';
import { AllContentList } from '@/components/admin/AllContentList';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { PendingAnswersList } from '@/components/admin/PendingAnswersList';

const tabTitles: Record<string, string> = {
  'stats': 'Overview',
  'upload': 'Upload Content',
  'my-content': 'My Content',
  'analytics': 'Analytics',
  'pending': 'Pending Content',
  'pending-answers': 'Pending Q&A',
  'all-content': 'All Content',
  'users': 'User Management',
};

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const [activeTab, setActiveTab] = useState(() => {
    // Default tab based on role
    return isAdmin ? 'analytics' : 'stats';
  });

  // Update default tab when role changes
  useEffect(() => {
    if (!loading && role) {
      if (role === 'admin' && activeTab === 'upload') {
        setActiveTab('analytics');
      }
    }
  }, [role, loading]);

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
      case 'my-content':
        return <MyContentList />;
      case 'analytics':
        return isAdmin ? <AdminAnalytics /> : null;
      case 'pending':
        return isAdmin ? <PendingContentList /> : null;
      case 'pending-answers':
        return isAdmin ? <PendingAnswersList /> : null;
      case 'all-content':
        return isAdmin ? <AllContentList /> : null;
      case 'users':
        return isAdmin ? <UserManagement /> : null;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={tabTitles[activeTab] || 'Dashboard'}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
