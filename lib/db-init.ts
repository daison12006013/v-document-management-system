// Database initialization utilities
import { getClient } from './db';

/**
 * Test database connection
 * Call this to verify the database is accessible
 */
async function testConnection(): Promise<boolean> {
  let connection;
  try {
    connection = await getClient();
    await connection.execute('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
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

