.PHONY: help install dev build start lint check-unused ct \
	db-start db-stop db-restart db-status db-push db-migrate db-generate db-seed db-clean db-wipe db-reset db-studio \
	docker-destroy \
	swagger-build swagger-open \
	postman-run postman-install \
	clean setup _check-pnpm

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${BLUE}%-20s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

## Development
_check-pnpm: ## Internal: Check if pnpm is installed, install if missing
	@echo "${BLUE}Checking for pnpm...${NC}"
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "${YELLOW}⚠ pnpm is not installed. Installing pnpm...${NC}"; \
		if command -v npm >/dev/null 2>&1; then \
			echo "${BLUE}Installing pnpm via npm...${NC}"; \
			npm install -g pnpm || (echo "${RED}✗ Failed to install pnpm. Please install it manually: npm install -g pnpm${NC}" && exit 1); \
			echo "${GREEN}✓ pnpm installed successfully${NC}"; \
		elif command -v corepack >/dev/null 2>&1; then \
			echo "${BLUE}Enabling pnpm via corepack...${NC}"; \
			corepack enable && corepack prepare pnpm@latest --activate || (echo "${RED}✗ Failed to enable pnpm via corepack${NC}" && exit 1); \
			echo "${GREEN}✓ pnpm enabled via corepack${NC}"; \
		else \
			echo "${RED}✗ Neither npm nor corepack is available.${NC}"; \
			echo "${YELLOW}Please install Node.js (which includes npm) or enable corepack, then run 'make setup' again.${NC}"; \
			echo "${BLUE}Alternatively, install pnpm manually:${NC}"; \
			echo "  npm install -g pnpm"; \
			echo "  or"; \
			echo "  curl -fsSL https://get.pnpm.io/install.sh | sh -"; \
			exit 1; \
		fi; \
	else \
		echo "${GREEN}✓ pnpm is already installed${NC}"; \
	fi

install: _check-pnpm ## Install dependencies
	@echo "${BLUE}Installing dependencies...${NC}"
	pnpm install

dev: ## Start development server
	@echo "${BLUE}Starting development server...${NC}"
	pnpm dev

build: ## Build for production
	@echo "${BLUE}Building for production...${NC}"
	pnpm build

start: ## Start production server
	@echo "${BLUE}Starting production server...${NC}"
	pnpm start

lint: ## Run linter
	@echo "${BLUE}Running linter...${NC}"
	pnpm lint

check-unused: ## Check for unused code and dependencies (knip)
	@echo "${BLUE}Checking for unused code and dependencies...${NC}"
	pnpm check-unused

ct: ## Check TypeScript and React types/component errors
	@echo "${BLUE}Checking TypeScript and React types...${NC}"
	pnpm exec tsc --noEmit || (echo "${RED}✗ Type checking failed${NC}" && exit 1)
	@echo "${GREEN}✓ Type checking passed${NC}"

## Database - Basic Operations
db-start: ## Start MySQL database container
	@echo "${BLUE}Starting MySQL database...${NC}"
	@docker-compose up -d mysql
	@echo "${GREEN}Waiting for MySQL to be ready...${NC}"
	@timeout=60; \
	ready_count=0; \
	while [ $$timeout -gt 0 ]; do \
		if docker-compose exec -T mysql mysqladmin ping -h localhost -u vistra_user -pvistra_password --silent 2>/dev/null; then \
			ready_count=$$((ready_count + 1)); \
			if [ $$ready_count -ge 3 ]; then \
				echo "${GREEN}✓ MySQL is ready!${NC}"; \
				exit 0; \
			fi; \
		else \
			ready_count=0; \
		fi; \
		sleep 1; \
		timeout=$$((timeout - 1)); \
	done; \
	echo "${RED}✗ MySQL container did not become ready in time${NC}"; \
	exit 1

db-stop: ## Stop MySQL database container
	@echo "${BLUE}Stopping MySQL database...${NC}"
	@docker-compose down
	@echo "${GREEN}✓ MySQL stopped${NC}"

db-restart: db-stop db-start ## Restart MySQL database container
	@echo "${GREEN}✓ Database restarted${NC}"

db-status: ## Check MySQL database status
	@echo "${BLUE}Checking database status...${NC}"
	@if docker ps | grep -q vistra_mysql; then \
		echo "${GREEN}✓ MySQL container is running${NC}"; \
		if docker-compose exec -T mysql mysqladmin ping -h localhost -u vistra_user -pvistra_password --silent 2>/dev/null; then \
			echo "${GREEN}✓ MySQL is accepting connections${NC}"; \
		else \
			echo "${YELLOW}⚠ MySQL container running but not ready${NC}"; \
		fi; \
	else \
		echo "${RED}✗ MySQL container is not running${NC}"; \
		echo "Run 'make db-start' to start it"; \
	fi

## Database - Schema Management
db-push: db-start ## Push schema changes to database (auto-confirms)
	@echo "${BLUE}Pushing schema to database...${NC}"
	@$(MAKE) _db-push

_db-push: ## Internal: Push schema (non-interactive, uses --force flag)
	@echo "${BLUE}Pushing schema (non-interactive, auto-approving)...${NC}"
	@retries=3; \
	while [ $$retries -gt 0 ]; do \
		if pnpm db:push:force 2>&1; then \
			echo "${GREEN}✓ Schema pushed successfully${NC}"; \
			exit 0; \
		fi; \
		retries=$$((retries - 1)); \
		if [ $$retries -gt 0 ]; then \
			echo "${YELLOW}⚠ Schema push failed, retrying in 5 seconds... ($$retries attempts left)${NC}"; \
			sleep 5; \
			echo "${BLUE}Verifying MySQL connection...${NC}"; \
			timeout=15; \
			while [ $$timeout -gt 0 ]; do \
				if docker-compose exec -T mysql mysqladmin ping -h localhost -u vistra_user -pvistra_password --silent 2>/dev/null; then \
					echo "${GREEN}✓ MySQL connection verified${NC}"; \
					break; \
				fi; \
				sleep 1; \
				timeout=$$((timeout - 1)); \
			done; \
		fi; \
	done; \
	echo "${RED}✗ Failed to push schema after multiple attempts${NC}"; \
	exit 1

db-generate: ## Generate migration files from schema changes
	@echo "${BLUE}Generating migration files...${NC}"
	pnpm db:generate
	@echo "${GREEN}✓ Migration files generated${NC}"

db-migrate: db-start ## Run database migrations
	@echo "${BLUE}Running migrations...${NC}"
	pnpm db:migrate || (echo "${RED}Failed to run migrations${NC}" && exit 1)
	@echo "${GREEN}✓ Migrations completed${NC}"

## Database - Data Management
db-seed: ## Seed database with initial data
	@echo "${BLUE}Verifying MySQL connection before seeding...${NC}"
	@timeout=15; \
	while [ $$timeout -gt 0 ]; do \
		if docker-compose exec -T mysql mysqladmin ping -h localhost -u vistra_user -pvistra_password --silent 2>/dev/null; then \
			break; \
		fi; \
		sleep 1; \
		timeout=$$((timeout - 1)); \
	done; \
	if [ $$timeout -eq 0 ]; then \
		echo "${RED}✗ MySQL is not ready. Run 'make db-start' first.${NC}"; \
		exit 1; \
	fi
	@echo "${BLUE}Seeding database...${NC}"
	@docker-compose exec -T mysql mysql -uvistra_user -pvistra_password vistra_db < database/seeds/seed.sql 2>/dev/null || \
	 docker exec vistra_mysql mysql -uvistra_user -pvistra_password vistra_db < database/seeds/seed.sql 2>/dev/null || \
	 (echo "${RED}Error: Failed to seed database. Is the container running? Run 'make db-start' first.${NC}" && exit 1)
	@echo "${GREEN}✓ Database seeded successfully${NC}"

db-clean: ## Drop all tables from database (with confirmation)
	@echo "${YELLOW}⚠️  WARNING: This will drop ALL tables from the database!${NC}"
	@read -p "Are you sure you want to continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "${BLUE}Cancelled.${NC}"; \
		exit 1; \
	fi
	@$(MAKE) _db-drop-tables

_db-drop-tables: ## Internal: Drop all tables (no confirmation)
	@echo "${BLUE}Dropping all tables...${NC}"
	@docker-compose exec -T mysql mysql -uvistra_user -pvistra_password vistra_db -e "SET FOREIGN_KEY_CHECKS = 0; \
		DROP TABLE IF EXISTS file_shares, files, activities, user_permissions, user_roles, role_permissions, permissions, roles, users;" 2>/dev/null || \
	 docker exec vistra_mysql mysql -uvistra_user -pvistra_password vistra_db -e "SET FOREIGN_KEY_CHECKS = 0; \
		DROP TABLE IF EXISTS file_shares, files, activities, user_permissions, user_roles, role_permissions, permissions, roles, users;" 2>/dev/null || \
	 (echo "${YELLOW}Warning: Could not drop tables. Database may be empty.${NC}" && exit 0)
	@echo "${GREEN}✓ All tables dropped${NC}"

db-wipe: db-start ## Drop all tables and reseed database (full reset)
	@echo "${YELLOW}⚠️  WARNING: This will wipe the database and reseed it!${NC}"
	@read -p "Are you sure you want to continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "${BLUE}Cancelled.${NC}"; \
		exit 1; \
	fi
	@$(MAKE) _db-drop-tables
	@$(MAKE) _db-push
	@$(MAKE) db-seed
	@echo "${GREEN}✓ Database wiped and reseeded${NC}"

db-reset: db-stop db-start ## Restart database container
	@echo "${GREEN}✓ Database reset (stopped and started)${NC}"

## Database - Utilities
db-studio: ## Open Drizzle Studio (visual database browser)
	@echo "${BLUE}Opening Drizzle Studio...${NC}"
	@echo "${GREEN}Studio will open at http://localhost:4983${NC}"
	pnpm db:studio

## Docker - Container Management
docker-destroy: ## Stop and remove all Docker containers, volumes, and networks (destructive)
	@echo "${YELLOW}⚠️  WARNING: This will destroy all Docker containers, volumes, and networks!${NC}"
	@echo "${YELLOW}⚠️  This will permanently delete all database data!${NC}"
	@read -p "Are you sure you want to continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "${BLUE}Cancelled.${NC}"; \
		exit 1; \
	fi
	@echo "${BLUE}Stopping and removing containers...${NC}"
	@docker-compose down -v || true
	@echo "${BLUE}Removing volumes...${NC}"
	@docker volume ls -q | grep -E "(vistra|mysql_data)" | xargs docker volume rm 2>/dev/null || true
	@echo "${GREEN}✓ Docker containers, volumes, and networks destroyed${NC}"

## Swagger Documentation
swagger-build: ## Build/validate Swagger documentation
	@echo "${BLUE}Validating Swagger documentation...${NC}"
	@if [ ! -f swagger.yaml ]; then \
		echo "${RED}✗ swagger.yaml not found${NC}"; \
		exit 1; \
	fi
	@echo "${GREEN}✓ Swagger documentation is valid${NC}"
	@echo "${BLUE}Swagger spec location: ${NC}swagger.yaml"
	@echo "${BLUE}API docs will be available at: ${NC}http://localhost:3000/api-docs"

swagger-open: ## Open Swagger API documentation in browser
	@echo "${BLUE}Opening Swagger API documentation...${NC}"
	@echo "${GREEN}Documentation will open at http://localhost:3000/api-docs${NC}"
	@if command -v open >/dev/null 2>&1; then \
		open http://localhost:3000/api-docs; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open http://localhost:3000/api-docs; \
	elif command -v start >/dev/null 2>&1; then \
		start http://localhost:3000/api-docs; \
	else \
		echo "${YELLOW}⚠ Could not automatically open browser. Please visit: http://localhost:3000/api-docs${NC}"; \
	fi

# Note: Use 'make swagger-build' or 'pnpm swagger:build' (npm scripts support colons)

## Postman API Testing
postman-install: ## Install Newman CLI and HTML reporter for running Postman tests
	@echo "${BLUE}Installing Newman CLI and HTML reporter...${NC}"
	@if command -v npm >/dev/null 2>&1; then \
		npm install -g newman newman-reporter-html || (echo "${YELLOW}Note: If installation fails, try: npm install -g newman newman-reporter-html${NC}" && exit 0); \
	else \
		echo "${RED}✗ npm is not installed. Please install Node.js and npm first.${NC}"; \
		exit 1; \
	fi
	@echo "${GREEN}✓ Newman and HTML reporter installed${NC}"
	@echo "${BLUE}You can now run 'make postman-run' to execute the Postman collection${NC}"

postman-run: ## Run Postman collection tests using Newman
	@echo "${BLUE}Running Postman collection tests...${NC}"
	@if [ ! -f postman/Vistra_API.postman_collection.json ]; then \
		echo "${RED}✗ Postman collection not found at postman/Vistra_API.postman_collection.json${NC}"; \
		exit 1; \
	fi
	@if [ ! -f postman/Vistra_API.postman_environment.json ]; then \
		echo "${RED}✗ Postman environment not found at postman/Vistra_API.postman_environment.json${NC}"; \
		exit 1; \
	fi
	@if ! command -v newman >/dev/null 2>&1; then \
		echo "${YELLOW}⚠ Newman CLI not found. Installing...${NC}"; \
		$(MAKE) postman-install || (echo "${RED}✗ Failed to install Newman. Please install manually: npm install -g newman${NC}" && exit 1); \
	fi
	@echo "${BLUE}Checking if server is running...${NC}"
	@if ! curl -s http://localhost:3000/api/health/db >/dev/null 2>&1; then \
		echo "${YELLOW}⚠ Server may not be running. Starting dev server in background...${NC}"; \
		echo "${BLUE}Note: Make sure the server is running on http://localhost:3000${NC}"; \
		echo "${BLUE}You can start it with: make dev${NC}"; \
		sleep 2; \
	fi
	@newman run postman/Vistra_API.postman_collection.json \
		-e postman/Vistra_API.postman_environment.json \
		--reporters cli,html,json \
		--reporter-html-export postman/report.html \
		--reporter-json-export postman/report.json \
		--timeout-request 30000 \
		--delay-request 500 || (echo "${RED}✗ Some tests failed. Check the report at postman/report.html${NC}" && exit 1)
	@echo "${GREEN}✓ Postman tests completed${NC}"
	@echo "${BLUE}Test report saved to: postman/report.html${NC}"
	@if command -v open >/dev/null 2>&1; then \
		echo "${BLUE}Opening test report...${NC}"; \
		open postman/report.html 2>/dev/null || true; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open postman/report.html 2>/dev/null || true; \
	fi

## Cleanup
clean: ## Remove build artifacts, node_modules, and database tables (with confirmation)
	@echo "${YELLOW}⚠️  WARNING: This will remove .next, node_modules, AND all database tables!${NC}"
	@read -p "Are you sure you want to continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "${BLUE}Cancelled.${NC}"; \
		exit 1; \
	fi
	@echo "${BLUE}Cleaning build artifacts...${NC}"
	@echo "Stopping any running Next.js processes..."
	@pkill -f "next" || true
	@sleep 1
	rm -rf .next node_modules
	@echo "${GREEN}✓ Build artifacts cleaned${NC}"
	@echo "${BLUE}Dropping database tables...${NC}"
	@$(MAKE) _db-drop-tables || echo "${YELLOW}Warning: Could not drop database tables (database may not be running)${NC}"
	@echo "${GREEN}✓ Complete cleanup finished${NC}"

## Setup
setup: install _setup-env db-start db-push db-seed ## Complete setup (install + start DB + push schema + seed)
	@echo "${GREEN}"
	@echo "╔════════════════════════════════════════════════════╗"
	@echo "║     Setup complete!                                ║"
	@echo "║                                                    ║"
	@echo "║  Run 'make dev' to start the development server    ║"
	@echo "╚════════════════════════════════════════════════════╝"
	@echo "${NC}"

_setup-env: ## Internal: Setup .env.local file
	@if [ ! -f .env.local ]; then \
		echo "${BLUE}Creating .env.local from .env.example...${NC}"; \
		cp .env.example .env.local; \
		echo "${BLUE}Randomizing SESSION_SECRET...${NC}"; \
		SESSION_SECRET=$$(openssl rand -hex 32); \
		if [ -z "$$SESSION_SECRET" ]; then \
			SESSION_SECRET=$$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1); \
		fi; \
		if [ "$$(uname)" = "Darwin" ]; then \
			sed -i '' "s|^SESSION_SECRET=.*|SESSION_SECRET=$$SESSION_SECRET|" .env.local; \
		else \
			sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$$SESSION_SECRET|" .env.local; \
		fi; \
		echo "${GREEN}✓ .env.local created with randomized SESSION_SECRET${NC}"; \
	else \
		echo "${YELLOW}⚠ .env.local already exists, skipping...${NC}"; \
	fi
