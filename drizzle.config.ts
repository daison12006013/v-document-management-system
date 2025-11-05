import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export default {
  schema: './database/schema/index.ts',
  out: './database/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;

