import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { handleApiError } from '@/lib/utils/error-handler';
import * as shareLinkQueries from '@/lib/queries/share-links';
import * as fileQueries from '@/lib/queries/files';
import { logger } from '@/lib/logger';

// POST /api/files/[id]/share - Create a share link
const postHandler = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.id;
    const body = await request.json();
    const { expiresInSeconds } = body;

    // Validate file exists and user has access
    const file = await fileQueries.getFile(fileId);
    if (!file) {
      return createErrorResponse(ERRORS.NOT_FOUND, 'File not found');
    }

    // Check if user owns the file or has permission
    if (file.createdBy !== user.id) {
      return createErrorResponse(ERRORS.FORBIDDEN, 'You do not have permission to share this file');
    }

    // Validate expiresInSeconds if provided
    let expiresIn: number | null = null;
    if (expiresInSeconds !== undefined && expiresInSeconds !== null) {
      if (typeof expiresInSeconds !== 'number' || expiresInSeconds < 0) {
        return createErrorResponse(ERRORS.INVALID_INPUT, 'Invalid expiration time');
      }
      expiresIn = expiresInSeconds;
    }

    // Create share link
    let shareLink;
    try {
      shareLink = await shareLinkQueries.createShareLink({
        fileId,
        sharedBy: user.id,
        expiresInSeconds: expiresIn,
      });
    } catch (dbError: any) {
      logger.error('Failed to create share link', {
        error: dbError,
        fileId,
        userId: user.id,
        message: dbError.message,
        stack: dbError.stack,
      });

      // Check if it's a table not found error
      if (dbError.message?.includes('doesn\'t exist') ||
          dbError.message?.includes('Unknown table') ||
          dbError.code === 'ER_NO_SUCH_TABLE') {
        return createErrorResponse(
          ERRORS.INTERNAL_SERVER_ERROR,
          'Share links table does not exist. Please run database migrations.'
        );
      }

      throw dbError; // Re-throw to be handled by handleApiError
    }

    // Generate the share URL
    const { getStorageConfig } = await import('@/lib/storage/config');
    const storageConfig = getStorageConfig();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || storageConfig.drivers.local.baseUrl || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareLink.token}`;

    logger.info('Share link created', {
      fileId,
      shareLinkId: shareLink.id,
      userId: user.id,
      expiresIn: expiresIn,
    });

    return createSuccessResponse({
      id: shareLink.id,
      token: shareLink.token,
      shareUrl,
      expiresAt: shareLink.expiresAt,
      expiresInSeconds: shareLink.expiresInSeconds,
      createdAt: shareLink.createdAt,
    });
  } catch (error: any) {
    return handleApiError(error, 'Create share link');
  }
}, { requiredPermission: { resource: 'files', action: 'read' } });

export const POST = withCsrfProtection(postHandler);

