/**
 * Centralized authentication middleware
 * Reduces code duplication and ensures consistent error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import { requireAuth, requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/utils/error-handler';

interface AuthContext {
  user: User;
}

interface AuthMiddlewareOptions {
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Handles authentication and permission checks, then passes user to handler
 *
 * Supports both simple handlers and handlers with Next.js route params:
 * - Simple: withAuth(handler) -> (request) => handler(request, user)
 * - With params: withAuth(handler) -> (request, context) => handler(request, user, context)
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: User, ...args: T) => Promise<NextResponse>,
  options?: AuthMiddlewareOptions
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      let user: User;

      if (options?.requiredPermission) {
        // Check authentication and permission
        user = await requirePermission(
          options.requiredPermission.resource,
          options.requiredPermission.action
        );
      } else {
        // Check authentication only
        user = await requireAuth();
      }

      return handler(request, user, ...args);
    } catch (error) {
      // Use centralized error handler
      return handleApiError(error, 'Authentication check');
    }
  };
}

/**
 * Requires any of the specified permissions (OR logic)
 */
export function withAnyPermission(
  permissionNames: string[],
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { requireAnyPermission } = await import('@/lib/auth');
      const user = await requireAnyPermission(permissionNames);
      return handler(request, user);
    } catch (error) {
      // Use centralized error handler
      return handleApiError(error, 'Permission check');
    }
  };
}

