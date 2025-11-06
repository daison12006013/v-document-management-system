import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/__integration__/**/*.test.{ts,tsx}'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    teardownTimeout: 10000,
    globalSetup: ['./__integration__/setup.ts'],
    // @ts-expect-error - globalTeardown exists but TypeScript types may not be updated
    globalTeardown: ['./__integration__/teardown.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'mysql://vistra_user:vistra_password@localhost:3306/vistra_db',
      NODE_ENV: 'test',
      STORAGE_DRIVER: 'local',
      STORAGE_LOCAL_PATH: './storage/test',
      SESSION_SECRET: process.env.SESSION_SECRET || 'test-session-secret-at-least-32-characters-long-for-testing',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

