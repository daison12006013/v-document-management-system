import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStorageDriverByType } from '../storage'
import { LocalStorageDriver } from '../storage/drivers/local'
import { S3StorageDriver } from '../storage/drivers/s3'
import { R2StorageDriver } from '../storage/drivers/r2'

// Mock storage drivers
vi.mock('../storage/drivers/local')
vi.mock('../storage/drivers/s3')
vi.mock('../storage/drivers/r2')

describe('lib/storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStorageDriverByType', () => {
    it('should return LocalStorageDriver for local type', () => {
      const driver = getStorageDriverByType('local')
      expect(driver).toBeInstanceOf(LocalStorageDriver)
    })

    it('should return S3StorageDriver for s3 type', () => {
      const driver = getStorageDriverByType('s3')
      expect(driver).toBeInstanceOf(S3StorageDriver)
    })

    it('should return R2StorageDriver for r2 type', () => {
      const driver = getStorageDriverByType('r2')
      expect(driver).toBeInstanceOf(R2StorageDriver)
    })

    it('should throw error for unknown type', () => {
      // @ts-expect-error - Testing invalid type
      expect(() => getStorageDriverByType('unknown')).toThrow('Unknown storage driver type: unknown')
    })

    it('should create new instances for each call', () => {
      const driver1 = getStorageDriverByType('local')
      const driver2 = getStorageDriverByType('local')
      // Different instances since it's not singleton
      expect(driver1).not.toBe(driver2)
      expect(driver1).toBeInstanceOf(LocalStorageDriver)
      expect(driver2).toBeInstanceOf(LocalStorageDriver)
    })
  })

  describe('getStorageDriver', () => {
    it('should be exportable function', async () => {
      // This test verifies that getStorageDriver can be called
      // The actual driver selection depends on environment variables
      // which is tested in storage-config.test.ts
      const storageModule = await import('../storage')
      expect(typeof storageModule.getStorageDriver).toBe('function')
    })
  })
})

