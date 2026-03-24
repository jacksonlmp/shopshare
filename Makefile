.PHONY: help build setup up stop restart logs ps down backend-logs db-logs migrate makemigrations shell test lint format frontend-setup frontend frontend-build frontend-lint frontend-format dev dev-setup

# Default target
help:
	@echo ""
	@echo "ShopShare — available commands:"
	@echo ""
	@echo "  make build         Build backend + frontend images; pull Postgres"
	@echo "  make setup         Build images and run backend migrations"
	@echo "  make up            Start Docker services (backend, Postgres, Redis, frontend)"
	@echo "  make stop          Stop Docker services"
	@echo "  make restart       Restart Docker services"
	@echo "  make logs          Tail Docker logs (all services)"
	@echo "  make backend-logs  Tail backend logs"
	@echo "  make db-logs       Tail PostgreSQL logs"
	@echo "  make ps            Show Docker services status"
	@echo "  make down          Stop and remove all containers"
	@echo "  make migrate       Run Django migrations in Docker"
	@echo "  make makemigrations Generate Django migrations in Docker"
	@echo "  make shell         Open Django shell in Docker"
	@echo "  make seed-invite-demo  Lista demo + código INVITE (link /invite/INVITE)"
	@echo "  make test          Run Django API tests in Docker"
	@echo "  make lint          Backend: flake8 + black --check + isort --check"
	@echo "  make format        Backend: black + isort"
	@echo "  make frontend-setup  npm ci in frontend/"
	@echo "  make frontend      Run Vite dev server (host; HMR)"
	@echo "  make frontend-build  Production build of the React app"
	@echo "  make frontend-lint   ESLint on frontend/"
	@echo "  make frontend-format Prettier on frontend/"
	@echo "  make dev           Backend stack (detached) + local Vite dev server"
	@echo "  make dev-setup     Docker setup + frontend npm ci"
	@echo ""

# ── Database & stack ─────────────────────────────────────────────────────────

build:
	docker compose build backend frontend
	docker compose pull postgres redis
	@echo "Docker images are up to date."

setup: build migrate

up:
	docker compose up
	@echo "Backend: http://localhost:8000  Frontend (Vite in Docker): http://localhost:5173"

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

seed-invite-demo:
	docker compose run --rm backend python manage.py seed_invite_demo

test:
	docker compose run --rm backend python manage.py test apps.users apps.lists apps.items -v 1

lint:
	docker compose run --rm backend sh -c "pip install --no-cache-dir -q -r requirements-dev.txt && flake8 apps config manage.py && black --check apps config manage.py && isort --check apps config manage.py"

format:
	docker compose run --rm backend sh -c "pip install --no-cache-dir -q -r requirements-dev.txt && black apps config manage.py && isort apps config manage.py"

# ── Frontend (React + Vite) ───────────────────────────────────────────────────

frontend-setup:
	cd frontend && npm ci

frontend:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-format:
	cd frontend && npm run format

# ── Dev (backend in Docker + Vite on host) ───────────────────────────────────

dev:
	@echo "→ Starting backend, Postgres, Redis (detached)..."
	docker compose up -d backend postgres redis
	@echo "→ Waiting for http://localhost:8000/health/ ..."
	@until curl -sf http://localhost:8000/health/ > /dev/null 2>&1; do sleep 1; done
	@echo "✓ Backend is up. Starting Vite (http://localhost:5173)..."
	cd "$(CURDIR)/frontend" && npm run dev

dev-setup:
	@echo "→ Setting up Docker backend stack..."
	$(MAKE) setup
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm ci
	@echo "Done. Run: make dev   OR   docker compose up   (includes Vite container)"
