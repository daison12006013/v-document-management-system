import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiError, auth, dashboard, users, roles, permissions, files, api } from '../api'

// Mock global fetch
global.fetch = vi.fn()

describe('lib/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ApiError', () => {
    it('should create an ApiError instance', () => {
      const error = new ApiError('Test error', 400, { details: 'test' })

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(400)
      expect(error.data).toEqual({ details: 'test' })
      expect(error.name).toBe('ApiError')
    })
  })

  describe('auth', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test', permissions: [] }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockUser }),
      } as Response)

      const result = await auth.getMe()
      expect(result).toEqual(mockUser)
      expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }))
    })

    it('should login with email and password', async () => {
      const mockResponse = { user: { id: '1', email: 'test@example.com', name: 'Test' } }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockResponse }),
      } as Response)

      const result = await auth.login('test@example.com', 'password123')
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      }))
    })

    it('should handle error responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          data: { alias: 'INVALID_CREDENTIALS', code: 401, message: 'Invalid credentials' },
        }),
      } as Response)

      await expect(auth.login('test@example.com', 'wrong')).rejects.toThrow(ApiError)
    })

    it('should logout', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: undefined }),
      } as Response)

      await auth.logout()
      expect(fetch).toHaveBeenCalledWith('/api/logout', expect.objectContaining({
        method: 'POST',
      }))
    })
  })

  describe('dashboard', () => {
    it('should get dashboard data', async () => {
      const mockData = {
        usersCount: 10,
        rolesCount: 5,
        permissionsCount: 20,
        recentActivities: [],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockData }),
      } as Response)

      const result = await dashboard.getDashboard()
      expect(result).toEqual(mockData)
    })
  })

  describe('users', () => {
    it('should get all users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', name: 'User 1' },
        { id: '2', email: 'user2@example.com', name: 'User 2' },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockUsers }),
      } as Response)

      const result = await users.getAll()
      expect(result).toEqual(mockUsers)
    })

    it('should get user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockUser }),
      } as Response)

      const result = await users.getById('1')
      expect(result).toEqual(mockUser)
      expect(fetch).toHaveBeenCalledWith('/api/users/1', expect.any(Object))
    })

    it('should create user', async () => {
      const mockUser = { id: '1', email: 'new@example.com', name: 'New User' }
      const userData = { email: 'new@example.com', name: 'New User', password: 'password123' }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockUser }),
      } as Response)

      const result = await users.create(userData)
      expect(result).toEqual(mockUser)
      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(userData),
      }))
    })

    it('should update user', async () => {
      const mockUser = { id: '1', email: 'updated@example.com', name: 'Updated' }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockUser }),
      } as Response)

      const result = await users.update('1', { email: 'updated@example.com', name: 'Updated' })
      expect(result).toEqual(mockUser)
    })

    it('should delete user', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: undefined }),
      } as Response)

      await users.delete('1')
      expect(fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'DELETE',
      }))
    })

    it('should assign role to user', async () => {
      const mockResponse = { roles: [], permissions: [], directPermissions: [] }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockResponse }),
      } as Response)

      const result = await users.assignRole('user-1', 'role-1')
      expect(result).toEqual(mockResponse)
    })

    it('should remove role from user', async () => {
      const mockResponse = { roles: [], permissions: [], directPermissions: [] }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockResponse }),
      } as Response)

      const result = await users.removeRole('user-1', 'role-1')
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/users/user-1/roles?roleId=role-1', expect.objectContaining({
        method: 'DELETE',
      }))
    })
  })

  describe('roles', () => {
    it('should get all roles', async () => {
      const mockRoles = [{ id: '1', name: 'admin', description: 'Administrator' }]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockRoles }),
      } as Response)

      const result = await roles.getAll()
      expect(result).toEqual(mockRoles)
    })

    it('should create role', async () => {
      const mockRole = { id: '1', name: 'editor', description: 'Editor', permissions: [] }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockRole }),
      } as Response)

      const result = await roles.create({
        name: 'editor',
        description: 'Editor',
        permissions: ['perm1'],
      })
      expect(result).toEqual(mockRole)
    })
  })

  describe('permissions', () => {
    it('should get all permissions', async () => {
      const mockPermissions = [
        { id: '1', name: 'users:read', resource: 'users', action: 'read', description: null },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockPermissions }),
      } as Response)

      const result = await permissions.getAll()
      expect(result).toEqual(mockPermissions)
    })
  })

  describe('files', () => {
    it('should get all files', async () => {
      const mockFiles = [{ id: '1', name: 'test.txt', type: 'file' as const }]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockFiles }),
      } as Response)

      const result = await files.getAll()
      expect(result).toEqual(mockFiles)
    })

    it('should get files with filters', async () => {
      const mockFiles = [{ id: '1', name: 'test.txt', type: 'file' as const }]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockFiles }),
      } as Response)

      const result = await files.getAll({ parentId: 'folder-1', type: 'file', limit: 10 })
      expect(result).toEqual(mockFiles)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('parentId=folder-1'),
        expect.any(Object)
      )
    })

    it('should create folder', async () => {
      const mockFolder = { id: '1', name: 'New Folder', type: 'folder' as const }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockFolder }),
      } as Response)

      const result = await files.createFolder({ name: 'New Folder', parentId: null })
      expect(result).toEqual(mockFolder)
    })

    it('should upload file', async () => {
      const mockFile = { id: '1', name: 'upload.txt', type: 'file' as const }
      const file = new File(['content'], 'upload.txt', { type: 'text/plain' })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockFile }),
      } as Response)

      const result = await files.uploadFile(file, null, 'upload.txt')
      expect(result).toEqual(mockFile)
      expect(fetch).toHaveBeenCalledWith('/api/files', expect.objectContaining({
        method: 'POST',
      }))
    })

    it('should handle upload error', async () => {
      const file = new File(['content'], 'upload.txt', { type: 'text/plain' })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'error',
          data: { alias: 'FILE_SIZE_EXCEEDED', code: 400, message: 'File too large' },
        }),
      } as Response)

      await expect(files.uploadFile(file)).rejects.toThrow(ApiError)
    })

    it('should get download URL', async () => {
      const mockResponse = { url: 'https://example.com/file', filename: 'test.txt', mimeType: 'text/plain', size: 100 }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok', data: mockResponse }),
      } as Response)

      const result = await files.getDownloadUrl('file-1')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('api object', () => {
    it('should export all API modules', () => {
      expect(api.auth).toBeDefined()
      expect(api.dashboard).toBeDefined()
      expect(api.users).toBeDefined()
      expect(api.roles).toBeDefined()
      expect(api.permissions).toBeDefined()
      expect(api.files).toBeDefined()
    })
  })
})

