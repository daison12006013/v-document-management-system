# Vistra API Postman Collection

This directory contains a comprehensive Postman collection for testing the Vistra API with full test coverage including both success and failure scenarios.

## Files

- `Vistra_API.postman_collection.json` - Complete Postman collection with all API endpoints
- `Vistra_API.postman_environment.json` - Environment variables with default values
- `report.html` - HTML test report (generated after running tests)
- `report.json` - JSON test report (generated after running tests)

## Quick Start

### Import into Postman

1. Open Postman
2. Click **Import** button
3. Select both files:
   - `Vistra_API.postman_collection.json`
   - `Vistra_API.postman_environment.json`
4. The collection and environment will be imported automatically

### Run Tests via CLI

```bash
# Install Newman CLI (one-time setup)
make postman-install

# Run all tests
make postman-run
```

The tests will:

- Execute all requests in the collection
- Run success and failure test cases
- Generate HTML and JSON reports
- Display results in the terminal

## Environment Variables

The environment file includes the following default values:

### Base Configuration

- `baseUrl`: `http://localhost:3000`

### Default Test Accounts

- `adminEmail`: `admin@vistra.com`
- `adminPassword`: `admin123`
- `userEmail`: `user@vistra.com`
- `userPassword`: `user123`
- `demoEmail`: `demo@vistra.com`
- `demoPassword`: `demo123`

### Dynamic Variables (Auto-populated)

- `csrfToken` - Automatically fetched for POST/PUT/DELETE requests
- `sessionCookie` - Set after successful login
- `userId` - Current user ID
- `createdUserId` - ID of newly created user
- `adminRoleId` - Admin role ID
- `viewerRoleId` - Viewer role ID
- `createdRoleId` - ID of newly created role
- `filesReadPermissionId` - Files read permission ID
- `folderId` - Created folder ID
- `fileId` - Created file ID
- `shareToken` - Share link token

## Collection Structure

The collection is organized into the following folders:

### 1. Authentication

- Login - Success
- Login - Invalid Credentials
- Login - Validation Error
- Get Current User
- Get Current User - Unauthorized
- Logout

### 2. CSRF

- Get CSRF Token

### 3. Health

- Database Health Check

### 4. Users

- List Users
- List Users - Unauthorized
- Create User
- Create User - Validation Error
- Create User - Duplicate Email
- Get User by ID
- Get User by ID - Not Found
- Update User
- Delete User
- Assign Role to User
- Remove Role from User
- Assign Permission to User
- Remove Permission from User

### 5. Roles

- List Roles
- Create Role
- Create Role - Duplicate Name
- Get Role by ID
- Get Role by ID - Not Found
- Update Role
- Delete Role

### 6. Permissions

- List Permissions

### 7. Files

- List Files
- List Files - With Filters
- Create Folder
- Create Folder - Validation Error
- Get File by ID
- Get File by ID - Not Found
- Update File
- Get Folder Children
- Get Folder Children - Not a Folder
- Create Share Link
- Get Share Link Info
- Get Share Link Info - Invalid Token
- Delete File

### 8. Dashboard

- Get Dashboard Data

## Features

### Automatic CSRF Token Handling

The collection includes a pre-request script that automatically fetches and includes CSRF tokens for all POST, PUT, DELETE, and PATCH requests.

### Comprehensive Test Coverage

Each endpoint includes:

- **Success test cases**: Verify correct responses, status codes, and data structure
- **Failure test cases**: Test error handling, validation, and edge cases

### Test Assertions

All requests include test scripts that verify:

- HTTP status codes
- Response structure
- Data validation
- Error messages
- Authentication/authorization

### Dynamic Variable Management

The collection automatically:

- Stores session cookies after login
- Captures IDs from responses for use in subsequent requests
- Manages CSRF tokens
- Tracks created resources for cleanup

## Running Tests

### Prerequisites

1. **Server Running**: Ensure the Next.js development server is running

   ```bash
   make dev
   ```

2. **Database Seeded**: Make sure the database is set up with seed data

   ```bash
   make setup
   # or
   make db-seed
   ```

3. **Newman CLI**: Install Newman for CLI testing (optional, for `make postman-run`)

   ```bash
   npm install -g newman
   # or
   make postman-install
   ```

### Via Postman UI

1. Open Postman
2. Select the **Vistra API** collection
3. Select the **Vistra API - Local** environment
4. Click **Run** button
5. Select all requests or specific folders
6. Click **Run Vistra API**

### Via CLI (Newman)

```bash
# Run all tests
make postman-run

# Or manually
newman run postman/Vistra_API.postman_collection.json \
  -e postman/Vistra_API.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export postman/report.html
```

### Test Reports

After running tests via CLI, reports are generated:

- **HTML Report**: `postman/report.html` - Visual test results
- **JSON Report**: `postman/report.json` - Machine-readable results

The HTML report opens automatically in your browser after tests complete.

## Customization

### Changing Base URL

Edit `Vistra_API.postman_environment.json` and update the `baseUrl` value:

```json
{
  "key": "baseUrl",
  "value": "https://api.example.com",
  "type": "default"
}
```

### Using Different Test Accounts

Update the email and password variables in the environment file:

```json
{
  "key": "adminEmail",
  "value": "your-admin@example.com"
},
{
  "key": "adminPassword",
  "value": "your-password"
}
```

### Adding New Tests

1. Add a new request to the appropriate folder
2. Write test scripts in the **Tests** tab
3. Use `pm.test()` for assertions
4. Use `pm.environment.set()` to store variables
5. Use `pm.environment.get()` to retrieve variables

## Troubleshooting

### Tests Failing

1. **Check server is running**: `curl http://localhost:3000/api/health/db`
2. **Verify database is seeded**: Ensure default accounts exist
3. **Check environment variables**: Verify baseUrl and credentials
4. **Review test reports**: Check `postman/report.html` for detailed errors

### CSRF Token Issues

The collection automatically handles CSRF tokens. If you see CSRF errors:

1. Ensure the "Get CSRF Token" request runs first
2. Check that the pre-request script is enabled
3. Verify the server is returning CSRF tokens

### Authentication Issues

If authentication fails:

1. Run the "Login - Success" request first
2. Verify credentials match seed data
3. Check that session cookies are being set
4. Ensure the environment is selected in Postman

## Integration with CI/CD

You can integrate these tests into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Postman Tests
  run: |
    npm install -g newman
    newman run postman/Vistra_API.postman_collection.json \
      -e postman/Vistra_API.postman_environment.json \
      --reporters cli,html,json \
      --reporter-html-export postman/report.html \
      --reporter-json-export postman/report.json
```

## Notes

- The collection uses the default test accounts from `database/seeds/seed.sql`
- Some tests create resources that may need cleanup between runs
- The collection assumes the server is running on `http://localhost:3000`
- All timestamps and delays are configurable in the collection settings

## Support

For issues or questions:

1. Check the test reports for detailed error messages
2. Verify server logs for API errors
3. Ensure database is properly seeded
4. Review the Swagger documentation at `/api-docs`
