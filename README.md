# Vistra Takehome Exam - Next.js

A Next.js application built with TypeScript, Tailwind CSS, PostgreSQL, and sqlc.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Database**: PostgreSQL
- **Database Code Generation**: sqlc with TypeScript plugin
- **Local Development**: Docker
- **Deployment**: AWS Serverless (Lambda, API Gateway)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- Docker and Docker Compose
- sqlc (for database code generation)

### Installation

1. Install dependencies (uses pnpm):
```bash
make install
# or directly: pnpm install
```

2. Start PostgreSQL database:
```bash
make db-up
```

3. Run initial setup (install + start DB):
```bash
make setup
```

### Development

Start the development server:
```bash
make dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database

Generate TypeScript types from SQL queries:
```bash
make db-generate
```

Validate SQL queries:
```bash
make db-validate
```

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
├── components/             # React components (including shadcn/ui)
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions and helpers
├── database/              # sqlc database schemas and queries
│   ├── schema/           # SQL schema files
│   ├── sql/              # SQL query files
│   └── sqlc.yaml         # sqlc configuration
├── src/                   # Generated code from sqlc
├── public/                # Static assets
├── Dockerfile             # Docker configuration for local development
├── docker-compose.yml     # Docker Compose configuration
├── Makefile              # Build and development commands
└── package.json          # Node.js dependencies
```

## Available Make Commands

- `make help` - Show help message
- `make install` - Install dependencies
- `make dev` - Start development server
- `make build` - Build for production
- `make start` - Start production server
- `make lint` - Run linter
- `make db-up` - Start PostgreSQL database
- `make db-down` - Stop PostgreSQL database
- `make db-generate` - Generate TypeScript types from SQL
- `make db-validate` - Validate SQL queries
- `make db-reset` - Reset database (stop and start)
- `make clean` - Clean build artifacts
- `make setup` - Initial setup (install + start DB)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vistra_db?sslmode=disable
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## License

Private project for Vistra takehome exam.

