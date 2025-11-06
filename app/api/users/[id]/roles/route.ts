import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission, getCurrentUser, isSystemAccount } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';
import { withCsrfProtection } from '@/lib/middleware/csrf';

// POST /api/users/[id]/roles - Assign role to user
async function postHandler(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let id: string | undefined;
    try {
        // User must have BOTH users:write AND permission to manage roles
        await requirePermission('users', 'write');
        await requireAnyPermission(['roles:*', 'roles:write']);

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }

        const resolvedParams = await params;
        id = resolvedParams.id;
        const body = await request.json();
        const { roleId } = body;

        if (!roleId) {
            return createErrorResponse(ERRORS.ROLE_ID_REQUIRED);
        }

        // Check if user exists
        const user = await userQueries.getUser(id);
        if (!user) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Prevent modification of system accounts
        if (user.isSystemAccount) {
            return createErrorResponse(ERRORS.CANNOT_MODIFY_ROLES_FOR_SYSTEM_ACCOUNT);
        }

        // Check if role exists
        const role = await rbacQueries.getRole(roleId);
        if (!role) {
            return createErrorResponse(ERRORS.ROLE_NOT_FOUND);
        }

        // Assign role to user
        await rbacQueries.assignRoleToUser(id, roleId, currentUser.id);

        // Fetch updated user roles and permissions in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(id),
            userQueries.getUserDirectPermissions(id),
            userQueries.getUserPermissions(id),
        ]);

        // Log role assignment activity
        await logActivity({
            action: 'assign_role',
            resourceType: 'user_role',
            resourceId: id,
            description: `Role assigned to user: ${user.email} (role: ${role.name})`,
            metadata: {
                userId: id,
                userEmail: user.email,
                userName: user.name,
                roleId: roleId,
                roleName: role.name,
            },
            userId: currentUser.id,
        });

        return createSuccessResponse({
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
        logger.error('Assign role API error', { error, userId: id! });
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}

export const POST = withCsrfProtection(postHandler);

// DELETE /api/users/[id]/roles?roleId=xxx - Remove role from user
async function deleteHandler(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let id: string | undefined;
    try {
        // User must have BOTH users:write AND permission to manage roles
        await requirePermission('users', 'write');
        await requireAnyPermission(['roles:*', 'roles:write']);

        const resolvedParams = await params;
        id = resolvedParams.id;
        const { searchParams } = new URL(request.url);
        const roleId = searchParams.get('roleId');

        if (!roleId) {
            return createErrorResponse(ERRORS.ROLE_ID_REQUIRED);
        }

        // Check if user exists
        const user = await userQueries.getUser(id);
        if (!user) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Prevent modification of system accounts
        if (user.isSystemAccount) {
            return createErrorResponse(ERRORS.CANNOT_MODIFY_ROLES_FOR_SYSTEM_ACCOUNT);
        }

        // Fetch the role details for logging (before removal)
        const removedRole = await rbacQueries.getRole(roleId);

        // Remove role from user
        await rbacQueries.removeRoleFromUser(id, roleId);

        // Fetch updated user roles and permissions in parallel
        const [roles, directPermissions, permissions, currentUser] = await Promise.all([
            userQueries.getUserRoles(id),
            userQueries.getUserDirectPermissions(id),
            userQueries.getUserPermissions(id),
            getCurrentUser()
        ]);

        await logActivity({
            action: 'remove_role',
            resourceType: 'user_role',
            resourceId: id,
            description: `Role removed from user: ${user.email} (role: ${removedRole?.name ?? roleId})`,
            metadata: {
                userId: id,
                userEmail: user.email,
                userName: user.name,
                roleId: roleId,
                roleName: removedRole?.name ?? null,
            },
            userId: currentUser?.id ?? null,
        });

        return createSuccessResponse({
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
        logger.error('Remove role API error', { error, userId: id! });
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}

export const DELETE = withCsrfProtection(deleteHandler);
