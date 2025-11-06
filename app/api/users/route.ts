import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withAuth } from '@/lib/middleware/auth';
import { validateRequest } from '@/lib/validations/middleware';
import { createUserSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/errors';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import type { User } from '@/lib/types';

// GET /api/users - List all users
export const GET = withAuth(async (request: NextRequest, user) => {
    try {
        const usersList = await userQueries.listUsers();

        // For each user, get their roles and permissions
        const usersWithPermissions = await Promise.all(
            usersList.map(async (user) => {
                try {
                    // getUserRoles and getUserDirectPermissions are independent, so fetch them in parallel
                    const [roles, directPermissions, permissions] = await Promise.all([
                        userQueries.getUserRoles(user.id),
                        userQueries.getUserDirectPermissions(user.id),
                        userQueries.getUserPermissions(user.id),
                    ]);
                    // Exclude password from response
                    const { password: _, ...userWithoutPassword } = user;
                    return {
                        ...userWithoutPassword,
                        roles: (roles || []).map(r => r?.role).filter(Boolean),
                        permissions: permissions || [],
                        directPermissions: (directPermissions || []).map(p => p?.permission).filter(Boolean),
                    };
                } catch (userError) {
                    logger.error(`Error fetching data for user ${user.id}`, { error: userError });
                    // Return user with empty arrays if there's an error fetching their roles/permissions
                    // Exclude password from response
                    const { password: _, ...userWithoutPassword } = user;
                    return {
                        ...userWithoutPassword,
                        roles: [],
                        permissions: [],
                        directPermissions: [],
                    };
                }
            })
        );

        return createSuccessResponse(usersWithPermissions);
    } catch (error) {
        logger.error('List users API error', { error });
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}, { requiredPermission: { resource: 'users', action: 'read' } });

// POST /api/users - Create a new user
const createUserHandler = async (request: NextRequest, user: User) => {
    try {
        const validatedData = await validateRequest(request, createUserSchema);
        const { email, name, password } = validatedData;
        const currentUser = await getCurrentUser();

        // Check if user already exists
        const existingUser = await userQueries.getUserByEmail(email);
        if (existingUser) {
            return createErrorResponse(ERRORS.EMAIL_ALREADY_EXISTS);
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userQueries.createUser({
            email,
            name,
            password: hashedPassword,
        });

        if (!newUser) {
            return createErrorResponse(ERRORS.FAILED_TO_CREATE_USER);
        }

        // Log user creation activity
        await logActivity({
            action: 'create',
            resourceType: 'user',
            resourceId: newUser.id,
            description: `User created: ${newUser.email}`,
            metadata: { email: newUser.email, name: newUser.name },
            userId: currentUser?.id ?? null,
        });

        logger.info('User created successfully', { userId: newUser.id, email: newUser.email, createdBy: currentUser?.id });

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = newUser;
        return createSuccessResponse(userWithoutPassword, { status: 201 });
    } catch (error) {
        if (error instanceof ValidationError) {
            // Format validation error message to include specific field errors
            let errorMessage = 'Validation failed';
            if (error.details && Array.isArray(error.details)) {
                const messages = error.details.map((detail: any) => detail.message).filter(Boolean);
                if (messages.length > 0) {
                    errorMessage = messages.join(', ');
                }
            }
            return createErrorResponse(ERRORS.VALIDATION_ERROR, errorMessage, error.details);
        }
        logger.error('Create user API error', { error });
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
};

export const POST = withCsrfProtection(withAuth(createUserHandler, { requiredPermission: { resource: 'users', action: 'write' } }));
