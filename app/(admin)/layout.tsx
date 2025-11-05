import { AdminLayout } from "@/components/admin/admin-layout"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // If user is not authenticated, redirect to login
  if (!user) {
    redirect("/")
  }

  return <AdminLayout user={user}>{children}</AdminLayout>
}

