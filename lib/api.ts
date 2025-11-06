import type { User, Role, Permission, Activity, File } from "@/lib/types"

// Base API error class
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: any
    ) {
        super(message)
        this.name = "ApiError"
    }
}

// Helper function for making API requests
async function request<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new ApiError(
            data.error || `Request failed with status ${response.status}`,
            response.status,
            data
        )
    }

    return data
}

// Auth API
export const auth = {
    /**
     * Get current authenticated user
     */
    async getMe(): Promise<User & { permissions: Permission[] }> {
        return request<User & { permissions: Permission[] }>("/api/auth/me")
    },

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<{ user: User }> {
        return request<{ user: User }>("/api/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        })
    },

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        return request<void>("/api/logout", {
            method: "POST",
        })
    },
}

// Dashboard API
export const dashboard = {
    /**
     * Get dashboard data including counts and recent activities
     */
    async getDashboard(): Promise<{
        usersCount?: number
        rolesCount?: number
        permissionsCount?: number
        recentActivities?: Activity[]
    }> {
        return request("/api/dashboard")
    },
}

// Users API
export const users = {
    /**
     * Get all users
     */
    async getAll(): Promise<User[]> {
        return request<User[]>("/api/users")
    },

    /**
     * Get a single user by ID
     */
    async getById(id: string): Promise<User> {
        return request<User>(`/api/users/${id}`)
    },

    /**
     * Create a new user
     */
    async create(data: { email: string; name: string; password: string }): Promise<User> {
        return request<User>("/api/users", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    /**
     * Update a user by ID
     */
    async update(id: string, data: { email: string; name: string }): Promise<User> {
        return request<User>(`/api/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    /**
     * Delete a user by ID
     */
    async delete(id: string): Promise<void> {
        return request<void>(`/api/users/${id}`, {
            method: "DELETE",
        })
    },

    /**
     * Assign a role to a user
     */
    async assignRole(
        userId: string,
        roleId: string
    ): Promise<{
        roles: Role[]
        permissions: Permission[]
        directPermissions: Permission[]
    }> {
        return request<{
            roles: Role[]
            permissions: Permission[]
            directPermissions: Permission[]
        }>(`/api/users/${userId}/roles`, {
            method: "POST",
            body: JSON.stringify({ roleId }),
        })
    },

    /**
     * Remove a role from a user
     */
    async removeRole(
        userId: string,
        roleId: string
    ): Promise<{
        roles: Role[]
        permissions: Permission[]
        directPermissions: Permission[]
    }> {
        return request<{
            roles: Role[]
            permissions: Permission[]
            directPermissions: Permission[]
        }>(`/api/users/${userId}/roles?roleId=${roleId}`, {
            method: "DELETE",
        })
    },

    /**
     * Assign a permission to a user
     */
    async assignPermission(
        userId: string,
        permissionId: string
    ): Promise<{
        roles: Role[]
        permissions: Permission[]
        directPermissions: Permission[]
    }> {
        return request<{
            roles: Role[]
            permissions: Permission[]
            directPermissions: Permission[]
        }>(`/api/users/${userId}/permissions`, {
            method: "POST",
            body: JSON.stringify({ permissionId }),
        })
    },

    /**
     * Remove a permission from a user
     */
    async removePermission(
        userId: string,
        permissionId: string
    ): Promise<{
        roles: Role[]
        permissions: Permission[]
        directPermissions: Permission[]
    }> {
        return request<{
            roles: Role[]
            permissions: Permission[]
            directPermissions: Permission[]
        }>(`/api/users/${userId}/permissions?permissionId=${permissionId}`, {
            method: "DELETE",
        })
    },
}

// Roles API
export const roles = {
    /**
     * Get all roles
     */
    async getAll(): Promise<Role[]> {
        return request<Role[]>("/api/roles")
    },

    /**
     * Get a single role by ID
     */
    async getById(id: string): Promise<Role> {
        return request<Role>(`/api/roles/${id}`)
    },

    /**
     * Create a new role
     */
    async create(data: {
        name: string
        description?: string | null
        permissions: string[]
    }): Promise<Role> {
        return request<Role>("/api/roles", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    /**
     * Update a role by ID
     */
    async update(
        id: string,
        data: {
            name: string
            description?: string | null
            permissions: string[]
        }
    ): Promise<Role> {
        return request<Role>(`/api/roles/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    /**
     * Delete a role by ID
     */
    async delete(id: string): Promise<void> {
        return request<void>(`/api/roles/${id}`, {
            method: "DELETE",
        })
    },
}

// Permissions API
export const permissions = {
    /**
     * Get all permissions
     */
    async getAll(): Promise<Permission[]> {
        return request<Permission[]>("/api/permissions")
    },
}

// Files API
export const files = {
    /**
     * Get all files/folders (with optional filters)
     */
    async getAll(params?: {
        parentId?: string | null
        type?: 'file' | 'folder'
        limit?: number
        offset?: number
    }): Promise<File[]> {
        const searchParams = new URLSearchParams()
        if (params?.parentId !== undefined) {
            searchParams.append('parentId', params.parentId === null ? 'null' : params.parentId)
        }
        if (params?.type) {
            searchParams.append('type', params.type)
        }
        if (params?.limit) {
            searchParams.append('limit', params.limit.toString())
        }
        if (params?.offset) {
            searchParams.append('offset', params.offset.toString())
        }
        const query = searchParams.toString()
        return request<File[]>(`/api/files${query ? `?${query}` : ''}`)
    },

    /**
     * Get a single file/folder by ID
     */
    async getById(id: string): Promise<File> {
        return request<File>(`/api/files/${id}`)
    },

    /**
     * Get folder children
     */
    async getChildren(folderId: string): Promise<File[]> {
        return request<File[]>(`/api/files/${folderId}/children`)
    },

    /**
     * Create a folder
     */
    async createFolder(data: { name: string; parentId?: string | null }): Promise<File> {
        return request<File>("/api/files", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: data.name,
                type: "folder",
                parentId: data.parentId || null,
            }),
        })
    },

    /**
     * Upload a file
     */
    async uploadFile(file: File, parentId?: string | null, name?: string): Promise<File> {
        const formData = new FormData()
        formData.append('file', file)
        if (parentId !== undefined) {
            formData.append('parentId', parentId || '')
        }
        if (name) {
            formData.append('name', name)
        }

        const response = await fetch("/api/files", {
            method: "POST",
            body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ApiError(
                data.error || `Upload failed with status ${response.status}`,
                response.status,
                data
            )
        }

        return data
    },

    /**
     * Update a file/folder
     */
    async update(id: string, data: { name?: string; parentId?: string | null; metadata?: Record<string, any> }): Promise<File> {
        return request<File>(`/api/files/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    /**
     * Delete a file/folder
     */
    async delete(id: string): Promise<void> {
        return request<void>(`/api/files/${id}`, {
            method: "DELETE",
        })
    },

    /**
     * Get download URL for a file
     */
    async getDownloadUrl(id: string): Promise<{ url: string; filename: string; mimeType?: string; size?: number }> {
        return request<{ url: string; filename: string; mimeType?: string; size?: number }>(`/api/files/${id}/download`)
    },
}

// Combined API object for convenience
export const api = {
    auth,
    dashboard,
    users,
    roles,
    permissions,
    files,
}

