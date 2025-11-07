"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import type { User, Activity } from "@/lib/types"
import { dashboard } from "@/lib/api"

interface DashboardData {
  usersCount?: number
  rolesCount?: number
  permissionsCount?: number
  recentActivities?: Activity[]
}

export const AdminDashboard = ({ user }: { user: User }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const data = await dashboard.getDashboard()
        setDashboardData(data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <AdminLayout user={user}>
      <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {dashboardData.usersCount !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                  <CardDescription>Active user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-3xl font-bold text-foreground">...</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{dashboardData.usersCount ?? 0}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {dashboardData.rolesCount !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>System roles defined</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-3xl font-bold text-foreground">...</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{dashboardData.rolesCount ?? 0}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {dashboardData.permissionsCount !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>Available permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-3xl font-bold text-foreground">...</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{dashboardData.permissionsCount ?? 0}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {dashboardData.recentActivities !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-muted-foreground text-sm">Loading...</div>
                ) : dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentActivities.map((activity) => (
                      <div key={activity.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {activity.action} {activity.resourceType}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {activity.userName && (
                                <span>By {activity.userName}</span>
                              )}
                              <span>•</span>
                              <span>{formatDate(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No recent activity to display.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
      </div>
    </AdminLayout>
  )
};

