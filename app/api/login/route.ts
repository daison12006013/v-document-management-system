import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as userQueries from '@/lib/queries/users';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { validateRequest } from '@/lib/validations/middleware';
import { loginSchema } from '@/lib/validations/schemas';
import { setSessionCookie } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { addCsrfTokenToResponse } from '@/lib/middleware/csrf';

async function loginHandler(request: NextRequest): Promise<NextResponse> {
    try {
        // Validate request body using Zod schema
        const { email, password } = await validateRequest(request, loginSchema);

        // Get user from database
        const user = await userQueries.getUserByEmail(email);

        if (!user) {
            // Don't reveal if user exists or not (security best practice)
            const errorResponse = createErrorResponse(ERRORS.INVALID_CREDENTIALS);
            return await addCsrfTokenToResponse(errorResponse);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            const errorResponse = createErrorResponse(ERRORS.INVALID_CREDENTIALS);
            return await addCsrfTokenToResponse(errorResponse);
        }

        // Create response with user data (excluding password)
        const response = createSuccessResponse(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 200 }
        );

        // Set secure JWT session cookie
        setSessionCookie(response, {
            userId: user.id,
            email: user.email,
            name: user.name,
            createdAt: new Date().toISOString(),
        });

        // Log login activity
        await logActivity({
            action: 'login',
            resourceType: 'auth',
            resourceId: user.id,
            description: `User logged in: ${user.email}`,
            metadata: { email: user.email, name: user.name },
            userId: user.id,
        });

        logger.info('User logged in successfully', { userId: user.id, email: user.email });

        // Always add CSRF token to response (initializes if missing)
        return await addCsrfTokenToResponse(response);
    } catch (error) {
        let errorResponse: NextResponse;

        if (error instanceof ValidationError) {
            errorResponse = createErrorResponse(ERRORS.VALIDATION_ERROR, error.message, error.details);
        } else {
            logger.error('Login error', { error });
            errorResponse = createErrorResponse(
                ERRORS.INTERNAL_SERVER_ERROR,
                undefined,
                error instanceof Error ? { message: error.message, stack: error.stack } : error
            );
        }

        // Always add CSRF token to error responses too (for retry scenarios)
        return await addCsrfTokenToResponse(errorResponse);
    }
}

export const POST = loginHandler;
