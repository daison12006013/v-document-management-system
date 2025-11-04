import { db } from '@/lib/db';
import { createActivity } from '@/app/generated-queries/dashboard_sql';
import { getCurrentUser } from '@/lib/auth';

export interface ActivityLogParams {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  description?: string | null;
  metadata?: any;
  userId?: string | null; // Optional: if not provided, will get current user
}

/**
 * Log an activity to the activities table
 * Automatically captures the current user if userId is not provided
 *
 * @param params Activity parameters
 * @returns Promise<void> - Logs activity asynchronously (doesn't block on errors)
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    // Get user ID if not provided
    let userId: string | null = params.userId ?? null;

    if (!userId) {
      try {
        const currentUser = await getCurrentUser();
        userId = currentUser?.id ?? null;
      } catch (error) {
        // If getting current user fails (e.g., not authenticated), continue with null
        userId = null;
      }
    }

    // Log the activity (non-blocking)
    await createActivity(db, {
      userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      description: params.description ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (error) {
    // Don't throw errors from activity logging - it should never break the main flow
    // Log to console for debugging but don't fail the request
    console.error('Failed to log activity:', error);
  }
}

