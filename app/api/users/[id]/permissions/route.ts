import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import { withAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/utils/error-handler';
import { mapUserRoles, mapUserDirectPermissions } from '@/lib/utils/rbac';
import { ensureUserExists, ensurePermissionExists, ensureNotSystemAccount } from '@/lib/utils/validation';
import { logPermissionAssigned, logPermissionRemoved } from '@/lib/utils/activities';
import { validateRequiredFields } from '@/lib/utils/validation';

// POST /api/users/[id]/permissions - Assign permission to user
const postHandler = withAuth(async (
    request: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) => {
    try {
        // User must have BOTH users:write AND permission to manage permissions
        await requireAnyPermission(['permissions:*', 'permissions:write']);

        const { id } = await context.params;
        const body = await request.json();
        const { permissionId } = body;

        const requiredFieldsCheck = validateRequiredFields({ permissionId }, ['permissionId']);
        if (requiredFieldsCheck.error) {
            return requiredFieldsCheck.error;
        }

        // Check if target user exists
        const { user: targetUser, error: userError } = await ensureUserExists(id);
        if (userError) return userError;

        // Prevent modification of system accounts
        const systemAccountCheck = await ensureNotSystemAccount(id, 'modify_permissions');
        if (systemAccountCheck.error) return systemAccountCheck.error;

        // Check if permission exists
        const { permission, error: permError } = await ensurePermissionExists(permissionId);
        if (permError) return permError;

        // Assign permission to user
        await rbacQueries.assignPermissionToUser(id, permissionId, user.id);

        // Fetch updated user roles and permissions in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(id),
            userQueries.getUserDirectPermissions(id),
            userQueries.getUserPermissions(id),
        ]);

        // Log permission assignment activity
        await logPermissionAssigned({
            userId: id,
            userEmail: targetUser!.email,
            userName: targetUser!.name,
            permissionId,
            permissionName: permission!.name,
            assignedBy: user.id,
        });

        return createSuccessResponse({
            roles: mapUserRoles(roles),
            permissions,
            directPermissions: mapUserDirectPermissions(directPermissions),
        });
    } catch (error: any) {
        return handleApiError(error, 'Assign permission');
    }
}, { requiredPermission: { resource: 'users', action: 'write' } });

export const POST = withCsrfProtection(postHandler);

// DELETE /api/users/[id]/permissions?permissionId=xxx - Remove permission from user
const deleteHandler = withAuth(async (
    request: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) => {
    try {
        // User must have BOTH users:write AND permission to manage permissions
        await requireAnyPermission(['permissions:*', 'permissions:write']);

        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const permissionId = searchParams.get('permissionId');

        if (!permissionId) {
            return createErrorResponse(ERRORS.PERMISSION_ID_REQUIRED);
        }

        // Check if target user exists
        const { user: targetUser, error: userError } = await ensureUserExists(id);
        if (userError) return userError;

        // Prevent modification of system accounts
        const systemAccountCheck = await ensureNotSystemAccount(id, 'modify_permissions');
        if (systemAccountCheck.error) return systemAccountCheck.error;

        // Fetch the permission details for logging (before removal)
        const { permission: removedPermission } = await ensurePermissionExists(permissionId);

        // Remove permission from user
        await rbacQueries.removePermissionFromUser(id, permissionId);

        // Fetch updated user roles and permissions in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(id),
            userQueries.getUserDirectPermissions(id),
            userQueries.getUserPermissions(id),
        ]);

        // Log permission removal activity
        await logPermissionRemoved({
            userId: id,
            userEmail: targetUser!.email,
            userName: targetUser!.name,
            permissionId,
            permissionName: removedPermission?.name ?? null,
            removedBy: user.id,
        });

        return createSuccessResponse({
            roles: mapUserRoles(roles),
            permissions,
            directPermissions: mapUserDirectPermissions(directPermissions),
        });
    } catch (error: any) {
        return handleApiError(error, 'Remove permission');
    }
}, { requiredPermission: { resource: 'users', action: 'write' } });

export const DELETE = withCsrfProtection(deleteHandler);
