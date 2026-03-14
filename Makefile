.PHONY: help build setup up stop restart logs ps down backend-logs db-logs migrate makemigrations shell mobile-setup mobile mobile-android mobile-ios mobile-web mobile-lint mobile-tunnel mobile-android-debug dev dev-setup

# Default target
help:
	@echo ""
	@echo "ShopShare — available commands:"
	@echo ""
	@echo "  make build       Build/pull Docker images"
	@echo "  make setup       Build images and run backend migrations"
	@echo "  make up          Start Docker services (backend + PostgreSQL)"
	@echo "  make stop        Stop Docker services"
	@echo "  make restart     Restart Docker services"
	@echo "  make logs        Tail Docker logs (all services)"
	@echo "  make backend-logs Tail backend logs"
	@echo "  make db-logs     Tail PostgreSQL logs"
	@echo "  make ps          Show Docker services status"
	@echo "  make down        Stop and remove all containers"
	@echo "  make migrate     Run Django migrations in Docker"
	@echo "  make makemigrations Generate Django migrations in Docker"
	@echo "  make shell       Open Django shell in Docker"
	@echo "  make mobile-setup Install Expo/React Native dependencies"
	@echo "  make mobile      Run Expo dev server"
	@echo "  make mobile-android Run Expo on Android"
	@echo "  make mobile-android-debug Run Expo Android with adb reverse (fix Metro connection)"
	@echo "  make mobile-tunnel Run Expo using tunnel mode"
	@echo "  make mobile-ios  Run Expo on iOS"
	@echo "  make mobile-web  Run Expo on Web"
	@echo "  make mobile-lint Run mobile lint checks"
	@echo "  make dev         Start Docker stack + React Native (Expo)"
	@echo "  make dev-setup   Setup Docker stack and mobile dependencies"
	@echo ""

# ── Database ─────────────────────────────────────────────────────────────────

build:
	docker compose build backend
	docker compose pull postgres
	@echo "Docker images are up to date."

setup: build migrate

up:
	docker compose up
	@echo "Backend is up at http://localhost:8000 and PostgreSQL at localhost:5432"

stop:
	docker compose stop

restart:
	docker compose restart
	@echo "Docker services restarted."

logs:
	docker compose logs -f

backend-logs:
	docker compose logs -f backend

db-logs:
	docker compose logs -f postgres

ps:
	docker compose ps

down:
	docker compose down
	@echo "All containers stopped and removed."

# ── Backend (Django via Docker) ───────────────────────────────────────────────

migrate:
	docker compose run --rm backend python manage.py migrate

makemigrations:
	docker compose run --rm backend python manage.py makemigrations

shell:
	docker compose run --rm backend python manage.py shell

# ── New Mobile (Expo + React Native) ─────────────────────────────────────────

mobile-setup:
	cd mobile && npm install

mobile:
	cd mobile && npm run start

mobile-android:
	cd mobile && npm run android

mobile-android-debug:
	adb reverse tcp:8000 tcp:8000 || true
	adb reverse tcp:8081 tcp:8081 || true
	adb reverse tcp:19000 tcp:19000 || true
	adb reverse tcp:19001 tcp:19001 || true
	cd mobile && npx expo start --android --clear

mobile-tunnel:
	cd mobile && npx expo start --tunnel

mobile-ios:
	cd mobile && npm run ios

mobile-web:
	cd mobile && npm run web

mobile-lint:
	cd mobile && npm run lint

# ── Dev (all-in-one) ─────────────────────────────────────────────────────────

dev: up
	@echo "→ Waiting for backend on port 8000..."; \
	until curl -sf http://localhost:8000/health/ > /dev/null 2>&1; do sleep 1; done; \
	echo "✓ Backend is up. Starting React Native (Expo)..."; \
	cd "$(CURDIR)/mobile" && npm run start

# ── Setup ────────────────────────────────────────────────────────────────────

dev-setup:
	@echo "→ Setting up Docker backend stack..."
	$(MAKE) setup
	@echo "→ Installing React Native dependencies..."
	cd mobile && npm install
	@echo "Done! Run 'make up' and 'make mobile' in separate terminals."
