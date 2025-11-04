import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission, getCurrentUser, isSystemAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUser } from '@/app/generated-queries/users_sql';
import * as rbac from '@/app/generated-queries/rbac_sql';
import { logActivity } from '@/lib/activities';

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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { permissionId } = body;

        if (!permissionId) {
            return NextResponse.json(
                { error: 'Permission ID is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await getUser(db, { id });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent modification of system accounts
        if (await isSystemAccount(id)) {
            return NextResponse.json(
                { error: 'Cannot modify permissions for system accounts' },
                { status: 403 }
            );
        }

        // Check if permission exists
        const permission = await rbac.getPermission(db, { id: permissionId });
        if (!permission) {
            return NextResponse.json(
                { error: 'Permission not found' },
                { status: 404 }
            );
        }

        // Assign permission to user
        await rbac.assignPermissionToUser(db, {
            userId: id,
            permissionId,
            assignedBy: currentUser.id,
        });

        // Fetch updated user roles and permissions
        const roles = await rbac.getUserRoles(db, { userId: id });
        const permissions = await rbac.getUserPermissions(db, { userId: id });
        const directPermissions = await rbac.getUserDirectPermissions(db, { userId: id });

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

        return NextResponse.json({
            success: true,
            roles,
            permissions,
            directPermissions,
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Assign permission API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
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
            return NextResponse.json(
                { error: 'Permission ID is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await getUser(db, { id });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent modification of system accounts
        if (await isSystemAccount(id)) {
            return NextResponse.json(
                { error: 'Cannot modify permissions for system accounts' },
                { status: 403 }
            );
        }

        // Remove permission from user
        await rbac.removePermissionFromUser(db, {
            userId: id,
            permissionId,
        });

        // Fetch the permission details for logging
        const removedPermission = await rbac.getPermission(db, { id: permissionId });

        // Fetch updated user roles and permissions
        const roles = await rbac.getUserRoles(db, { userId: id });
        const permissions = await rbac.getUserPermissions(db, { userId: id });
        const directPermissions = await rbac.getUserDirectPermissions(db, { userId: id });

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

        return NextResponse.json({
            success: true,
            roles,
            permissions,
            directPermissions,
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Remove permission API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

