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

/**
 * Get CSRF token from cookie (browser-side only)
 */
const getCsrfTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') {
        return null
    }

    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'csrf-token') {
            return decodeURIComponent(value)
        }
    }
    return null
};

/**
 * Check if the HTTP method requires CSRF protection
 */
const requiresCsrfToken = (method: string): boolean => {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
};

// Helper function for making API requests
const request = async <T>(
    url: string,
    options?: RequestInit
): Promise<T> => {
    const method = options?.method || 'GET'
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options?.headers,
    }

    // Add CSRF token header for state-changing methods
    if (requiresCsrfToken(method)) {
        const csrfToken = getCsrfTokenFromCookie()
        if (csrfToken) {
            (headers as Record<string, string>)['x-csrf-token'] = csrfToken
        }
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type')
    let data: any

    if (contentType && contentType.includes('application/json')) {
        try {
            data = await response.json()
        } catch (err) {
            // If JSON parsing fails, throw a generic error
            throw new ApiError(
                `Invalid response from server (status ${response.status})`,
                response.status,
                { originalError: err instanceof Error ? err.message : String(err) }
            )
        }
    } else {
        // If response is not JSON, create error from status
        const text = await response.text().catch(() => '')
        throw new ApiError(
            text || `Request failed with status ${response.status}`,
            response.status,
            { text }
        )
    }

    // Handle standardized API response format (status: 'ok' | 'error')
    if (data.status === 'error') {
        throw new ApiError(
            data.data?.message || `Request failed with status ${data.data?.code || response.status}`,
            data.data?.code || response.status,
            data.data
        )
    }

    // If response is not ok and no standardized format, treat as error
    if (!response.ok) {
        throw new ApiError(
            data.error || data.message || `Request failed with status ${response.status}`,
            response.status,
            data
        )
    }

    // Return data from standardized format (status: 'ok') or direct data
    return data.status === 'ok' ? data.data : data
};

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
     * Returns paginated response if limit/offset provided, otherwise returns all files
     */
    async getAll(params?: {
        parentId?: string | null
        type?: 'file' | 'folder'
        limit?: number
        offset?: number
        query?: string
        mimeType?: string
        createdAfter?: string
        createdBefore?: string
        sizeMin?: number
        sizeMax?: number
        sortField?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type'
        sortOrder?: 'asc' | 'desc'
    }): Promise<File[] | { files: File[]; total: number }> {
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
        if (params?.query) {
            searchParams.append('query', params.query)
        }
        if (params?.mimeType) {
            searchParams.append('mimeType', params.mimeType)
        }
        if (params?.createdAfter) {
            searchParams.append('createdAfter', params.createdAfter)
        }
        if (params?.createdBefore) {
            searchParams.append('createdBefore', params.createdBefore)
        }
        if (params?.sizeMin !== undefined) {
            searchParams.append('sizeMin', params.sizeMin.toString())
        }
        if (params?.sizeMax !== undefined) {
            searchParams.append('sizeMax', params.sizeMax.toString())
        }
        if (params?.sortField) {
            searchParams.append('sortField', params.sortField)
        }
        if (params?.sortOrder) {
            searchParams.append('sortOrder', params.sortOrder)
        }
        const query = searchParams.toString()
        return request<File[] | { files: File[]; total: number }>(`/api/files${query ? `?${query}` : ''}`)
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
    async uploadFile(file: globalThis.File, parentId?: string | null, name?: string): Promise<File> {
        const formData = new FormData()
        formData.append('file', file, name || file.name)
        if (parentId !== undefined) {
            formData.append('parentId', parentId || '')
        }
        if (name) {
            formData.append('name', name)
        }

        // Get CSRF token for file upload
        const csrfToken = getCsrfTokenFromCookie()
        const headers: HeadersInit = {}
        if (csrfToken) {
            (headers as Record<string, string>)['x-csrf-token'] = csrfToken
        }

        const response = await fetch("/api/files", {
            method: "POST",
            headers,
            body: formData,
        })

        const data = await response.json()

        // Handle standardized API response format
        if (data.status === 'error') {
            throw new ApiError(
                data.data.message || `Upload failed with status ${data.data.code}`,
                data.data.code,
                data.data
            )
        }

        // Handle legacy format (for backward compatibility)
        if (!response.ok) {
            throw new ApiError(
                data.error || `Upload failed with status ${response.status}`,
                response.status,
                data
            )
        }

        // Return data from standardized format or legacy format
        return data.status === 'ok' ? data.data : data
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

    /**
     * Create a share link for a file/folder
     */
    async createShareLink(
        id: string,
        options: { expiresInSeconds?: number | null }
    ): Promise<{
        id: string
        token: string
        shareUrl: string
        expiresAt: Date | null
        expiresInSeconds: number | null
        createdAt: Date
    }> {
        return request<{
            id: string
            token: string
            shareUrl: string
            expiresAt: Date | null
            expiresInSeconds: number | null
            createdAt: Date
        }>(`/api/files/${id}/share`, {
            method: "POST",
            body: JSON.stringify(options),
        })
    },

    /**
     * Get share link info by token (public, no auth required)
     */
    async getShareLink(token: string): Promise<{
        id: string
        fileId: string
        file: {
            id: string
            name: string
            type: 'file' | 'folder'
            mimeType: string | null
            size: number | null
        }
        expiresAt: Date | null
        createdAt: Date
    }> {
        return request<{
            id: string
            fileId: string
            file: {
                id: string
                name: string
                type: 'file' | 'folder'
                mimeType: string | null
                size: number | null
            }
            expiresAt: Date | null
            createdAt: Date
        }>(`/api/files/share/${token}`)
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

