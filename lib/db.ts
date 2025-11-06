import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@/database/schema';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';

// Database connection pool
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    // Parse MySQL connection string
    // Format: mysql://user:password@host:port/database
    const url = new URL(env.DATABASE_URL);

    const poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
      // Connection pool configuration with environment-based values
      waitForConnections: true,
      connectionLimit: env.DB_POOL_SIZE || 20,
      queueLimit: env.DB_QUEUE_LIMIT || 100,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

    pool = mysql.createPool(poolConfig);

    // Handle pool errors
    pool.on('connection', (connection) => {
      connection.on('error', (err) => {
        logger.error('MySQL connection error', { error: err });
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
      logger: env.NODE_ENV === 'development',
    });
  }
  return dbInstance;
}

// Export default db instance for convenience
export const db = getDb();


