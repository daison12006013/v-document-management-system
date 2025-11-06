/**
 * Storage module - main entry point
 * Provides storage driver abstraction and factory
 */

import { LocalStorageDriver } from './drivers/local';
import { S3StorageDriver } from './drivers/s3';
import { R2StorageDriver } from './drivers/r2';
import type { StorageDriver } from './types';
import { getStorageConfig } from './config';

let storageDriverInstance: StorageDriver | null = null;

/**
 * Get the configured storage driver instance
 * Lazy initialization - creates driver on first call
 */
export function getStorageDriver(): StorageDriver {
  if (storageDriverInstance) {
    return storageDriverInstance;
  }

  const config = getStorageConfig();

  switch (config.default) {
    case 'local':
      storageDriverInstance = new LocalStorageDriver();
      break;
    case 's3':
      storageDriverInstance = new S3StorageDriver();
      break;
    case 'r2':
      storageDriverInstance = new R2StorageDriver();
      break;
    default:
      throw new Error(`Unknown storage driver: ${config.default}`);
  }

  return storageDriverInstance;
}

/**
 * Get a specific storage driver by type (useful when file was stored with a different driver)
 */
export function getStorageDriverByType(type: 'local' | 's3' | 'r2'): StorageDriver {
  switch (type) {
    case 'local':
      return new LocalStorageDriver();
    case 's3':
      return new S3StorageDriver();
    case 'r2':
      return new R2StorageDriver();
    default:
      throw new Error(`Unknown storage driver type: ${type}`);
  }
}

// Re-export types and utilities
export * from './types';
export * from './config';

