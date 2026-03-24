import { Metadata } from 'next';
import { HomeView } from './view';
import { supabase } from '@/integrations/supabase/client';

export const metadata: Metadata = {
  title: 'فکرِ اسلام | مستند اسلامی کتب، خطبات اور ویڈیوز',
  description: 'مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ — قابل اعتماد علماء سے لئی گئی معلومات۔',
  openGraph: {
    title: 'فکرِ اسلام',
    description: 'مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ',
    images: ['/logo.png'],
  },
};

async function getContentStats() {
  try {
    const [booksResult, audioResult, videoResult] = await Promise.all([
      supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("type", "book")
        .eq("status", "approved"),
      supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("type", "audio")
        .eq("status", "approved"),
      supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("type", "video")
        .eq("status", "approved"),
    ]);

    return {
      books: booksResult.count ?? 0,
      audio: audioResult.count ?? 0,
      video: videoResult.count ?? 0,
    };
  } catch (error) {
    console.error('Error fetching content stats:', error);
    return { books: 0, audio: 0, video: 0 };
  }
}

export default async function HomePage() {
  const stats = await getContentStats();

  return <HomeView stats={stats} />;
}
