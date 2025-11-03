.PHONY: help install dev build start lint db-up db-down db-migrate db-generate db-reset clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies using pnpm
	pnpm install

dev: ## Start development server
	pnpm dev

build: ## Build for production
	pnpm build

start: ## Start production server
	pnpm start

lint: ## Run linter
	pnpm lint

db-up: ## Start PostgreSQL database
	docker-compose up -d postgres

db-down: ## Stop PostgreSQL database
	docker-compose down

db-migrate: ## Run database migrations (placeholder - implement with your migration tool)
	@echo "Run migrations here"

db-generate: ## Generate TypeScript types from SQL queries using sqlc
	sqlc generate

db-validate: ## Validate SQL queries using sqlc
	sqlc validate

db-reset: db-down db-up ## Reset database (stop and start)

clean: ## Clean build artifacts and node_modules
	rm -rf .next node_modules

check-outdated: ## Check for outdated packages
	pnpm outdated

update-packages: ## Update all packages to latest versions
	pnpm update --latest

setup: install db-up ## Initial setup: install dependencies and start database
	@echo "Setup complete! Run 'make dev' to start the development server."

