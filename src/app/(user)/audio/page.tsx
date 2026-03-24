import { Metadata } from 'next';
import { AudioView } from './view';

export const metadata: Metadata = {
  title: 'آڈیو لائبریری | فکرِ اسلام',
  description: 'مختلف علماء کے بصیرت افروز خطبات، سلسلے اور قرآنی تلاوت سنیں۔',
};

export default function AudioPage() {
  return <AudioView />;
}
