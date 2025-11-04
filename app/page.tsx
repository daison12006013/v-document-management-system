import { LoginPage } from "@/components/login-page"
import { AdminDashboard } from "@/components/admin-dashboard"
import { getCurrentUser } from "@/lib/auth"

export default async function Home() {
  const user = await getCurrentUser()

  // If user is authenticated, show dashboard
  if (user) {
    return <AdminDashboard user={user} />
  }

  // Otherwise, show login page
  return <LoginPage />
}

