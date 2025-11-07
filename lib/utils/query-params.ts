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

