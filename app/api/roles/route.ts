import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requirePermission, requireAnyPermission, getCurrentUser } from "@/lib/auth"
import { logActivity } from "@/lib/activities"
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses'
import { logger } from '@/lib/logger'
import { withCsrfProtection } from '@/lib/middleware/csrf'

// GET /api/roles - List all roles
// Users with roles:read OR users:write can list roles
// (users:write is allowed because they need to see available roles when managing user roles)
export async function GET() {
  try {
    // Allow users with either roles:read OR users:write to list roles
    await requireAnyPermission(['roles:read', 'roles:*', 'users:write', 'users:*', '*:*'])

    const roles = await rbac.listRoles()

    // For each role, get its permissions
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const rolePermissions = await rbac.getRolePermissions(role.id)
        return {
          ...role,
          permissions: rolePermissions.map(rp => rp.permission),
        }
      })
    )

    return createSuccessResponse(rolesWithPermissions)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED)
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN)
    }
    logger.error("Error fetching roles", { error })
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    )
  }
}

// POST /api/roles - Create a new role
async function postHandler(request: NextRequest) {
  try {
    await requirePermission('roles', 'write')

    const body = await request.json()
    const { name, description, permissions } = body

    if (!name) {
      return createErrorResponse(ERRORS.ROLE_NAME_REQUIRED)
    }

    // Check if role already exists
    const existingRole = await rbac.getRoleByName(name)
    if (existingRole) {
      return createErrorResponse(ERRORS.ROLE_ALREADY_EXISTS)
    }

    // Create the role
    const role = await rbac.createRole({
      name,
      description: description || undefined,
    })

    if (!role) {
      return createErrorResponse(ERRORS.FAILED_TO_CREATE_ROLE)
    }

    // Add permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      // Check if user has permission to manage permissions (in addition to roles:write)
      await requireAnyPermission(['permissions:*', 'permissions:write']);

      try {
        await Promise.all(
          permissions.map(async (permissionName: string) => {
            // Validate and get/create permission
            const permission = await validateAndGetOrCreatePermission(permissionName)
            if (permission) {
              await rbac.addPermissionToRole(role.id, permission.id)
            }
          })
        )
      } catch (permError: any) {
        // If permission validation fails, rollback role creation and return error
        await rbac.deleteRole(role.id)
        if (permError.message?.includes("Invalid permission format")) {
          return createErrorResponse(
            ERRORS.INVALID_PERMISSION_FORMAT,
            permError.message
          )
        }
        throw permError
      }
    }

    // Fetch the role with its permissions
    const rolePermissions = await rbac.getRolePermissions(role.id)

    // Log role creation activity
    const currentUser = await getCurrentUser();
    await logActivity({
      action: 'create',
      resourceType: 'role',
      resourceId: role.id,
      description: `Role created: ${role.name}`,
      metadata: {
        roleId: role.id,
        roleName: role.name,
        roleDescription: role.description,
        permissions: permissions || [],
      },
      userId: currentUser?.id ?? null,
    });

    return createSuccessResponse({
      ...role,
      permissions: rolePermissions.map(rp => rp.permission),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED)
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN)
    }
    if (error.message?.includes("Invalid permission format")) {
      return createErrorResponse(
        ERRORS.INVALID_PERMISSION_FORMAT,
        error.message
      )
    }
    logger.error("Error creating role", { error })
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    )
  }
}

export const POST = withCsrfProtection(postHandler);

// Helper function to validate and get or create a permission
async function validateAndGetOrCreatePermission(permissionName: string) {
  // Validate permission format: should be "resource:action" or "resource:*"
  const permissionPattern = /^[a-zA-Z0-9_*]+:[a-zA-Z0-9_*]+$/
  if (!permissionPattern.test(permissionName)) {
    throw new Error(
      `Invalid permission format: ${permissionName}. Expected format: "resource:action" or "resource:*"`
    )
  }

  const [resource, action] = permissionName.split(":")

  // Try to get existing permission
  let permission = await rbac.getPermissionByName(permissionName)

  // If doesn't exist, create it
  if (!permission) {
    permission = await rbac.createPermission({
      name: permissionName,
      resource,
      action,
      description: undefined,
    })
  }

  return permission
}

