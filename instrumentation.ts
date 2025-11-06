// This file runs once when Next.js starts
// It ensures the database connection is initialized early
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server-side
    const { db } = await import('./lib/db');
    const { sql } = await import('drizzle-orm');

    // Test connection on startup
    try {
      // Perform a simple query to verify connection
      // Drizzle handles connection acquisition and release automatically
      await db.execute(sql`SELECT 1`);
      console.log('✅ Database connected successfully');
    } catch (error: any) {
      // More helpful error message
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.warn('⚠️  Database not available yet. Make sure MySQL is running:');
        console.warn('   Run: make db-start');
        console.warn('   Connection will be retried when needed.');
      } else {
        console.error('❌ Database connection failed:', error.message || error);
      }
      // Don't throw - allow app to start, but log the error
      // The connection will be lazily initialized when first used
    }
  }
}

