/**
 * RBAC utility functions
 * Centralized helpers for role-based access control operations
 */

import * as rbac from '@/lib/queries/rbac';

/**
 * Map role permissions to permission objects
 *
 * @param rolePermissions - Array of role permission relations
 * @returns Array of permission objects
 */
export const mapRolePermissions = (
  rolePermissions: Array<{ permission: any }>
): any[] => {
  return rolePermissions.map(rp => rp.permission).filter(Boolean);
};

/**
 * Map user roles to role objects
 *
 * @param userRoles - Array of user role relations
 * @returns Array of role objects
 */
export const mapUserRoles = (
  userRoles: Array<{ role: any }>
): any[] => {
  return userRoles.map(ur => ur.role).filter(Boolean);
};

/**
 * Map user direct permissions to permission objects
 *
 * @param userPermissions - Array of user permission relations
 * @returns Array of permission objects
 */
export const mapUserDirectPermissions = (
  userPermissions: Array<{ permission: any }>
): any[] => {
  return userPermissions.map(up => up.permission).filter(Boolean);
};

/**
 * Validate and get or create a permission
 *
 * @param permissionName - Permission name in format "resource:action"
 * @returns Permission object
 * @throws Error if permission format is invalid
 */
export const validateAndGetOrCreatePermission = async (permissionName: string) => {
  // Validate permission format: should be "resource:action" or "resource:*"
  const permissionPattern = /^[a-zA-Z0-9_*]+:[a-zA-Z0-9_*]+$/;
  if (!permissionPattern.test(permissionName)) {
    throw new Error(
      `Invalid permission format: ${permissionName}. Expected format: "resource:action" or "resource:*"`
    );
  }

  const [resource, action] = permissionName.split(':');

  // Try to get existing permission
  let permission = await rbac.getPermissionByName(permissionName);

  // If doesn't exist, create it
  if (!permission) {
    permission = await rbac.createPermission({
      name: permissionName,
      resource,
      action,
      description: undefined,
    });
  }

  return permission;
};

