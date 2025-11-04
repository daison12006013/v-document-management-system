import { RolesPermissionsPage } from "@/components/roles-permissions-page"
import { AdminLayout } from "@/components/admin-layout"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { checkUserPermissionByName } from "@/app/generated-queries/rbac_sql"

export default async function RolesPermissionsRoute() {
  const user = await getCurrentUser()

  // If user is not authenticated, redirect to login
  if (!user) {
    redirect("/")
  }

  // Check if user has roles:read OR permissions:read permission
  const hasRolesRead = await checkUserPermissionByName(db, {
    userId: user.id,
    name: 'roles:read',
  })

  const hasPermissionsRead = await checkUserPermissionByName(db, {
    userId: user.id,
    name: 'permissions:read',
  })

  // If user doesn't have either permission, redirect to dashboard
  if (!hasRolesRead?.hasPermission && !hasPermissionsRead?.hasPermission) {
    redirect("/")
  }

  return (
    <AdminLayout user={user}>
      <RolesPermissionsPage user={user} />
    </AdminLayout>
  )
}

