import { Metadata } from 'next';
import { SettingsView } from './view';

export const metadata: Metadata = {
  title: 'ترتیبات | فکرِ اسلام',
  description: 'اپنے اکاؤنٹ کی معلومات اور پاس ورڈ تبدیل کریں۔',
};

export default function SettingsPage() {
  return <SettingsView />;
}
