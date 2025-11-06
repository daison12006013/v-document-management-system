'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, AlertCircle, Upload, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
  error?: string;
  speed?: number; // bytes per second
  eta?: number; // seconds remaining
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onCancel?: (uploadId: string) => void;
  onPause?: (uploadId: string) => void;
  onResume?: (uploadId: string) => void;
  onRetry?: (uploadId: string) => void;
  onClear?: () => void;
  className?: string;
}

export function UploadProgress({
  uploads,
  onCancel,
  onPause,
  onResume,
  onRetry,
  onClear,
  className,
}: UploadProgressProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-minimize when all uploads are complete
  useEffect(() => {
    const allComplete = uploads.length > 0 && uploads.every(
      upload => upload.status === 'completed' || upload.status === 'error'
    );
    if (allComplete) {
      const timer = setTimeout(() => setIsMinimized(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [uploads]);

  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending');
  const completedUploads = uploads.filter(u => u.status === 'completed');
  const errorUploads = uploads.filter(u => u.status === 'error');
  const totalProgress = uploads.length > 0
    ? uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length
    : 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("fixed bottom-4 right-4 w-96 z-50 shadow-lg", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Upload Progress ({completedUploads.length}/{uploads.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? '▲' : '▼'}
            </Button>
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-1">
          <Progress value={totalProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(totalProgress)}% complete</span>
            <div className="flex gap-2">
              {errorUploads.length > 0 && (
                <Badge variant="destructive" className="h-4 text-xs">
                  {errorUploads.length} failed
                </Badge>
              )}
              {activeUploads.length > 0 && (
                <Badge variant="secondary" className="h-4 text-xs">
                  {activeUploads.length} uploading
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="pt-0 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-2 rounded border bg-card"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(upload.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {upload.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </span>
                  </div>

                  {upload.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress
                        value={upload.progress}
                        className="h-1"
                        indicatorClassName={getStatusColor(upload.status)}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(upload.progress)}%</span>
                        <div className="flex gap-2">
                          {upload.speed && (
                            <span>{formatSpeed(upload.speed)}</span>
                          )}
                          {upload.eta && (
                            <span>ETA: {formatTime(upload.eta)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-500 truncate">
                      {upload.error}
                    </p>
                  )}

                  {upload.status === 'completed' && (
                    <div className="h-1 bg-green-500 rounded-full" />
                  )}

                  {upload.status === 'paused' && (
                    <div className="h-1 bg-yellow-500 rounded-full" />
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  {upload.status === 'uploading' && onPause && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPause(upload.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}

                  {upload.status === 'paused' && onResume && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResume(upload.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}

                  {upload.status === 'error' && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(upload.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  )}

                  {(upload.status === 'pending' || upload.status === 'uploading' || upload.status === 'paused') && onCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(upload.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
