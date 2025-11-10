'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { File } from '@/lib/types';
import { api } from '@/lib/api';
import type { SearchFilters } from '../file-search';

interface UseFileLoaderOptions {
  parentId?: string | null;
  searchFilters?: SearchFilters;
  refreshTrigger?: string | null;
  pagination?: {
    enabled: boolean;
    itemsPerPage?: number;
    currentPage?: number;
  };
  sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
}

interface UseFileLoaderResult {
  files: File[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  loadFiles: () => Promise<void>;
}

export const useFileLoader = (
  options: UseFileLoaderOptions = {}
): UseFileLoaderResult => {
  const {
    parentId = null,
    searchFilters,
    refreshTrigger,
    pagination = { enabled: false },
    sortField,
    sortOrder,
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a stable string representation of search filters for dependency tracking
  const searchFiltersKey = useMemo(
    () => JSON.stringify(searchFilters || {}),
    [searchFilters]
  );

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build API params
      const apiParams: any = {
        parentId,
      };

      // Add pagination if enabled
      if (pagination.enabled) {
        const offset =
          ((pagination.currentPage || 1) - 1) * (pagination.itemsPerPage || 10);
        apiParams.limit = pagination.itemsPerPage || 10;
        apiParams.offset = offset;
      }

      // Add search filters if they have values
      if (searchFilters?.query && searchFilters.query.trim()) {
        apiParams.query = searchFilters.query.trim();
      }
      if (searchFilters?.type) {
        apiParams.type = searchFilters.type;
      }
      if (searchFilters?.mimeType) {
        apiParams.mimeType = searchFilters.mimeType;
      }
      if (searchFilters?.createdAfter) {
        apiParams.createdAfter = searchFilters.createdAfter;
      }
      if (searchFilters?.createdBefore) {
        apiParams.createdBefore = searchFilters.createdBefore;
      }
      if (searchFilters?.sizeMin !== undefined) {
        apiParams.sizeMin = searchFilters.sizeMin;
      }
      if (searchFilters?.sizeMax !== undefined) {
        apiParams.sizeMax = searchFilters.sizeMax;
      }

      // Add sort parameters
      if (sortField) {
        apiParams.sortField = sortField;
      }
      if (sortOrder) {
        apiParams.sortOrder = sortOrder;
      }

      const response = await api.files.getAll(apiParams);

      // Check if response is paginated
      if (
        response &&
        typeof response === 'object' &&
        'files' in response &&
        'total' in response
      ) {
        setFiles(response.files);
        setTotalItems(response.total);
      } else {
        // Fallback for non-paginated response
        const filesArray = response as File[];
        setFiles(filesArray);
        setTotalItems(filesArray.length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
      setFiles([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [parentId, searchFiltersKey, pagination.enabled, pagination.currentPage, pagination.itemsPerPage, sortField, sortOrder]);

  // Load files when dependencies change
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadFiles();
    }
  }, [refreshTrigger, loadFiles]);

  return {
    files,
    totalItems,
    isLoading,
    error,
    loadFiles,
  };
};

