import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';

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

    // Debug logging (remove in production)
    console.log(`[auth/me] User ${user.id} has ${permissions.length} permissions:`, permissions.map(p => p.name));

    return createSuccessResponse({
      authenticated: true,
      user,
      permissions,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}
