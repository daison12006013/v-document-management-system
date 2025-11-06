import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';

// GET /api/users - List all users
export async function GET() {
    try {
        await requirePermission('users', 'read');

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
                    return {
                        ...user,
                        roles: (roles || []).map(r => r?.role).filter(Boolean),
                        permissions: permissions || [],
                        directPermissions: (directPermissions || []).map(p => p?.permission).filter(Boolean),
                    };
                } catch (userError) {
                    console.error(`Error fetching data for user ${user.id}:`, userError);
                    // Return user with empty arrays if there's an error fetching their roles/permissions
                    return {
                        ...user,
                        roles: [],
                        permissions: [],
                        directPermissions: [],
                    };
                }
            })
        );

        return createSuccessResponse(usersWithPermissions);
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }
        if (error.message === 'Forbidden') {
            return createErrorResponse(ERRORS.FORBIDDEN);
        }
        console.error('List users API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
    try {
        await requirePermission('users', 'write');

        const body = await request.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return createErrorResponse(
                ERRORS.MISSING_REQUIRED_FIELDS,
                'Email, name, and password are required'
            );
        }

        // Check if user already exists
        const existingUser = await userQueries.getUserByEmail(email);
        if (existingUser) {
            return createErrorResponse(ERRORS.USER_ALREADY_EXISTS);
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
        const currentUser = await getCurrentUser();
        await logActivity({
            action: 'create',
            resourceType: 'user',
            resourceId: newUser.id,
            description: `User created: ${newUser.email}`,
            metadata: { email: newUser.email, name: newUser.name },
            userId: currentUser?.id ?? null,
        });

        return createSuccessResponse(newUser, { status: 201 });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }
        if (error.message === 'Forbidden') {
            return createErrorResponse(ERRORS.FORBIDDEN);
        }
        console.error('Create user API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}
