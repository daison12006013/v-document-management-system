import { Pool, QueryArrayConfig, QueryArrayResult } from 'pg';

// Database connection pool
// This ensures credentials are only used server-side
let pool: Pool | null = null;

function getPool(): Pool {
    if (!pool) {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        pool = new Pool({
            connectionString: databaseUrl,
            // Prevent connection string from being exposed
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    return pool;
}

export async function getClient() {
    return getPool().connect();
}

export async function query(text: string, params?: any[]) {
    return getPool().query(text, params);
}

// Export a client interface compatible with sqlc generated code
// sqlc expects QueryArrayResult when rowMode is 'array'
export const db = {
    query: async (config: QueryArrayConfig): Promise<QueryArrayResult> => {
        const result = await getPool().query(config);
        return result as QueryArrayResult;
    },
};

