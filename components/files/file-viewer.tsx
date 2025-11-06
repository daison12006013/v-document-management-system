'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import { File } from '@/lib/types';
import { formatFileSize } from '@/lib/helpers';

interface FileViewerProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (file: File) => void;
}

export function FileViewer({ file, isOpen, onClose, onDownload }: FileViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch signed URL when file changes
  useEffect(() => {
    if (!file || !isOpen) {
      setPreviewUrl(null);
      setTextContent(null);
      setError(null);
      return;
    }

    const fetchPreviewUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/files/${file.id}/download`);
        const responseData = await response.json();

        // Handle standardized API response format { status: 'ok' | 'error', data: {...} }
        if (responseData.status === 'error') {
          throw new Error(responseData.data?.message || 'Failed to get file URL');
        }

        if (!response.ok) {
          throw new Error(responseData.data?.message || 'Failed to get file URL');
        }

        const data = responseData.status === 'ok' ? responseData.data : responseData;
        setPreviewUrl(data.url);

        // For text files, fetch the actual content
        const isTextFile = file.mimeType?.startsWith('text/') ||
                          file.mimeType === 'application/json' ||
                          file.mimeType === 'application/xml' ||
                          !file.mimeType ||
                          file.mimeType === 'application/octet-stream';

        if (isTextFile && data.url) {
          try {
            const textResponse = await fetch(data.url);
            if (textResponse.ok) {
              const content = await textResponse.text();
              setTextContent(content);
            }
          } catch (textErr) {
            console.error('Error fetching text content:', textErr);
            // Don't fail the whole preview if text fetch fails
            setTextContent('Failed to load text content');
          }
        }
      } catch (err: any) {
        console.error('Error fetching preview URL:', err);
        setError(err.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [file?.id, file?.mimeType, isOpen]);

  if (!file) return null;

  // Determine file type
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = file.mimeType?.startsWith('text/') ||
                 file.mimeType === 'application/json' ||
                 file.mimeType === 'application/xml' ||
                 !file.mimeType || // No mimeType - default to text
                 file.mimeType === 'application/octet-stream'; // Unknown type - default to text
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');

  const canPreview = isImage || isPdf || isText || isVideo || isAudio;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleDownload = () => {
    if (onDownload && file) {
      onDownload(file);
    }
  };

  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {canPreview && isImage && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          {!canPreview && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-semibold mb-2">Preview not available</h3>
              <p className="text-muted-foreground mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>File:</strong> {file.name}</p>
                <p><strong>Type:</strong> {file.mimeType}</p>
                <p><strong>Size:</strong> {formatFileSize(file.size || 0)}</p>
              </div>
              <Button onClick={handleDownload} className="mt-4">
                <Download className="h-4 w-4 mr-2" />
                Download to view
              </Button>
            </div>
          )}

          {isImage && (
            <div className="flex justify-center items-center min-h-[400px] max-h-[calc(90vh-200px)] overflow-auto">
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading image...</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {previewUrl && !loading && !error && (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-w-full max-h-[calc(90vh-200px)] w-auto h-auto object-contain"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onLoad={resetView}
                  onError={() => setError('Failed to load image')}
                />
              )}
            </div>
          )}

          {isPdf && (
            <div className="w-full h-96">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {previewUrl && !loading && !error && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border rounded"
                  title={file.name}
                />
              )}
            </div>
          )}

          {isText && (
            <div className="bg-muted p-4 rounded border">
              {loading && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading text content...</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center gap-2 text-center py-8">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {!loading && !error && (
                <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[calc(90vh-200px)]">
                  {textContent !== null ? (
                    textContent
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Loading text content...
                    </div>
                  )}
                </pre>
              )}
            </div>
          )}

          {isVideo && (
            <div className="flex justify-center items-center min-h-[400px]">
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading video...</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {previewUrl && !loading && !error && (
                <video
                  controls
                  className="max-w-full h-auto"
                  style={{ maxHeight: '60vh' }}
                >
                  <source src={previewUrl} type={file.mimeType || undefined} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}

          {isAudio && (
            <div className="flex justify-center p-8 items-center min-h-[200px]">
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading audio...</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {previewUrl && !loading && !error && (
                <audio controls className="w-full max-w-md">
                  <source src={previewUrl} type={file.mimeType || undefined} />
                  Your browser does not support the audio tag.
                </audio>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-muted/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Size:</span>
              <div className="text-muted-foreground">{formatFileSize(file.size || 0)}</div>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <div className="text-muted-foreground">{file.mimeType}</div>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <div className="text-muted-foreground">
                {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-medium">Modified:</span>
              <div className="text-muted-foreground">
                {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
