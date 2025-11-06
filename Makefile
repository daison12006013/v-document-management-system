.PHONY: help install dev build start lint check-unused \
	db-start db-stop db-status db-push db-migrate db-generate db-seed db-clean db-wipe db-reset db-studio \
	clean setup

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
install: ## Install dependencies
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

## Database - Basic Operations
db-start: ## Start MySQL database container
	@echo "${BLUE}Starting MySQL database...${NC}"
	@docker-compose up -d mysql
	@echo "${GREEN}Waiting for MySQL to be ready...${NC}"
	@timeout=30; \
	while [ $$timeout -gt 0 ]; do \
		if docker-compose exec -T mysql mysqladmin ping -h localhost -u vistra_user -pvistra_password --silent 2>/dev/null; then \
			echo "${GREEN}✓ MySQL is ready!${NC}"; \
			exit 0; \
		fi; \
		sleep 1; \
		timeout=$$((timeout - 1)); \
	done; \
	echo "${YELLOW}MySQL container started but not fully ready yet${NC}"

db-stop: ## Stop MySQL database container
	@echo "${BLUE}Stopping MySQL database...${NC}"
	@docker-compose down
	@echo "${GREEN}✓ MySQL stopped${NC}"

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
	@pnpm db:push:force || (echo "${RED}Failed to push schema${NC}" && exit 1)
	@echo "${GREEN}✓ Schema pushed successfully${NC}"

db-generate: ## Generate migration files from schema changes
	@echo "${BLUE}Generating migration files...${NC}"
	pnpm db:generate
	@echo "${GREEN}✓ Migration files generated${NC}"

db-migrate: db-start ## Run database migrations
	@echo "${BLUE}Running migrations...${NC}"
	pnpm db:migrate || (echo "${RED}Failed to run migrations${NC}" && exit 1)
	@echo "${GREEN}✓ Migrations completed${NC}"

## Database - Data Management
db-seed: db-start ## Seed database with initial data
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
setup: install db-start db-push db-seed ## Complete setup (install + start DB + push schema + seed)
	@echo "${GREEN}"
	@echo "╔════════════════════════════════════════════════════╗"
	@echo "║     Setup complete!                                ║"
	@echo "║                                                    ║"
	@echo "║  Run 'make dev' to start the development server    ║"
	@echo "╚════════════════════════════════════════════════════╝"
	@echo "${NC}"
