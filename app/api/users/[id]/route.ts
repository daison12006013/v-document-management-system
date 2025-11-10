import { NextRequest } from 'next/server';
import * as userQueries from '@/lib/queries/users';
import { logResourceUpdated, logResourceDeleted } from '@/lib/utils/activities';
import { ensureUserExists, ensureNotSystemAccount } from '@/lib/utils/validation';
import { validateRequiredFields } from '@/lib/utils/validation';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withProtected } from '@/lib/middleware/protected';
import { excludePassword } from '@/lib/utils/user';
import { handleApiError } from '@/lib/utils/error-handler';
import { withAuth } from '@/lib/middleware/auth';
import { fetchUserPermissionsData } from '@/lib/utils/user-permissions';
import { extractParams } from '@/lib/utils/api-helpers';

// GET /api/users/[id] - Get a specific user
export const GET = withAuth(async (
    _request: NextRequest,
    _user,
    context: { params: Promise<{ id: string }> }
) => {
    const { id } = await extractParams(context);
    try {
        const targetUser = await userQueries.getUser(id);

        if (!targetUser) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Get user roles, permissions, and direct permissions
        const permissionsData = await fetchUserPermissionsData(targetUser.id);

        // Exclude password from response
        const userWithoutPassword = excludePassword(targetUser);
        return createSuccessResponse({
            ...userWithoutPassword,
            ...permissionsData,
        });
    } catch (error: any) {
        return handleApiError(error, 'Get user');
    }
}, { requiredPermission: { resource: 'users', action: 'read' } });

// PUT /api/users/[id] - Update a user
const putHandler = withAuth(async (
    request: NextRequest,
    user,
    context: { params: Promise<{ id: string }> }
) => {
    const { id } = await extractParams(context);
    try {
        const body = await request.json();
        const { email, name } = body;

        const requiredFieldsCheck = validateRequiredFields({ email, name }, ['email', 'name']);
        if (requiredFieldsCheck.error) {
            return requiredFieldsCheck.error;
        }

        // Check if user exists
        const { user: existingUser, error: userError } = await ensureUserExists(id);
        if (userError) return userError;

        // Prevent modification of system accounts
        const systemAccountCheck = await ensureNotSystemAccount(id, 'modify');
        if (systemAccountCheck.error) return systemAccountCheck.error;

        const updatedUser = await userQueries.updateUser(id, { email, name });

        if (!updatedUser) {
            return createErrorResponse(ERRORS.FAILED_TO_UPDATE_USER);
        }

        // Log user update activity
        await logResourceUpdated({
            resourceType: 'user',
            resourceId: id,
            resourceName: updatedUser.email,
            userId: user.id,
            metadata: {
                email: updatedUser.email,
                name: updatedUser.name,
                previousEmail: existingUser!.email,
                previousName: existingUser!.name,
            },
        });

        return createSuccessResponse(updatedUser);
    } catch (error: any) {
        return handleApiError(error, 'Update user');
    }
}, { requiredPermission: { resource: 'users', action: 'write' } });

export const PUT = withProtected(putHandler, { requiredPermission: { resource: 'users', action: 'write' } });

// DELETE /api/users/[id] - Delete a user
const deleteHandler = withAuth(async (
    _request: NextRequest,
    user,
    context: { params: Promise<{ id: string }> }
) => {
    const { id } = await extractParams(context);
    try {
        // Check if user exists
        const { user: existingUser, error: userError } = await ensureUserExists(id);
        if (userError) return userError;

        // Prevent deletion of system accounts
        const systemAccountCheck = await ensureNotSystemAccount(id, 'delete');
        if (systemAccountCheck.error) return systemAccountCheck.error;

        await userQueries.deleteUser(id);

        // Log user deletion activity
        await logResourceDeleted({
            resourceType: 'user',
            resourceId: id,
            resourceName: existingUser!.email,
            userId: user.id,
            metadata: {
                email: existingUser!.email,
                name: existingUser!.name,
            },
        });

        return createSuccessResponse({ success: true });
    } catch (error: any) {
        return handleApiError(error, 'Delete user');
    }
}, { requiredPermission: { resource: 'users', action: 'delete' } });

export const DELETE = withProtected(deleteHandler, { requiredPermission: { resource: 'users', action: 'delete' } });
