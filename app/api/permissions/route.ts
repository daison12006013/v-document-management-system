import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { requireAnyPermission } from "@/lib/auth"
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses'

// GET /api/permissions - List all permissions
// Users with permissions:read OR users:write can list permissions
// (users:write is allowed because they need to see available permissions when managing user permissions)
export async function GET() {
  try {
    // Allow users with either permissions:read OR users:write to list permissions
    await requireAnyPermission(['permissions:read', 'permissions:*', 'users:write', 'users:*', '*:*'])

    const permissions = await rbac.listPermissions()

    return createSuccessResponse(permissions)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ERRORS.UNAUTHORIZED)
    }
    if (error.message === 'Forbidden') {
      return createErrorResponse(ERRORS.FORBIDDEN)
    }
    console.error("Error fetching permissions:", error)
    return createErrorResponse(
      ERRORS.INTERNAL_SERVER_ERROR,
      undefined,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    )
  }
}

