import { Metadata } from 'next';
import { ForgotPasswordView } from './view';

export const metadata: Metadata = {
  title: 'پاس ورڈ بھول گئے | فکرِ اسلام',
  description: 'اپنا پاس ورڈ تبدیل کرنے کے لیے لنک حاصل کریں۔',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
