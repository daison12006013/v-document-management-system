import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission, getCurrentUser, isSystemAccount } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import { logActivity } from '@/lib/activities';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';

// POST /api/users/[id]/permissions - Assign permission to user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // User must have BOTH users:write AND permission to manage permissions
        await requirePermission('users', 'write');
        await requireAnyPermission(['permissions:*', 'permissions:write']);

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }

        const { id } = await params;
        const body = await request.json();
        const { permissionId } = body;

        if (!permissionId) {
            return createErrorResponse(ERRORS.PERMISSION_ID_REQUIRED);
        }

        // Check if user exists
        const user = await userQueries.getUser(id);
        if (!user) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Prevent modification of system accounts
        if (user.isSystemAccount) {
            return createErrorResponse(ERRORS.CANNOT_MODIFY_PERMISSIONS_FOR_SYSTEM_ACCOUNT);
        }

        // Check if permission exists
        const permission = await rbacQueries.getPermission(permissionId);
        if (!permission) {
            return createErrorResponse(ERRORS.PERMISSION_NOT_FOUND);
        }

        // Assign permission to user
        await rbacQueries.assignPermissionToUser(id, permissionId, currentUser.id);

        // Fetch updated user roles and permissions in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(id),
            userQueries.getUserDirectPermissions(id),
            userQueries.getUserPermissions(id),
        ]);

        // Log permission assignment activity
        await logActivity({
            action: 'assign_permission',
            resourceType: 'user_permission',
            resourceId: id,
            description: `Permission assigned to user: ${user.email} (permission: ${permission.name})`,
            metadata: {
                userId: id,
                userEmail: user.email,
                userName: user.name,
                permissionId: permissionId,
                permissionName: permission.name,
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
        console.error('Assign permission API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}

// DELETE /api/users/[id]/permissions?permissionId=xxx - Remove permission from user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // User must have BOTH users:write AND permission to manage permissions
        await requirePermission('users', 'write');
        await requireAnyPermission(['permissions:*', 'permissions:write']);

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permissionId = searchParams.get('permissionId');

        if (!permissionId) {
            return createErrorResponse(ERRORS.PERMISSION_ID_REQUIRED);
        }

        // Check if user exists
        const user = await userQueries.getUser(id);
        if (!user) {
            return createErrorResponse(ERRORS.USER_NOT_FOUND);
        }

        // Prevent modification of system accounts
        if (user.isSystemAccount) {
            return createErrorResponse(ERRORS.CANNOT_MODIFY_PERMISSIONS_FOR_SYSTEM_ACCOUNT);
        }

        // Fetch the permission details for logging (before removal)
        const removedPermission = await rbacQueries.getPermission(permissionId);

        // Remove permission from user
        await rbacQueries.removePermissionFromUser(id, permissionId);

        // Fetch updated user roles and permissions in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(id),
            userQueries.getUserDirectPermissions(id),
            userQueries.getUserPermissions(id),
        ]);

        // Log permission removal activity
        const currentUser = await getCurrentUser();
        await logActivity({
            action: 'remove_permission',
            resourceType: 'user_permission',
            resourceId: id,
            description: `Permission removed from user: ${user.email} (permission: ${removedPermission?.name ?? permissionId})`,
            metadata: {
                userId: id,
                userEmail: user.email,
                userName: user.name,
                permissionId: permissionId,
                permissionName: removedPermission?.name ?? null,
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
        console.error('Remove permission API error:', error);
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}
