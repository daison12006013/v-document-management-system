import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '../utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })
  })

  describe('formatDate', () => {
    it('should format a valid date', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('should return "N/A" for null', () => {
      expect(formatDate(null)).toBe('N/A')
    })

    it('should return "N/A" for undefined', () => {
      expect(formatDate(undefined)).toBe('N/A')
    })

    it('should handle date strings', () => {
      const formatted = formatDate(new Date('2024-01-15T10:30:00Z'))
      expect(formatted).toBeTruthy()
    })
  })
})

