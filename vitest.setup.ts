import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock environment variables if needed
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'

