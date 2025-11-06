# E2E Tests

End-to-end tests using Playwright to test the full application flow through the browser.

## Prerequisites

1. Docker and Docker Compose installed
2. MySQL container running (via `make db-start` or Docker Compose)
3. Database schema initialized (via `make db-push` and `make db-seed`)
4. Next.js server running on port 3000

## Installation

Playwright browsers are installed automatically, but you can manually install them:

```bash
pnpm exec playwright install --with-deps chromium
```

## Running E2E Tests

### Local Development

1. **Start the database:**
   ```bash
   make db-start
   make db-push
   make db-seed
   ```

2. **Start Next.js server** (in a separate terminal):
   ```bash
   pnpm dev
   # Or for production build:
   pnpm build && pnpm start
   ```

3. **Run E2E tests:**
   ```bash
   pnpm test:e2e
   ```

### Other Commands

- **UI Mode** (interactive): `pnpm test:e2e:ui`
- **Debug Mode**: `pnpm test:e2e:debug`
- **Headed Mode** (see browser): `pnpm test:e2e:headed`

## Test Structure

- `__e2e__/auth.spec.ts` - Authentication flows (login, logout)
- `__e2e__/users.spec.ts` - User management UI
- `__e2e__/files.spec.ts` - File management UI
- `__e2e__/example.spec.ts` - Example test template

## Writing Tests

```typescript
import { test, expect } from '@playwright/test'

test('should do something', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Hello')).toBeVisible()
})
```

## CI/CD

E2E tests run automatically in GitHub Actions CI:
- Uses Docker service for MySQL
- Builds and starts Next.js server
- Runs Playwright tests
- Uploads test reports as artifacts

See `.github/workflows/test.yml` for details.

## Best Practices

1. Use semantic selectors (`getByRole`, `getByText`) instead of CSS selectors
2. Wait for elements to be visible before interacting
3. Use `waitForLoadState('networkidle')` for pages that load data
4. Clean up test data if needed (though tests should be isolated)
5. Use `test.skip()` for tests that require features not yet implemented

