# Document Management System - Next.js

A Next.js application built with TypeScript, Tailwind CSS, MySQL, and Drizzle ORM.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- Docker and Docker Compose

### Setup

1. Make sure Docker is running

2. Run the setup command:

   ```bash
   make setup
   ```

   This will automatically:
   - Install dependencies
   - Start the MySQL database
   - Set up the database schema
   - Seed the database with initial data

3. Start the development server:

   ```bash
   make dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Login Credentials

The following test users are available after running `make setup`:

| Email              | Password   | Role   | Description                      |
|--------------------|------------|--------|----------------------------------|
| `admin@vistra.com` | `admin123` | Admin  | Full access to all features      |
| `user@vistra.com`  | `user123`  | User   | Regular user with limited access |****
| `demo@vistra.com`  | `demo123`  | Viewer | Read-only access                 |

*Note: The email address is shown as a placeholder in the login form.*

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Database**: MySQL 8.0
- **ORM**: Drizzle ORM with MySQL2
- **Testing**: Vitest with React Testing Library
- **Local Development**: Docker
- **Deployment**: AWS Serverless (Lambda, API Gateway)

## Database

### Quick Commands

```bash
make db-start       # Start MySQL database
make db-stop        # Stop MySQL database
make db-status      # Check database status
make db-push        # Push schema changes (auto-confirms)
make db-generate    # Generate migration files
make db-migrate     # Run migrations
make db-seed        # Seed database with initial data
make db-clean       # Drop all tables (with confirmation)
make db-wipe        # Drop all tables and reseed (full reset)
make db-reset       # Restart database container
make db-studio      # Open Drizzle Studio (visual database browser)
```

### Schema Management

**Development (auto-sync):**

```bash
# Make changes to database/schema/*.ts files
make db-push  # Automatically syncs schema changes (auto-confirms)
```

**Production (migrations):**

```bash
make db-generate  # Generate migration files
make db-migrate   # Run migrations
```

### Drizzle Studio

Browse and edit your database visually:

```bash
make db-studio
# Opens at http://localhost:4983
```

**Note**: The database container must be running (`make db-start`) before pushing schema, running migrations, or seeding.

**Note**: The database connection is automatically tested when Next.js starts. If MySQL isn't running (`make db-start`), you'll see a warning but the app will still start (connection will be retried on first use).

### Testing

Run tests:

```bash
pnpm test              # Run all tests once
pnpm test:watch        # Run tests in watch mode
pnpm test:ui           # Open Vitest UI in browser
pnpm test:coverage     # Run tests with coverage report
```

**Test Coverage:**

- Overall: **93%+** statements, lines, functions
- Library utilities: **92-100%** coverage
- Components: **100%** coverage (Button, Card, Badge tested)

### Build

Build for production:

```bash
make build
```

Start production server:

```bash
make start
```

## Project Structure

```
/
├── app/                    # Next.js App Router pages and routes
│   ├── api/               # API routes
│   ├── (admin)/           # Admin route group
│   └── page.tsx           # Home page
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   │   └── __tests__/     # Component tests
│   ├── admin/             # Admin components
│   ├── auth/              # Authentication components
│   ├── files/             # File management components
│   └── theme/             # Theme components
├── lib/                   # Utility functions and helpers
│   ├── __tests__/         # Library tests
│   ├── queries/           # Drizzle query functions
│   │   ├── users.ts       # User queries
│   │   ├── rbac.ts        # RBAC queries
│   │   ├── activities.ts  # Activity logging queries
│   │   ├── dashboard.ts   # Dashboard queries
│   │   └── files.ts       # File queries
│   ├── storage/           # Storage abstraction layer
│   │   ├── drivers/       # Storage drivers (local, S3, R2)
│   │   ├── config.ts      # Storage configuration
│   │   └── index.ts       # Storage factory
│   ├── uppy/              # File upload configuration
│   ├── db.ts              # Database connection setup
│   ├── db-init.ts         # Connection utilities
│   ├── auth.ts            # Authentication helpers
│   ├── api.ts             # API client functions
│   ├── activities.ts      # Activity logging
│   ├── helpers.ts         # Utility helpers
│   └── utils.ts           # Common utilities
├── database/              # Database schemas and migrations
│   ├── schema/            # Drizzle schema definitions
│   │   ├── users.ts       # Users table schema
│   │   ├── rbac.ts        # RBAC tables schema
│   │   ├── activities.ts  # Activities table schema
│   │   ├── files.ts       # Files table schema
│   │   ├── relations.ts   # Table relations
│   │   └── index.ts       # Schema exports
│   ├── migrations/        # Generated migration files
│   └── seeds/             # Database seed scripts
│       └── seed.sql       # Initial data seeding
├── scripts/               # Development scripts
│   └── dev-with-db.ts     # Auto-setup dev script
├── instrumentation.ts     # Next.js instrumentation (auto-connects DB)
├── public/                # Static assets
├── vitest.config.ts       # Vitest configuration
├── vitest.setup.ts        # Test setup file
├── Dockerfile             # Docker configuration for local development
├── docker-compose.yml     # Docker Compose configuration (MySQL)
├── Makefile               # Build and development commands
└── package.json           # Node.js dependencies
```

## Available Make Commands

### Development

- `make help` - Show help message
- `make install` - Install dependencies
- `make dev` - Start development server
- `make build` - Build for production
- `make start` - Start production server
- `make lint` - Run linter

### Testing

- `pnpm test` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Open Vitest UI in browser
- `pnpm test:coverage` - Generate coverage report

### Database

- `make db-start` - Start MySQL database container
- `make db-stop` - Stop MySQL database container
- `make db-status` - Check database status
- `make db-push` - Push schema changes (auto-confirms)
- `make db-generate` - Generate migration files
- `make db-migrate` - Run database migrations
- `make db-seed` - Seed database with initial data
- `make db-clean` - Drop all tables (with confirmation)
- `make db-wipe` - Drop all tables and reseed (full reset)
- `make db-reset` - Restart database container
- `make db-studio` - Open Drizzle Studio (visual browser)

### Cleanup & Setup

- `make clean` - Remove build artifacts and node_modules (with confirmation)
- `make setup` - Complete setup (install + start DB + push schema + seed)

Run `make help` to see all commands with descriptions.

## Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=mysql://vistra_user:vistra_password@localhost:3306/vistra_db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**MySQL Connection String Format:**

```
mysql://[username]:[password]@[host]:[port]/[database]
```

## Database Connection

The application automatically connects to MySQL when Next.js starts:

1. **Auto-Connect on Startup**: `instrumentation.ts` tests the connection
2. **Health Check**: Available at `/api/health/db`
3. **Lazy Initialization**: Connection created on first use if not available at startup

Check connection status:

```bash
curl http://localhost:3000/api/health/db
```

## Features

- **Role-Based Access Control (RBAC)**: Supports wildcard permissions (`users:*`, `*:read`, etc.)
- **User Management**: Create, read, update, delete users with permission checks
- **Role & Permission Management**: Assign roles and permissions to users
- **Activity Logging**: Track all user actions
- **Session Management**: Secure cookie-based sessions
- **System Accounts**: Protected accounts that cannot be modified

## Development Workflow

1. **Make Schema Changes**: Edit files in `database/schema/*.ts`
2. **Sync Schema**: Run `make db-push` (development) or `make db-generate` followed by `make db-migrate` (production)
3. **Update Queries**: Update query functions in `lib/queries/*.ts` if needed
4. **Write Tests**: Add tests in `lib/__tests__/` or `components/**/__tests__/`
5. **Run Tests**: Use `pnpm test:watch` during development
6. **Test**: Start dev server with `make dev`

## Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing with comprehensive coverage of utility functions and components.

### Quick Start

```bash
# Run all tests
pnpm test

# Watch mode (useful during development)
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Open interactive UI
pnpm test:ui
```

### Test Coverage

- **Overall**: 93%+ statements, functions, branches, lines
- **Library utilities**: 92-100% coverage
  - `lib/utils.ts`: 100%
  - `lib/helpers.ts`: 100%
  - `lib/auth.ts`: 100%
  - `lib/activities.ts`: 100%
  - `lib/error_responses.ts`: 100%
  - `lib/api.ts`: 82%
- **Components**: 100% coverage for tested components (Button, Card, Badge)

### What's Tested

✅ **Library Functions**

- Utility functions (`cn`, `formatDate`, `formatFileSize`, etc.)
- Authentication helpers (with mocked Next.js APIs)
- API client functions (with mocked fetch)
- Error response utilities
- Activity logging
- Storage configuration

✅ **Components**

- Button component (variants, sizes, interactions)
- Card component and subcomponents
- Badge component

### Coverage Thresholds

The project enforces coverage thresholds:

- Lines: 85%
- Functions: 80%
- Branches: 75%
- Statements: 85%

The build will fail if coverage drops below these thresholds.

### Integration & E2E Tests

**Integration Tests** (require Docker MySQL):

```bash
# Start database first
make db-start && make db-push && make db-seed

# Start Next.js server (in another terminal)
pnpm dev

# Run integration tests
pnpm test:integration
```

**E2E Tests** (require Docker MySQL + Next.js server):

```bash
# Start database and server (same as integration tests)
make db-start && make db-push && make db-seed
pnpm dev  # in another terminal

# Run E2E tests
pnpm test:e2e
pnpm test:e2e:ui    # Interactive UI mode
pnpm test:e2e:debug # Debug mode
```

See `__integration__/README.md` and `__e2e__/README.md` for detailed documentation.

## License

Private project for Vistra's Document Management System.
