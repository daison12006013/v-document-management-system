import { NextRequest, NextResponse } from 'next/server';
import * as fileQueries from '@/lib/queries/files';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/utils/error-handler';
import { ensureFileExists } from '@/lib/utils/validation';

// GET /api/files/[id]/download - Get signed download URL
export const GET = withAuth(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const { file, error: fileError } = await ensureFileExists(id);
    if (fileError) return fileError;

    if (file!.type !== 'file') {
      return createErrorResponse(ERRORS.CANNOT_DOWNLOAD_FOLDER);
    }

    if (!file!.storagePath || !file!.storageDriver) {
      return createErrorResponse(ERRORS.FILE_STORAGE_INFO_UNAVAILABLE);
    }

    // Get signed URL from storage driver (use the driver that stored the file)
    const { getStorageDriverByType } = await import('@/lib/storage');
    const storage = getStorageDriverByType(file!.storageDriver);
    // Pass MIME type to ensure correct content type in signed URL token
    // Note: LocalStorageDriver includes this in the token, S3/R2 drivers ignore it
    const signedUrl = await storage.getSignedUrl(file!.storagePath, undefined, file!.mimeType || undefined);

    return createSuccessResponse({
      url: signedUrl,
      filename: file!.originalName || file!.name,
      mimeType: file!.mimeType,
      size: file!.size,
    });
  } catch (error: any) {
    return handleApiError(error, 'Download file');
  }
}, { requiredPermission: { resource: 'files', action: 'download' } });

