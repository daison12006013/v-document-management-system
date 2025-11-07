/**
 * Centralized error handling utilities for API routes
 */

import { NextResponse } from 'next/server';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/errors';
import { createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';

/**
 * Extract error trace information for logging
 */
function getErrorTrace(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * Format validation error messages from error details
 */
function formatValidationError(error: ValidationError): string {
  let errorMessage = 'Validation failed';
  if (error.details && Array.isArray(error.details)) {
    const messages = (error.details as any[])
      .map((detail: any) => detail.message)
      .filter(Boolean);
    if (messages.length > 0) {
      errorMessage = messages.join(', ');
    }
  }
  return errorMessage;
}

/**
 * Handle common errors in API route handlers
 * Returns appropriate error response or re-throws if not a known error type
 *
 * Usage:
 * ```ts
 * try {
 *   // handler logic
 * } catch (error) {
 *   return handleApiError(error, 'Operation name');
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context: string = 'API operation'
): NextResponse {
  // Handle custom error classes
  if (error instanceof UnauthorizedError) {
    return createErrorResponse(ERRORS.UNAUTHORIZED);
  }

  if (error instanceof ForbiddenError) {
    return createErrorResponse(ERRORS.FORBIDDEN);
  }

  if (error instanceof ValidationError) {
    const errorMessage = formatValidationError(error);
    return createErrorResponse(ERRORS.VALIDATION_ERROR, errorMessage, error.details);
  }

  if (error instanceof NotFoundError) {
    // Map NotFoundError to appropriate error response based on context
    // This is a fallback - specific routes should use specific error codes
    return createErrorResponse(ERRORS.USER_NOT_FOUND, error.message);
  }

  // Handle legacy string-based error checking (for backward compatibility)
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED);
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN);
    }
  }

  // Log unexpected errors
  const trace = getErrorTrace(error);
  logger.error(`${context} error`, { error: trace });

  // Return generic server error
  return createErrorResponse(
    ERRORS.INTERNAL_SERVER_ERROR,
    undefined,
    error instanceof Error ? trace : error
  );
}


