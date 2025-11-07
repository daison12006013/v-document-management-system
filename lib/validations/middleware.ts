/**
 * Request validation middleware
 * Centralized validation for API routes
 */

import { NextRequest } from 'next/server';
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


