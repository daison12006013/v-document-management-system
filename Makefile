.PHONY: help install dev build start lint db-up db-down db-drop _db-drop db-migrate db-generate db-seed db-reset clean

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

_db-drop: ## Internal target: Drop all tables and functions from the database (no confirmation)
	@echo "Dropping all tables and functions..."
	@docker-compose exec -T postgres psql -U postgres -d vistra_db -c "DO \$$$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$$$;" || \
	 docker exec vistra_postgres psql -U postgres -d vistra_db -c "DO \$$$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$$$;" || \
	 (echo "Error: Database container must be running. Run 'make db-up' first." && exit 1)
	@docker-compose exec -T postgres psql -U postgres -d vistra_db -c "DO \$$$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT p.proname, oidvectortypes(p.proargtypes) as argtypes FROM pg_proc p INNER JOIN pg_namespace n ON p.pronamespace = n.oid LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e' WHERE n.nspname = 'public' AND d.objid IS NULL) LOOP BEGIN EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE'; EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END \$$$$;" || \
	 docker exec vistra_postgres psql -U postgres -d vistra_db -c "DO \$$$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT p.proname, oidvectortypes(p.proargtypes) as argtypes FROM pg_proc p INNER JOIN pg_namespace n ON p.pronamespace = n.oid LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e' WHERE n.nspname = 'public' AND d.objid IS NULL) LOOP BEGIN EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE'; EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END \$$$$;" || true
	@echo "All tables and functions dropped successfully!"

db-drop: ## Drop all tables and functions from the database (with confirmation)
	@echo "⚠️  WARNING: This will drop ALL tables and functions from the database!"
	@read -p "Are you sure you want to continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "Cancelled."; \
		exit 1; \
	fi
	@$(MAKE) _db-drop

db-migrate: ## Run database migrations (runs all .sql files in database/schema in ascending order)
	@echo "Running database migrations..."
	@for file in $$(ls database/schema/*.sql | sort); do \
		echo "Executing $$(basename $$file)..."; \
		docker-compose exec -T postgres psql -U postgres -d vistra_db < $$file || \
		docker exec vistra_postgres psql -U postgres -d vistra_db < $$file || \
		(echo "Error: Failed to execute $$file. Database container must be running. Run 'make db-up' first." && exit 1); \
	done
	@echo "Database migrations completed successfully!"

db-generate: ## Generate TypeScript types from SQL queries using sqlc
	(cd database && sqlc generate)

db-validate: ## Validate SQL queries using sqlc
	(cd database && sqlc compile)

db-seed: ## Seed database with initial data
	@echo "Seeding database..."
	@docker-compose exec -T postgres psql -U postgres -d vistra_db < database/seeds/seed.sql || \
	 docker exec vistra_postgres psql -U postgres -d vistra_db < database/seeds/seed.sql || \
	 (echo "Error: Database container must be running. Run 'make db-up' first." && exit 1)
	@echo "Database seeded successfully!"

db-reset: db-down db-up ## Reset database (stop and start)

clean: ## Clean build artifacts, node_modules, and drop all database tables (with confirmation)
	@echo "⚠️  WARNING: This will remove build artifacts, node_modules, AND drop ALL database tables!"
	@read -p "Are you sure you want to continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "Cancelled."; \
		exit 1; \
	fi
	@echo "Cleaning build artifacts and node_modules..."
	rm -rf .next node_modules
	@$(MAKE) _db-drop || (echo "Warning: Could not drop database tables. Database container may not be running." && true)
	@echo "Cleanup completed successfully!"

check-outdated: ## Check for outdated packages
	pnpm outdated

update-packages: ## Update all packages to latest versions
	pnpm update --latest

setup: install db-up db-migrate db-seed
	@echo "Setup complete! Run 'make dev' to start the development server."

