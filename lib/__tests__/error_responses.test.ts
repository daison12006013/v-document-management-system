import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ERRORS,
  successResponse,
  errorResponse,
  customErrorResponse,
  createSuccessResponse,
  createErrorResponse,
  createCustomErrorResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from '../error_responses'
import { NextResponse } from 'next/server'

describe('lib/error_responses', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('ERRORS constant', () => {
    it('should have all required error definitions', () => {
      expect(ERRORS.UNAUTHORIZED).toBeDefined()
      expect(ERRORS.FORBIDDEN).toBeDefined()
      expect(ERRORS.INVALID_CREDENTIALS).toBeDefined()
      expect(ERRORS.USER_NOT_FOUND).toBeDefined()
      expect(ERRORS.FILE_NOT_FOUND).toBeDefined()
      expect(ERRORS.VALIDATION_ERROR).toBeDefined()
      expect(ERRORS.INTERNAL_SERVER_ERROR).toBeDefined()
    })

    it('should have correct error structure', () => {
      const error = ERRORS.UNAUTHORIZED
      expect(error).toHaveProperty('alias')
      expect(error).toHaveProperty('code')
      expect(error).toHaveProperty('message')
      expect(typeof error.alias).toBe('string')
      expect(typeof error.code).toBe('number')
      expect(typeof error.message).toBe('string')
    })
  })

  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '123', name: 'Test' }
      const response = successResponse(data)

      expect(response.status).toBe('ok')
      expect(response.data).toEqual(data)
      expect(response).toHaveProperty('status', 'ok')
    })

    it('should handle various data types', () => {
      expect(successResponse(null)).toEqual({ status: 'ok', data: null })
      expect(successResponse([])).toEqual({ status: 'ok', data: [] })
      expect(successResponse('string')).toEqual({ status: 'ok', data: 'string' })
      expect(successResponse(123)).toEqual({ status: 'ok', data: 123 })
    })
  })

  describe('errorResponse', () => {
    it('should create an error response', () => {
      const response = errorResponse(ERRORS.UNAUTHORIZED)

      expect(response.status).toBe('error')
      expect(response.data.alias).toBe('UNAUTHORIZED')
      expect(response.data.code).toBe(401)
      expect(response.data.message).toBe('Unauthorized')
    })

    it('should accept custom message', () => {
      const response = errorResponse(ERRORS.UNAUTHORIZED, 'Custom message')

      expect(response.data.message).toBe('Custom message')
      expect(response.data.alias).toBe('UNAUTHORIZED')
      expect(response.data.code).toBe(401)
    })

    it('should include trace in debug mode', () => {
      Object.assign(process.env, { NODE_ENV: 'development' })
      process.env.APP_DEBUG = 'true'

      const trace = { stack: 'error stack' }
      const response = errorResponse(ERRORS.INTERNAL_SERVER_ERROR, undefined, trace)

      expect(response.data.trace).toEqual(trace)
    })

    it('should not include trace in production', () => {
      Object.assign(process.env, { NODE_ENV: 'production' })
      process.env.APP_DEBUG = 'false'

      const trace = { stack: 'error stack' }
      const response = errorResponse(ERRORS.INTERNAL_SERVER_ERROR, undefined, trace)

      expect(response.data.trace).toBeUndefined()
    })
  })

  describe('customErrorResponse', () => {
    it('should create a custom error response', () => {
      const response = customErrorResponse('CUSTOM_ERROR', 400, 'Custom error message')

      expect(response.status).toBe('error')
      expect(response.data.alias).toBe('CUSTOM_ERROR')
      expect(response.data.code).toBe(400)
      expect(response.data.message).toBe('Custom error message')
    })

    it('should include trace in debug mode', () => {
      Object.assign(process.env, { NODE_ENV: 'development' })

      const trace = { details: 'error details' }
      const response = customErrorResponse('CUSTOM_ERROR', 400, 'Message', trace)

      expect(response.data.trace).toEqual(trace)
    })
  })

  describe('createSuccessResponse', () => {
    it('should create NextResponse with success data', () => {
      const data = { id: '123' }
      const response = createSuccessResponse(data)

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should accept ResponseInit options', () => {
      const data = { id: '123' }
      const response = createSuccessResponse(data, { status: 201 })

      expect(response).toBeInstanceOf(NextResponse)
    })
  })

  describe('createErrorResponse', () => {
    it('should create NextResponse with error data', () => {
      const response = createErrorResponse(ERRORS.UNAUTHORIZED)

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should set correct status code', () => {
      const response = createErrorResponse(ERRORS.FILE_NOT_FOUND)
      expect(response.status).toBe(404)
    })
  })

  describe('createCustomErrorResponse', () => {
    it('should create NextResponse with custom error', () => {
      const response = createCustomErrorResponse('CUSTOM', 400, 'Message')

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })
  })
})

