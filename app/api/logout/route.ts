import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Get current user before clearing session
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch (error) {
      // User might not be authenticated, continue with logout
    }

    const response = createSuccessResponse({ success: true });

    // Clear the session cookie
    cookieStore.delete('vistra_session');
    response.cookies.delete('vistra_session');

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
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
}

