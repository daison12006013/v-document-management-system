'use client';
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
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Eye,
  Share,
} from 'lucide-react';
import { File } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/helpers';
import { FileIcon } from './file-icon';
import { FileContextMenu } from './context-menu';
import { RenameDialog, DeleteDialog } from './dialogs';
import { useFileOperations } from './hooks/use-file-operations';

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

export const FileCard = ({
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
}: FileCardProps) => {
  // Use shared file operations hook
  const {
    renameDialogOpen,
    setRenameDialogOpen,
    handleRenameClick,
    handleRename,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteClick,
    handleDelete,
    selectedFile,
  } = useFileOperations({
    onRename: onRename,
    onDelete: onDelete,
  });


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
        onRename={() => handleRenameClick(file)}
        onDelete={() => handleDeleteClick(file)}
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
                    mimeType={file.mimeType ?? undefined}
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
                  <span>{file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : 'N/A'}</span>
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
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRenameClick(file);
                      }}>
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
                        onClick={() => handleDeleteClick(file)}
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
                    mimeType={file.mimeType ?? undefined}
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
                    <span>{file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : 'N/A'}</span>
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
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRenameClick(file);
                      }}>
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
                        onClick={() => handleDeleteClick(file)}
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
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        file={selectedFile}
        onRename={handleRename}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={selectedFile}
        onDelete={handleDelete}
      />
    </>
  );
};
