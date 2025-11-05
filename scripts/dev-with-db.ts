#!/usr/bin/env tsx
/**
 * Development script that:
 * 1. Starts the database
 * 2. Pushes schema changes
 * 3. Starts Next.js dev server
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

async function main() {
  console.log('🚀 Starting development environment with database...\n');

  // Check if database is running
  try {
    console.log('📊 Checking database connection...');
    execSync('docker ps | grep vistra_mysql', { stdio: 'pipe' });
    console.log('✅ Database container is running\n');
  } catch {
    console.log('⚠️  Database container not found. Starting it...');
    try {
      execSync('make db-start', { stdio: 'inherit' });
      console.log('✅ Database started\n');

      // Wait a bit for database to be ready
      console.log('⏳ Waiting for database to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('❌ Failed to start database:', error);
      process.exit(1);
    }
  }

  // Push schema if needed (only in development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('📐 Pushing schema changes to database...');
      execSync('pnpm db:push', { stdio: 'inherit' });
      console.log('✅ Schema synced\n');
    } catch (error) {
      console.warn('⚠️  Schema push failed, but continuing...');
    }
  }

  // Start Next.js dev server
  console.log('🌐 Starting Next.js development server...\n');
  execSync('pnpm dev', { stdio: 'inherit' });
}

main().catch(console.error);

