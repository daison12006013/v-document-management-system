// This file runs once when Next.js starts
// It ensures the database connection is initialized early
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server-side
    const { getClient } = await import('./lib/db');

    // Test connection on startup
    try {
      const connection = await getClient();
      // Perform a simple query to verify connection
      await connection.execute('SELECT 1');
      connection.release();
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

