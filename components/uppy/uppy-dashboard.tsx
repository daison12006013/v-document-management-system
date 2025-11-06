'use client';

import { useEffect, useState, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/dashboard';
import { createUppyInstance, getUploadLimits } from '@/lib/uppy/config';

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface UppyDashboardProps {
  parentId?: string | null;
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: Error, file?: any) => void;
  inline?: boolean;
  width?: number;
  height?: number;
  showProgressDetails?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  target?: string | HTMLElement;
}

export function UppyDashboard({
  parentId,
  onUploadComplete,
  onUploadError,
  inline = true,
  width,
  height,
  showProgressDetails = true,
  theme = 'auto',
  className,
  target,
}: UppyDashboardProps) {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only initialize on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create Uppy instance only on client side
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    const instance = createUppyInstance({
      parentId,
      endpoint: '/api/files',
      autoProceed: false,
      allowMultiple: true,
      // Dashboard options are NOT passed here - they're passed to the React component
    });

    setUppy(instance);

    return () => {
      try {
        instance.cancelAll();
        // Clean up Uppy instance - Uppy doesn't have a close method, just cancelAll
      } catch (error) {
        console.warn('Error cleaning up Uppy instance:', error);
      }
    };
  }, [isClient, parentId]);

  // Update parentId in meta when it changes
  useEffect(() => {
    if (!uppy || parentId === undefined) return;

    uppy.setOptions({
      meta: {
        parentId: parentId || null,
      },
    });
  }, [parentId, uppy]);

  useEffect(() => {
    if (!uppy) return;

    // Handle upload complete
    const handleComplete = (result: any) => {
      if (result.successful && result.successful.length > 0) {
        onUploadComplete?.(result.successful);
        // Clear files after successful upload
        setTimeout(() => {
          uppy.cancelAll();
        }, 2000);
      }
      if (result.failed && result.failed.length > 0) {
        result.failed.forEach((file: any) => {
          if (file.error) {
            onUploadError?.(file.error as Error, file);
          }
        });
      }
    };

    // Handle individual file upload errors
    const handleUploadError = (file: any, error: Error) => {
      onUploadError?.(error, file);
    };

    uppy.on('complete', handleComplete);
    uppy.on('upload-error', handleUploadError);

    return () => {
      uppy.off('complete', handleComplete);
      uppy.off('upload-error', handleUploadError);
    };
  }, [uppy, onUploadComplete, onUploadError]);

  // Don't render until client-side
  if (!isClient || !uppy) {
    return (
      <div ref={containerRef} className={className}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // For @uppy/react/dashboard, target is optional when inline is true
  // The component renders itself into its container
  const dashboardProps: any = {
    uppy,
    inline,
    width,
    height,
    showProgressDetails,
    theme,
    proudlyDisplayPoweredByUppy: false,
    note: `Maximum file size: ${formatFileSize(getUploadLimits().maxFileSize)}`,
    locale: {
      strings: {
        dropPasteImportFiles: 'Drop files here, %{browseFiles} or import from:',
        browseFiles: 'browse files',
        uploadComplete: 'Upload complete',
        uploadFailed: 'Upload failed',
        retry: 'Retry',
        cancel: 'Cancel',
        removeFile: 'Remove file',
        myDevice: 'My Device',
        dropHint: 'Drop your files here',
      },
    },
  };

  // Only add target if it's a string (for non-inline mode or specific selector)
  if (target && typeof target === 'string') {
    dashboardProps.target = target;
  }

  return (
    <div ref={containerRef} className={className}>
      <Dashboard {...dashboardProps} />
    </div>
  );
}
