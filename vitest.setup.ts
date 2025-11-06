import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock environment variables if needed
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test'
Object.assign(process.env, { NODE_ENV: process.env.NODE_ENV || 'test' })
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-at-least-32-characters-long-for-testing'
process.env.STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local'

