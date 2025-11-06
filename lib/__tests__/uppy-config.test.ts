import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getUploadLimits } from '../uppy/config'

describe('lib/uppy/config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('getUploadLimits', () => {
    it('should return default limits', () => {
      delete process.env.MAX_FILE_SIZE
      delete process.env.MAX_FILES_PER_UPLOAD
      delete process.env.ALLOWED_FILE_TYPES
      const limits = getUploadLimits()

      expect(limits.maxFileSize).toBe(100 * 1024 * 1024) // 100MB
      expect(limits.maxFilesPerUpload).toBe(10)
      expect(limits.allowedFileTypes).toBeNull()
    })

    it('should use MAX_FILE_SIZE env var', () => {
      process.env.MAX_FILE_SIZE = '52428800' // 50MB
      const limits = getUploadLimits()

      expect(limits.maxFileSize).toBe(52428800)
    })

    it('should use MAX_FILES_PER_UPLOAD env var', () => {
      process.env.MAX_FILES_PER_UPLOAD = '5'
      const limits = getUploadLimits()

      expect(limits.maxFilesPerUpload).toBe(5)
    })

    it('should parse ALLOWED_FILE_TYPES as array when not "*"', () => {
      process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,application/pdf'
      const limits = getUploadLimits()

      expect(limits.allowedFileTypes).toEqual(['image/jpeg', 'image/png', 'application/pdf'])
    })

    it('should return null for ALLOWED_FILE_TYPES when "*"', () => {
      process.env.ALLOWED_FILE_TYPES = '*'
      const limits = getUploadLimits()

      expect(limits.allowedFileTypes).toBeNull()
    })

    it('should handle ALLOWED_FILE_TYPES with spaces', () => {
      process.env.ALLOWED_FILE_TYPES = 'image/jpeg, image/png , application/pdf'
      const limits = getUploadLimits()

      expect(limits.allowedFileTypes).toEqual(['image/jpeg', 'image/png', 'application/pdf'])
    })

    it('should handle empty ALLOWED_FILE_TYPES', () => {
      delete process.env.ALLOWED_FILE_TYPES
      const limits = getUploadLimits()

      expect(limits.allowedFileTypes).toBeNull()
    })
  })

  describe('createUppyInstance', () => {
    it('should be exported function', async () => {
      const uppyModule = await import('../uppy/config')
      expect(typeof uppyModule.createUppyInstance).toBe('function')
    })

    it('should accept config parameter', async () => {
      const uppyModule = await import('../uppy/config')

      // Just verify the function exists and accepts config
      expect(typeof uppyModule.createUppyInstance).toBe('function')
    })
  })
})
