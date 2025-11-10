/**
 * Utility functions for fetching user permissions
 * Reduces code duplication across API routes
 */

import * as userQueries from '@/lib/queries/users';
import { mapUserRoles, mapUserDirectPermissions } from './rbac';

export interface UserPermissionsData {
  roles: ReturnType<typeof mapUserRoles>;
  permissions: Awaited<ReturnType<typeof userQueries.getUserPermissions>>;
  directPermissions: ReturnType<typeof mapUserDirectPermissions>;
}

/**
 * Fetch all user permissions data (roles, permissions, directPermissions) in parallel
 * This pattern is repeated across multiple API routes
 */
export async function fetchUserPermissionsData(userId: string): Promise<UserPermissionsData> {
  const [roles, directPermissions, permissions] = await Promise.all([
    userQueries.getUserRoles(userId),
    userQueries.getUserDirectPermissions(userId),
    userQueries.getUserPermissions(userId),
  ]);

  return {
    roles: mapUserRoles(roles),
    permissions,
    directPermissions: mapUserDirectPermissions(directPermissions),
  };
}

