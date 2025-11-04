import { UsersPage } from "@/components/users-page"
import { AdminLayout } from "@/components/admin-layout"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Users() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return (
    <AdminLayout user={user}>
      <UsersPage user={user} />
    </AdminLayout>
  )
}

