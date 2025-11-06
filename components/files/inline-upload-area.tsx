'use client';

import { UppyDashboard } from '@/components/uppy/uppy-dashboard';
import { cn } from '@/lib/utils';

interface InlineUploadAreaProps {
  parentId?: string | null;
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: Error, file?: any) => void;
  className?: string;
}

/**
 * Inline upload area using Uppy Dashboard
 * Enhanced with dedicated upload background and visual indicators
 */
export function InlineUploadArea({
  parentId,
  onUploadComplete,
  onUploadError,
  className,
}: InlineUploadAreaProps) {
  return (
    <div className={cn('w-full', className)}>
      <UppyDashboard
        parentId={parentId}
        onUploadComplete={onUploadComplete}
        onUploadError={onUploadError}
        inline={true}
        showProgressDetails={true}
        theme="auto"
        className="w-full"
      />
    </div>
  );
}
