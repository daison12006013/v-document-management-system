import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getConnectionStatus } from '../db-init'

// Mock db module - use vi.hoisted to avoid hoisting issues
const mockExecute = vi.hoisted(() => vi.fn())

vi.mock('../db', () => ({
  db: {
    execute: mockExecute,
  },
}))

describe('lib/db-init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getConnectionStatus', () => {
    it('should return connected status when database connection succeeds', async () => {
      mockExecute.mockResolvedValue([[]] as any)

      const status = await getConnectionStatus()

      expect(status.connected).toBe(true)
      expect(status.message).toBe('Database connected')
      expect(status.timestamp).toBeDefined()
      expect(typeof status.timestamp).toBe('string')
      expect(mockExecute).toHaveBeenCalled()
    })

    it('should return disconnected status when database connection fails', async () => {
      mockExecute.mockRejectedValue(new Error('Connection failed'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      expect(status.message).toBe('Database connection failed')
      expect(status.timestamp).toBeDefined()
      expect(mockExecute).toHaveBeenCalled()
    })

    it('should return disconnected status when db.execute throws', async () => {
      mockExecute.mockRejectedValue(new Error('Cannot connect to database'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      // Error is caught in testConnection() and returns false, so message is 'Database connection failed'
      expect(status.message).toBe('Database connection failed')
      expect(status.timestamp).toBeDefined()
    })

    it('should handle errors without message', async () => {
      mockExecute.mockRejectedValue({} as Error)

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      // Error is caught in testConnection() and returns false, so message is 'Database connection failed'
      expect(status.message).toBe('Database connection failed')
      expect(status.timestamp).toBeDefined()
    })

    it('should include ISO timestamp', async () => {
      mockExecute.mockResolvedValue([[]] as any)

      const status = await getConnectionStatus()

      expect(status.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle query execution errors', async () => {
      mockExecute.mockRejectedValue(new Error('Query failed'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      expect(mockExecute).toHaveBeenCalled()
    })

    it('should handle case when database connection is unavailable', async () => {
      mockExecute.mockRejectedValue(new Error('No connection'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
    })
  })
})

