import { Metadata } from 'next';
import { RegisterView } from './view';

export const metadata: Metadata = {
  title: 'اکاؤنٹ بنائیں | فکرِ اسلام',
  description: 'مستند اسلامی علم کی کمیونٹی میں شامل ہونے کے لیے اکاؤنٹ بنائیں۔',
};

export default function RegisterPage() {
  return <RegisterView />;
}
