"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import type { User, Permission, Role } from "@/lib/types"
import { auth, users as usersApi, roles, permissions, ApiError } from "@/lib/api"

interface UsersPageProps {
  user: {
    id: string
    email: string
    name: string
  }
}

export function UsersPage({ user: currentUser }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ email: "", name: "", password: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [canManageRoles, setCanManageRoles] = useState(false)
  const [canManagePermissions, setCanManagePermissions] = useState(false)
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false)
  const [managingUser, setManagingUser] = useState<User | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)

  useEffect(() => {
    fetchUsers()
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    try {
      // Fetch current user's permissions
      const userData = await auth.getMe()
      const userPermissions = userData.permissions || []

      // Debug: Log permissions to help troubleshoot
      console.log('User permissions:', userPermissions.map((p: Permission) => p.name))

      // Check if user has the required permissions
      const hasUsersWrite = userPermissions.some((p: Permission) =>
        p.name === 'users:write' || p.name === 'users:*' || p.name === '*:*'
      )
      const hasUsersDelete = userPermissions.some((p: Permission) =>
        p.name === 'users:delete' || p.name === 'users:*' || p.name === '*:*'
      )
      const hasRolesWrite = userPermissions.some((p: Permission) =>
        p.name === 'roles:write' || p.name === 'roles:*' || p.name === '*:*'
      )
      const hasPermissionsWrite = userPermissions.some((p: Permission) =>
        p.name === 'permissions:write' || p.name === 'permissions:*' || p.name === '*:*'
      )

      console.log('Has users:delete permission:', hasUsersDelete)

      setCanCreate(hasUsersWrite)
      setCanUpdate(hasUsersWrite)
      setCanDelete(hasUsersDelete)
      setCanManageRoles(hasRolesWrite)
      setCanManagePermissions(hasPermissionsWrite)
    } catch (error) {
      console.error("Error checking permissions:", error)
      setCanCreate(false)
      setCanUpdate(false)
      setCanDelete(false)
      setCanManageRoles(false)
      setCanManagePermissions(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await usersApi.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching users:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError("You don't have permission to view users")
        } else if (error.status === 401) {
          setError("You are not authorized. Please log in again.")
        } else {
          setError(error.message || "Failed to load users. Please try again later.")
        }
      } else {
        setError("Failed to load users. Please try again later.")
      }
      // Ensure users is still an array on error
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditingUser(null)
    setFormData({ email: "", name: "", password: "" })
    setIsDialogOpen(true)
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setFormData({ email: user.email, name: user.name, password: "" })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (editingUser?.isSystemAccount) {
      setError("Cannot modify system accounts")
      setIsSubmitting(false)
      return
    }

    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, formData)
      } else {
        await usersApi.create(formData)
      }

      setIsDialogOpen(false)
      setFormData({ email: "", name: "", password: "" })
      setEditingUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error("Error saving user:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError(editingUser ? "You don't have permission to update users" : "You don't have permission to create users")
        } else {
          setError(error.message || "Failed to save user")
        }
      } else {
        setError("Failed to save user")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    if (deletingUser.isSystemAccount) {
      setError("Cannot delete system accounts")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await usersApi.delete(deletingUser.id)
      setIsDeleteDialogOpen(false)
      setDeletingUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError("You don't have permission to delete users")
        } else {
          setError(error.message || "Failed to delete user")
        }
      } else {
        setError("Failed to delete user")
      }
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleManageRolesClick = async (user: User) => {
    setManagingUser(user)
    setIsRolesDialogOpen(true)
    await fetchAvailableRoles()
  }

  const fetchAvailableRoles = async () => {
    try {
      setIsLoadingRoles(true)
      const data = await roles.getAll()
      setAvailableRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setIsLoadingRoles(false)
    }
  }

  const handleAssignRole = async (roleId: string) => {
    if (!managingUser) return

    if (managingUser.isSystemAccount) {
      setError("Cannot modify roles for system accounts")
      return
    }

    try {
      const data = await usersApi.assignRole(managingUser.id, roleId)

      // Update the managing user's roles and permissions
      setManagingUser({
        ...managingUser,
        roles: data.roles,
        permissions: data.permissions,
        directPermissions: data.directPermissions || [],
      })

      // Update the user in the users list
      setUsers(users.map(u =>
        u.id === managingUser.id
          ? { ...u, roles: data.roles, permissions: data.permissions, directPermissions: data.directPermissions || [] }
          : u
      ))
    } catch (error: any) {
      console.error("Error assigning role:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError("You don't have permission to assign roles")
        } else {
          setError(error.message || "Failed to assign role")
        }
      } else {
        setError("Failed to assign role")
      }
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    if (!managingUser) return

    if (managingUser.isSystemAccount) {
      setError("Cannot modify roles for system accounts")
      return
    }

    try {
      const data = await usersApi.removeRole(managingUser.id, roleId)

      // Update the managing user's roles and permissions
      setManagingUser({
        ...managingUser,
        roles: data.roles,
        permissions: data.permissions,
        directPermissions: data.directPermissions || [],
      })

      // Update the user in the users list
      setUsers(users.map(u =>
        u.id === managingUser.id
          ? { ...u, roles: data.roles, permissions: data.permissions, directPermissions: data.directPermissions || [] }
          : u
      ))
    } catch (error: any) {
      console.error("Error removing role:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError("You don't have permission to remove roles")
        } else {
          setError(error.message || "Failed to remove role")
        }
      } else {
        setError("Failed to remove role")
      }
    }
  }

  const handleManagePermissionsClick = async (user: User) => {
    setManagingUser(user)
    setIsPermissionsDialogOpen(true)
    await fetchAvailablePermissions()
  }

  const fetchAvailablePermissions = async () => {
    try {
      setIsLoadingPermissions(true)
      const data = await permissions.getAll()
      setAvailablePermissions(data)
    } catch (error) {
      console.error("Error fetching permissions:", error)
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  const handleAssignPermission = async (permissionId: string) => {
    if (!managingUser) return

    if (managingUser.isSystemAccount) {
      setError("Cannot modify permissions for system accounts")
      return
    }

    try {
      const data = await usersApi.assignPermission(managingUser.id, permissionId)

      // Update the managing user's roles and permissions
      setManagingUser({
        ...managingUser,
        roles: data.roles,
        permissions: data.permissions,
        directPermissions: data.directPermissions || [],
      })

      // Update the user in the users list
      setUsers(users.map(u =>
        u.id === managingUser.id
          ? { ...u, roles: data.roles, permissions: data.permissions, directPermissions: data.directPermissions || [] }
          : u
      ))
    } catch (error: any) {
      console.error("Error assigning permission:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError("You don't have permission to assign permissions")
        } else {
          setError(error.message || "Failed to assign permission")
        }
      } else {
        setError("Failed to assign permission")
      }
    }
  }

  const handleRemovePermission = async (permissionId: string) => {
    if (!managingUser) return

    if (managingUser.isSystemAccount) {
      setError("Cannot modify permissions for system accounts")
      return
    }

    try {
      const data = await usersApi.removePermission(managingUser.id, permissionId)

      // Update the managing user's roles and permissions
      setManagingUser({
        ...managingUser,
        roles: data.roles,
        permissions: data.permissions,
        directPermissions: data.directPermissions || [],
      })

      // Update the user in the users list
      setUsers(users.map(u =>
        u.id === managingUser.id
          ? { ...u, roles: data.roles, permissions: data.permissions, directPermissions: data.directPermissions || [] }
          : u
      ))
    } catch (error: any) {
      console.error("Error removing permission:", error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setError("You don't have permission to remove permissions")
        } else {
          setError(error.message || "Failed to remove permission")
        }
      } else {
        setError("Failed to remove permission")
      }
    }
  }

  const generateSecurePassword = () => {
    // Generate a secure random password
    // Include uppercase, lowercase, numbers, and special characters
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const allChars = uppercase + lowercase + numbers + special

    // Ensure at least one of each character type
    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    // Fill the rest randomly (total length: 16)
    for (let i = password.length; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle the password to avoid predictable pattern
    password = password.split('').sort(() => Math.random() - 0.5).join('')

    setFormData({ ...formData, password })
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Users</h1>
            <p className="text-muted-foreground">Manage user accounts</p>
          </div>
          <Button onClick={handleCreateClick} disabled={!canCreate}>
            Create User
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A list of all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Name</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Email</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Roles</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Permissions</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Created At</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Updated At</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-foreground text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-accent/50">
                        <td className="px-2 py-1.5 text-foreground text-xs">
                          {user.name}
                          {user.isSystemAccount && (
                            <span className="ml-2 text-[10px] text-muted-foreground italic">(System)</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground text-xs">{user.email}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-0.5">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <span
                                  key={role.id}
                                  className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                                >
                                  {role.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-0.5 max-w-xs">
                            {user.permissions && user.permissions.length > 0 ? (
                              user.permissions.slice(0, 3).map((permission) => (
                                <span
                                  key={permission.id}
                                  className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                                  title={permission.description || permission.name}
                                >
                                  {permission.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground">No permissions</span>
                            )}
                            {user.permissions && user.permissions.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{user.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground text-[10px]">{formatDate(user.createdAt)}</td>
                        <td className="px-2 py-1.5 text-muted-foreground text-[10px]">{formatDate(user.updatedAt)}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleManageRolesClick(user)}
                              disabled={!canUpdate || user.isSystemAccount}
                              title={user.isSystemAccount ? "System accounts cannot be modified" : ""}
                            >
                              Roles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleManagePermissionsClick(user)}
                              disabled={!canUpdate || user.isSystemAccount}
                              title={user.isSystemAccount ? "System accounts cannot be modified" : ""}
                            >
                              Perms
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleEditClick(user)}
                              disabled={!canUpdate || user.isSystemAccount}
                              title={user.isSystemAccount ? "System accounts cannot be modified" : ""}
                            >
                              Edit
                            </Button>
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleDeleteClick(user)}
                                disabled={user.id === currentUser.id || user.isSystemAccount}
                                title={user.isSystemAccount ? "System accounts cannot be deleted" : ""}
                              >
                                Del
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user information below."
                  : "Create a new user account with email, name, and password."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {!editingUser && (
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSecurePassword}
                        title="Generate a secure random password"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setFormData({ email: "", name: "", password: "" })
                    setEditingUser(null)
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deletingUser?.name} ({deletingUser?.email})? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingUser(null)
                  setError(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Roles Dialog */}
        <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Roles for {managingUser?.name}</DialogTitle>
              <DialogDescription>
                Assign or remove roles for this user. Permissions are inherited from roles.
              </DialogDescription>
            </DialogHeader>

            {managingUser && (
              <div className="space-y-4 py-4">
                {/* Current Roles */}
                <div className="space-y-2">
                  <Label>Current Roles</Label>
                  {managingUser.roles && managingUser.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {managingUser.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                        >
                          {role.name}
                          {!managingUser.isSystemAccount && canManageRoles && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRole(role.id)}
                              className="ml-1 rounded-sm hover:bg-secondary-foreground/20 p-0.5"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  )}
                </div>

                {/* Available Roles */}
                <div className="space-y-2">
                  <Label>Available Roles</Label>
                  {isLoadingRoles ? (
                    <p className="text-sm text-muted-foreground">Loading roles...</p>
                  ) : availableRoles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No roles available</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                      {managingUser.isSystemAccount && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md mb-2">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            This is a system account. Roles cannot be modified.
                          </p>
                        </div>
                      )}
                      {availableRoles.map((role) => {
                        const isAssigned = managingUser.roles?.some(r => r.id === role.id)
                        return (
                          <div
                            key={role.id}
                            className={`flex items-center justify-between p-2 rounded-md border ${isAssigned ? 'bg-secondary/50' : 'hover:bg-accent'
                              }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{role.name}</p>
                              {role.description && (
                                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                              )}
                            </div>
                            {isAssigned ? (
                              canManageRoles && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveRole(role.id)}
                                  disabled={managingUser.isSystemAccount}
                                >
                                  Remove
                                </Button>
                              )
                            ) : (
                              canManageRoles && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAssignRole(role.id)}
                                  disabled={managingUser.isSystemAccount}
                                >
                                  Assign
                                </Button>
                              )
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Current Permissions */}
                <div className="space-y-2">
                  <Label>Current Permissions (from roles)</Label>
                  {managingUser.permissions && managingUser.permissions.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto border rounded-md p-3">
                      <div className="flex flex-wrap gap-2">
                        {managingUser.permissions.map((permission) => (
                          <span
                            key={permission.id}
                            className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            title={permission.description || permission.name}
                          >
                            {permission.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No permissions (assign roles to grant permissions)</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRolesDialogOpen(false)
                  setManagingUser(null)
                  setError(null)
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Permissions Dialog */}
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Direct Permissions for {managingUser?.name}</DialogTitle>
              <DialogDescription>
                Assign or remove direct permissions for this user. Direct permissions are in addition to permissions inherited from roles.
              </DialogDescription>
            </DialogHeader>

            {managingUser && (
              <div className="space-y-4 py-4">
                {/* Current Direct Permissions */}
                <div className="space-y-2">
                  <Label>Current Direct Permissions</Label>
                  {managingUser.directPermissions && managingUser.directPermissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {managingUser.directPermissions.map((permission) => (
                        <span
                          key={permission.id}
                          className="inline-flex items-center gap-2 rounded-md bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary"
                        >
                          {permission.name}
                          {permission.description && (
                            <span className="text-xs text-muted-foreground">({permission.description})</span>
                          )}
                          {!managingUser.isSystemAccount && canManagePermissions && (
                            <button
                              type="button"
                              onClick={() => handleRemovePermission(permission.id)}
                              className="ml-1 rounded-sm hover:bg-primary/30 p-0.5"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No direct permissions assigned</p>
                  )}
                </div>

                {/* Available Permissions */}
                <div className="space-y-2">
                  <Label>Available Permissions</Label>
                  {isLoadingPermissions ? (
                    <p className="text-sm text-muted-foreground">Loading permissions...</p>
                  ) : availablePermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No permissions available</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                      {managingUser.isSystemAccount && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md mb-2">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            This is a system account. Permissions cannot be modified.
                          </p>
                        </div>
                      )}
                      {availablePermissions.map((permission) => {
                        const isAssigned = managingUser.directPermissions?.some(p => p.id === permission.id)
                        return (
                          <div
                            key={permission.id}
                            className={`flex items-center justify-between p-2 rounded-md border ${isAssigned ? 'bg-secondary/50' : 'hover:bg-accent'
                              }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{permission.name}</p>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Resource: {permission.resource} | Action: {permission.action}
                              </p>
                            </div>
                            {isAssigned ? (
                              canManagePermissions && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemovePermission(permission.id)}
                                  disabled={managingUser.isSystemAccount}
                                >
                                  Remove
                                </Button>
                              )
                            ) : (
                              canManagePermissions && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAssignPermission(permission.id)}
                                  disabled={managingUser.isSystemAccount}
                                >
                                  Assign
                                </Button>
                              )
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* All Permissions (from roles + direct) */}
                <div className="space-y-2">
                  <Label>All Permissions (Roles + Direct)</Label>
                  {managingUser.permissions && managingUser.permissions.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto border rounded-md p-3">
                      <div className="flex flex-wrap gap-2">
                        {managingUser.permissions.map((permission) => {
                          const isDirect = managingUser.directPermissions?.some(p => p.id === permission.id)
                          return (
                            <span
                              key={permission.id}
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${isDirect
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-primary/10 text-primary'
                                }`}
                              title={isDirect ? 'Direct permission' : 'From role'}
                            >
                              {permission.name}
                              {isDirect && <span className="ml-1 text-[10px]">(direct)</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No permissions</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPermissionsDialogOpen(false)
                  setManagingUser(null)
                  setError(null)
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

