/**
 * File utility functions
 * Centralized helpers for file-related operations
 */

/**
 * Normalize parentId from various input formats
 * Handles: 'null' string, empty strings, undefined, null, and actual IDs
 *
 * @param parentId - The parent ID value (can be string, null, undefined, or 'null')
 * @returns Normalized parent ID (string ID or null)
 */
export const normalizeParentId = (parentId: string | null | undefined): string | null | undefined => {
  if (parentId === undefined) {
    return undefined; // Allow undefined to pass through for optional updates
  }

  if (parentId === null || parentId === 'null' || (typeof parentId === 'string' && parentId.trim() === '')) {
    return null;
  }

  return parentId;
};

/**
 * Normalize parentId from query parameters
 * Specifically handles query param normalization where 'null' is a string
 */
export const normalizeParentIdFromQuery = (parentId: string | null): string | null | undefined => {
  if (parentId === null) {
    return undefined;
  }

  return parentId === 'null' ? null : parentId;
};

