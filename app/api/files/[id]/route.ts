import { NextRequest, NextResponse } from 'next/server';
import * as fileQueries from '@/lib/queries/files';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import { withAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/utils/error-handler';
import { normalizeParentId } from '@/lib/utils/files';
import { ensureFileExists } from '@/lib/utils/validation';
import { logResourceUpdated, logResourceDeleted } from '@/lib/utils/activities';

// GET /api/files/[id] - Get file/folder details
export const GET = withAuth(async (
  _request: NextRequest,
  _user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const { file, error } = await ensureFileExists(id);
    if (error) return error;

    return createSuccessResponse(file);
  } catch (error: any) {
    return handleApiError(error, 'Get file');
  }
}, { requiredPermission: { resource: 'files', action: 'read' } });

// PUT /api/files/[id] - Update file/folder metadata
const putHandler = withAuth(async (
    request: NextRequest,
    user,
    context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const { file: existingFile, error: fileError } = await ensureFileExists(id);
    if (fileError) return fileError;

    const body = await request.json();
    const { name, parentId: parentIdRaw, metadata } = body;

    // Normalize parentId
    const parentId = parentIdRaw !== undefined ? normalizeParentId(parentIdRaw) : undefined;

    // Validate parent if moving to a folder
    if (parentId !== undefined && parentId !== null) {
      const { file: parentFile, error: parentError } = await ensureFileExists(parentId);
      if (parentError) {
        return createErrorResponse(ERRORS.PARENT_FOLDER_NOT_FOUND);
      }
      if (parentFile!.type !== 'folder') {
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

    await logResourceUpdated({
      resourceType: existingFile!.type,
      resourceId: id,
      resourceName: updatedFile.name,
      userId: user.id,
      previousName: existingFile!.name,
      metadata: { newName: name },
    });

    return createSuccessResponse(updatedFile);
  } catch (error: any) {
    return handleApiError(error, 'Update file');
  }
}, { requiredPermission: { resource: 'files', action: 'update' } });

export const PUT = withCsrfProtection(putHandler);

// DELETE /api/files/[id] - Delete file/folder
const deleteHandler = withAuth(async (
    _request: NextRequest,
    user,
    context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const { file, error: fileError } = await ensureFileExists(id);
    if (fileError) return fileError;

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

    const descriptionSuffix = file!.type === 'folder' && filesToDeleteFromStorage.length > 0
      ? ` (and ${filesToDeleteFromStorage.length} file(s) within)`
      : '';

    await logResourceDeleted({
      resourceType: file!.type,
      resourceId: id,
      resourceName: file!.name,
      userId: user.id,
      descriptionSuffix,
    });

    return createSuccessResponse({ success: true });
  } catch (error: any) {
    return handleApiError(error, 'Delete file');
  }
}, { requiredPermission: { resource: 'files', action: 'delete' } });

export const DELETE = withCsrfProtection(deleteHandler);

