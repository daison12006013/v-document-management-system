# Vistra Takehome Exam - Next.js

A Next.js application built with TypeScript, Tailwind CSS, MySQL, and Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Database**: MySQL 8.0
- **ORM**: Drizzle ORM with MySQL2
- **Local Development**: Docker
- **Deployment**: AWS Serverless (Lambda, API Gateway)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- Docker and Docker Compose

### Installation

1. Install dependencies (uses pnpm):

```bash
make install
# or directly: pnpm install
```

2. Start MySQL database:

```bash
make db-start
```

3. Push database schema:

```bash
make db-push
```

4. Seed database with initial data:

```bash
make db-seed
```

Or run the complete setup:

```bash
make setup  # install + start DB + push schema + seed
```

### Development

Start the development server:

```bash
make dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note**: The database connection is automatically tested when Next.js starts. If MySQL isn't running (`make db-start`), you'll see a warning but the app will still start (connection will be retried on first use).

### Database

#### Quick Commands

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

#### Schema Management

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

#### Drizzle Studio

Browse and edit your database visually:

```bash
make db-studio
# Opens at http://localhost:4983
```

**Note**: The database container must be running (`make db-start`) before pushing schema, running migrations, or seeding.

### Login Credentials

For development and testing, the following credentials are available (displayed on the landing page):

- **Email**: `admin@vistra.com`
- **Password**: `admin123`

These correspond to seeded database users. Run `make db-seed` to populate the database with initial data.

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
├── components/             # React components (including shadcn/ui)
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions and helpers
│   ├── queries/           # Drizzle query functions
│   │   ├── users.ts       # User queries
│   │   ├── rbac.ts        # RBAC queries
│   │   ├── activities.ts  # Activity logging queries
│   │   └── dashboard.ts   # Dashboard queries
│   ├── db.ts              # Database connection setup
│   ├── db-init.ts         # Connection utilities
│   └── auth.ts            # Authentication helpers
├── database/              # Database schemas and migrations
│   ├── schema/            # Drizzle schema definitions
│   │   ├── users.ts       # Users table schema
│   │   ├── rbac.ts        # RBAC tables schema
│   │   ├── activities.ts  # Activities table schema
│   │   ├── relations.ts   # Table relations
│   │   └── index.ts       # Schema exports
│   ├── migrations/        # Generated migration files
│   └── seeds/             # Database seed scripts
│       └── seed.sql       # Initial data seeding
├── scripts/               # Development scripts
│   └── dev-with-db.ts     # Auto-setup dev script
├── instrumentation.ts     # Next.js instrumentation (auto-connects DB)
├── public/                # Static assets
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
2. **Sync Schema**: Run `pnpm db:push` (development) or generate migrations (production)
3. **Update Queries**: Update query functions in `lib/queries/*.ts` if needed
4. **Test**: Start dev server with `make dev` or `pnpm dev:with-db`


## License

Private project for Vistra takehome exam.
