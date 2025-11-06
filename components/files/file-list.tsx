'use client';

import { FileCard } from './file-card';
import type { File } from '@/lib/types';

interface FileListProps {
  files: File[];
  viewMode?: 'grid' | 'list';
  onOpen: (file: File) => void;
  onDownload?: (file: File) => void;
  onRename?: (file: File, newName: string) => void;
  onDelete?: (file: File) => void;
  onView?: (file: File) => void;
  onShare?: (file: File) => void;
  selectedFiles?: Set<string>;
  onFileSelect?: (file: File, selected: boolean) => void;
  canDownload?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function FileList({
  files,
  viewMode = 'grid',
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onView,
  onShare,
  selectedFiles = new Set(),
  onFileSelect,
  canDownload = false,
  canUpdate = false,
  canDelete = false,
}: FileListProps) {
  // Separate folders and files
  const folders = files.filter(file => file.type === 'folder');
  const fileItems = files.filter(file => file.type === 'file');

  const gridClasses = viewMode === 'grid'
    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    : "space-y-2";

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No documents found</h3>
        <p className="text-muted-foreground max-w-md">
          This folder is empty. Upload documents or create folders to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {folders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Folders ({folders.length})
          </h3>
          <div className={gridClasses}>
            {folders.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                viewMode={viewMode}
                onOpen={onOpen}
                onRename={onRename ? (file, newName) => onRename(file, newName) : undefined}
                onDelete={onDelete}
                onView={onView}
                onShare={onShare}
                isSelected={selectedFiles.has(file.id)}
                onSelect={onFileSelect}
              />
            ))}
          </div>
        </div>
      )}

      {fileItems.length > 0 && (
        <div>
          {folders.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Documents ({fileItems.length})
            </h3>
          )}
          <div className={gridClasses}>
            {fileItems.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                viewMode={viewMode}
                onOpen={onOpen}
                onDownload={canDownload ? onDownload : undefined}
                onRename={onRename ? (file, newName) => onRename(file, newName) : undefined}
                onDelete={onDelete}
                onView={onView}
                onShare={onShare}
                isSelected={selectedFiles.has(file.id)}
                onSelect={onFileSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
