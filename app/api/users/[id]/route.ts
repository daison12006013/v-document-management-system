import { permissions } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isSystemAccount, getCurrentUser } from '@/lib/auth';
import * as userQueries from '@/lib/queries/users';
import { logActivity } from '@/lib/activities';

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
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get user roles, permissions, and direct permissions
        // getUserRoles and getUserDirectPermissions are independent, so fetch them in parallel
        const [roles, directPermissions, permissions] = await Promise.all([
            userQueries.getUserRoles(user.id),
            userQueries.getUserDirectPermissions(user.id),
            userQueries.getUserPermissions(user.id),
        ]);

        return NextResponse.json({
            ...user,
            roles: roles.map(r => r.role).filter(Boolean),
            permissions,
            directPermissions: directPermissions.map(p => p.permission).filter(Boolean),
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
        const existingUser = await userQueries.getUser(id);
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent modification of system accounts
        if (existingUser.isSystemAccount) {
            return NextResponse.json(
                { error: 'Cannot modify system accounts' },
                { status: 403 }
            );
        }

        const updatedUser = await userQueries.updateUser(id, { email, name });

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
        const existingUser = await userQueries.getUser(id);
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deletion of system accounts
        if (existingUser.isSystemAccount) {
            return NextResponse.json(
                { error: 'Cannot delete system accounts' },
                { status: 403 }
            );
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
