'use client';

import { FileIcon } from './file-icon';
import type { File } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { RenameDialog, DeleteDialog } from './dialogs';
import { useFileOperations } from './hooks/use-file-operations';
import { FileActionMenu } from './file-action-menu';

interface FileTableProps {
  files: File[];
  onOpen: (file: File) => void;
  onDownload?: (file: File) => void;
  onRename?: (file: File, newName: string) => void;
  onDelete?: (file: File) => void;
  onView?: (file: File) => void;
  onShare?: (file: File) => void;
  selectedFiles?: Set<string>;
  onFileSelect?: (file: File, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type') => void;
  canDownload?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
  totalItems?: number;
}

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDateShort = (date: Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    // Format: "7 Nov, 2025 6:23 PM"
    const day = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day} ${month}, ${year} ${timeStr}`;
  } catch {
    return '-';
  }
};

export const FileTable = ({
  files,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onView,
  onShare,
  selectedFiles = new Set(),
  onFileSelect,
  onSelectAll,
  sortField = 'name',
  sortOrder = 'asc',
  onSort,
  canDownload = false,
  canUpdate = false,
  canDelete = false,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  totalItems = 0,
}: FileTableProps) => {
  const { theme } = useTheme();
  const allSelected = files.length > 0 && files.every(file => selectedFiles.has(file.id));
  const someSelected = files.some(file => selectedFiles.has(file.id));

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

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    } else if (onFileSelect) {
      files.forEach(file => onFileSelect(file, checked));
    }
  };

  const handleSort = (field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type') => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type') => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-primary">
            <tr>
              <th className="text-left px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={cn(
                    "border-primary-foreground/50 data-[state=checked]:bg-primary-foreground data-[state=checked]:border-primary-foreground",
                    theme === 'dark' ? "data-[state=checked]:text-primary" : "data-[state=checked]:text-primary",
                    someSelected && !allSelected && 'data-[state=checked]:bg-primary-foreground/70'
                  )}
                />
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity font-semibold text-sm text-primary-foreground"
                >
                  Name
                  {getSortIcon('name') && (
                    <span className="text-xs">{getSortIcon('name')}</span>
                  )}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-sm text-primary-foreground">
                Created by
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity font-semibold text-sm text-primary-foreground"
                >
                  Date
                  {getSortIcon('updatedAt') && (
                    <span className="text-xs">{getSortIcon('updatedAt')}</span>
                  )}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('size')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity font-semibold text-sm text-primary-foreground"
                >
                  File size
                  {getSortIcon('size') && (
                    <span className="text-xs">{getSortIcon('size')}</span>
                  )}
                </button>
              </th>
              <th className="text-right px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {files.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No documents found
                </td>
              </tr>
            ) : (
              files.map((file) => {
                const isSelected = selectedFiles.has(file.id);
                const isFolder = file.type === 'folder';

                return (
                  <tr
                    key={file.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer border-b border-border",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => !isFolder && onView ? onView(file) : onOpen(file)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (onFileSelect) {
                            onFileSelect(file, checked as boolean);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon
                          fileName={file.name}
                          mimeType={file.mimeType ?? undefined}
                          type={file.type}
                          size="sm"
                        />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {file.creator?.name || 'John Green'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDateShort(file.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {isFolder ? '-' : formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <FileActionMenu
                          file={file}
                          onView={onView}
                          onDownload={canDownload ? onDownload : undefined}
                          onRename={canUpdate ? () => handleRenameClick(file) : undefined}
                          onShare={onShare}
                          onDelete={canDelete ? () => handleDeleteClick(file) : undefined}
                          canDownload={canDownload}
                          canUpdate={canUpdate}
                          canDelete={canDelete}
                        />
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                if (onItemsPerPageChange) {
                  onItemsPerPageChange(Number(e.target.value));
                }
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-muted-foreground">rows per page</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ←
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[2rem]"
                      onClick={() => onPageChange && onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        file={selectedFile}
        onRename={handleRename}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={selectedFile}
        onDelete={handleDelete}
      />
    </div>
  );
};

