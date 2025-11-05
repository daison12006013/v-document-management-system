import { cookies } from 'next/headers';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import type { User } from '@/lib/types';

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
    const user = await userQueries.getUser(sessionData.id);

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

async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requirePermission(resource: string, action: string): Promise<User> {
  const user = await requireAuth();

  const hasPermission = await rbacQueries.checkUserPermission(user.id, resource, action);

  if (!hasPermission) {
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

  // Check all permissions in parallel (they're independent)
  const permissionChecks = permissionNames.map(permissionName => {
    const [resource, action] = permissionName.split(':');
    if (resource && action) {
      return rbacQueries.checkUserPermission(user.id, resource, action);
    }
    return Promise.resolve(false);
  });

  const results = await Promise.all(permissionChecks);

  // Check if user has at least one permission
  if (results.some(hasPermission => hasPermission)) {
    return user;
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
    const user = await userQueries.getUser(userId);
    return user?.isSystemAccount === true || false;
  } catch (error) {
    console.error('Error checking if user is system account:', error);
    return false;
  }
}
