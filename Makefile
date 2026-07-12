# Makefile for Docker Compose

PROJECT_NAME=online-cinema
COMPOSE_DEV=-f docker-compose.yaml -f docker-compose.dev.yaml -p $(PROJECT_NAME)

up:
	docker compose $(COMPOSE_DEV) up -d

down:
	docker compose $(COMPOSE_DEV) down

restart:
	docker compose $(COMPOSE_DEV) down
	docker compose $(COMPOSE_DEV) up -d

logs:
	docker compose $(COMPOSE_DEV) logs -f

logs-hate-speech-detector:
	docker compose $(COMPOSE_DEV) logs -f hate-speech-detector

ps:
	docker compose $(COMPOSE_DEV) ps

build:
	docker compose $(COMPOSE_DEV) build

rebuild-backend:
	docker compose $(COMPOSE_DEV) down backend
	docker compose $(COMPOSE_DEV) up --build -d backend

rebuild-hate-speech-detector:
	docker compose $(COMPOSE_DEV) down hate-speech-detector
	docker compose $(COMPOSE_DEV) up --build -d hate-speech-detector

rebuild:
	docker compose $(COMPOSE_DEV) down
	docker compose $(COMPOSE_DEV) up --build -d

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
	docker compose $(COMPOSE_PROD) build frontend-builder
	docker compose $(COMPOSE_PROD) run --rm frontend-builder

run-migration-prod:
	docker exec -it online-cinema-backend npm run migration:run

run-migration-rollback-prod:
	docker exec -it online-cinema-backend npm run migration:revert
