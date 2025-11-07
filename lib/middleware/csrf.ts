/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createErrorResponse, ERRORS } from '@/lib/error_responses';
import { env } from '@/lib/config/env';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * State-changing HTTP methods that require CSRF protection
 */
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Generate a new CSRF token
 */
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get or create CSRF token for the current session
 */
export const getCsrfToken = async (): Promise<string> => {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (!token) {
    token = generateCsrfToken();
  }

  return token;
};

/**
 * Set CSRF token cookie
 */
export const setCsrfTokenCookie = (response: NextResponse, token: string): void => {
  const isProduction = env.NODE_ENV === 'production';

  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Must be accessible to JavaScript for Double Submit Cookie pattern
    secure: isProduction,
    sameSite: 'strict', // Stricter than 'lax' for CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days, same as session
    path: '/',
  });
};

/**
 * Verify CSRF token from request
 */
const verifyCsrfToken = async (request: NextRequest): Promise<boolean> => {
  // Only protect state-changing methods
  if (!PROTECTED_METHODS.includes(request.method)) {
    return true;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  // Both tokens must exist and match
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Ensure both tokens are the same length before comparison
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
};

/**
 * CSRF protection middleware wrapper
 * Supports both simple handlers and Next.js route handlers with params
 */
export const withCsrfProtection = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) => {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Skip CSRF protection in test mode or when test header is present
    const isTestMode = process.env.NODE_ENV === 'test' ||
                       request.headers.get('x-test-mode') === 'true';

    if (!isTestMode) {
      // Verify CSRF token for protected methods
      const isValid = await verifyCsrfToken(request);

      if (!isValid) {
        return createErrorResponse(
          ERRORS.FORBIDDEN,
          'Invalid or missing CSRF token'
        );
      }
    }

    // Set CSRF token cookie if not already present (for GET requests and initial loads)
    const response = await handler(request, ...args);
    const cookieStore = await cookies();
    if (!cookieStore.get(CSRF_TOKEN_COOKIE)) {
      const token = generateCsrfToken();
      setCsrfTokenCookie(response, token);
    }

    return response;
  };
};

/**
 * Add CSRF token to response headers (for API responses that need it)
 */
export const addCsrfTokenToResponse = async (response: NextResponse): Promise<NextResponse> => {
  const token = await getCsrfToken();
  setCsrfTokenCookie(response, token);
  return response;
};

