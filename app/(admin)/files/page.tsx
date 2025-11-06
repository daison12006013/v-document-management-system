import { EnhancedFilesPage } from "@/components/files/enhanced-files-page"
import { getCurrentUser } from "@/lib/auth"

export default async function Page() {
  const user = await getCurrentUser()

  // User authentication is handled by the layout
  // This is guaranteed to have a user due to layout redirect

  return <EnhancedFilesPage user={user!} />
}

