import { EnhancedFilesPage } from "@/components/files/enhanced-files-page"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return <EnhancedFilesPage user={user} />
}

