import { Metadata } from 'next';
import { LibraryView } from './view';

export const metadata: Metadata = {
  title: 'میرا کتب خانہ | فکرِ اسلام',
  description: 'روحانی سیکھنے کے لیے آپ کی ذاتی جگہ۔ اپنے محفوظ کردہ پسندیدہ اور مرضی کی فہرستوں تک رسائی حاصل کریں۔',
};

export default function LibraryPage() {
  return <LibraryView />;
}
