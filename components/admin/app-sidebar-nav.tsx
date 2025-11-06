"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SidebarContent, SidebarItem } from "@/components/ui/sidebar"
import { auth } from "@/lib/api"

interface Permission {
    id: string
    name: string
    resource: string
    action: string
    description: string | null
}

interface AppSidebarNavProps {
    pathname: string
}

// Module-level cache for permissions to persist across navigations
let permissionsCache: {
    canAccessDashboard: boolean
    canAccessUsers: boolean
    canAccessRolesPermissions: boolean
    canAccessFiles: boolean
} | null = null

export function AppSidebarNav({ pathname }: AppSidebarNavProps) {
    // Initialize state with cached values if available
    const [canAccessDashboard, setCanAccessDashboard] = useState(permissionsCache?.canAccessDashboard ?? false)
    const [canAccessUsers, setCanAccessUsers] = useState(permissionsCache?.canAccessUsers ?? false)
    const [canAccessRolesPermissions, setCanAccessRolesPermissions] = useState(permissionsCache?.canAccessRolesPermissions ?? false)
    const [canAccessFiles, setCanAccessFiles] = useState(permissionsCache?.canAccessFiles ?? false)
    const [isLoading, setIsLoading] = useState(permissionsCache === null)

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                // Only show loading state if we don't have cached data
                if (permissionsCache === null) {
                    setIsLoading(true)
                }

                const userData = await auth.getMe()
                const userPermissions = userData.permissions || []

                // Check if user has dashboard access (at least one dashboard permission or wildcard)
                const hasDashboardAccess = userPermissions.some((p: Permission) =>
                    p.name.startsWith('dashboard:') || p.name === '*:*'
                )
                setCanAccessDashboard(hasDashboardAccess)

                // Check if user has users:read permission
                const hasUsersRead = userPermissions.some((p: Permission) =>
                    p.name === 'users:read' || p.name === 'users:*' || p.name === '*:*'
                )
                setCanAccessUsers(hasUsersRead)

                // Check if user has roles:read OR permissions:read permission
                const hasRolesRead = userPermissions.some((p: Permission) =>
                    p.name === 'roles:read' || p.name === 'roles:*' || p.name === '*:*'
                )
                const hasPermissionsRead = userPermissions.some((p: Permission) =>
                    p.name === 'permissions:read' || p.name === 'permissions:*' || p.name === '*:*'
                )
                setCanAccessRolesPermissions(hasRolesRead || hasPermissionsRead)

                // Check if user has files:read permission
                const hasFilesRead = userPermissions.some((p: Permission) =>
                    p.name === 'files:read' || p.name === 'files:*' || p.name === '*:*'
                )
                setCanAccessFiles(hasFilesRead)

                // Update cache
                permissionsCache = {
                    canAccessDashboard: hasDashboardAccess,
                    canAccessUsers: hasUsersRead,
                    canAccessRolesPermissions: hasRolesRead || hasPermissionsRead,
                    canAccessFiles: hasFilesRead,
                }
            } catch (error) {
                console.error("Error checking permissions:", error)
                // On error, clear cache to force refresh on next mount
                permissionsCache = null
            } finally {
                setIsLoading(false)
            }
        }

        checkPermissions()
    }, [])

    // Only show empty state on first load if no cache exists
    // Otherwise show cached menu items immediately (no blinking)
    if (isLoading && permissionsCache === null) {
        return (
            <SidebarContent>
                <nav className="space-y-1">
                </nav>
            </SidebarContent>
        )
    }

    return (
        <SidebarContent>
            <nav className="space-y-1">
                {canAccessDashboard && (
                    <Link href="/" className="block">
                        <SidebarItem className={pathname === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Dashboard</span>
                            </div>
                        </SidebarItem>
                    </Link>
                )}
                {canAccessUsers && (
                    <Link href="/users" className="block">
                        <SidebarItem className={pathname === "/users" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>Users</span>
                            </div>
                        </SidebarItem>
                    </Link>
                )}
                {canAccessRolesPermissions && (
                    <Link href="/roles-permissions" className="block">
                        <SidebarItem className={pathname === "/roles-permissions" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Roles & Permissions</span>
                            </div>
                        </SidebarItem>
                    </Link>
                )}
                {canAccessFiles && (
                    <Link href="/files" className="block">
                        <SidebarItem className={pathname === "/files" || pathname.startsWith("/files/") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Files</span>
                            </div>
                        </SidebarItem>
                    </Link>
                )}
            </nav>
        </SidebarContent>
    )
}

