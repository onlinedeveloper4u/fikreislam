import { Metadata } from 'next';
import { HomeView } from './home-view';

export const metadata: Metadata = {
  title: 'فکرِ اسلام | مستند اسلامی کتب، خطبات اور ویڈیوز',
  description: 'مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ — قابل اعتماد علماء سے لئی گئی معلومات۔',
  openGraph: {
    title: 'فکرِ اسلام',
    description: 'مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ',
    images: ['/logo.png'],
  },
};

export default function HomePage() {
  return <HomeView />;
}
