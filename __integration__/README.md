# Integration Tests

Integration tests that require a real database connection and running Next.js server.

## Prerequisites

1. Docker and Docker Compose installed
2. MySQL container running (via `make db-start` or Docker Compose)
3. Database schema initialized (via `make db-push` and `make db-seed`)
4. Next.js server running on port 3000 (for testing endpoints)

## Running Integration Tests

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

3. **Run integration tests:**
   ```bash
   pnpm test:integration
   ```

### Watch Mode

```bash
pnpm test:integration:watch
```

## Test Structure

- `__integration__/api/` - API endpoint integration tests
- `__integration__/helpers.ts` - Test utilities (auth, requests, etc.)
- `__integration__/setup.ts` - Global test setup
- `__integration__/teardown.ts` - Global test teardown

## CI/CD

Integration tests run automatically in GitHub Actions CI:
- Uses Docker service for MySQL
- Starts Next.js server
- Runs all integration tests

See `.github/workflows/test.yml` for details.
