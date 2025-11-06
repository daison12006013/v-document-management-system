import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/')
    // Wait for page to load and form to be ready
    await page.waitForLoadState('networkidle')
    // Wait for the login form to be visible (check for the card or form)
    await page.waitForSelector('form', { timeout: 10000 })
  })

  test('should display login page', async ({ page }) => {
    // Check for login form elements using labels (more reliable than placeholders)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    // Fill in credentials using labels
    await page.getByLabel(/email/i).fill('admin@vistra.com')
    await page.getByLabel(/password/i).fill('admin123')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard or admin area after login
    // After login, the page refreshes and shows AdminDashboard instead of LoginPage
    await page.waitForLoadState('networkidle')
    // Check that we're no longer on the login page (the form should disappear)
    await expect(page.getByLabel(/email/i)).not.toBeVisible({ timeout: 10000 })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('admin@vistra.com')
    await page.getByLabel(/password/i).fill('wrongpassword')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|error|failed/i)).toBeVisible({ timeout: 5000 })
  })

  test('should require email and password', async ({ page }) => {
    // Try to submit without filling fields
    // HTML5 validation should prevent submission, but let's try clicking submit
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation errors or stay on page (form should still be visible)
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

test.describe('Authentication - Logged In', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 10000 })

    await page.getByLabel(/email/i).fill('admin@vistra.com')
    await page.getByLabel(/password/i).fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for login to complete and page to refresh
    await page.waitForLoadState('networkidle')
    // Verify we're logged in by checking login form is gone
    await expect(page.getByLabel(/email/i)).not.toBeVisible({ timeout: 10000 })
  })

  test('should access protected routes when logged in', async ({ page }) => {
    // Try to access admin routes
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    // Should be on admin users page
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('should display user information', async ({ page }) => {
    // Check for user information in the sidebar footer (AdminLayout shows user name and email)
    await page.waitForLoadState('networkidle')
    // The sidebar contains user info. Since multiple elements contain "Admin User",
    // verify user info exists by checking that we can see both the logout button (in sidebar footer)
    // and some user-related text exists in the page (proving we're logged in and info is displayed)
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await expect(logoutButton).toBeVisible({ timeout: 5000 })
    // Also verify user info exists somewhere (the sidebar footer displays it)
    // Use locator to find all elements containing the email and verify at least one exists
    const userInfoElements = page.locator('text=/admin@vistra\\.com/i')
    await expect(userInfoElements.first()).toBeVisible({ timeout: 5000 })
  })

  test('should logout', async ({ page }) => {
    // Look for logout button in the sidebar footer
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await expect(logoutButton).toBeVisible({ timeout: 5000 })

    await logoutButton.click()

    // Should redirect to login page after logout
    await page.waitForLoadState('networkidle')
    // Wait a bit for the page to refresh and show login form
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })
  })
})

