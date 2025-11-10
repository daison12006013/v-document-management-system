/**
 * Query parameter parsing utilities
 * Centralized helpers for parsing common query parameters
 */

import { NextRequest } from 'next/server';

/**
 * Parse pagination parameters from query string
 */
export const parsePaginationParams = (request: NextRequest): {
  limit?: number;
  offset?: number;
} => {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
  return { limit, offset };
};

/**
 * Parse parentId from query string (handles 'null' string)
 */
export const parseParentIdFromQuery = (request: NextRequest): string | null | undefined => {
  const searchParams = request.nextUrl.searchParams;
  const parentId = searchParams.get('parentId');
  return parentId === 'null' ? null : parentId || undefined;
};

/**
 * Parse file type from query string
 */
export const parseFileTypeFromQuery = (request: NextRequest): 'file' | 'folder' | null => {
  const searchParams = request.nextUrl.searchParams;
  return searchParams.get('type') as 'file' | 'folder' | null;
};

/**
 * Parse search filters from query string
 */
export const parseSearchFiltersFromQuery = (request: NextRequest): {
  query?: string;
  type?: 'file' | 'folder';
  mimeType?: string;
  createdAfter?: string;
  createdBefore?: string;
  sizeMin?: number;
  sizeMax?: number;
} => {
  const searchParams = request.nextUrl.searchParams;
  const filters: any = {};

  if (searchParams.get('query')) {
    filters.query = searchParams.get('query')!;
  }
  if (searchParams.get('type')) {
    filters.type = searchParams.get('type') as 'file' | 'folder';
  }
  if (searchParams.get('mimeType')) {
    filters.mimeType = searchParams.get('mimeType')!;
  }
  if (searchParams.get('createdAfter')) {
    filters.createdAfter = searchParams.get('createdAfter')!;
  }
  if (searchParams.get('createdBefore')) {
    filters.createdBefore = searchParams.get('createdBefore')!;
  }
  if (searchParams.get('sizeMin')) {
    filters.sizeMin = parseInt(searchParams.get('sizeMin')!);
  }
  if (searchParams.get('sizeMax')) {
    filters.sizeMax = parseInt(searchParams.get('sizeMax')!);
  }

  return filters;
};

/**
 * Parse sort parameters from query string
 */
export const parseSortParams = (request: NextRequest): {
  sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
} => {
  const searchParams = request.nextUrl.searchParams;
  const sortField = searchParams.get('sortField');
  const sortOrder = searchParams.get('sortOrder');

  const result: {
    sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
    sortOrder?: 'asc' | 'desc';
  } = {};

  if (sortField && ['name', 'createdAt', 'updatedAt', 'size', 'type'].includes(sortField)) {
    result.sortField = sortField as 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  }

  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    result.sortOrder = sortOrder as 'asc' | 'desc';
  }

  return result;
};

