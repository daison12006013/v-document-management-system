import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { logActivity } from '@/lib/activities';
import { getStorageDriver } from '@/lib/storage';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';

// GET /api/files - List files and folders
export async function GET(request: NextRequest) {
  try {
    await requirePermission('files', 'read');

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const type = searchParams.get('type') as 'file' | 'folder' | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const filesList = await fileQueries.listFiles({
      parentId: parentId === 'null' ? null : parentId || undefined,
      type: type || undefined,
      limit,
      offset,
    });

    return createSuccessResponse(filesList);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('List files API error', { error });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

// POST /api/files - Upload file or create folder
async function postHandler(request: NextRequest) {
  try {
    const user = await requirePermission('files', 'create');

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { name, type, parentId } = body;

      if (!name || !type) {
        return createErrorResponse(
          ERRORS.MISSING_REQUIRED_FIELDS,
          'Name and type are required'
        );
      }

      if (type !== 'file' && type !== 'folder') {
        return createErrorResponse(ERRORS.INVALID_FILE_TYPE);
      }

      if (type === 'folder') {
        const normalizedParentId = parentId && parentId.trim() !== '' && parentId !== 'null'
          ? parentId
          : null;

        const newFolder = await fileQueries.createFile({
          name,
          type: 'folder',
          parentId: normalizedParentId,
          path: '',
          createdBy: user.id,
        });

        if (!newFolder) {
          return createErrorResponse(ERRORS.FAILED_TO_CREATE_FOLDER);
        }

        await logActivity({
          action: 'create',
          resourceType: 'folder',
          resourceId: newFolder.id,
          description: `Folder created: ${newFolder.name}`,
          userId: user.id,
        });

        return createSuccessResponse(newFolder, { status: 201 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parentIdRaw = formData.get('parentId') as string | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return createErrorResponse(ERRORS.FILE_REQUIRED);
    }

    const parentId = parentIdRaw && parentIdRaw.trim() !== '' && parentIdRaw !== 'null'
      ? parentIdRaw
      : null;

    // Check upload limits
    const { getUploadLimits } = await import('@/lib/storage/config');
    const limits = getUploadLimits();

    if (file.size > limits.maxFileSize) {
      return createErrorResponse(
        ERRORS.FILE_SIZE_EXCEEDED,
        `File size exceeds maximum of ${limits.maxFileSize} bytes`
      );
    }

    const fileId = randomUUID();
    const storagePath = `${user.id}/${fileId}/${file.name}`;

    const storage = getStorageDriver();
    const { getStorageConfig } = await import('@/lib/storage/config');
    const storageConfig = getStorageConfig();
    const storageResult = await storage.upload(file, storagePath);
    const fileName = name || file.name;
    const newFile = await fileQueries.createFile({
      name: fileName,
      type: 'file',
      parentId: parentId,
      path: '',
      createdBy: user.id,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      storagePath: storageResult.path,
      storageDriver: storageConfig.default,
      checksum: storageResult.checksum,
    });

    if (!newFile) {
      try {
        await storage.delete(storagePath);
      } catch (deleteError) {
        logger.error('Failed to cleanup uploaded file', { error: deleteError, storagePath });
      }
      return createErrorResponse(ERRORS.FAILED_TO_CREATE_FILE);
    }

    await logActivity({
      action: 'create',
      resourceType: 'file',
      resourceId: newFile.id,
      description: `File uploaded: ${newFile.name}`,
      metadata: {
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      },
      userId: user.id,
    });

    return createSuccessResponse(newFile, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('Create file API error', { error });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      error.message || undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

export const POST = withCsrfProtection(postHandler);

