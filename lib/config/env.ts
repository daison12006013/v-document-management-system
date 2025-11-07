/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Session & Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3', 'r2']).default('local'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Debug
  APP_DEBUG: z
    .union([
      z.string().transform((val) => val === 'true'),
      z.boolean(),
    ])
    .default(false),

  // Database Pool Configuration (optional with defaults)
  DB_POOL_SIZE: z.string().transform((val) => parseInt(val, 10)).optional(),
  DB_QUEUE_LIMIT: z.string().transform((val) => parseInt(val, 10)).optional(),

  // AWS Configuration (optional, required for S3/R2)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_R2_BUCKET: z.string().optional(),
  AWS_R2_ENDPOINT: z.string().url().optional(),
  AWS_R2_ACCOUNT_ID: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    }).join('\n');
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }
  throw error;
}

export { env };

