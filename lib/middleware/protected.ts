/**
 * Combined CSRF and Auth Protection Middleware
 * Simplifies the common pattern of wrapping handlers with both CSRF and Auth
 *
 * @example
 * ```ts
 * // Instead of: withCsrfProtection(withAuth(handler, options))
 * export const POST = withProtected(handler, {
 *   requiredPermission: { resource: 'users', action: 'write' }
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import { withCsrfProtection } from './csrf';
import { withAuth, AuthMiddlewareOptions } from './auth';

/**
 * Wraps a handler with both CSRF protection and authentication
 * This is a common pattern that appears frequently in the codebase
 */
export function withProtected<T extends any[]>(
  handler: (request: NextRequest, user: User, ...args: T) => Promise<NextResponse>,
  authOptions?: AuthMiddlewareOptions
) {
  return withCsrfProtection(withAuth(handler, authOptions));
}

