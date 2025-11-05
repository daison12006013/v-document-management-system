import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requireAnyPermission } from "@/lib/auth"

// GET /api/permissions - List all permissions
// Users with permissions:read OR users:write can list permissions
// (users:write is allowed because they need to see available permissions when managing user permissions)
export async function GET() {
  try {
    // Allow users with either permissions:read OR users:write to list permissions
    await requireAnyPermission(['permissions:read', 'permissions:*', 'users:write', 'users:*', '*:*'])

    const permissions = await rbac.listPermissions()

    return NextResponse.json(permissions)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error("Error fetching permissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    )
  }
}

