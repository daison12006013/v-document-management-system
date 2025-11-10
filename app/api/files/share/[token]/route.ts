import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { handleApiError } from '@/lib/utils/error-handler';
import * as shareLinkQueries from '@/lib/queries/share-links';
import { logger } from '@/lib/logger';

// GET /api/files/share/[token] - Get share link info (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    if (!token || token.trim() === '') {
      return createErrorResponse(ERRORS.NOT_FOUND, 'Share link not found or expired');
    }

    const shareLink = await shareLinkQueries.getShareLinkByToken(token);

    if (!shareLink) {
      return createErrorResponse(ERRORS.NOT_FOUND, 'Share link not found or expired');
    }

    if (!shareLink.file) {
      return createErrorResponse(ERRORS.NOT_FOUND, 'File not found');
    }

    return createSuccessResponse({
      id: shareLink.id,
      fileId: shareLink.fileId,
      file: {
        id: shareLink.file.id,
        name: shareLink.file.name,
        type: shareLink.file.type,
        mimeType: shareLink.file.mimeType,
        size: shareLink.file.size,
      },
      expiresAt: shareLink.expiresAt,
      createdAt: shareLink.createdAt,
    });
  } catch (error: any) {
    return handleApiError(error, 'Get share link');
  }
}

