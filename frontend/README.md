# ShopShare — Web frontend

React + Vite + TypeScript SPA. It talks to the Django API at `VITE_API_BASE_URL` (default `http://localhost:8000`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Typecheck + production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Environment

Copy `.env.example` to `.env` and adjust if needed:

- **`VITE_API_BASE_URL`** — REST API origin (browser must reach this host; use `http://localhost:8000` when the API is exposed on the host).
- **`VITE_WS_BASE_URL`** — optional; WebSocket origin for list sync. If omitted, it is derived from `VITE_API_BASE_URL` (`http` → `ws`, `https` → `wss`).

Helpers live in `src/utils/wsUrl.ts`.

## Local development

```bash
npm ci
npm run dev
```

Ensure the backend is running (e.g. `docker compose up -d backend postgres redis` from the repo root).

## Docker

The repo root `docker-compose.yml` includes a `frontend` service that runs `npm run dev` with `--host 0.0.0.0`. Source is bind-mounted; `node_modules` uses a named volume so run `npm ci` inside the container on first start (the compose command runs `npm ci` before `vite`).

## Structure

- `src/api/` — Axios client (`X-User-Id` from `localStorage` when present)
- `src/services/` — `localStorage` session helpers
- `src/store/` — Zustand session store
- `src/pages/` — routed screens
- `src/utils/wsUrl.ts` — WebSocket URL builder for Phase 4
