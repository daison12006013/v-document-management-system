import { UsersPage } from "@/components/admin/users-page"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Users() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return <UsersPage user={user} />
}

