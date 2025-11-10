'use client';

import { useState, useEffect } from 'react';
import { Download, FileIcon, FolderIcon, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
// Format file size helper
const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

interface ShareViewPageProps {
  shareLink: {
    id: string;
    fileId: string;
    file: {
      id: string;
      name: string;
      type: 'file' | 'folder';
      mimeType: string | null;
      size: number | null;
    };
    expiresAt: Date | null;
    createdAt: Date;
  };
  token: string;
}

export const ShareViewPage = ({ shareLink, token }: ShareViewPageProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // For both files and folders, redirect to the view endpoint
      // Files will be served directly, folders will be served as ZIP
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      window.location.href = `${baseUrl}/api/files/share/${token}/view`;
    } catch (err: any) {
      setError(err.message || 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    try {
      const d = new Date(date);
      // Use a consistent format that works the same on server and client
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return 'Invalid date';
    }
  };

  const isExpired = shareLink.expiresAt
    ? new Date(shareLink.expiresAt) < new Date()
    : false;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Link Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This share link has expired and is no longer accessible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            {shareLink.file.type === 'folder' ? (
              <FolderIcon className="h-8 w-8 text-primary" />
            ) : (
              <FileIcon className="h-8 w-8 text-primary" />
            )}
            <div className="flex-1">
              <CardTitle className="text-xl">{shareLink.file.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {shareLink.file.type === 'folder' ? 'Folder' : 'File'} shared with you
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Type</div>
              <Badge variant="outline">
                {shareLink.file.type === 'folder' ? 'Folder' : shareLink.file.mimeType || 'File'}
              </Badge>
            </div>
            {shareLink.file.size !== null && (
              <div>
                <div className="text-muted-foreground mb-1">Size</div>
                <div className="font-medium">{formatFileSize(shareLink.file.size)}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </div>
              <div className="font-medium">{formatDate(shareLink.createdAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires
              </div>
              <div className="font-medium">{formatDate(shareLink.expiresAt)}</div>
            </div>
          </div>

          {shareLink.file.type === 'file' && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download File'}
              </Button>
            </div>
          )}

          {shareLink.file.type === 'folder' && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Creating zip...' : 'Download as ZIP'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                The folder will be downloaded as a ZIP file containing all files and subfolders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

