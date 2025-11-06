import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getStorageConfig, getUploadLimits, getSignedUrlConfig } from '../storage/config'

describe('lib/storage/config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getStorageConfig', () => {
    it('should return default local config when no env vars set', () => {
      delete process.env.STORAGE_DRIVER
      const config = getStorageConfig()

      expect(config.default).toBe('local')
      expect(config.drivers.local.path).toBe('./storage/documents')
      expect(config.drivers.local.baseUrl).toBe('http://localhost:3000')
    })

    it('should use STORAGE_DRIVER env var', () => {
      process.env.STORAGE_DRIVER = 's3'
      const config = getStorageConfig()

      expect(config.default).toBe('s3')
    })

    it('should configure local driver from env vars', () => {
      process.env.STORAGE_LOCAL_PATH = '/custom/storage'
      process.env.STORAGE_LOCAL_BASE_URL = 'https://example.com'
      const config = getStorageConfig()

      expect(config.drivers.local.path).toBe('/custom/storage')
      expect(config.drivers.local.baseUrl).toBe('https://example.com')
    })

    it('should configure s3 driver from env vars', () => {
      process.env.AWS_REGION = 'eu-west-1'
      process.env.AWS_S3_BUCKET = 'my-bucket'
      process.env.AWS_ACCESS_KEY_ID = 'access-key'
      process.env.AWS_SECRET_ACCESS_KEY = 'secret-key'
      const config = getStorageConfig()

      expect(config.drivers.s3.region).toBe('eu-west-1')
      expect(config.drivers.s3.bucket).toBe('my-bucket')
      expect(config.drivers.s3.accessKeyId).toBe('access-key')
      expect(config.drivers.s3.secretAccessKey).toBe('secret-key')
    })

    it('should use default s3 region when not set', () => {
      delete process.env.AWS_REGION
      const config = getStorageConfig()

      expect(config.drivers.s3.region).toBe('us-east-1')
    })

    it('should configure r2 driver from env vars', () => {
      process.env.R2_ENDPOINT = 'https://r2.example.com'
      process.env.R2_BUCKET = 'r2-bucket'
      process.env.R2_ACCESS_KEY_ID = 'r2-key'
      process.env.R2_SECRET_ACCESS_KEY = 'r2-secret'
      const config = getStorageConfig()

      expect(config.drivers.r2.endpoint).toBe('https://r2.example.com')
      expect(config.drivers.r2.bucket).toBe('r2-bucket')
      expect(config.drivers.r2.accessKeyId).toBe('r2-key')
      expect(config.drivers.r2.secretAccessKey).toBe('r2-secret')
    })
  })

  describe('getUploadLimits', () => {
    it('should return default limits', () => {
      delete process.env.MAX_FILE_SIZE
      delete process.env.MAX_FILES_PER_UPLOAD
      delete process.env.ALLOWED_FILE_TYPES
      const limits = getUploadLimits()

      expect(limits.maxFileSize).toBe(104857600) // 100MB
      expect(limits.maxFilesPerUpload).toBe(10)
      expect(limits.allowedFileTypes).toBe('*')
    })

    it('should use MAX_FILE_SIZE env var', () => {
      process.env.MAX_FILE_SIZE = '209715200' // 200MB
      const limits = getUploadLimits()

      expect(limits.maxFileSize).toBe(209715200)
    })

    it('should use MAX_FILES_PER_UPLOAD env var', () => {
      process.env.MAX_FILES_PER_UPLOAD = '20'
      const limits = getUploadLimits()

      expect(limits.maxFilesPerUpload).toBe(20)
    })

    it('should use ALLOWED_FILE_TYPES env var', () => {
      process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png'
      const limits = getUploadLimits()

      expect(limits.allowedFileTypes).toBe('image/jpeg,image/png')
    })

    it('should parse MAX_FILE_SIZE as integer', () => {
      process.env.MAX_FILE_SIZE = '50'
      const limits = getUploadLimits()

      expect(typeof limits.maxFileSize).toBe('number')
      expect(limits.maxFileSize).toBe(50)
    })

    it('should parse MAX_FILES_PER_UPLOAD as integer', () => {
      process.env.MAX_FILES_PER_UPLOAD = '5'
      const limits = getUploadLimits()

      expect(typeof limits.maxFilesPerUpload).toBe('number')
      expect(limits.maxFilesPerUpload).toBe(5)
    })
  })

  describe('getSignedUrlConfig', () => {
    it('should return default config', () => {
      delete process.env.SIGNED_URL_SECRET
      delete process.env.NEXTAUTH_SECRET
      delete process.env.SIGNED_URL_EXPIRY
      const config = getSignedUrlConfig()

      expect(config.secret).toBe('change-this-secret')
      expect(config.expiry).toBe(3600)
    })

    it('should use SIGNED_URL_SECRET env var', () => {
      process.env.SIGNED_URL_SECRET = 'custom-secret'
      delete process.env.NEXTAUTH_SECRET
      const config = getSignedUrlConfig()

      expect(config.secret).toBe('custom-secret')
    })

    it('should fallback to NEXTAUTH_SECRET when SIGNED_URL_SECRET not set', () => {
      delete process.env.SIGNED_URL_SECRET
      process.env.NEXTAUTH_SECRET = 'nextauth-secret'
      const config = getSignedUrlConfig()

      expect(config.secret).toBe('nextauth-secret')
    })

    it('should use SIGNED_URL_EXPIRY env var', () => {
      process.env.SIGNED_URL_EXPIRY = '7200'
      const config = getSignedUrlConfig()

      expect(config.expiry).toBe(7200)
    })

    it('should parse expiry as integer', () => {
      process.env.SIGNED_URL_EXPIRY = '1800'
      const config = getSignedUrlConfig()

      expect(typeof config.expiry).toBe('number')
      expect(config.expiry).toBe(1800)
    })
  })
})

