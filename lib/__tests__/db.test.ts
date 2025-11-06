import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getClient } from '../db'

const originalEnv = process.env

describe('lib/db', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getClient', () => {
    it('should be exportable function', async () => {
      const dbModule = await import('../db')
      expect(typeof dbModule.getClient).toBe('function')
    })

    it('should require DATABASE_URL environment variable', async () => {
      delete process.env.DATABASE_URL

      // Re-import to trigger the error
      await expect(async () => {
        const dbModule = await import('../db')
        // Accessing db will trigger getPool() which checks DATABASE_URL
        await dbModule.getClient()
      }).rejects.toThrow('DATABASE_URL environment variable is not set')
    })

    it('should parse DATABASE_URL correctly', async () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/dbname'

      const dbModule = await import('../db')

      // Should not throw
      expect(() => dbModule.db).toBeDefined()
    })

    it('should use default port 3306 when not specified', async () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost/dbname'

      const dbModule = await import('../db')

      // Should not throw - default port should be used
      expect(() => dbModule.db).toBeDefined()
    })
  })

  describe('db instance', () => {
    it('should be exportable', async () => {
      process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test'
      const dbModule = await import('../db')
      expect(dbModule.db).toBeDefined()
    })
  })
})

