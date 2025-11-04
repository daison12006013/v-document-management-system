import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isSystemAccount, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUser, updateUser, deleteUser } from '@/app/generated-queries/users_sql';
import { logActivity } from '@/lib/activities';

// GET /api/users/[id] - Get a specific user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission('users', 'read');

        const { id } = await params;
        const user = await getUser(db, { id });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get user roles and permissions
        const rbac = await import('@/app/generated-queries/rbac_sql');
        const roles = await rbac.getUserRoles(db, { userId: user.id });
        const permissions = await rbac.getUserPermissions(db, { userId: user.id });
        const directPermissions = await rbac.getUserDirectPermissions(db, { userId: user.id });

        return NextResponse.json({
            ...user,
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
        console.error('Get user API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
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
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await getUser(db, { id });
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent modification of system accounts
        if (await isSystemAccount(id)) {
            return NextResponse.json(
                { error: 'Cannot modify system accounts' },
                { status: 403 }
            );
        }

        const updatedUser = await updateUser(db, { id, email, name });

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'Failed to update user' },
                { status: 500 }
            );
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

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Update user API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
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
        const existingUser = await getUser(db, { id });
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deletion of system accounts
        if (await isSystemAccount(id)) {
            return NextResponse.json(
                { error: 'Cannot delete system accounts' },
                { status: 403 }
            );
        }

        await deleteUser(db, { id });

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

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Delete user API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

