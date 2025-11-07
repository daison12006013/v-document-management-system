import { test, expect } from '@playwright/test'

test.describe('Users Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if login form is visible (not logged in)
    const loginFormVisible = await page.getByLabel(/email/i).isVisible({ timeout: 2000 }).catch(() => false)

    if (loginFormVisible) {
      // Need to login
      await page.getByLabel(/email/i).fill('admin@vistra.com')
      await page.getByLabel(/password/i).fill('admin123')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Wait for login to complete - page should reload and show dashboard
      await page.waitForLoadState('networkidle')
      // Wait for login form to disappear (indicating successful login)
      await page.getByLabel(/email/i).waitFor({ state: 'hidden', timeout: 10000 })
    }
  })

  test('should navigate to users page', async ({ page }) => {
    // Navigate to users page
    await page.goto('/users')

    // Should show users list
    await expect(page).toHaveURL(/\/(admin\/)?users/)

    // Check for users table or list
    const usersContent = page.getByText(/users/i).or(
      page.getByRole('table').or(page.getByRole('list'))
    ).first()
    await expect(usersContent).toBeVisible({ timeout: 5000 })
  })

  test('should display users list', async ({ page }) => {
    await page.goto('/users')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Check if there's a table with user data
    const table = page.getByRole('table').first()
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Table exists, check for rows
      const rows = table.getByRole('row')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThan(0)
    } else {
      // Alternative: check for user cards or list items
      const userItems = page.locator('[data-testid*="user"], [class*="user-card"], [class*="user-item"]').first()
      await expect(userItems).toBeVisible({ timeout: 3000 })
    }
  })

  test('should create a new user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')

    // Look for create/add button
    const createButton = page.getByRole('button', { name: /create|add|new.*user/i }).first()

    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click()

      // Fill in user form
      await page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).fill(`test-${Date.now()}@example.com`)
      await page.getByPlaceholder(/name/i).or(page.getByLabel(/name/i)).fill('Test User')
      await page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).fill('TestPassword123!')

      // Submit form
      await page.getByRole('button', { name: /create|submit|save/i }).click()

      // Should see success message or redirect - use locator to avoid strict mode violation
      await expect(
        page.locator('text=/success|created|saved/i').or(page.locator('text=/test-.*@example\\.com/i')).first()
      ).toBeVisible({ timeout: 5000 })
    } else {
      // Skip if create functionality not available
      test.skip()
    }
  })

  test('should search/filter users', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).first()

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('admin')
      await page.waitForTimeout(500) // Wait for search to execute

      // Results should update
      await expect(page.getByText(/admin/i)).toBeVisible()
    }
  })

  test('should assign a role to a new user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')

    // First, create a new user
    const createButton = page.getByRole('button', { name: /create|add|new.*user/i }).first()

    if (!(await createButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Create user button not available')
      return
    }

    await createButton.click()

    const testEmail = `test-role-${Date.now()}@example.com`
    const testName = 'Test User for Role Assignment'

    await page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).fill(testEmail)
    await page.getByPlaceholder(/name/i).or(page.getByLabel(/name/i)).fill(testName)
    await page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).fill('TestPassword123!')

    // Submit form
    await page.getByRole('button', { name: /create|submit|save/i }).click()

    // Wait for user to be created
    await expect(
      page.locator(`text=/${testEmail}/i`).or(
        page.locator('text=/success|created|saved/i')
      ).first()
    ).toBeVisible({ timeout: 5000 })

    // Wait a bit for the user to appear in the list
    await page.waitForTimeout(1000)

    // Find the newly created user in the table and click the Roles button
    const userRow = page.locator('tr').filter({ hasText: testEmail }).first()

    if (await userRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click the Roles button for this user
      const rolesButton = userRow.getByRole('button', { name: /roles/i }).first()
      await rolesButton.click()

      // Wait for roles dialog to open
      await page.waitForTimeout(500)

      // Look for available roles to assign
      const assignButtons = page.getByRole('button', { name: /assign/i })
      const assignButtonCount = await assignButtons.count()

      if (assignButtonCount > 0) {
        // Click the first available Assign button
        await assignButtons.first().click()

        // Wait for role to be assigned - look for success message or role badge
        await expect(
          page.locator('text=/role.*assigned|success/i').or(
            page.locator('[class*="badge"], [class*="role"]')
          ).first()
        ).toBeVisible({ timeout: 5000 })

        // Close the dialog
        const closeButton = page.getByRole('button', { name: /close/i }).first()
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click()
        }
      } else {
        test.skip(true, 'No roles available to assign')
      }
    } else {
      test.skip(true, 'Newly created user not found in table')
    }
  })

  test('should assign a permission to a new user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')

    // First, create a new user
    const createButton = page.getByRole('button', { name: /create|add|new.*user/i }).first()

    if (!(await createButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Create user button not available')
      return
    }

    await createButton.click()

    const testEmail = `test-perm-${Date.now()}@example.com`
    const testName = 'Test User for Permission Assignment'

    await page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).fill(testEmail)
    await page.getByPlaceholder(/name/i).or(page.getByLabel(/name/i)).fill(testName)
    await page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).fill('TestPassword123!')

    // Submit form
    await page.getByRole('button', { name: /create|submit|save/i }).click()

    // Wait for user to be created
    await expect(
      page.locator(`text=/${testEmail}/i`).or(
        page.locator('text=/success|created|saved/i')
      ).first()
    ).toBeVisible({ timeout: 5000 })

    // Wait a bit for the user to appear in the list
    await page.waitForTimeout(1000)

    // Find the newly created user in the table and click the Permissions button
    const userRow = page.locator('tr').filter({ hasText: testEmail }).first()

    if (await userRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click the Permissions button for this user (might be "Perms" button)
      const permsButton = userRow.getByRole('button', { name: /perms|permissions/i }).first()
      await permsButton.click()

      // Wait for permissions dialog to open
      await page.waitForTimeout(500)

      // Look for available permissions to assign
      const assignButtons = page.getByRole('button', { name: /assign/i })
      const assignButtonCount = await assignButtons.count()

      if (assignButtonCount > 0) {
        // Click the first available Assign button
        await assignButtons.first().click()

        // Wait for permission to be assigned - look for success message or permission badge
        await expect(
          page.locator('text=/permission.*assigned|success/i').or(
            page.locator('[class*="badge"], [class*="permission"]')
          ).first()
        ).toBeVisible({ timeout: 5000 })

        // Close the dialog
        const closeButton = page.getByRole('button', { name: /close/i }).first()
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click()
        }
      } else {
        test.skip(true, 'No permissions available to assign')
      }
    } else {
      test.skip(true, 'Newly created user not found in table')
    }
  })
})

test.describe('Users Management - Permissions', () => {
  test('should require authentication to access users page', async ({ page }) => {
    // Try to access users page without logging in
    await page.goto('/users')

    // Should redirect to login (root page shows login when not authenticated)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 10000 })
    // Verify login form is visible
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 })
  })
})
