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
    globalTeardown: ['./__integration__/teardown.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'mysql://vistra_user:vistra_password@localhost:3306/vistra_db',
      NODE_ENV: 'test',
      STORAGE_DRIVER: 'local',
      STORAGE_LOCAL_PATH: './storage/test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

