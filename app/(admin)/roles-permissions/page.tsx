import { RolesPermissionsPage } from "@/components/admin/roles-permissions-page"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkUserPermissionByName } from "@/lib/queries/rbac"

export default async function RolesPermissionsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  // Check if user has roles:read OR permissions:read permission
  const hasRolesRead = await checkUserPermissionByName(user.id, 'roles:read')
  const hasPermissionsRead = await checkUserPermissionByName(user.id, 'permissions:read')

  // If user doesn't have either permission, redirect to dashboard
  if (!hasRolesRead && !hasPermissionsRead) {
    redirect("/")
  }

  return <RolesPermissionsPage user={user} />
}

