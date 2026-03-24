import { Suspense } from 'react';
import { Metadata } from 'next';
import { LoginView } from './view';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = {
  title: 'لاگ ان | فکرِ اسلام',
  description: 'جاری رکھنے کے لیے فکرِ اسلام میں داخل ہوں۔',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <LoginView />
    </Suspense>
  );
}
