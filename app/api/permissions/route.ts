import { NextRequest, NextResponse } from "next/server"
import * as rbac from "@/lib/queries/rbac"
import { createSuccessResponse } from '@/lib/error_responses'
import { withAnyPermission } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/utils/error-handler'

// GET /api/permissions - List all permissions
// Users with permissions:read OR users:write can list permissions
// (users:write is allowed because they need to see available permissions when managing user permissions)
export const GET = withAnyPermission(
  ['permissions:read', 'permissions:*', 'users:write', 'users:*', '*:*'],
  async (_request: NextRequest, _user) => {
    try {
      const permissions = await rbac.listPermissions()
      return createSuccessResponse(permissions)
    } catch (error: any) {
      return handleApiError(error, 'List permissions')
    }
  }
)

