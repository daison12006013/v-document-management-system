import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logActivity } from '../activities'
import * as activityQueries from '../queries/activities'
import * as authModule from '../auth'

// Mock dependencies
vi.mock('../queries/activities')
vi.mock('../auth')

describe('lib/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logActivity', () => {
    it('should log activity with provided userId', async () => {
      vi.mocked(activityQueries.createActivity).mockResolvedValue(undefined as any)

      await logActivity({
        action: 'CREATE',
        resourceType: 'user',
        resourceId: 'user-123',
        userId: 'user-456',
        description: 'Created user',
        metadata: { test: true },
      })

      expect(activityQueries.createActivity).toHaveBeenCalledWith({
        userId: 'user-456',
        action: 'CREATE',
        resourceType: 'user',
        resourceId: 'user-123',
        description: 'Created user',
        metadata: { test: true },
      })
    })

    it('should get current user when userId is not provided', async () => {
      const mockUser = { id: 'current-user', email: 'test@example.com', name: 'Test' }
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(activityQueries.createActivity).mockResolvedValue(undefined as any)

      await logActivity({
        action: 'UPDATE',
        resourceType: 'file',
        resourceId: 'file-123',
      })

      expect(authModule.getCurrentUser).toHaveBeenCalled()
      expect(activityQueries.createActivity).toHaveBeenCalledWith({
        userId: 'current-user',
        action: 'UPDATE',
        resourceType: 'file',
        resourceId: 'file-123',
        description: null,
        metadata: null,
      })
    })

    it('should use null userId when current user is not available', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(activityQueries.createActivity).mockResolvedValue(undefined as any)

      await logActivity({
        action: 'DELETE',
        resourceType: 'role',
        resourceId: 'role-123',
      })

      expect(activityQueries.createActivity).toHaveBeenCalledWith({
        userId: null,
        action: 'DELETE',
        resourceType: 'role',
        resourceId: 'role-123',
        description: null,
        metadata: null,
      })
    })

    it('should handle null values correctly', async () => {
      vi.mocked(activityQueries.createActivity).mockResolvedValue(undefined as any)

      await logActivity({
        action: 'VIEW',
        resourceType: 'dashboard',
        resourceId: null,
        userId: null,
        description: null,
        metadata: null,
      })

      expect(activityQueries.createActivity).toHaveBeenCalledWith({
        userId: null,
        action: 'VIEW',
        resourceType: 'dashboard',
        resourceId: null,
        description: null,
        metadata: null,
      })
    })

    it('should not throw error when activity logging fails', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue({ id: 'user-1' } as any)
      vi.mocked(activityQueries.createActivity).mockRejectedValue(new Error('DB error'))

      // Should not throw
      await expect(logActivity({
        action: 'TEST',
        resourceType: 'test',
      })).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalled()
    })

    it('should not throw error when getting current user fails', async () => {
      vi.mocked(authModule.getCurrentUser).mockRejectedValue(new Error('Auth error'))
      vi.mocked(activityQueries.createActivity).mockResolvedValue(undefined as any)

      await expect(logActivity({
        action: 'TEST',
        resourceType: 'test',
      })).resolves.toBeUndefined()

      expect(activityQueries.createActivity).toHaveBeenCalledWith({
        userId: null,
        action: 'TEST',
        resourceType: 'test',
        resourceId: null,
        description: null,
        metadata: null,
      })
    })

    it('should handle undefined values', async () => {
      vi.mocked(activityQueries.createActivity).mockResolvedValue(undefined as any)

      await logActivity({
        action: 'TEST',
        resourceType: 'test',
        resourceId: undefined,
        description: undefined,
        metadata: undefined,
      })

      expect(activityQueries.createActivity).toHaveBeenCalledWith({
        userId: null,
        action: 'TEST',
        resourceType: 'test',
        resourceId: null,
        description: null,
        metadata: null,
      })
    })
  })
})

