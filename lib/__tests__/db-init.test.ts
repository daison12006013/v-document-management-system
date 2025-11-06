import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getConnectionStatus } from '../db-init'
import { getClient } from '../db'

// Mock db module
vi.mock('../db', () => ({
  getClient: vi.fn(),
}))

describe('lib/db-init', () => {
  const mockConnection = {
    execute: vi.fn(),
    release: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getConnectionStatus', () => {
    it('should return connected status when database connection succeeds', async () => {
      vi.mocked(getClient).mockResolvedValue(mockConnection as any)
      vi.mocked(mockConnection.execute).mockResolvedValue([[]] as any)

      const status = await getConnectionStatus()

      expect(status.connected).toBe(true)
      expect(status.message).toBe('Database connected')
      expect(status.timestamp).toBeDefined()
      expect(typeof status.timestamp).toBe('string')
      expect(mockConnection.release).toHaveBeenCalled()
    })

    it('should return disconnected status when database connection fails', async () => {
      vi.mocked(getClient).mockResolvedValue(mockConnection as any)
      vi.mocked(mockConnection.execute).mockRejectedValue(new Error('Connection failed'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      expect(status.message).toBe('Database connection failed')
      expect(status.timestamp).toBeDefined()
      expect(mockConnection.release).toHaveBeenCalled()
    })

    it('should return disconnected status when getClient throws', async () => {
      vi.mocked(getClient).mockRejectedValue(new Error('Cannot connect to database'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      // Error is caught in testConnection() and returns false, so message is 'Database connection failed'
      expect(status.message).toBe('Database connection failed')
      expect(status.timestamp).toBeDefined()
    })

    it('should handle errors without message', async () => {
      vi.mocked(getClient).mockRejectedValue({} as Error)

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
      // Error is caught in testConnection() and returns false, so message is 'Database connection failed'
      expect(status.message).toBe('Database connection failed')
      expect(status.timestamp).toBeDefined()
    })

    it('should include ISO timestamp', async () => {
      vi.mocked(getClient).mockResolvedValue(mockConnection as any)
      vi.mocked(mockConnection.execute).mockResolvedValue([[]] as any)

      const status = await getConnectionStatus()

      expect(status.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should release connection even when execute fails', async () => {
      vi.mocked(getClient).mockResolvedValue(mockConnection as any)
      vi.mocked(mockConnection.execute).mockRejectedValue(new Error('Query failed'))

      await getConnectionStatus()

      expect(mockConnection.release).toHaveBeenCalled()
    })

    it('should handle case when connection is null', async () => {
      vi.mocked(getClient).mockRejectedValue(new Error('No connection'))

      const status = await getConnectionStatus()

      expect(status.connected).toBe(false)
    })
  })
})

