import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requireAnyPermission } from "@/lib/auth"
import { logResourceCreated } from '@/lib/utils/activities'
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses'
import { withCsrfProtection } from '@/lib/middleware/csrf'
import { withAnyPermission } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/utils/error-handler'
import { validateAndGetOrCreatePermission, mapRolePermissions } from '@/lib/utils/rbac'

// GET /api/roles - List all roles
// Users with roles:read OR users:write can list roles
// (users:write is allowed because they need to see available roles when managing user roles)
export const GET = withAnyPermission(
  ['roles:read', 'roles:*', 'users:write', 'users:*', '*:*'],
  async (_request: NextRequest, _user) => {
    try {
      const roles = await rbac.listRoles()

      // For each role, get its permissions
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const rolePermissions = await rbac.getRolePermissions(role.id)
          return {
            ...role,
            permissions: mapRolePermissions(rolePermissions),
          }
        })
      )

      return createSuccessResponse(rolesWithPermissions)
    } catch (error: any) {
      return handleApiError(error, 'List roles')
    }
  }
)

// POST /api/roles - Create a new role
const postHandler = withAnyPermission(
  ['roles:write', 'roles:*'],
  async (request: NextRequest, user) => {
    try {
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
      await logResourceCreated({
        resourceType: 'role',
        resourceId: role.id,
        resourceName: role.name,
        userId: user.id,
        metadata: {
          roleId: role.id,
          roleName: role.name,
          roleDescription: role.description,
          permissions: permissions || [],
        },
      });

      return createSuccessResponse({
        ...role,
        permissions: mapRolePermissions(rolePermissions),
      })
    } catch (error: any) {
      return handleApiError(error, 'Create role')
    }
  }
)

export const POST = withCsrfProtection(postHandler);

