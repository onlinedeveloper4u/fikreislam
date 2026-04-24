import { Metadata } from 'next';
import { DashboardView } from '../view';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ tab: string }> 
}): Promise<Metadata> {
  const { tab } = await params;
  
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
    'settings': "ترتیبات",
  };
  
  return {
    title: `${tabTitles[tab] || 'ڈیش بورڈ'} | فکرِ اسلام`,
  };
}

export default async function AdminTabPage({ 
  params 
}: { 
  params: Promise<{ tab: string }> 
}) {
  const { tab } = await params;
  return <DashboardView activeTab={tab} />;
}
