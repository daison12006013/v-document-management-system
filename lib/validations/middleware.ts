/**
 * Request validation middleware
 * Centralized validation for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/errors';
import { createErrorResponse, ERRORS } from '@/lib/error_responses';

/**
 * Validate request body against a Zod schema
 * @throws ValidationError if validation fails
 */
export async function validateRequest<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      throw new ValidationError('Validation failed', details);
    }
    throw error;
  }
}

/**
 * Wrapper for API routes that validates the request body
 * Returns formatted error response if validation fails
 */
export function withValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: ZodSchema<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const validatedData = await validateRequest(request, schema);
      return handler(request, validatedData);
    } catch (error) {
      if (error instanceof ValidationError) {
        return createErrorResponse(ERRORS.VALIDATION_ERROR, error.message, error.details);
      }
      throw error;
    }
  };
}

