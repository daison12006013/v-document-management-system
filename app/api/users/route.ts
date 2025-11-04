import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { listUsers, createUser, getUserByEmail } from '@/app/generated-queries/users_sql';
import { logActivity } from '@/lib/activities';

// GET /api/users - List all users
export async function GET() {
    try {
        await requirePermission('users', 'read');

        const users = await listUsers(db);

        // For each user, get their roles and permissions
        const rbac = await import('@/app/generated-queries/rbac_sql');
        const usersWithPermissions = await Promise.all(
            users.map(async (user) => {
                const roles = await rbac.getUserRoles(db, { userId: user.id });
                const permissions = await rbac.getUserPermissions(db, { userId: user.id });
                const directPermissions = await rbac.getUserDirectPermissions(db, { userId: user.id });
                return {
                    ...user,
                    roles,
                    permissions,
                    directPermissions,
                };
            })
        );

        return NextResponse.json(usersWithPermissions);
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('List users API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
    try {
        await requirePermission('users', 'write');

        const body = await request.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return NextResponse.json(
                { error: 'Email, name, and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(db, { email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await createUser(db, { email, name, password: hashedPassword });

        if (!newUser) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        // Log user creation activity
        const currentUser = await getCurrentUser();
        await logActivity({
            action: 'create',
            resourceType: 'user',
            resourceId: newUser.id,
            description: `User created: ${newUser.email}`,
            metadata: { email: newUser.email, name: newUser.name },
            userId: currentUser?.id ?? null,
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Create user API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

