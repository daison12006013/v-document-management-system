import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import * as fileQueries from '@/lib/queries/files';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';

// GET /api/files/[id]/children - Get folder contents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission('files', 'read');

    // Verify the folder exists
    const folder = await fileQueries.getFile(id);
    if (!folder) {
      return createErrorResponse(ERRORS.FOLDER_NOT_FOUND);
    }

    if (folder.type !== 'folder') {
      return createErrorResponse(ERRORS.NOT_A_FOLDER);
    }

    // Get folder children
    const children = await fileQueries.getFolderChildren(id);

    return createSuccessResponse(children);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
    logger.error('Get folder children API error', { error, folderId: id });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

