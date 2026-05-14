'use client';

import Link from 'next/link';
import { AlertCircle, Loader2, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUpload } from '@/contexts/UploadContextTypes';

export function UploadStatusStrip() {
  const { activeUploads } = useUpload();
  const activeCount = activeUploads.filter(upload =>
    ['preparing', 'uploading', 'database', 'deleting'].includes(upload.status)
  ).length;
  const issueCount = activeUploads.filter(upload =>
    upload.status === 'error' || upload.status === 'interrupted'
  ).length;

  if (activeCount === 0 && issueCount === 0) return null;

  return (
    <Link
      href="/admin/uploads"
      className="border-b bg-muted/35 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 md:px-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <UploadCloud className="h-4 w-4" />
        <span>{"اپلوڈ صورتحال"}</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {`${activeCount} جاری`}
          </Badge>
        )}
        {issueCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {`${issueCount} مسئلہ`}
          </Badge>
        )}
      </div>
    </Link>
  );
}
