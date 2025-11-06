import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCurrentUser, requirePermission, requireAnyPermission, isSystemAccount } from '../auth'
import * as userQueries from '../queries/users'
import * as rbacQueries from '../queries/rbac'
import * as sessionModule from '../auth/session'

// Mock dependencies
vi.mock('../queries/users')
vi.mock('../queries/rbac')
vi.mock('../auth/session')

describe('lib/auth', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    isSystemAccount: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return null when no session cookie', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(null)

      const user = await getCurrentUser()
      expect(user).toBeNull()
    })

    it('should return null when session cookie is invalid', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(null)

      const user = await getCurrentUser()
      expect(user).toBeNull()
    })

    it('should return null when session data has no userId', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: '',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })

      vi.mocked(userQueries.getUser).mockResolvedValue(null)

      const user = await getCurrentUser()
      expect(user).toBeNull()
    })

    it('should return null when user not found in database', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(null)

      const user = await getCurrentUser()
      expect(user).toBeNull()
      expect(userQueries.getUser).toHaveBeenCalledWith('user-123')
    })

    it('should return user when session is valid', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(mockUser as any)

      const user = await getCurrentUser()
      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      })
    })

    it('should return null on error', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockRejectedValue(new Error('Session error'))

      const user = await getCurrentUser()
      expect(user).toBeNull()
    })
  })

  describe('requirePermission', () => {
    it('should throw error when user is not authenticated', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(null)

      await expect(requirePermission('users', 'read')).rejects.toThrow('Unauthorized')
    })

    it('should throw error when user lacks permission', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(mockUser as any)
      vi.mocked(rbacQueries.checkUserPermission).mockResolvedValue(false)

      await expect(requirePermission('users', 'write')).rejects.toThrow('Forbidden')
    })

    it('should return user when permission is granted', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(mockUser as any)
      vi.mocked(rbacQueries.checkUserPermission).mockResolvedValue(true)

      const user = await requirePermission('users', 'read')
      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(rbacQueries.checkUserPermission).toHaveBeenCalledWith('user-123', 'users', 'read')
    })
  })

  describe('requireAnyPermission', () => {
    it('should throw error when user is not authenticated', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(null)

      await expect(requireAnyPermission(['users:read', 'users:write'])).rejects.toThrow('Unauthorized')
    })

    it('should throw error when user lacks all permissions', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(mockUser as any)
      vi.mocked(rbacQueries.checkUserPermission).mockResolvedValue(false)

      await expect(requireAnyPermission(['users:read', 'users:write'])).rejects.toThrow('Forbidden')
    })

    it('should return user when at least one permission is granted', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(mockUser as any)
      vi.mocked(rbacQueries.checkUserPermission).mockImplementation((userId, resource, action) => {
        return Promise.resolve(resource === 'users' && action === 'read')
      })

      const user = await requireAnyPermission(['users:read', 'files:write'])
      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      })
    })

    it('should handle invalid permission format gracefully', async () => {
      vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      })
      vi.mocked(userQueries.getUser).mockResolvedValue(mockUser as any)
      vi.mocked(rbacQueries.checkUserPermission).mockResolvedValue(false)

      await expect(requireAnyPermission(['invalid-format', 'users:read'])).rejects.toThrow('Forbidden')
    })
  })

  describe('isSystemAccount', () => {
    it('should return true for system account', async () => {
      vi.mocked(userQueries.getUser).mockResolvedValue({
        ...mockUser,
        isSystemAccount: true,
      } as any)

      const result = await isSystemAccount('user-123')
      expect(result).toBe(true)
      expect(userQueries.getUser).toHaveBeenCalledWith('user-123')
    })

    it('should return false for regular user', async () => {
      vi.mocked(userQueries.getUser).mockResolvedValue({
        ...mockUser,
        isSystemAccount: false,
      } as any)

      const result = await isSystemAccount('user-123')
      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      vi.mocked(userQueries.getUser).mockResolvedValue(null)

      const result = await isSystemAccount('user-123')
      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(userQueries.getUser).mockRejectedValue(new Error('DB error'))

      const result = await isSystemAccount('user-123')
      expect(result).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })
})

