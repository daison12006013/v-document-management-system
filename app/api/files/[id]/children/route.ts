import { NextRequest, NextResponse } from 'next/server';
import * as fileQueries from '@/lib/queries/files';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/utils/error-handler';
import { ensureFileExists } from '@/lib/utils/validation';

// GET /api/files/[id]/children - Get folder contents
export const GET = withAuth(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;

    // Verify the folder exists
    const { file: folder, error: folderError } = await ensureFileExists(id);
    if (folderError) {
      return createErrorResponse(ERRORS.FOLDER_NOT_FOUND);
    }

    if (folder!.type !== 'folder') {
      return createErrorResponse(ERRORS.NOT_A_FOLDER);
    }

    // Get folder children
    const children = await fileQueries.getFolderChildren(id);

    return createSuccessResponse(children);
  } catch (error: any) {
    return handleApiError(error, 'Get folder children');
  }
}, { requiredPermission: { resource: 'files', action: 'read' } });

