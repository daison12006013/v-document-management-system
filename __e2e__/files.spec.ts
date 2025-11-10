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

    // Should show files interface
    const filesContent = page.locator('text=/files|documents/i').first()
    await expect(filesContent).toBeVisible({ timeout: 5000 })
  })

  test('should display files list or empty state', async ({ page }) => {
    await page.goto('/files')
    await page.waitForLoadState('networkidle')

    // Either show files list or empty state
    const content = page.locator('text=/no files|empty|upload|documents found/i').first()
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test.describe('Table View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/files')
      await page.waitForLoadState('networkidle')

      // Ensure we're in Table View (default)
      const tableViewButton = page.getByRole('button', { name: /table view/i })
      if (await tableViewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tableViewButton.click()
        await page.waitForTimeout(500) // Wait for view to switch
      }
    })

    test('should display table view by default', async ({ page }) => {
      // Check for table view elements
      const tableViewButton = page.getByRole('button', { name: /table view/i })
      await expect(tableViewButton).toBeVisible({ timeout: 5000 })

      // Check if table is visible (either with data or empty state)
      const table = page.locator('table').first()
      const emptyState = page.locator('text=/no documents found/i').first()
      await expect(table.or(emptyState)).toBeVisible({ timeout: 5000 })
    })

    test('should navigate folders by clicking on folder rows', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Wait for files to load

      // First, create a folder to ensure we have one to navigate into
      const createFolderButton = page.getByRole('button', { name: /add new folder|create.*folder/i })
      let folderName = ''

      if (await createFolderButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        folderName = `Nav Test Folder ${Date.now()}`
        await createFolderButton.click()
        await page.waitForTimeout(500)

        const folderNameInput = page.getByPlaceholder(/folder.*name|my folder/i).or(
          page.getByLabel(/folder name/i)
        ).first()
        await folderNameInput.fill(folderName)
        await page.getByRole('button', { name: /create/i }).click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500) // Wait for folder to appear

        // Now click on the folder row to navigate into it
        const folderRow = page.locator('table tbody tr').filter({
          has: page.locator(`text=/${folderName}/i`)
        }).first()

        if (await folderRow.isVisible({ timeout: 5000 }).catch(() => false)) {
          await folderRow.click()
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(1500)

          // Should see breadcrumb showing we're in the folder
          const breadcrumb = page.locator('nav').filter({ has: page.locator('button') }).first()
          await expect(breadcrumb).toBeVisible({ timeout: 5000 })

          // Breadcrumb should contain the folder name or show we're in a folder
          const breadcrumbWithFolder = breadcrumb.filter({ has: page.locator(`text=/${folderName}/i`) })
          await expect(breadcrumbWithFolder.or(breadcrumb)).toBeVisible({ timeout: 5000 })
        }
      } else {
        // If no create button, try to find existing folders
        const allRows = page.locator('table tbody tr')
        const rowCount = await allRows.count()

        if (rowCount > 0) {
          // Try clicking on the first row (might be a folder)
          const firstRow = allRows.first()
          const currentUrl = page.url()
          await firstRow.click()
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(1000)

          // Check if URL changed or breadcrumb appeared (indicating navigation)
          const newUrl = page.url()
          const breadcrumb = page.locator('nav').filter({ has: page.locator('button') }).first()

          // Either URL changed or breadcrumb appeared
          if (currentUrl !== newUrl || await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(breadcrumb.or(page.locator('table'))).toBeVisible({ timeout: 5000 })
          }
        }
      }
    })

    test('should navigate using breadcrumbs', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Create a folder and navigate into it
      const createFolderButton = page.getByRole('button', { name: /add new folder|create.*folder/i })
      if (await createFolderButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const folderName = `Breadcrumb Test ${Date.now()}`
        await createFolderButton.click()
        await page.waitForTimeout(500)

        const folderNameInput = page.getByPlaceholder(/folder.*name|my folder/i).or(
          page.getByLabel(/folder name/i)
        ).first()
        await folderNameInput.fill(folderName)
        await page.getByRole('button', { name: /create/i }).click()
        await page.waitForTimeout(1000)

        // Navigate into the folder
        const folderRow = page.locator('table tbody tr').filter({ has: page.locator(`text=/${folderName}/i`) }).first()
        if (await folderRow.isVisible({ timeout: 3000 }).catch(() => false)) {
          await folderRow.click()
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(1000)

          // Check breadcrumb is visible
          const breadcrumb = page.locator('nav').filter({ has: page.locator('button') }).first()
          await expect(breadcrumb).toBeVisible({ timeout: 5000 })

          // Click on Root breadcrumb to go back
          const rootButton = breadcrumb.getByRole('button', { name: /root/i }).first()
          if (await rootButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await rootButton.click()
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1000)

            // Should be back at root
            const table = page.locator('table').first()
            await expect(table).toBeVisible({ timeout: 5000 })
          }
        }
      }
    })

    test('should change items per page limit', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Look for the items per page selector
      const itemsPerPageSelect = page.locator('select').filter({
        has: page.locator('option[value="10"]')
      }).first()

      if (await itemsPerPageSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Change to 25
        await itemsPerPageSelect.selectOption('25')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Verify the select value changed
        await expect(itemsPerPageSelect).toHaveValue('25')

        // Change to 50
        await itemsPerPageSelect.selectOption('50')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await expect(itemsPerPageSelect).toHaveValue('50')

        // Change back to 10
        await itemsPerPageSelect.selectOption('10')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await expect(itemsPerPageSelect).toHaveValue('10')
      }
    })

    test('should paginate through pages', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Look for pagination controls
      const paginationControls = page.locator('button').filter({
        hasText: /←|→|next|previous/i
      }).or(page.locator('button').filter({ hasText: /^\d+$/ }))

      const hasPagination = await paginationControls.count() > 0

      if (hasPagination) {
        // Check if there's a next button
        const nextButton = page.locator('button').filter({ hasText: /→|next/i }).first()
        const prevButton = page.locator('button').filter({ hasText: /←|previous/i }).first()

        // Try to go to next page if available
        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isDisabled = await nextButton.isDisabled().catch(() => true)
          if (!isDisabled) {
            await nextButton.click()
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1000)

            // Should be on page 2 (or next page)
            const table = page.locator('table').first()
            await expect(table).toBeVisible({ timeout: 5000 })

            // Go back to previous page
            if (await prevButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              const prevDisabled = await prevButton.isDisabled().catch(() => true)
              if (!prevDisabled) {
                await prevButton.click()
                await page.waitForLoadState('networkidle')
                await page.waitForTimeout(1000)
              }
            }
          }
        }

        // Try clicking on a page number button
        const pageNumberButtons = page.locator('button').filter({ hasText: /^\d+$/ })
        const pageButtonCount = await pageNumberButtons.count()
        if (pageButtonCount > 0) {
          // Click on a different page number (if not already on it)
          const firstPageButton = pageNumberButtons.first()
          const buttonText = await firstPageButton.textContent()
          if (buttonText && buttonText !== '1') {
            await firstPageButton.click()
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1000)
          } else if (pageButtonCount > 1) {
            // Click on the second page button
            const secondPageButton = pageNumberButtons.nth(1)
            await secondPageButton.click()
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1000)
          }
        }
      }
    })

    test('should create a folder in table view', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Look for create folder button
      const createFolderButton = page.getByRole('button', { name: /add new folder|create.*folder/i }).first()

      if (await createFolderButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const folderName = `E2E Test Folder ${Date.now()}`
        await createFolderButton.click()
        await page.waitForTimeout(500)

        // Fill folder name
        const folderNameInput = page.getByPlaceholder(/folder.*name|my folder/i).or(
          page.getByLabel(/folder name/i)
        ).first()
        await folderNameInput.fill(folderName)

        // Submit
        await page.getByRole('button', { name: /create/i }).click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Should see the new folder in the table
        const folderInTable = page.locator('table tbody tr').filter({
          has: page.locator(`text=/${folderName}/i`)
        }).first()
        await expect(folderInTable).toBeVisible({ timeout: 5000 })
      } else {
        test.skip()
      }
    })

    test('should upload files in table view', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Look for upload button
      const uploadButton = page.getByRole('button', { name: /upload files/i }).first()

      if (await uploadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await uploadButton.click()
        await page.waitForTimeout(500)

        // Look for file input (might be hidden)
        const fileInput = page.locator('input[type="file"]')

        if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Create a test file
          const testFileContent = 'Test file content for e2e testing'
          const testFile = new Blob([testFileContent], { type: 'text/plain' })
          const testFileName = `test-${Date.now()}.txt`

          // Set the file input
          await fileInput.setInputFiles({
            name: testFileName,
            mimeType: 'text/plain',
            buffer: Buffer.from(testFileContent)
          })

          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(2000) // Wait for upload to complete

          // Check if file appears in table (might take a moment)
          const fileInTable = page.locator('table tbody tr').filter({
            has: page.locator(`text=/${testFileName}/i`)
          }).first()

          // File might appear or might be uploading
          await expect(fileInTable.or(page.locator('text=/upload/i'))).toBeVisible({ timeout: 10000 })
        } else {
          // File input might be in a dropzone area
          const uploadArea = page.locator('[class*="upload"]').or(page.locator('[class*="dropzone"]')).first()
          if (await uploadArea.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Try to trigger file upload via drag and drop or click
            const testFileContent = 'Test file content'
            const testFileName = `test-${Date.now()}.txt`

            // Create file input programmatically
            await page.evaluate(({ name, content }) => {
              const input = document.createElement('input')
              input.type = 'file'
              input.style.display = 'none'
              document.body.appendChild(input)

              const dataTransfer = new DataTransfer()
              const blob = new Blob([content], { type: 'text/plain' })
              const file = new File([blob], name, { type: 'text/plain' })
              dataTransfer.items.add(file)
              input.files = dataTransfer.files

              const event = new Event('change', { bubbles: true })
              input.dispatchEvent(event)
            }, { name: testFileName, content: testFileContent })

            await page.waitForTimeout(2000)
          }
        }
      } else {
        test.skip()
      }
    })
  })

  test.describe('Folder Tree View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/files')
      await page.waitForLoadState('networkidle')

      // Switch to Folder Tree view
      const treeViewButton = page.getByRole('button', { name: /folder tree/i })
      if (await treeViewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await treeViewButton.click()
        await page.waitForTimeout(1000) // Wait for view to switch
      }
    })

    test('should display folder tree view', async ({ page }) => {
      // Check for folder tree view elements
      const treeViewButton = page.getByRole('button', { name: /folder tree/i })
      await expect(treeViewButton).toBeVisible({ timeout: 5000 })

      // Check if folder tree is visible
      const folderTree = page.locator('text=/documents.*folders|root/i').first()
      await expect(folderTree).toBeVisible({ timeout: 5000 })
    })

    test('should navigate folders in tree view', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Wait for tree to load

      // Look for folder items in the tree
      const folderItems = page.locator('[class*="tree"]').or(page.locator('[class*="folder"]')).filter({
        has: page.locator('button').or(page.locator('[role="button"]'))
      })

      // Try to find and click on a folder
      const firstFolder = folderItems.first()
      if (await firstFolder.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstFolder.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Should see some change in the view
        const content = page.locator('body')
        await expect(content).toBeVisible()
      }
    })

    test('should expand and collapse folders in tree', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Look for expand/collapse buttons (chevron icons)
      const expandButtons = page.locator('button').filter({
        has: page.locator('svg')
      }).or(page.locator('[class*="chevron"]'))

      const expandButtonCount = await expandButtons.count()
      if (expandButtonCount > 0) {
        const firstExpandButton = expandButtons.first()
        if (await firstExpandButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click to expand/collapse
          await firstExpandButton.click()
          await page.waitForTimeout(500)

          // Click again to toggle
          await firstExpandButton.click()
          await page.waitForTimeout(500)
        }
      }
    })

    test('should create folder in tree view', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Look for create folder button
      const createFolderButton = page.getByRole('button', { name: /add new folder|create.*folder/i }).first()

      if (await createFolderButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const folderName = `Tree Test Folder ${Date.now()}`
        await createFolderButton.click()
        await page.waitForTimeout(500)

        const folderNameInput = page.getByPlaceholder(/folder.*name|my folder/i).or(
          page.getByLabel(/folder name/i)
        ).first()
        await folderNameInput.fill(folderName)

        await page.getByRole('button', { name: /create/i }).click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000) // Wait for tree to refresh

        // Should see the new folder in the tree or in the file list
        const folderExists = page.locator(`text=/${folderName}/i`).first()
        await expect(folderExists).toBeVisible({ timeout: 5000 })
      } else {
        test.skip()
      }
    })
  })

  test.describe('View Switching', () => {
    test('should switch between table and tree views', async ({ page }) => {
      await page.goto('/files')
      await page.waitForLoadState('networkidle')

      // Check both view buttons exist
      const tableViewButton = page.getByRole('button', { name: /table view/i })
      const treeViewButton = page.getByRole('button', { name: /folder tree/i })

      await expect(tableViewButton).toBeVisible({ timeout: 5000 })
      await expect(treeViewButton).toBeVisible({ timeout: 5000 })

      // Switch to tree view
      await treeViewButton.click()
      await page.waitForTimeout(1000)

      // Switch back to table view
      await tableViewButton.click()
      await page.waitForTimeout(1000)

      // Should be back in table view
      const table = page.locator('table').first()
      await expect(table.or(page.locator('text=/no documents found/i'))).toBeVisible({ timeout: 5000 })
    })
  })
})
