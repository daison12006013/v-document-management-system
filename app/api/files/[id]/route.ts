import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';

// GET /api/files/[id] - Get file/folder details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission('files', 'read');
    const file = await fileQueries.getFile(id);

    if (!file) {
      return createErrorResponse(ERRORS.FILE_NOT_FOUND);
    }

    return createSuccessResponse(file);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('Get file API error', { error, fileId: id });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

// PUT /api/files/[id] - Update file/folder metadata
async function putHandler(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await requirePermission('files', 'update');
    const body = await request.json();
    const { name, parentId: parentIdRaw, metadata } = body;

    const existingFile = await fileQueries.getFile(id);
    if (!existingFile) {
      return createErrorResponse(ERRORS.FILE_NOT_FOUND);
    }

    // Normalize parentId
    const parentId = parentIdRaw !== undefined
      ? (parentIdRaw && typeof parentIdRaw === 'string' && parentIdRaw.trim() !== '' && parentIdRaw !== 'null'
          ? parentIdRaw
          : null)
      : undefined;

    // Validate parent if moving to a folder
    if (parentId !== undefined && parentId !== null) {
      const parentFile = await fileQueries.getFile(parentId);
      if (!parentFile) {
        return createErrorResponse(ERRORS.PARENT_FOLDER_NOT_FOUND);
      }
      if (parentFile.type !== 'folder') {
        return createErrorResponse(ERRORS.PARENT_MUST_BE_FOLDER);
      }
    }

    const updatedFile = await fileQueries.updateFile(id, {
      name,
      parentId,
      metadata,
    });

    if (!updatedFile) {
      return createErrorResponse(ERRORS.FAILED_TO_UPDATE_FILE);
    }

    await logActivity({
      action: 'update',
      resourceType: existingFile.type,
      resourceId: id,
      description: `File updated: ${updatedFile.name}`,
      metadata: { previousName: existingFile.name, newName: name },
      userId: user.id,
    });

    return createSuccessResponse(updatedFile);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('Update file API error', { error, fileId: id });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      error.message || undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

export const PUT = withCsrfProtection(putHandler);

// DELETE /api/files/[id] - Delete file/folder
async function deleteHandler(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await requirePermission('files', 'delete');

    // Check if file exists
    const file = await fileQueries.getFile(id);
    if (!file) {
      return createErrorResponse(ERRORS.FILE_NOT_FOUND);
    }

    // Soft delete - recursively deletes children if folder
    const filesToDeleteFromStorage = await fileQueries.deleteFile(id);

    // Delete all files from storage in parallel
    if (filesToDeleteFromStorage.length > 0) {
      const { getStorageDriverByType } = await import('@/lib/storage');

      await Promise.all(
        filesToDeleteFromStorage.map(async (fileInfo) => {
          try {
            const storage = getStorageDriverByType(fileInfo.storageDriver as 'local' | 's3' | 'r2');
            await storage.delete(fileInfo.storagePath);
          } catch (storageError) {
            logger.error(`Failed to delete file from storage`, {
              error: storageError,
              storageDriver: fileInfo.storageDriver,
              storagePath: fileInfo.storagePath
            });
            // Continue even if storage delete fails (soft delete already done)
          }
        })
      );
    }

    const description = file.type === 'folder' && filesToDeleteFromStorage.length > 0
      ? `Folder deleted: ${file.name} (and ${filesToDeleteFromStorage.length} file(s) within)`
      : `${file.type === 'folder' ? 'Folder' : 'File'} deleted: ${file.name}`;

    await logActivity({
      action: 'delete',
      resourceType: file.type,
      resourceId: id,
      description,
      userId: user.id,
    });

    return createSuccessResponse({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('Delete file API error', { error, fileId: id });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      error.message || undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

export const DELETE = withCsrfProtection(deleteHandler);

