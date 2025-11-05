"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import { AppSidebarNav } from "@/components/admin/app-sidebar-nav"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import type { User } from "@/lib/types"
import { auth } from "@/lib/api"

interface AdminLayoutProps {
  user: User
  children: React.ReactNode
}

export function AdminLayout({ user, children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await auth.logout()
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Theme toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Sidebar */}
      <Sidebar className="w-64 bg-card border-r border-border">
        <SidebarHeader>
          <div className="">
            <img
              src="/vistra-logo.svg"
              alt="Vistra Logo"
              className="h-8"
            />
          </div>
        </SidebarHeader>

        <AppSidebarNav pathname={pathname} />

        <SidebarFooter>
          <div className="space-y-3">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        {children}
      </div>
    </div>
  )
}

