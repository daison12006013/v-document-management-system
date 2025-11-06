import { describe, it, expect } from 'vitest'
import { authenticatedRequest } from '../helpers'

describe('API Integration Tests - Health', () => {
  describe('GET /api/health/db', () => {
    it('should return database connection status', async () => {
      const response = await fetch('http://localhost:3000/api/health/db')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('connected')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('timestamp')
      expect(typeof data.connected).toBe('boolean')
      expect(typeof data.message).toBe('string')
      expect(typeof data.timestamp).toBe('string')

      // Database should be connected in integration tests
      expect(data.connected).toBe(true)
    })
  })
})

