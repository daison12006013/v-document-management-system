import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import { logResourceCreated } from '@/lib/utils/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withAuth } from '@/lib/middleware/auth';
import { validateRequest } from '@/lib/validations/middleware';
import { createUserSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import { excludePassword } from '@/lib/utils/user';
import { mapUserRoles, mapUserDirectPermissions } from '@/lib/utils/rbac';
import { handleApiError } from '@/lib/utils/error-handler';
import type { User } from '@/lib/types';

// GET /api/users - List all users
export const GET = withAuth(async (_request: NextRequest, _user) => {
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
                    const userWithoutPassword = excludePassword(user);

                    // Map roles and permissions using utilities
                    const userRoles = mapUserRoles(roles || []);
                    const userDirectPermissions = mapUserDirectPermissions(directPermissions || []);

                    return {
                        ...userWithoutPassword,
                        roles: userRoles,
                        permissions: permissions || [],
                        directPermissions: userDirectPermissions,
                    };
                } catch (userError) {
                    logger.error(`Error fetching data for user ${user.id}`, { error: userError });
                    // Return user with empty arrays if there's an error fetching their roles/permissions
                    // Exclude password from response
                    const userWithoutPassword = excludePassword(user);
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
        return handleApiError(error, 'List users');
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
        await logResourceCreated({
            resourceType: 'user',
            resourceId: newUser.id,
            resourceName: newUser.email,
            userId: currentUser?.id ?? user.id,
            metadata: { email: newUser.email, name: newUser.name },
        });

        logger.info('User created successfully', { userId: newUser.id, email: newUser.email, createdBy: currentUser?.id });

        // Exclude password from response
        const userWithoutPassword = excludePassword(newUser);
        return createSuccessResponse(userWithoutPassword, { status: 201 });
    } catch (error) {
        return handleApiError(error, 'Create user');
    }
};

export const POST = withCsrfProtection(withAuth(createUserHandler, { requiredPermission: { resource: 'users', action: 'write' } }));
