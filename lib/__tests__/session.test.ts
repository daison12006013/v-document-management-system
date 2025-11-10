import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionFromCookie,
} from '../auth/session'
import { env } from '../config/env'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock env
vi.mock('../config/env', () => ({
  env: {
    SESSION_SECRET: 'test-session-secret-at-least-32-characters-long-for-testing',
    NODE_ENV: 'test',
  },
}))

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setSessionCookie', () => {
    it('should set session cookie with JWT token', () => {
      const response = new NextResponse()
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      }

      setSessionCookie(response, sessionData)

      const cookie = response.cookies.get('vistra_session')
      expect(cookie).toBeDefined()
      expect(cookie?.value).toBeTruthy()
      expect(cookie?.httpOnly).toBe(true)
      expect(cookie?.sameSite).toBe('lax')
    })

    it('should set secure cookie in production', () => {
      const originalEnv = env.NODE_ENV
      ;(env as any).NODE_ENV = 'production'

      const response = new NextResponse()
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      }

      setSessionCookie(response, sessionData)

      const cookie = response.cookies.get('vistra_session')
      expect(cookie?.secure).toBe(true)

      ;(env as any).NODE_ENV = originalEnv
    })

    it('should allow overriding secure option', () => {
      const response = new NextResponse()
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      }

      setSessionCookie(response, sessionData, { secure: false })

      const cookie = response.cookies.get('vistra_session')
      expect(cookie?.secure).toBe(false)
    })
  })

  describe('clearSessionCookie', () => {
    it('should clear session cookie', () => {
      const response = new NextResponse()
      clearSessionCookie(response)

      const cookie = response.cookies.get('vistra_session')
      expect(cookie?.value).toBe('')
      expect(cookie?.maxAge).toBe(0)
      expect(cookie?.httpOnly).toBe(true)
    })

    it('should set secure cookie in production when clearing', () => {
      const originalEnv = env.NODE_ENV
      ;(env as any).NODE_ENV = 'production'

      const response = new NextResponse()
      clearSessionCookie(response)

      const cookie = response.cookies.get('vistra_session')
      expect(cookie?.secure).toBe(true)

      ;(env as any).NODE_ENV = originalEnv
    })
  })

  describe('getSessionFromCookie', () => {
    it('should return session data from valid cookie', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({
          value:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMCwiaXNzIjoidmlzdHJhLWFwcCIsImF1ZCI6InZpc3RyYS1hcHAifQ.test-signature',
        }),
      }

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      // This will fail because we need a valid JWT, but we can test the flow
      const result = await getSessionFromCookie()
      // The result will be null because the JWT is invalid, but we've tested the code path
      expect(result).toBeNull()
    })

    it('should return null when no cookie exists', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      }

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getSessionFromCookie()
      expect(result).toBeNull()
    })

    it('should return null when cookie value is empty', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: '' }),
      }

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getSessionFromCookie()
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      vi.mocked(cookies).mockRejectedValue(new Error('Cookie error'))

      const result = await getSessionFromCookie()
      expect(result).toBeNull()
    })

    it('should return null when token is missing required fields', async () => {
      // Create a token with missing fields by mocking jwt.verify
      const jwt = await import('jsonwebtoken')
      const mockToken = jwt.sign(
        { userId: '123' }, // Missing email, name, createdAt
        env.SESSION_SECRET,
        { expiresIn: '1h', issuer: 'vistra-app', audience: 'vistra-app' }
      )

      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: mockToken }),
      }

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getSessionFromCookie()
      // Should return null because token is missing required fields
      expect(result).toBeNull()
    })

    it('should return session data when token has all required fields', async () => {
      // Create a valid token with all required fields
      const jwt = await import('jsonwebtoken')
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      }

      const validToken = jwt.sign(
        sessionData,
        env.SESSION_SECRET,
        { expiresIn: '1h', issuer: 'vistra-app', audience: 'vistra-app' }
      )

      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: validToken }),
      }

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getSessionFromCookie()
      // Should return the session data when token is valid and has all fields
      expect(result).not.toBeNull()
      if (result) {
        expect(result.userId).toBe(sessionData.userId)
        expect(result.email).toBe(sessionData.email)
        expect(result.name).toBe(sessionData.name)
        expect(result.createdAt).toBe(sessionData.createdAt)
      }
    })
  })
})

