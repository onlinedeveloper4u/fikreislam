import { Metadata } from 'next';
import { VideoView } from './view';

export const metadata: Metadata = {
  title: 'ویڈیو ذخیرہ | فکرِ اسلام',
  description: 'اسلامی تعلیمات پر مبنی تعلیمی ویڈیوز، دستاویزی فلمیں اور لائیو نشستیں دیکھیں۔',
};

export default function VideoPage() {
  return <VideoView />;
}
