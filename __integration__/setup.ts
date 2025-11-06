import { execSync } from 'child_process'
import { existsSync } from 'fs'

/**
 * Global setup for integration tests
 * - Ensures Docker MySQL is running
 * - Waits for database to be ready
 * - Runs migrations/seeds
 */
export async function setup() {
  console.log('🚀 Starting integration test setup...')

  // Check if Docker is available
  try {
    execSync('docker --version', { stdio: 'ignore' })
  } catch {
    throw new Error('Docker is not available. Integration tests require Docker.')
  }

  // Start MySQL container if not running
  try {
    execSync('docker compose up -d mysql', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ MySQL container started')
  } catch (error) {
    console.warn('⚠️  Failed to start MySQL container, assuming it\'s already running')
  }

  // Wait for database to be ready (max 60 seconds)
  console.log('⏳ Waiting for database to be ready...')
  const maxAttempts = 60
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      // Try to connect using mysql client
      execSync(
        'docker exec vistra_mysql mysqladmin ping -h localhost -u vistra_user -pvistra_password',
        { stdio: 'ignore' }
      )
      console.log('✅ Database is ready')
      break
    } catch {
      attempts++
      if (attempts >= maxAttempts) {
        throw new Error('Database did not become ready within 60 seconds')
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Set environment variable for tests
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://vistra_user:vistra_password@localhost:3306/vistra_db'
  process.env.NODE_ENV = 'test'

  console.log('✅ Integration test setup complete')
}

