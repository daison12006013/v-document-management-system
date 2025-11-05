import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requirePermission, requireAnyPermission, getCurrentUser } from "@/lib/auth"
import { logActivity } from "@/lib/activities"

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

    return NextResponse.json(rolesWithPermissions)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    await requirePermission('roles', 'write')

    const body = await request.json()
    const { name, description, permissions } = body

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await rbac.getRoleByName(name)
    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 409 }
      )
    }

    // Create the role
    const role = await rbac.createRole({
      name,
      description: description || undefined,
    })

    if (!role) {
      return NextResponse.json(
        { error: "Failed to create role" },
        { status: 500 }
      )
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
          return NextResponse.json({ error: permError.message }, { status: 400 })
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

    return NextResponse.json({
      ...role,
      permissions: rolePermissions.map(rp => rp.permission),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error.message?.includes("Invalid permission format")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Error creating role:", error)
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    )
  }
}

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

