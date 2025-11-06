/**
 * Activity logging utilities
 * Centralized helpers for common activity logging patterns
 */

import { logActivity } from '@/lib/activities';

interface BaseActivityParams {
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a resource creation activity
 */
export async function logResourceCreated(params: {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await logActivity({
    action: 'create',
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    description: `${params.resourceType.charAt(0).toUpperCase() + params.resourceType.slice(1)} created: ${params.resourceName}`,
    userId: params.userId,
    metadata: params.metadata,
  });
}

/**
 * Log a resource update activity
 */
export async function logResourceUpdated(params: {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  previousName?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const description = params.previousName
    ? `${params.resourceType.charAt(0).toUpperCase() + params.resourceType.slice(1)} updated: ${params.resourceName}`
    : `${params.resourceType.charAt(0).toUpperCase() + params.resourceType.slice(1)} updated: ${params.resourceName}`;

  await logActivity({
    action: 'update',
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    description,
    userId: params.userId,
    metadata: params.metadata,
  });
}

/**
 * Log a resource deletion activity
 */
export async function logResourceDeleted(params: {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  metadata?: Record<string, any>;
  descriptionSuffix?: string;
}): Promise<void> {
  const baseDescription = `${params.resourceType === 'folder' ? 'Folder' : params.resourceType.charAt(0).toUpperCase() + params.resourceType.slice(1)} deleted: ${params.resourceName}`;
  const description = params.descriptionSuffix
    ? `${baseDescription}${params.descriptionSuffix}`
    : baseDescription;

  await logActivity({
    action: 'delete',
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    description,
    userId: params.userId,
    metadata: params.metadata,
  });
}

/**
 * Log a role assignment activity
 */
export async function logRoleAssigned(params: {
  userId: string;
  userEmail: string;
  userName: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
}): Promise<void> {
  await logActivity({
    action: 'assign_role',
    resourceType: 'user_role',
    resourceId: params.userId,
    description: `Role assigned to user: ${params.userEmail} (role: ${params.roleName})`,
    userId: params.assignedBy,
    metadata: {
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      roleId: params.roleId,
      roleName: params.roleName,
    },
  });
}

/**
 * Log a role removal activity
 */
export async function logRoleRemoved(params: {
  userId: string;
  userEmail: string;
  userName: string;
  roleId: string;
  roleName: string | null;
  removedBy: string;
}): Promise<void> {
  await logActivity({
    action: 'remove_role',
    resourceType: 'user_role',
    resourceId: params.userId,
    description: `Role removed from user: ${params.userEmail} (role: ${params.roleName ?? params.roleId})`,
    userId: params.removedBy,
    metadata: {
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      roleId: params.roleId,
      roleName: params.roleName,
    },
  });
}

/**
 * Log a permission assignment activity
 */
export async function logPermissionAssigned(params: {
  userId: string;
  userEmail: string;
  userName: string;
  permissionId: string;
  permissionName: string;
  assignedBy: string;
}): Promise<void> {
  await logActivity({
    action: 'assign_permission',
    resourceType: 'user_permission',
    resourceId: params.userId,
    description: `Permission assigned to user: ${params.userEmail} (permission: ${params.permissionName})`,
    userId: params.assignedBy,
    metadata: {
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      permissionId: params.permissionId,
      permissionName: params.permissionName,
    },
  });
}

/**
 * Log a permission removal activity
 */
export async function logPermissionRemoved(params: {
  userId: string;
  userEmail: string;
  userName: string;
  permissionId: string;
  permissionName: string | null;
  removedBy: string;
}): Promise<void> {
  await logActivity({
    action: 'remove_permission',
    resourceType: 'user_permission',
    resourceId: params.userId,
    description: `Permission removed from user: ${params.userEmail} (permission: ${params.permissionName ?? params.permissionId})`,
    userId: params.removedBy,
    metadata: {
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      permissionId: params.permissionId,
      permissionName: params.permissionName,
    },
  });
}

