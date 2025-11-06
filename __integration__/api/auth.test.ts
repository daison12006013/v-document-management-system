import { describe, it, expect, beforeAll } from 'vitest'
import { authenticatedRequest, login } from '../helpers'

describe('API Integration Tests - Auth', () => {
  beforeAll(() => {
    // Verify database is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for integration tests')
    }
  })

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      const response = await authenticatedRequest<{ user: { id: string; email: string; name: string } }>(
        '/api/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@vistra.com',
            password: 'admin123',
          }),
        }
      )

      expect(response.status).toBe('ok')
      expect(response.data).toBeDefined()
      expect(response.data?.user).toBeDefined()
      expect(response.data?.user.email).toBe('admin@vistra.com')
      expect(response.data?.user.id).toBeDefined()
      expect(response.data?.user.name).toBeDefined()
      // Password should not be in response
      expect(response.data?.user).not.toHaveProperty('password')
    }, 30000) // 30 second timeout

    it('should reject invalid credentials', async () => {
      const response = await authenticatedRequest(
        '/api/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@vistra.com',
            password: 'wrongpassword',
          }),
        }
      )

      expect(response.status).toBe('error')
      expect(response.error).toBeDefined()
      expect(response.error?.alias).toBe('INVALID_CREDENTIALS')
      expect(response.error?.code).toBe(401)
    })

    it('should reject missing email', async () => {
      const response = await authenticatedRequest(
        '/api/login',
        {
          method: 'POST',
          body: JSON.stringify({
            password: 'admin123',
          }),
        }
      )

      expect(response.status).toBe('error')
      expect(response.error?.code).toBe(400)
    })

    it('should reject missing password', async () => {
      const response = await authenticatedRequest(
        '/api/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@vistra.com',
          }),
        }
      )

      expect(response.status).toBe('error')
      expect(response.error?.code).toBe(400)
    })

    it('should reject non-existent user', async () => {
      const response = await authenticatedRequest(
        '/api/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'anypassword',
          }),
        }
      )

      expect(response.status).toBe('error')
      expect(response.error?.alias).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info when authenticated', async () => {
      const { cookie } = await login('admin@vistra.com', 'admin123')

      const response = await authenticatedRequest<{
        authenticated: boolean
        user: { id: string; email: string; name: string }
        permissions: any[]
      }>('/api/auth/me', {
        method: 'GET',
        cookies: cookie,
      })

      expect(response.status).toBe('ok')
      expect(response.data).toBeDefined()
      expect(response.data?.authenticated).toBe(true)
      expect(response.data?.user).toBeDefined()
      expect(response.data?.user.email).toBe('admin@vistra.com')
      expect(response.data?.permissions).toBeDefined()
      expect(Array.isArray(response.data?.permissions)).toBe(true)
    })

    it('should return 401 when not authenticated', async () => {
      const response = await authenticatedRequest('/api/auth/me', {
        method: 'GET',
        // No cookie
      })

      expect(response.status).toBe('error')
      expect(response.error?.alias).toBe('UNAUTHORIZED')
      expect(response.error?.code).toBe(401)
    })

    it('should return 401 with invalid session cookie', async () => {
      const response = await authenticatedRequest('/api/auth/me', {
        method: 'GET',
        cookies: 'vistra_session=invalid-json',
      })

      expect(response.status).toBe('error')
      expect(response.error?.alias).toBe('UNAUTHORIZED')
    })
  })
})

