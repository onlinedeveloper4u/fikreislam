import { Metadata } from 'next';
import { QAView } from './view';

export const metadata: Metadata = {
  title: 'سوال و جواب | فکرِ اسلام',
  description: 'علماء اور ماہرین کی ہماری کمیونٹی سے اپنے سوالات کے مستند جوابات حاصل کریں۔',
};

export default function QAPage() {
  return <QAView />;
}
