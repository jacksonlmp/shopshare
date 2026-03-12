.PHONY: help db db-stop db-restart db-logs down backend app dev dev-setup fix-linux-linker

# Default target
help:
	@echo ""
	@echo "ShopShare — available commands:"
	@echo ""
	@echo "  make db          Start PostgreSQL container"
	@echo "  make db-stop     Stop PostgreSQL container"
	@echo "  make db-restart  Restart PostgreSQL container"
	@echo "  make db-logs     Tail PostgreSQL container logs"
	@echo "  make down        Stop and remove all containers"
	@echo "  make backend     Start Dart Frog dev server (port 8080)"
	@echo "  make app         Run Flutter app on Linux desktop"
	@echo "  make dev         Start DB + backend + app (sequential, one terminal)"
	@echo "  make dev-setup   Install all dependencies (backend + app)"
	@echo ""

# ── Database ─────────────────────────────────────────────────────────────────

db:
	docker compose up -d
	@echo "PostgreSQL is up at localhost:5432 (db: shopshare, user: shopuser)"

db-stop:
	docker compose stop

db-restart:
	docker compose restart postgres
	@echo "PostgreSQL restarted."

db-logs:
	docker compose logs -f postgres

down:
	docker compose down
	@echo "All containers stopped and removed."

# ── Backend ───────────────────────────────────────────────────────────────────

backend:
	@export PATH="$$PATH:$$HOME/.pub-cache/bin"; \
	cd backend && dart_frog dev

# ── App ───────────────────────────────────────────────────────────────────────

app:
	cd app && flutter run -d linux

# Only needed if Flutter was installed via snap (snap ships without lld).
# The official tarball install does not require this.
fix-linux-linker:
	@mkdir -p $(HOME)/.flutter-cc
	@printf '#!/bin/sh\nexec /snap/flutter/current/usr/bin/clang++ "$$@"\n' \
		> $(HOME)/.flutter-cc/clang++ && chmod +x $(HOME)/.flutter-cc/clang++
	@printf '#!/bin/sh\nexec /snap/flutter/current/usr/bin/clang "$$@"\n' \
		> $(HOME)/.flutter-cc/clang && chmod +x $(HOME)/.flutter-cc/clang
	@ln -sf /usr/bin/ar $(HOME)/.flutter-cc/ar
	@ln -sf /usr/bin/ar $(HOME)/.flutter-cc/llvm-ar
	@ln -sf /usr/bin/ld $(HOME)/.flutter-cc/ld
	@echo "✓ Linker wrapper ready at $(HOME)/.flutter-cc — run with: PATH=$(HOME)/.flutter-cc:$$PATH make app"

# ── Dev (all-in-one) ─────────────────────────────────────────────────────────

dev: db
	@echo "→ Starting backend in background (logs: backend.log)..."
	@export PATH="$$PATH:$$HOME/.pub-cache/bin"; \
	cd "$(CURDIR)/backend" && dart_frog dev > "$(CURDIR)/backend.log" 2>&1 & \
	echo "→ Waiting for backend on port 8080..."; \
	until curl -sf http://localhost:8080 > /dev/null 2>&1; do sleep 1; done; \
	echo "✓ Backend is up. Starting Flutter app..."; \
	cd "$(CURDIR)/app" && flutter run -d linux

# ── Setup ────────────────────────────────────────────────────────────────────

dev-setup:
	@echo "→ Installing backend dependencies..."
	cd backend && dart pub get
	@echo "→ Installing app dependencies..."
	cd app && flutter pub get
	@echo "Done! Run 'make db' then 'make backend' and 'make app' in separate terminals."
