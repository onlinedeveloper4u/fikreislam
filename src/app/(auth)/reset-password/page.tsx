import { Metadata } from 'next';
import { ResetPasswordView } from './view';

export const metadata: Metadata = {
  title: 'نیا پاس ورڈ | فکرِ اسلام',
  description: 'اپنا نیا پاس ورڈ مقرر کریں۔',
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
