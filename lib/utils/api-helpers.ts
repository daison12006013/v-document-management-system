/**
 * API Route Helper Utilities
 * Common patterns for API routes to reduce duplication
 */

import { NextRequest } from 'next/server';

/**
 * Extract params from Next.js route context
 * Reduces repetition of `const { id } = await context.params;`
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (request, user, context) => {
 *   const { id } = await extractParams(context);
 *   // ...
 * });
 * ```
 */
export async function extractParams<T extends Record<string, string>>(
  context: { params: Promise<T> }
): Promise<T> {
  return await context.params;
}

/**
 * Extract a single param by key
 *
 * @example
 * ```ts
 * const id = await extractParam(context, 'id');
 * ```
 */
export async function extractParam(
  context: { params: Promise<Record<string, string>> },
  key: string
): Promise<string> {
  const params = await context.params;
  return params[key];
}

/**
 * Parse request body as JSON with error handling
 * Wrapper around request.json() that provides consistent error handling
 *
 * @example
 * ```ts
 * const body = await parseRequestBody(request);
 * ```
 */
export async function parseRequestBody<T = any>(
  request: NextRequest
): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

