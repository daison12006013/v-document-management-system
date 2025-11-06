import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';
import { addCsrfTokenToResponse } from '@/lib/middleware/csrf';

// Ensure this route is never cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }

    // Get user permissions (includes both role-based and direct permissions)
    const permissions = await userQueries.getUserPermissions(user.id);

    // Debug logging
    logger.debug(`User ${user.id} has ${permissions.length} permissions`, {
      userId: user.id,
      permissionCount: permissions.length,
      permissions: permissions.map(p => p.name),
    });

    const response = createSuccessResponse({
      authenticated: true,
      user,
      permissions,
    });

    // Ensure CSRF token cookie is set for authenticated users
    return await addCsrfTokenToResponse(response);
  } catch (error) {
    logger.error('Auth check error', { error });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}
