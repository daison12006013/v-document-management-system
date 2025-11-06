import { test, expect } from '@playwright/test'

/**
 * Example E2E test to demonstrate Playwright usage
 * This test can be used as a template for new tests
 */
test.describe('Example E2E Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Basic assertion that page loaded
    expect(page.url()).toContain('localhost:3000')
  })

  test('should have proper page title', async ({ page }) => {
    await page.goto('/')

    // Check if title exists (adjust selector based on your app)
    const title = page.locator('title').or(page.locator('h1')).first()
    await expect(title).toBeAttached()
  })
})

