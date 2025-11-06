/**
 * Helper utilities for integration tests
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

export interface TestResponse<T = any> {
  status: number
  data?: T
  error?: {
    alias: string
    code: number
    message: string
  }
}

/**
 * Make an authenticated request
 */
export async function authenticatedRequest<T>(
  path: string,
  options: RequestInit & { cookies?: string } = {}
): Promise<TestResponse<T>> {
  const { cookies, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (cookies) {
    headers['Cookie'] = cookies
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  const data = await response.json()

  return {
    status: response.status,
    ...data,
  }
}

/**
 * Login and get session cookie
 */
export async function login(email: string, password: string): Promise<{ cookie: string; user: any }> {
  const response = await authenticatedRequest<{ user: { id: string; email: string; name: string } }>(
    '/api/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      cookies: undefined, // No cookie for login
    }
  )

  if (response.status !== 'ok' || !response.data) {
    throw new Error(`Login failed: ${response.error?.message || 'Unknown error'}`)
  }

  // Extract cookie from response (in real scenario, we'd get this from Set-Cookie header)
  // For Next.js testing, we'll simulate by storing the session data
  const sessionData = {
    id: response.data.user.id,
    email: response.data.user.email,
    name: response.data.user.name,
  }

  // Create cookie string
  const cookie = `vistra_session=${JSON.stringify(sessionData)}`

  return {
    cookie,
    user: response.data.user,
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

