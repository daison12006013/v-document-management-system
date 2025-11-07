import { getCsrfToken, setCsrfTokenCookie } from '@/lib/middleware/csrf';
import { createSuccessResponse } from '@/lib/error_responses';

/**
 * GET /api/csrf
 * Returns the CSRF token for the current session
 * This endpoint ensures the CSRF token cookie is set
 */
export async function GET() {
  const token = await getCsrfToken();
  const response = createSuccessResponse({ token });
  setCsrfTokenCookie(response, token);
  return response;
}

