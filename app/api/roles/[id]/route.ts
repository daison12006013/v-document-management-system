import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requirePermission, requireAnyPermission, getCurrentUser } from "@/lib/auth"
import { logActivity } from "@/lib/activities"
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses'

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

// GET /api/roles/[id] - Get a single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('roles', 'read')

    const { id } = await params;
    const role = await rbac.getRole(id)

    if (!role) {
      return createErrorResponse(ERRORS.ROLE_NOT_FOUND)
    }

    const rolePermissions = await rbac.getRolePermissions(role.id)

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
    console.error("Error fetching role:", error)
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    )
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('roles', 'write')

    const { id } = await params;
    const body = await request.json()
    const { name, description, permissions } = body

    // Check if role exists
    const existingRole = await rbac.getRole(id)
    if (!existingRole) {
      return createErrorResponse(ERRORS.ROLE_NOT_FOUND)
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingRole.name) {
      const roleWithName = await rbac.getRoleByName(name)
      if (roleWithName && roleWithName.id !== id) {
        return createErrorResponse(ERRORS.ROLE_ALREADY_EXISTS)
      }
    }

    // Update the role
    const updatedRole = await rbac.updateRole(id, {
      name: name || existingRole.name,
      description: description !== undefined ? description : existingRole.description,
    })

    if (!updatedRole) {
      return createErrorResponse(ERRORS.FAILED_TO_UPDATE_ROLE)
    }

    // Update permissions if provided
    if (permissions !== undefined && Array.isArray(permissions)) {
      // Check if user has permission to manage permissions (in addition to roles:write)
      await requireAnyPermission(['permissions:*', 'permissions:write']);

      // Clear existing permissions
      await rbac.clearRolePermissions(id)

      // Add new permissions
      if (permissions.length > 0) {
        try {
          await Promise.all(
            permissions.map(async (permissionName: string) => {
              const permission = await validateAndGetOrCreatePermission(permissionName)
              if (permission) {
                await rbac.addPermissionToRole(id, permission.id)
              }
            })
          )
        } catch (permError: any) {
          // If permission validation fails during update, restore previous permissions
          // Note: We already cleared permissions, so we'd need to track them to restore
          // For now, we'll just return the error
          if (permError.message?.includes("Invalid permission format")) {
            return createErrorResponse(
              ERRORS.INVALID_PERMISSION_FORMAT,
              permError.message
            )
          }
          throw permError
        }
      }
    }

    // Fetch the role with its permissions
    const rolePermissions = await rbac.getRolePermissions(id)

    // Log role update activity
    const currentUser = await getCurrentUser();
    await logActivity({
      action: 'update',
      resourceType: 'role',
      resourceId: id,
      description: `Role updated: ${updatedRole.name}`,
      metadata: {
        roleId: id,
        roleName: updatedRole.name,
        roleDescription: updatedRole.description,
        previousName: existingRole.name,
        previousDescription: existingRole.description,
        permissions: permissions !== undefined ? permissions : null,
      },
      userId: currentUser?.id ?? null,
    });

    return createSuccessResponse({
      ...updatedRole,
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
    console.error("Error updating role:", error)
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    )
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('roles', 'write')

    const { id } = await params;
    // Check if role exists
    const role = await rbac.getRole(id)
    if (!role) {
      return createErrorResponse(ERRORS.ROLE_NOT_FOUND)
    }

    await rbac.deleteRole(id)

    // Log role deletion activity
    const currentUser = await getCurrentUser();
    await logActivity({
      action: 'delete',
      resourceType: 'role',
      resourceId: id,
      description: `Role deleted: ${role.name}`,
      metadata: {
        roleId: id,
        roleName: role.name,
        roleDescription: role.description,
      },
      userId: currentUser?.id ?? null,
    });

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED)
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN)
    }
    console.error("Error deleting role:", error)
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    )
  }
}

