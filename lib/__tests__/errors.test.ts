import { describe, it, expect } from 'vitest'
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '../errors'

describe('Custom Error Classes', () => {
  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError()
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.name).toBe('UnauthorizedError')
      expect(error.message).toBe('Unauthorized')
    })

    it('should create error with custom message', () => {
      const error = new UnauthorizedError('Custom unauthorized message')
      expect(error.message).toBe('Custom unauthorized message')
      expect(error.name).toBe('UnauthorizedError')
    })

    it('should have correct prototype chain', () => {
      const error = new UnauthorizedError()
      expect(Object.getPrototypeOf(error)).toBe(UnauthorizedError.prototype)
    })
  })

  describe('ForbiddenError', () => {
    it('should create error with default message', () => {
      const error = new ForbiddenError()
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ForbiddenError)
      expect(error.name).toBe('ForbiddenError')
      expect(error.message).toBe('Forbidden')
    })

    it('should create error with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message')
      expect(error.message).toBe('Custom forbidden message')
      expect(error.name).toBe('ForbiddenError')
    })

    it('should have correct prototype chain', () => {
      const error = new ForbiddenError()
      expect(Object.getPrototypeOf(error)).toBe(ForbiddenError.prototype)
    })
  })

  describe('ValidationError', () => {
    it('should create error with message only', () => {
      const error = new ValidationError('Validation failed')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Validation failed')
      expect(error.details).toBeUndefined()
    })

    it('should create error with message and details', () => {
      const details = { field: 'email', reason: 'Invalid format' }
      const error = new ValidationError('Validation failed', details)
      expect(error.message).toBe('Validation failed')
      expect(error.details).toEqual(details)
    })

    it('should have correct prototype chain', () => {
      const error = new ValidationError('Test')
      expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype)
    })
  })

  describe('NotFoundError', () => {
    it('should create error with default message', () => {
      const error = new NotFoundError()
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('Resource not found')
    })

    it('should create error with custom message', () => {
      const error = new NotFoundError('User not found')
      expect(error.message).toBe('User not found')
      expect(error.name).toBe('NotFoundError')
    })

    it('should have correct prototype chain', () => {
      const error = new NotFoundError()
      expect(Object.getPrototypeOf(error)).toBe(NotFoundError.prototype)
    })
  })
})

