"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { api, ApiError } from "@/lib/api"
import type { User, Role, Permission } from "@/lib/types"

export function RolesPermissionsPage({ user }: { user: User }) {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })
  const [permissionInput, setPermissionInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const rolesData = await api.roles.getAll()
      // Ensure permissions array exists for each role
      const rolesWithPermissions = rolesData.map(role => ({
        ...role,
        permissions: role.permissions || []
      }))
      setRoles(Array.isArray(rolesWithPermissions) ? rolesWithPermissions : [])
    } catch (error) {
      console.error("Error fetching roles:", error)
      setRoles([])
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const permissionsData = await api.permissions.getAll()
      setAllPermissions(Array.isArray(permissionsData) ? permissionsData : [])
    } catch (error) {
      console.error("Error fetching permissions:", error)
      setAllPermissions([])
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateRole = () => {
    setIsEditing(false)
    setEditingRole(null)
    setFormData({
      name: "",
      description: "",
      permissions: [],
    })
    setPermissionInput("")
    setError(null)
    setIsDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setIsEditing(true)
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: (role.permissions || []).map((p) => p.name),
    })
    setPermissionInput("")
    setError(null)
    setIsDialogOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    setDeletingRole(role)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingRole) return

    setIsSubmitting(true)
    setError(null)

    try {
      await api.roles.delete(deletingRole.id)
      setIsDeleteDialogOpen(false)
      setDeletingRole(null)
      fetchRoles()
      toast({
        title: "Role deleted",
        description: `Successfully deleted role "${deletingRole.name}"`,
      })
    } catch (error) {
      console.error("Error deleting role:", error)
      const errorMessage = error instanceof ApiError ? error.message : "Failed to delete role"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const validatePermissionFormat = (permission: string): boolean => {
    const pattern = /^[a-zA-Z0-9_*]+:[a-zA-Z0-9_*]+$/
    return pattern.test(permission)
  }

  const handleAddPermission = () => {
    if (!permissionInput.trim()) {
      setError("Permission cannot be empty")
      return
    }

    const permission = permissionInput.trim()

    if (!validatePermissionFormat(permission)) {
      setError(
        'Invalid permission format. Expected format: "resource:action" or "resource:*" (e.g., "dashboard:read" or "dashboard:*")'
      )
      return
    }

    if (formData.permissions.includes(permission)) {
      setError("Permission already added")
      return
    }

    setFormData({
      ...formData,
      permissions: [...formData.permissions, permission],
    })
    setPermissionInput("")
    setError(null)
  }

  const handleRemovePermission = (permissionName: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.filter((p) => p !== permissionName),
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Role name is required")
      return
    }

    // Validate all permissions before submitting
    const invalidPermissions = formData.permissions.filter(
      (p) => !validatePermissionFormat(p)
    )
    if (invalidPermissions.length > 0) {
      setError(
        `Invalid permission format(s): ${invalidPermissions.join(", ")}`
      )
      return
    }

    setError(null)

    try {
      if (isEditing && editingRole) {
        await api.roles.update(editingRole.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissions: formData.permissions,
        })
      } else {
        await api.roles.create({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissions: formData.permissions,
        })
      }

      setIsDialogOpen(false)
      fetchRoles()
      toast({
        title: isEditing ? "Role updated" : "Role created",
        description: isEditing
          ? `Successfully updated role "${formData.name.trim()}"`
          : `Successfully created role "${formData.name.trim()}"`,
      })
    } catch (error) {
      console.error("Error saving role:", error)
      const errorMessage = error instanceof ApiError ? error.message : "Failed to save role"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their associated permissions</p>
        </div>
        <Button onClick={handleCreateRole}>Create Role</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading roles...</div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No roles found.</p>
            <Button onClick={handleCreateRole}>Create Your First Role</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{role.name}</CardTitle>
                    {role.description && (
                      <CardDescription className="mt-2">{role.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Permissions:</h4>
                  {(!role.permissions || role.permissions.length === 0) ? (
                    <p className="text-sm text-muted-foreground">No permissions assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <span
                          key={permission.id}
                          className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                        >
                          {permission.name}
                          {permission.description && (
                            <span className="ml-2 text-muted-foreground">
                              ({permission.description})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingRole?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingRole(null)
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

      {/* Create/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update role details and permissions"
                : "Create a new role and assign permissions"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., admin, editor, viewer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description for this role"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissions">Permissions</Label>
              <div className="flex gap-2">
                <Input
                  id="permissions"
                  value={permissionInput}
                  onChange={(e) => {
                    setPermissionInput(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddPermission()
                    }
                  }}
                  placeholder='e.g., "dashboard:*", "users:read"'
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddPermission}>
                  Add
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: resource:action (e.g., "dashboard:*", "users:read"). Permissions will be created automatically if they don't exist.
              </p>

              {formData.permissions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Added Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {permission}
                        <button
                          type="button"
                          onClick={() => handleRemovePermission(permission)}
                          className="ml-1 rounded-sm hover:bg-secondary-foreground/20"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show existing permissions for selection */}
              {allPermissions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Available Permissions:</p>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    <div className="flex flex-wrap gap-2">
                      {allPermissions.map((permission) => (
                        <button
                          key={permission.id}
                          type="button"
                          onClick={() => {
                            if (!formData.permissions.includes(permission.name)) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission.name],
                              })
                              setError(null)
                            }
                          }}
                          disabled={formData.permissions.includes(permission.name)}
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors ${formData.permissions.includes(permission.name)
                            ? "bg-primary text-primary-foreground cursor-not-allowed opacity-50"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                        >
                          {permission.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
