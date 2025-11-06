import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { getStorageDriver } from '@/lib/storage';
import { LocalStorageDriver } from '@/lib/storage/drivers/local';
import { getSignedUrlConfig } from '@/lib/storage/config';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';

// GET /api/files/[id]/download - Get signed download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission('files', 'download');
    const file = await fileQueries.getFile(id);

    if (!file) {
      return createErrorResponse(ERRORS.FILE_NOT_FOUND);
    }

    if (file.type !== 'file') {
      return createErrorResponse(ERRORS.CANNOT_DOWNLOAD_FOLDER);
    }

    if (!file.storagePath || !file.storageDriver) {
      return createErrorResponse(ERRORS.FILE_STORAGE_INFO_UNAVAILABLE);
    }

    // Get signed URL from storage driver (use the driver that stored the file)
    const { getStorageDriverByType } = await import('@/lib/storage');
    const storage = getStorageDriverByType(file.storageDriver);
    // Pass MIME type to ensure correct content type in signed URL token
    // Note: LocalStorageDriver includes this in the token, S3/R2 drivers ignore it
    const signedUrl = await storage.getSignedUrl(file.storagePath, undefined, file.mimeType || undefined);

    return createSuccessResponse({
      url: signedUrl,
      filename: file.originalName || file.name,
      mimeType: file.mimeType,
      size: file.size,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('Download file API error', { error, fileId: id });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

