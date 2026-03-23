# ShopShare

ShopShare is a **responsive web** product (SaaS-style UX): shared shopping lists with a Django API and a **React (Vite + TypeScript)** single-page app. There are **no in-app purchases** in this codebase.

## Repository structure

| Folder | Description |
|--------|-------------|
| `backend/` | Django + DRF + Channels (Docker) |
| `frontend/` | React SPA (Vite + TypeScript) |

## Quick start

```bash
# 1) Install frontend deps (once)
make frontend-setup

# 2) Build images and run migrations
make dev-setup

# 3) Run backend (Docker) + Vite on your machine (hot reload)
make dev
```

- **API:** http://localhost:8000  
- **App:** http://localhost:5173  
- **Health:** http://localhost:8000/health/

Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env` if you need to override `VITE_API_BASE_URL`.

### Full stack in Docker only

```bash
make build
make up
```

Opens the same URLs; the `frontend` service runs Vite inside Docker (see [`docker-compose.yml`](docker-compose.yml)).

## Useful commands

| Command | Description |
|---------|-------------|
| `make up` | Start backend, Postgres, Redis, and frontend (Vite) containers |
| `make down` | Stop containers |
| `make migrate` | Django migrations in Docker |
| `make test` | Backend API tests |
| `make lint` / `make format` | Backend Python lint / format |
| `make frontend` | Local Vite dev server |
| `make frontend-build` | Production build of the SPA (`frontend/dist`) |
| `make frontend-lint` / `make frontend-format` | Frontend ESLint / Prettier |

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for details.

## Roadmap

Product and technical notes live in [`shopshare_roadmap.md`](shopshare_roadmap.md).
