import { permissions } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isSystemAccount, getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';

// GET /api/users/[id] - Get a specific user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission('users', 'read');

        const { id } = await params;
        const user = await userQueries.getUser(id);

        if (!user) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Get user roles, permissions, and direct permissions in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(user.id),
            userQueries.getUserDirectPermissions(user.id),
            userQueries.getUserPermissions(user.id),
        ]);

        return createSuccessResponse({
            ...user,
            roles: roles.map(r => r.role).filter(Boolean),
            permissions,
            directPermissions: directPermissions.map(p => p.permission).filter(Boolean),
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }
        if (error.message === 'Forbidden') {
            return createErrorResponse(ERRORS.FORBIDDEN);
        }
        console.error('Get user API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission('users', 'write');

        const { id } = await params;
        const body = await request.json();
        const { email, name } = body;

        if (!email || !name) {
            return createErrorResponse(
                ERRORS.MISSING_REQUIRED_FIELDS,
                'Email and name are required'
            );
        }

        // Check if user exists
        const existingUser = await userQueries.getUser(id);
        if (!existingUser) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Prevent modification of system accounts
        if (existingUser.isSystemAccount) {
            return createErrorResponse(ERRORS.CANNOT_MODIFY_SYSTEM_ACCOUNT);
        }

        const updatedUser = await userQueries.updateUser(id, { email, name });

        if (!updatedUser) {
            return createErrorResponse(ERRORS.FAILED_TO_UPDATE_USER);
        }

        // Log user update activity
        const currentUser = await getCurrentUser();
        await logActivity({
            action: 'update',
            resourceType: 'user',
            resourceId: id,
            description: `User updated: ${updatedUser.email}`,
            metadata: {
                email: updatedUser.email,
                name: updatedUser.name,
                previousEmail: existingUser.email,
                previousName: existingUser.name,
            },
            userId: currentUser?.id ?? null,
        });

        return createSuccessResponse(updatedUser);
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }
        if (error.message === 'Forbidden') {
            return createErrorResponse(ERRORS.FORBIDDEN);
        }
        console.error('Update user API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission('users', 'delete');

        const { id } = await params;

        // Check if user exists
        const existingUser = await userQueries.getUser(id);
        if (!existingUser) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Prevent deletion of system accounts
        if (existingUser.isSystemAccount) {
            return createErrorResponse(ERRORS.CANNOT_DELETE_SYSTEM_ACCOUNT);
        }

        await userQueries.deleteUser(id);

        // Log user deletion activity
        const currentUser = await getCurrentUser();
        await logActivity({
            action: 'delete',
            resourceType: 'user',
            resourceId: id,
            description: `User deleted: ${existingUser.email}`,
            metadata: {
                email: existingUser.email,
                name: existingUser.name,
            },
            userId: currentUser?.id ?? null,
        });

        return createSuccessResponse({ success: true });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }
        if (error.message === 'Forbidden') {
            return createErrorResponse(ERRORS.FORBIDDEN);
        }
        console.error('Delete user API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}
