import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import * as fileQueries from '@/lib/queries/files';
import { getStorageDriver } from '@/lib/storage';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import { withAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/utils/error-handler';
import { normalizeParentId } from '@/lib/utils/files';
import { parsePaginationParams, parseParentIdFromQuery, parseFileTypeFromQuery } from '@/lib/utils/query-params';
import { logResourceCreated } from '@/lib/utils/activities';
import { validateRequiredFields } from '@/lib/utils/validation';

// GET /api/files - List files and folders
export const GET = withAuth(async (request: NextRequest, _user) => {
  try {
    const { limit, offset } = parsePaginationParams(request);
    const parentId = parseParentIdFromQuery(request);
    const type = parseFileTypeFromQuery(request);

    const filesList = await fileQueries.listFiles({
      parentId,
      type: type || undefined,
      limit,
      offset,
    });

    return createSuccessResponse(filesList);
  } catch (error: any) {
    return handleApiError(error, 'List files');
  }
}, { requiredPermission: { resource: 'files', action: 'read' } });

// POST /api/files - Upload file or create folder
const postHandler = withAuth(async (request: NextRequest, user) => {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { name, type, parentId } = body;

      const requiredFieldsCheck = validateRequiredFields({ name, type }, ['name', 'type']);
      if (requiredFieldsCheck.error) {
        return requiredFieldsCheck.error;
      }

      if (type !== 'file' && type !== 'folder') {
        return createErrorResponse(ERRORS.INVALID_FILE_TYPE);
      }

      if (type === 'folder') {
        const normalizedParentId = normalizeParentId(parentId);

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

        await logResourceCreated({
          resourceType: 'folder',
          resourceId: newFolder.id,
          resourceName: newFolder.name,
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

    const parentId = normalizeParentId(parentIdRaw);

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

    await logResourceCreated({
      resourceType: 'file',
      resourceId: newFile.id,
      resourceName: newFile.name,
      userId: user.id,
      metadata: {
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });

    return createSuccessResponse(newFile, { status: 201 });
  } catch (error: any) {
    return handleApiError(error, 'Create file');
  }
}, { requiredPermission: { resource: 'files', action: 'create' } });

export const POST = withCsrfProtection(postHandler);

