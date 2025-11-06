import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@/database/schema';

// Database connection pool
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse MySQL connection string
    // Format: mysql://user:password@host:port/database
    const url = new URL(databaseUrl);

    pool = mysql.createPool({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
      // Connection pool configuration
      waitForConnections: true,
      connectionLimit: 20, // Increased to handle concurrent requests
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Handle pool errors
    pool.on('connection', (connection) => {
      connection.on('error', (err) => {
        console.error('MySQL connection error:', err);
      });
    });
  }

  return pool;
}

// Drizzle database instance
let dbInstance: ReturnType<typeof drizzle<typeof schema, mysql.Pool>> | null = null;

function getDb() {
  if (!dbInstance) {
    const pool = getPool();
    // Use 'default' mode which properly handles connection pools
    // Connections are automatically acquired from and released back to the pool
    dbInstance = drizzle(pool, {
      schema,
      mode: 'default',
      // Ensure proper connection handling
      logger: process.env.NODE_ENV === 'development',
    });
  }
  return dbInstance;
}

// Export default db instance for convenience
export const db = getDb();

// Export pool for raw queries if needed
export async function getClient() {
  return getPool().getConnection();
}


