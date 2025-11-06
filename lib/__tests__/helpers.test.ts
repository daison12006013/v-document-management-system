import { describe, it, expect } from 'vitest'
import { formatFileSize, formatSpeed, formatTime } from '../helpers'

describe('lib/helpers', () => {
  describe('formatFileSize', () => {
    it('should return "0 Bytes" for zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes correctly', () => {
      expect(formatFileSize(100)).toBe('100 Bytes')
    })

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format MB correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })

    it('should format GB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
    })

    it('should format TB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB')
    })

    it('should handle decimal precision', () => {
      const result = formatFileSize(1536)
      expect(result).toMatch(/\d+\.?\d* KB/)
    })
  })

  describe('formatSpeed', () => {
    it('should format speed with "/s" suffix', () => {
      expect(formatSpeed(1024)).toBe('1 KB/s')
      expect(formatSpeed(2048)).toBe('2 KB/s')
      expect(formatSpeed(1024 * 1024)).toBe('1 MB/s')
    })

    it('should use formatFileSize internally', () => {
      expect(formatSpeed(0)).toBe('0 Bytes/s')
      expect(formatSpeed(512)).toBe('512 Bytes/s')
    })
  })

  describe('formatTime', () => {
    it('should format seconds less than 60', () => {
      expect(formatTime(0)).toBe('0s')
      expect(formatTime(30)).toBe('30s')
      expect(formatTime(59)).toBe('59s')
    })

    it('should format minutes and seconds', () => {
      expect(formatTime(60)).toBe('1m 0s')
      expect(formatTime(90)).toBe('1m 30s')
      expect(formatTime(125)).toBe('2m 5s')
      expect(formatTime(3661)).toBe('61m 1s')
    })

    it('should round seconds correctly', () => {
      expect(formatTime(30.7)).toBe('31s')
      expect(formatTime(60.3)).toBe('1m 0s')
      expect(formatTime(90.8)).toBe('1m 31s')
    })

    it('should handle large durations', () => {
      expect(formatTime(3600)).toBe('60m 0s')
    })
  })
})

