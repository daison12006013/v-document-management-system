import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { withProtected } from '@/lib/middleware/protected';
import { handleApiError } from '@/lib/utils/error-handler';
import { fetchUserPermissionsData } from '@/lib/utils/user-permissions';
import { ensureUserExists, ensureRoleExists, ensureNotSystemAccount } from '@/lib/utils/validation';
import { extractParams, parseRequestBody } from '@/lib/utils/api-helpers';
import { logRoleAssigned, logRoleRemoved } from '@/lib/utils/activities';
import { validateRequiredFields } from '@/lib/utils/validation';

// POST /api/users/[id]/roles - Assign role to user
const postHandler = withAuth(async (
    request: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) => {
    try {
        // User must have BOTH users:write AND permission to manage roles
        await requireAnyPermission(['roles:*', 'roles:write']);

        const { id } = await extractParams(context);
        const body = await parseRequestBody(request);
        const { roleId } = body;

        const requiredFieldsCheck = validateRequiredFields({ roleId }, ['roleId']);
        if (requiredFieldsCheck.error) {
            return requiredFieldsCheck.error;
        }

        // Check if target user exists
        const { user: targetUser, error: userError } = await ensureUserExists(id);
        if (userError) return userError;

        // Prevent modification of system accounts
        const systemAccountCheck = await ensureNotSystemAccount(id, 'modify_roles');
        if (systemAccountCheck.error) return systemAccountCheck.error;

        // Check if role exists
        const { role, error: roleError } = await ensureRoleExists(roleId);
        if (roleError) return roleError;

        // Assign role to user
        await rbacQueries.assignRoleToUser(id, roleId, user.id);

        // Fetch updated user roles and permissions
        const permissionsData = await fetchUserPermissionsData(id);

        // Log role assignment activity
        await logRoleAssigned({
            userId: id,
            userEmail: targetUser!.email,
            userName: targetUser!.name,
            roleId,
            roleName: role!.name,
            assignedBy: user.id,
        });

        return createSuccessResponse(permissionsData);
    } catch (error: any) {
        return handleApiError(error, 'Assign role');
    }
}, { requiredPermission: { resource: 'users', action: 'write' } });

export const POST = withProtected(postHandler, { requiredPermission: { resource: 'users', action: 'write' } });

// DELETE /api/users/[id]/roles?roleId=xxx - Remove role from user
const deleteHandler = withAuth(async (
    request: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) => {
    try {
        // User must have BOTH users:write AND permission to manage roles
        await requireAnyPermission(['roles:*', 'roles:write']);

        const { id } = await extractParams(context);
        const { searchParams } = new URL(request.url);
        const roleId = searchParams.get('roleId');

        if (!roleId) {
            return createErrorResponse(ERRORS.ROLE_ID_REQUIRED);
        }

        // Check if target user exists
        const { user: targetUser, error: userError } = await ensureUserExists(id);
        if (userError) return userError;

        // Prevent modification of system accounts
        const systemAccountCheck = await ensureNotSystemAccount(id, 'modify_roles');
        if (systemAccountCheck.error) return systemAccountCheck.error;

        // Fetch the role details for logging (before removal)
        const { role: removedRole } = await ensureRoleExists(roleId);

        // Remove role from user
        await rbacQueries.removeRoleFromUser(id, roleId);

        // Fetch updated user roles and permissions
        const permissionsData = await fetchUserPermissionsData(id);

        await logRoleRemoved({
            userId: id,
            userEmail: targetUser!.email,
            userName: targetUser!.name,
            roleId,
            roleName: removedRole?.name ?? null,
            removedBy: user.id,
        });

        return createSuccessResponse(permissionsData);
    } catch (error: any) {
        return handleApiError(error, 'Remove role');
    }
}, { requiredPermission: { resource: 'users', action: 'write' } });

export const DELETE = withProtected(deleteHandler, { requiredPermission: { resource: 'users', action: 'write' } });
