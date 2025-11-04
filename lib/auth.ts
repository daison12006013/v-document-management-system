import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getUser } from '@/app/generated-queries/users_sql';

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('vistra_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Parse JSON session data
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch (parseError) {
      console.error('Error parsing session cookie:', parseError);
      return null;
    }

    // Validate session data structure
    if (!sessionData?.id) {
      return null;
    }

    // Verify user still exists in database (security check)
    const user = await getUser(db, { id: sessionData.id });

    if (!user) {
      return null;
    }

    // Return user data from session (with DB verification)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requirePermission(resource: string, action: string): Promise<User> {
  const user = await requireAuth();
  const { db } = await import('@/lib/db');
  const { checkUserPermissionByName } = await import('@/app/generated-queries/rbac_sql');

  const permissionCheck = await checkUserPermissionByName(db, {
    userId: user.id,
    name: `${resource}:${action}`,
  });

  if (!permissionCheck?.hasPermission) {
    throw new Error('Forbidden');
  }

  return user;
}

/**
 * Requires that the user has ANY of the specified permissions (OR logic)
 * @param permissionNames Array of permission names to check (e.g., ['users:write', 'users:*'])
 * @returns The authenticated user if they have at least one permission
 * @throws Error('Unauthorized') if user is not authenticated
 * @throws Error('Forbidden') if user doesn't have any of the required permissions
 */
export async function requireAnyPermission(permissionNames: string[]): Promise<User> {
  const user = await requireAuth();
  const { db } = await import('@/lib/db');
  const { checkUserPermissionByName } = await import('@/app/generated-queries/rbac_sql');

  // Check each permission until we find one the user has
  for (const permissionName of permissionNames) {
    const permissionCheck = await checkUserPermissionByName(db, {
      userId: user.id,
      name: permissionName,
    });

    if (permissionCheck?.hasPermission) {
      return user;
    }
  }

  // User doesn't have any of the required permissions
  throw new Error('Forbidden');
}

/**
 * Checks if a user is a protected system account that cannot be modified
 * @param userId The user ID to check
 * @returns true if the user is a system account (protected)
 */
export async function isSystemAccount(userId: string): Promise<boolean> {
  try {
    const user = await getUser(db, { id: userId });
    return user?.isSystemAccount === true || false;
  } catch (error) {
    console.error('Error checking if user is system account:', error);
    return false;
  }
}

