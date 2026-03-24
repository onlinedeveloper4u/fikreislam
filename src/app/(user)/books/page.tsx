import { Metadata } from 'next';
import { BooksView } from './view';

export const metadata: Metadata = {
  title: 'اسلامی کتب | فکرِ اسلام',
  description: 'مستند اسلامی کتب اور علمی متون کا ہمارا مجموعہ دیکھیں۔',
};

export default function BooksPage() {
  return <BooksView />;
}
