'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileTable } from './file-table';
import { Breadcrumb } from './breadcrumb';
import type { File } from '@/lib/types';
import { RefreshCw } from 'lucide-react';
import type { SearchFilters } from './file-search';
import { useFileLoader } from './hooks/use-file-loader';

interface TableViewProps {
  currentFolderId: string | null;
  breadcrumbPath?: File[];
  onOpen: (file: File) => void;
  onDownload?: (file: File) => void;
  onRename?: (file: File, newName: string) => void;
  onDelete?: (file: File) => void;
  onView?: (file: File) => void;
  onShare?: (file: File) => void;
  selectedFiles: Set<string>;
  onFileSelect: (file: File, selected: boolean) => void;
  canDownload?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  sortField: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type') => void;
  onRefresh?: () => void;
  onFolderChange?: (folderId: string | null) => void;
  onBreadcrumbNavigate?: (folderId: string | null) => void;
  refreshTrigger?: string | null; // When this changes, refresh the table
  searchFilters?: SearchFilters; // Search filters to apply
}

export const TableView = ({
  currentFolderId,
  breadcrumbPath = [],
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onView,
  onShare,
  selectedFiles,
  onFileSelect,
  canDownload = false,
  canUpdate = false,
  canDelete = false,
  sortField,
  sortOrder,
  onSort,
  onRefresh,
  onFolderChange,
  onBreadcrumbNavigate,
  refreshTrigger,
  searchFilters,
}: TableViewProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize itemsPerPage from URL query parameter or default to 10
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const urlItemsPerPage = searchParams.get('rowsPerPage');
    return urlItemsPerPage ? parseInt(urlItemsPerPage, 10) : 10;
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Use shared file loader hook
  const { files, totalItems, isLoading, error, loadFiles } = useFileLoader({
    parentId: currentFolderId,
    searchFilters,
    refreshTrigger,
    pagination: {
      enabled: true,
      itemsPerPage,
      currentPage,
    },
    sortField,
    sortOrder,
  });

  // Reset to first page when folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFolderId]);

  // Reset to first page when search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters?.query, searchFilters?.type, searchFilters?.mimeType, searchFilters?.createdAfter, searchFilters?.createdBefore, searchFilters?.sizeMin, searchFilters?.sizeMax]);

  // Reset to first page when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortOrder]);

  // Update URL when itemsPerPage changes
  const updateUrlItemsPerPage = (items: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (items === 10) {
      // Remove from URL if default value
      params.delete('rowsPerPage');
    } else {
      params.set('rowsPerPage', items.toString());
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Sync itemsPerPage from URL when it changes (for browser back/forward navigation)
  useEffect(() => {
    const urlItemsPerPage = searchParams.get('rowsPerPage');
    const newItemsPerPage = urlItemsPerPage ? parseInt(urlItemsPerPage, 10) : 10;
    if (newItemsPerPage !== itemsPerPage && [10, 25, 50, 100].includes(newItemsPerPage)) {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Reset to first page when rows per page changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid loops

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      files.forEach(file => onFileSelect(file, true));
    } else {
      files.forEach(file => onFileSelect(file, false));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {/* Breadcrumb Navigation - Always visible in Table View */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
        <Breadcrumb
          items={breadcrumbPath}
          onNavigate={(folderId) => {
            if (onBreadcrumbNavigate) {
              onBreadcrumbNavigate(folderId);
            } else if (onFolderChange) {
              onFolderChange(folderId);
            }
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <FileTable
        files={files}
        onOpen={(file) => {
          if (file.type === 'folder' && onFolderChange) {
            onFolderChange(file.id);
          } else {
            onOpen(file);
          }
        }}
        onDownload={onDownload}
        onRename={onRename}
        onDelete={(file) => {
          onDelete?.(file);
          // Reload files after delete
          setTimeout(() => {
            loadFiles();
            onRefresh?.();
          }, 100);
        }}
        onView={onView}
        onShare={onShare}
        selectedFiles={selectedFiles}
        onFileSelect={onFileSelect}
        onSelectAll={handleSelectAll}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={onSort}
        canDownload={canDownload}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          updateUrlItemsPerPage(items);
        }}
        totalItems={totalItems}
        />
      </div>
    </div>
  );
};

