/**
 * Validation utilities
 * Centralized helpers for common validation patterns
 */

import { createErrorResponse, ERRORS } from '@/lib/error_responses';
import { NextResponse } from 'next/server';
import * as userQueries from '@/lib/queries/users';
import * as rbacQueries from '@/lib/queries/rbac';
import * as fileQueries from '@/lib/queries/files';
import { isSystemAccount } from '@/lib/auth';

/**
 * Check if a resource exists and return error if not found
 */
export async function ensureUserExists(
  userId: string
): Promise<{ user: Awaited<ReturnType<typeof userQueries.getUser>>; error?: NextResponse }> {
  const user = await userQueries.getUser(userId);
  if (!user) {
    return { user: null as any, error: createErrorResponse(ERRORS.USER_NOT_FOUND) };
  }
  return { user, error: undefined };
}

/**
 * Check if a role exists and return error if not found
 */
export async function ensureRoleExists(
  roleId: string
): Promise<{ role: Awaited<ReturnType<typeof rbacQueries.getRole>>; error?: NextResponse }> {
  const role = await rbacQueries.getRole(roleId);
  if (!role) {
    return { role: null as any, error: createErrorResponse(ERRORS.ROLE_NOT_FOUND) };
  }
  return { role, error: undefined };
}

/**
 * Check if a permission exists and return error if not found
 */
export async function ensurePermissionExists(
  permissionId: string
): Promise<{ permission: Awaited<ReturnType<typeof rbacQueries.getPermission>>; error?: NextResponse }> {
  const permission = await rbacQueries.getPermission(permissionId);
  if (!permission) {
    return { permission: null as any, error: createErrorResponse(ERRORS.PERMISSION_NOT_FOUND) };
  }
  return { permission, error: undefined };
}

/**
 * Check if a file exists and return error if not found
 */
export async function ensureFileExists(
  fileId: string
): Promise<{ file: Awaited<ReturnType<typeof fileQueries.getFile>>; error?: NextResponse }> {
  const file = await fileQueries.getFile(fileId);
  if (!file) {
    return { file: null as any, error: createErrorResponse(ERRORS.FILE_NOT_FOUND) };
  }
  return { file, error: undefined };
}

/**
 * Check if user is a system account and return error if trying to modify
 */
export async function ensureNotSystemAccount(
  userId: string,
  action: 'modify' | 'delete' | 'modify_roles' | 'modify_permissions' = 'modify'
): Promise<{ error?: NextResponse }> {
  const isSystem = await isSystemAccount(userId);
  if (isSystem) {
    const errorMap = {
      modify: ERRORS.CANNOT_MODIFY_SYSTEM_ACCOUNT,
      delete: ERRORS.CANNOT_DELETE_SYSTEM_ACCOUNT,
      modify_roles: ERRORS.CANNOT_MODIFY_ROLES_FOR_SYSTEM_ACCOUNT,
      modify_permissions: ERRORS.CANNOT_MODIFY_PERMISSIONS_FOR_SYSTEM_ACCOUNT,
    };
    return { error: createErrorResponse(errorMap[action]) };
  }
  return { error: undefined };
}

/**
 * Validate required fields and return error if missing
 */
export const validateRequiredFields = (
  fields: Record<string, any>,
  requiredFields: string[]
): { error?: NextResponse } => {
  const missingFields = requiredFields.filter(field => !fields[field] || (typeof fields[field] === 'string' && fields[field].trim() === ''));
  if (missingFields.length > 0) {
    return {
      error: createErrorResponse(
        ERRORS.MISSING_REQUIRED_FIELDS,
        `Missing required fields: ${missingFields.join(', ')}`
      ),
    };
  }
  return { error: undefined };
};

