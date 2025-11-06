'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Eye,
  Share,
} from 'lucide-react';
import { File } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FileIcon } from './file-icon';
import { FileContextMenu } from './context-menu';

interface FileCardProps {
  file: File;
  viewMode?: 'grid' | 'list';
  onOpen: (file: File) => void;
  onDownload?: (file: File) => void;
  onRename?: (file: File, newName: string) => void;
  onDelete?: (file: File) => void;
  onView?: (file: File) => void;
  onShare?: (file: File) => void;
  isSelected?: boolean;
  onSelect?: (file: File, selected: boolean) => void;
}

export function FileCard({
  file,
  viewMode = 'grid',
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onView,
  onShare,
  isSelected = false,
  onSelect
}: FileCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const handleRename = () => {
    if (newName.trim() && newName !== file.name) {
      onRename?.(file, newName.trim());
    }
    setIsRenaming(false);
    setNewName(file.name);
  };

  const handleDelete = () => {
    onDelete?.(file);
    setIsDeleting(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on dropdown or checkbox
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') ||
        (e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    onOpen(file);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(file, e.target.checked);
  };

  return (
    <>
      <FileContextMenu
        file={file}
        onView={onView}
        onDownload={onDownload}
        onRename={() => setIsRenaming(true)}
        onDelete={() => setIsDeleting(true)}
        onShare={onShare}
        onOpenFolder={file.type === 'folder' ? () => onOpen(file) : undefined}
      >
        <Card
          className={cn(
            "cursor-pointer hover:shadow-md transition-all duration-200",
            "group relative border-2",
            isSelected ? "border-blue-500 bg-blue-50/50" : "border-transparent hover:border-gray-200"
          )}
          onClick={handleCardClick}
        >
          <CardContent className={viewMode === 'grid' ? "p-4" : "p-4"}>
            {viewMode === 'grid' ? (
              // Grid View: Vertical layout
              <div className="flex flex-col items-center text-center relative">
                {/* Selection Checkbox - Top Right */}
                {onSelect && (
                  <div className="absolute top-0 right-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={handleSelectChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* File Icon */}
                <div className="mb-3">
                  <FileIcon
                    fileName={file.name}
                    mimeType={file.mimeType}
                    type={file.type}
                    size="lg"
                  />
                </div>

                {/* File Name */}
                <h3 className="font-medium text-sm truncate w-full mb-1">{file.name}</h3>

                {/* File Metadata */}
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <span className="capitalize">{file.type}</span>
                  {file.size && (
                    <span>{formatFileSize(file.size)}</span>
                  )}
                  <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Actions - Bottom Right */}
                <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        data-dropdown-trigger
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.type === 'file' && onView && (
                        <DropdownMenuItem onClick={() => onView(file)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      {file.type === 'file' && onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      {onShare && (
                        <DropdownMenuItem onClick={() => onShare(file)}>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsDeleting(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              // List View: Horizontal layout
              <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                {onSelect && (
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={handleSelectChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* File Icon */}
                <div className="flex-shrink-0">
                  <FileIcon
                    fileName={file.name}
                    mimeType={file.mimeType}
                    type={file.type}
                    size="lg"
                  />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{file.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="capitalize">{file.type}</span>
                    {file.size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        data-dropdown-trigger
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.type === 'file' && onView && (
                        <DropdownMenuItem onClick={() => onView(file)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      {file.type === 'file' && onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      {onShare && (
                        <DropdownMenuItem onClick={() => onShare(file)}>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsDeleting(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FileContextMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {file.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {file.type}</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete "{file.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
