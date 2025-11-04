import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission, getCurrentUser, isSystemAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUser } from '@/app/generated-queries/users_sql';
import * as rbac from '@/app/generated-queries/rbac_sql';
import { logActivity } from '@/lib/activities';

// POST /api/users/[id]/roles - Assign role to user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // User must have BOTH users:write AND permission to manage roles
        await requirePermission('users', 'write');
        await requireAnyPermission(['roles:*', 'roles:write']);

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { roleId } = body;

        if (!roleId) {
            return NextResponse.json(
                { error: 'Role ID is required' },
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
                { error: 'Cannot modify roles for system accounts' },
                { status: 403 }
            );
        }

        // Check if role exists
        const role = await rbac.getRole(db, { id: roleId });
        if (!role) {
            return NextResponse.json(
                { error: 'Role not found' },
                { status: 404 }
            );
        }

        // Assign role to user
        await rbac.assignRoleToUser(db, {
            userId: id,
            roleId,
            assignedBy: currentUser.id,
        });

        // Fetch updated user roles and permissions
        const roles = await rbac.getUserRoles(db, { userId: id });
        const permissions = await rbac.getUserPermissions(db, { userId: id });
        const directPermissions = await rbac.getUserDirectPermissions(db, { userId: id });

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
        console.error('Assign role API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id]/roles?roleId=xxx - Remove role from user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // User must have BOTH users:write AND permission to manage roles
        await requirePermission('users', 'write');
        await requireAnyPermission(['roles:*', 'roles:write']);

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const roleId = searchParams.get('roleId');

        if (!roleId) {
            return NextResponse.json(
                { error: 'Role ID is required' },
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
                { error: 'Cannot modify roles for system accounts' },
                { status: 403 }
            );
        }

        // Remove role from user
        await rbac.removeRoleFromUser(db, {
            userId: id,
            roleId,
        });

        // Fetch the role details for logging
        const removedRole = await rbac.getRole(db, { id: roleId });

        // Fetch updated user roles and permissions
        const roles = await rbac.getUserRoles(db, { userId: id });
        const permissions = await rbac.getUserPermissions(db, { userId: id });
        const directPermissions = await rbac.getUserDirectPermissions(db, { userId: id });

        // Log role removal activity
        const currentUser = await getCurrentUser();
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
        console.error('Remove role API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

