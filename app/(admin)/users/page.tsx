import { UsersPage } from "@/components/admin/users-page"
import { getCurrentUser } from "@/lib/auth"

export default async function Users() {
  const user = await getCurrentUser()

  // User authentication is handled by the layout
  // This is guaranteed to have a user due to layout redirect

  return <UsersPage user={user!} />
}

