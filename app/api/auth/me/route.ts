import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUserPermissions } from '@/app/generated-queries/rbac_sql';

// Ensure this route is never cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Get user permissions (includes both role-based and direct permissions)
    const permissions = await getUserPermissions(db, { userId: user.id });

    // Debug logging (remove in production)
    console.log(`[auth/me] User ${user.id} has ${permissions.length} permissions:`, permissions.map(p => p.name));

    return NextResponse.json({
      authenticated: true,
      user,
      permissions,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

