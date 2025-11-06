/**
 * Helper utilities for integration tests
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

export interface TestResponse<T = any> {
  status: 'ok' | 'error'
  data?: T
  error?: {
    alias: string
    code: number
    message: string
  }
}

/**
 * Make an authenticated request with timeout
 */
export async function authenticatedRequest<T>(
  path: string,
  options: RequestInit & { cookies?: string; timeout?: number } = {}
): Promise<TestResponse<T>> {
  const { cookies, timeout = 25000, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-test-mode': 'true', // Bypass CSRF protection in tests
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (cookies) {
    headers['Cookie'] = cookies
  }

  // Create an AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const data = await response.json()

    // The API returns { status: 'ok'|'error', data: {...} } or { status: 'error', data: { error details } }
    // Transform to match TestResponse interface
    if (data.status === 'error') {
      return {
        status: 'error',
        error: data.data, // error details are in data field
      }
    }

    return {
      status: data.status || 'ok',
      data: data.data,
      error: undefined,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Login and get session cookie
 */
export async function login(email: string, password: string): Promise<{ cookie: string; user: any }> {
  const fetchResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await fetchResponse.json()

  if (data.status !== 'ok' || !data.data) {
    // Error response structure: { status: 'error', data: { alias, code, message } }
    const errorMessage = data.data?.message || data.data?.alias || 'Unknown error'
    const errorCode = data.data?.code || 'unknown'
    throw new Error(`Login failed: ${errorMessage} (code: ${errorCode})`)
  }

  // Extract Set-Cookie header from response
  const setCookieHeader = fetchResponse.headers.get('set-cookie')
  let cookie = ''

  if (setCookieHeader) {
    // Extract the session cookie value
    const cookies = setCookieHeader.split(',')
    for (const cookieStr of cookies) {
      const trimmed = cookieStr.trim()
      if (trimmed.startsWith('vistra_session=')) {
        // Extract just the cookie name and value (before any attributes like ; Path=/)
        const match = trimmed.match(/vistra_session=([^;]+)/)
        if (match) {
          cookie = `vistra_session=${match[1]}`
          break
        }
      }
    }
  }

  // If no cookie was found in headers, we can't create a valid session
  // This would happen in real testing scenarios
  if (!cookie) {
    throw new Error('Login successful but no session cookie was returned')
  }

  return {
    cookie,
    user: data.data.user,
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition: () => Promise<boolean>, timeout = 5000, interval = 100): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Clean up test data (helper for tests)
 */
export async function cleanupTestData() {
  // This can be used to clean up test data if needed
  // For now, we rely on test isolation
}

