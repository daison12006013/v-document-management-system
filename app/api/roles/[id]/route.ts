import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requireAnyPermission } from "@/lib/auth"
import { logResourceUpdated, logResourceDeleted } from '@/lib/utils/activities'
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses'
import { logger } from '@/lib/logger'
import { withCsrfProtection } from '@/lib/middleware/csrf'
import { withAuth } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/utils/error-handler'
import { validateAndGetOrCreatePermission, mapRolePermissions } from '@/lib/utils/rbac'

// GET /api/roles/[id] - Get a single role
export const GET = withAuth(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const role = await rbac.getRole(id)

    if (!role) {
      return createErrorResponse(ERRORS.ROLE_NOT_FOUND)
    }

    const rolePermissions = await rbac.getRolePermissions(role.id)

    return createSuccessResponse({
      ...role,
      permissions: mapRolePermissions(rolePermissions),
    })
  } catch (error: any) {
    return handleApiError(error, 'Get role')
  }
}, { requiredPermission: { resource: 'roles', action: 'read' } });

// PUT /api/roles/[id] - Update a role
const putHandler = withAuth(async (
    request: NextRequest,
    user,
    context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
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
    await logResourceUpdated({
      resourceType: 'role',
      resourceId: id,
      resourceName: updatedRole.name,
      userId: user.id,
      previousName: existingRole.name,
      metadata: {
        roleId: id,
        roleName: updatedRole.name,
        roleDescription: updatedRole.description,
        previousDescription: existingRole.description,
        permissions: permissions !== undefined ? permissions : null,
      },
    });

    return createSuccessResponse({
      ...updatedRole,
      permissions: mapRolePermissions(rolePermissions),
    })
  } catch (error: any) {
    return handleApiError(error, 'Update role')
  }
}, { requiredPermission: { resource: 'roles', action: 'write' } });

// DELETE /api/roles/[id] - Delete a role
const deleteHandler = withAuth(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    // Check if role exists
    const role = await rbac.getRole(id)
    if (!role) {
      return createErrorResponse(ERRORS.ROLE_NOT_FOUND)
    }

    await rbac.deleteRole(id)

    // Log role deletion activity
    await logResourceDeleted({
      resourceType: 'role',
      resourceId: id,
      resourceName: role.name,
      userId: user.id,
      metadata: {
        roleId: id,
        roleName: role.name,
        roleDescription: role.description,
      },
    });

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    return handleApiError(error, 'Delete role')
  }
}, { requiredPermission: { resource: 'roles', action: 'write' } });

export const PUT = withCsrfProtection(putHandler);
export const DELETE = withCsrfProtection(deleteHandler);

