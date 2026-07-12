# Makefile for Docker Compose

PROJECT_NAME=online-cinema

up:
	docker compose -p $(PROJECT_NAME) up -d

down:
	docker compose -p $(PROJECT_NAME) down

restart:
	docker compose -p $(PROJECT_NAME) down
	docker compose -p $(PROJECT_NAME) up -d

logs:
	docker compose -p $(PROJECT_NAME) logs -f

logs-hate-speech-detector:
	docker compose -p $(PROJECT_NAME) logs -f hate-speech-detector

ps:
	docker compose -p $(PROJECT_NAME) ps

build:
	docker compose -p $(PROJECT_NAME) build

rebuild-backend:
	docker compose -p $(PROJECT_NAME) down backend
	docker compose -p $(PROJECT_NAME) up --build -d backend

rebuild-hate-speech-detector:
	docker compose -p $(PROJECT_NAME) down hate-speech-detector
	docker compose -p $(PROJECT_NAME) up --build -d hate-speech-detector

rebuild:
	docker compose -p $(PROJECT_NAME) down
	docker compose -p $(PROJECT_NAME) up --build -d

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

ssh-hate-speech-detector:
	docker exec -it online-cinema-hate-speech-detector bash

create-migration-backend:
	docker exec -it online-cinema-backend npm run migration:create --name=$(NAME)
	$(MAKE) fix-migration-permissions

run-migration-backend:
	docker exec -it online-cinema-backend npm run migration:run
	
run-migration-rollback-backend:
	docker exec -it online-cinema-backend npm run migration:revert

fix-migration-permissions:
	docker exec -it online-cinema-backend find src/migrations -maxdepth 1 -type f -exec chmod 666 {} +

# --- Production targets (uses docker-compose.yaml + docker-compose.prod.yaml) ---

COMPOSE_PROD=-f docker-compose.yaml -f docker-compose.prod.yaml -p $(PROJECT_NAME)

up-prod:
	docker compose $(COMPOSE_PROD) up -d

down-prod:
	docker compose $(COMPOSE_PROD) down

restart-prod:
	docker compose $(COMPOSE_PROD) down
	docker compose $(COMPOSE_PROD) up -d

rebuild-prod:
	docker compose $(COMPOSE_PROD) down
	docker compose $(COMPOSE_PROD) up -d --build

logs-prod:
	docker compose $(COMPOSE_PROD) logs -f

ps-prod:
	docker compose $(COMPOSE_PROD) ps

build-frontend:
	docker compose $(COMPOSE_PROD) run --rm frontend-builder

run-migration-prod:
	docker exec -it online-cinema-backend npm run migration:run

run-migration-rollback-prod:
	docker exec -it online-cinema-backend npm run migration:revert
