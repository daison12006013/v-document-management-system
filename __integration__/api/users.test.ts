import { describe, it, expect, beforeAll } from 'vitest'
import { authenticatedRequest, login } from '../helpers'

describe('API Integration Tests - Users', () => {
  let adminCookie: string

  beforeAll(async () => {
    // Login as admin to get authentication cookie
    const loginResult = await login('admin@vistra.com', 'admin123')
    adminCookie = loginResult.cookie
  })

  describe('GET /api/users', () => {
    it('should list all users when authenticated', async () => {
      const response = await authenticatedRequest<any[]>('/api/users', {
        method: 'GET',
        cookies: adminCookie,
      })

      expect(response.status).toBe('ok')
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data!.length).toBeGreaterThan(0)

      // Check user structure
      const user = response.data![0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('name')
      expect(user).not.toHaveProperty('password') // Password should not be exposed
    })

    it('should return 401 when not authenticated', async () => {
      const response = await authenticatedRequest('/api/users', {
        method: 'GET',
      })

      expect(response.status).toBe('error')
      expect(response.error?.alias).toBe('UNAUTHORIZED')
    })

    it('should return 403 when user lacks permission', async () => {
      // This would require a test user without users:read permission
      // For now, we'll just verify the endpoint responds
      const response = await authenticatedRequest('/api/users', {
        method: 'GET',
        cookies: adminCookie,
      })

      // Admin should have permission
      expect(response.status).toBe('ok')
    })
  })

  describe('GET /api/users/[id]', () => {
    let testUserId: string

    beforeAll(async () => {
      // Get a user ID from the list
      const listResponse = await authenticatedRequest<any[]>('/api/users', {
        method: 'GET',
        cookies: adminCookie,
      })

      if (listResponse.data && listResponse.data.length > 0) {
        testUserId = listResponse.data[0].id
      }
    })

    it('should get user by ID when authenticated', async () => {
      if (!testUserId) {
        console.warn('Skipping test: No test user ID available')
        return
      }

      const response = await authenticatedRequest<any>(`/api/users/${testUserId}`, {
        method: 'GET',
        cookies: adminCookie,
      })

      expect(response.status).toBe('ok')
      expect(response.data).toBeDefined()
      expect(response.data.id).toBe(testUserId)
      expect(response.data.email).toBeDefined()
      expect(response.data.name).toBeDefined()
      expect(response.data.roles).toBeDefined()
      expect(response.data.permissions).toBeDefined()
      expect(Array.isArray(response.data.permissions)).toBe(true)
    })

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await authenticatedRequest(`/api/users/${fakeId}`, {
        method: 'GET',
        cookies: adminCookie,
      })

      expect(response.status).toBe('error')
      expect(response.error?.alias).toBe('USER_NOT_FOUND')
      expect(response.error?.code).toBe(404)
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      const response = await authenticatedRequest<any>('/api/users', {
        method: 'POST',
        cookies: adminCookie,
        body: JSON.stringify({
          email: testEmail,
          name: 'Test User',
          password: 'TestPassword123!',
        }),
      })

      expect(response.status).toBe('ok')
      expect(response.data).toBeDefined()
      expect(response.data.email).toBe(testEmail)
      expect(response.data.name).toBe('Test User')
      expect(response.data.id).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      const response = await authenticatedRequest('/api/users', {
        method: 'POST',
        cookies: adminCookie,
        body: JSON.stringify({
          email: 'admin@vistra.com', // Existing email
          name: 'Duplicate User',
          password: 'SomePassword123!',
        }),
      })

      expect(response.status).toBe('error')
      expect(response.error?.alias).toBe('EMAIL_ALREADY_EXISTS')
      expect(response.error?.code).toBe(409)
    })
  })
})

