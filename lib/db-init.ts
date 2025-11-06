// Database initialization utilities
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Test database connection
 * Call this to verify the database is accessible
 */
async function testConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1 as test`);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get database connection status
 */
export async function getConnectionStatus() {
  try {
    const isConnected = await testConnection();
    return {
      connected: isConnected,
      message: isConnected ? 'Database connected' : 'Database connection failed',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

