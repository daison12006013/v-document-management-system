/**
 * Centralized authentication middleware
 * Reduces code duplication and ensures consistent error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import { requireAuth, requirePermission } from '@/lib/auth';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { createErrorResponse, ERRORS } from '@/lib/error_responses';

export interface AuthContext {
  user: User;
}

export interface AuthMiddlewareOptions {
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Handles authentication and permission checks, then passes user to handler
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
      if (error instanceof UnauthorizedError || (error as Error).message === 'Unauthorized') {
        return createErrorResponse(ERRORS.UNAUTHORIZED);
      }
      if (error instanceof ForbiddenError || (error as Error).message === 'Forbidden') {
        return createErrorResponse(ERRORS.FORBIDDEN);
      }
      // Re-throw unexpected errors
      throw error;
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
      if (error instanceof UnauthorizedError || (error as Error).message === 'Unauthorized') {
        return createErrorResponse(ERRORS.UNAUTHORIZED);
      }
      if (error instanceof ForbiddenError || (error as Error).message === 'Forbidden') {
        return createErrorResponse(ERRORS.FORBIDDEN);
      }
      throw error;
    }
  };
}

