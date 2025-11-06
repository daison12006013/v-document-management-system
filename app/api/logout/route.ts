import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { clearSessionCookie } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';

async function postHandler() {
  try {
    // Get current user before clearing session
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch (error) {
      // User might not be authenticated, continue with logout
    }

    const response = createSuccessResponse({ success: true });

    // Clear the session cookie using proper method
    clearSessionCookie(response);

    // Log logout activity if user was authenticated
    if (currentUser) {
      await logActivity({
        action: 'logout',
        resourceType: 'auth',
        resourceId: currentUser.id,
        description: `User logged out: ${currentUser.email}`,
        metadata: { email: currentUser.email, name: currentUser.name },
        userId: currentUser.id,
      });
      logger.info('User logged out', { userId: currentUser.id, email: currentUser.email });
    }

    return response;
  } catch (error) {
    logger.error('Logout error', { error });
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

export const POST = withCsrfProtection(postHandler);

