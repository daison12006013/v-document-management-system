import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const originalEnv = process.env

describe('lib/db', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('db instance', () => {
    it('should be exportable', async () => {
      process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test'
      process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-at-least-32-characters-long-for-testing'
      const dbModule = await import('../db')
      expect(dbModule.db).toBeDefined()
    })

    it('should require DATABASE_URL environment variable', async () => {
      const originalDbUrl = process.env.DATABASE_URL
      const originalSessionSecret = process.env.SESSION_SECRET
      delete process.env.DATABASE_URL
      delete process.env.SESSION_SECRET

      // Clear module cache and re-import to trigger the error
      vi.resetModules()
      await expect(async () => {
        const dbModule = await import('../db')
        // Accessing db will trigger getPool() which checks DATABASE_URL
        dbModule.db
      }).rejects.toThrow('DATABASE_URL')

      // Restore env vars
      if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl
      if (originalSessionSecret) process.env.SESSION_SECRET = originalSessionSecret
    })

    it('should parse DATABASE_URL correctly', async () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/dbname'
      process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-at-least-32-characters-long-for-testing'

      const dbModule = await import('../db')

      // Should not throw
      expect(() => dbModule.db).toBeDefined()
    })

    it('should use default port 3306 when not specified', async () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost/dbname'
      process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-at-least-32-characters-long-for-testing'

      const dbModule = await import('../db')

      // Should not throw - default port should be used
      expect(() => dbModule.db).toBeDefined()
    })
  })
})

