import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-primary/20">404</h1>
        <h2 className="text-3xl font-bold font-urdu">صفحہ نہیں ملا</h2>
        <p className="text-muted-foreground font-urdu">
          معذرت، آپ جس صفحے کو تلاش کر رہے ہیں وہ موجود نہیں ہے یا اسے منتقل کر دیا گیا ہے۔
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild variant="default" size="lg" className="rounded-xl px-8">
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              <span>واپس ہوم پیج</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl px-8">
            <Link href="/library">
              <span>لائبریری دیکھیں</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
