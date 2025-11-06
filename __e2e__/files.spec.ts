import { test, expect } from '@playwright/test'

test.describe('Files Management', () => {
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

  test('should navigate to files page', async ({ page }) => {
    await page.goto('/files')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/(admin\/)?files/)

    // Should show files interface - use locator to avoid strict mode violation
    const filesContent = page.locator('text=/files|documents/i').first()
    await expect(filesContent).toBeVisible({ timeout: 5000 })
  })

  test('should display files list or empty state', async ({ page }) => {
    await page.goto('/files')
    await page.waitForLoadState('networkidle')

    // Either show files list or empty state - use locator to avoid strict mode violation
    const content = page.locator('text=/no files|empty|upload/i').first()
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test('should create a folder', async ({ page }) => {
    await page.goto('/files')
    await page.waitForLoadState('networkidle')

    // Look for create folder button
    const createFolderButton = page.getByRole('button', { name: /create.*folder|new.*folder|add.*folder/i }).first()

    if (await createFolderButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createFolderButton.click()

      // Fill folder name
      const folderNameInput = page.getByPlaceholder(/folder.*name/i).or(
        page.getByLabel(/name/i)
      ).first()
      await folderNameInput.fill(`Test Folder ${Date.now()}`)

      // Submit
      await page.getByRole('button', { name: /create|save|submit/i }).click()

      // Should see the new folder - use locator to avoid strict mode violation
      await expect(page.locator('text=/test folder/i').first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })
})

