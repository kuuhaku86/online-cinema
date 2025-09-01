# Makefile for Docker Compose

PROJECT_NAME=online-cinema

up:
	docker-compose -p $(PROJECT_NAME) up -d

down:
	docker-compose -p $(PROJECT_NAME) down

restart:
	docker-compose -p $(PROJECT_NAME) down
	docker-compose -p $(PROJECT_NAME) up -d

logs:
	docker-compose -p $(PROJECT_NAME) logs -f

ps:
	docker-compose -p $(PROJECT_NAME) ps

build:
	docker-compose -p $(PROJECT_NAME) build

rebuild-backend:
	docker-compose -p $(PROJECT_NAME) down -d backend
	docker-compose -p $(PROJECT_NAME) up --build -d backend

rebuild:
	docker-compose -p $(PROJECT_NAME) down
	docker-compose -p $(PROJECT_NAME) up --build -d

test-backend:
	@echo "Running backend tests..."
	docker exec -it online-cinema-backend npm run test

test-backend-e2e:
	@echo "Running e2e backend tests..."
	docker exec -it online-cinema-backend npm run test:e2e

ssh-backend:
	docker exec -it online-cinema-backend bash

ssh-frontend:
	docker exec -it online-cinema-frontend bash

create-migration-backend:
	docker exec -it online-cinema-backend npm run migration:create --name=$(NAME)
	$(MAKE) fix-migration-permissions

run-migration-backend:
	docker exec -it online-cinema-backend npm run migration:run
	
run-migration-rollback-backend:
	docker exec -it online-cinema-backend npm run migration:revert

fix-migration-permissions:
	docker exec -it online-cinema-backend find src/migrations -maxdepth 1 -type f -exec chmod 666 {} +
