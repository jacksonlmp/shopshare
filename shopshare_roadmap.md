# ShopShare — Development Roadmap

## What is ShopShare?

ShopShare is a **real-time shared shopping list web app** (responsive for phones and desktops). The core idea is simple: families and groups can create a shopping list, share it with a 6-character code, and see everyone's updates instantly — no complicated sign-up required.

A user opens the site, picks a name and an emoji avatar, creates or joins a list with a short code, and starts adding items. When someone at the supermarket checks off "Milk", everyone else in the group sees it crossed out in real time. Offline-friendly behaviour (cache + sync) is a roadmap goal.

**The stack:**
- **Backend:** Django + Django REST Framework + Django Channels (WebSocket)
- **Database:** PostgreSQL
- **Frontend:** React (Vite + TypeScript) SPA
- **Real-time:** WebSocket via Django Channels + Redis channel layer
- **Infrastructure:** Docker + docker-compose

Design: https://stitch.withgoogle.com/projects/515881793632764729?pli=1

---

## Phase 1 — Repository & Environment

> Goal: have the monorepo set up, both projects running locally, and the database reachable.

- [x] Create the GitHub repository (`shopshare`)
- [x] Initialize with a `README.md` and a `.gitignore` for Python and Node
- [x] Create the monorepo folder structure at the root:
  - [x] `backend/` — Django project
  - [x] `frontend/` — React (Vite) web app
- [x] Install Python 3.12+ and create a virtual environment inside `backend/`
- [x] Install Django and project dependencies via `pip`:
- [ ] Create `docker-compose.yml` at the root with:
  - [x] `postgres:16` service with `POSTGRES_DB=shopshare`, user and password
  - [ ] `redis:7` service (required for Django Channels)
  - [ ] Verify both containers start with `docker compose up -d`
- [ ] Create `.env` inside `backend/` with:
  - [ ] `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`
- [ ] Create `.env.example` with variable names only (no values) and commit it
- [ ] Add `.env` and `__pycache__/` to `.gitignore`
- [ ] Connect Django to PostgreSQL and run `python manage.py migrate` successfully

---

## Phase 2 — Database & Models

> Goal: all tables defined as Django models, migrations applied, and basic queries working.

- [x] Create the `users` Django app: `python manage.py startapp users`
- [x] Define the `User` model (extending `AbstractUser` or as a standalone model):
  - [x] Fields: `id` (uuid string), `display_name`, `avatar_emoji`, `device_token`, `created_at`
  - [ ] (Optional) `AUTH_USER_MODEL = 'users.User'` in `settings.py` (not required for this Phase 2 scaffold)
- [x] Create the `lists` Django app: `python manage.py startapp lists`
- [x] Define the `ShoppingList` model:
  - [x] Fields: `id` (uuid string), `name`, `share_code` (6-char unique), `owner` (FK → User), `is_archived`, `created_at`, `updated_at`
  - [x] Add a `save()` override or `pre_save` signal to auto-generate `share_code`
- [x] Define the `ListMember` model (join table):
  - [x] Fields: `list` (FK), `user` (FK), `role` (choices: `owner` / `member`), `joined_at`
  - [x] Add `unique_together = [('list', 'user')]`
- [x] Define the `Category` model:
  - [x] Fields: `id`, `name`, `emoji`, `color_hex`
  - [x] Create a data migration to seed default categories (Fruits, Dairy, Meat, Cleaning, etc.)
- [x] Define the `Item` model:
  - [x] Fields: `id` (uuid string), `list` (FK), `added_by` (FK → User), `category` (FK, nullable), `name`, `quantity`, `unit` (nullable), `note` (nullable), `is_checked`, `checked_by` (FK nullable), `checked_at` (nullable), `sort_order`, `created_at`
- [x] Define the `ItemHistory` model:
  - [x] Fields: `id`, `list` (FK), `item_name`, `category` (FK), `times_added`, `last_used_at`
- [x] Generate and apply all migrations:
  - [x] `python manage.py makemigrations`
  - [x] `python manage.py migrate`
- [x] Register all models in `admin.py` for each app
- [x] Manually test CRUD operations via Django shell (`python manage.py shell`)

---

## Phase 3 — REST API

> Goal: all endpoints implemented, validated, and manually tested via Postman or Insomnia.

### Setup
- [x] Install and configure `djangorestframework` in `INSTALLED_APPS`
- [x] Install `drf-spectacular` and configure the auto-generated docs at `/api/schema/swagger-ui/`
- [x] Create a global `api/` URL prefix in `core/urls.py`
- [x] Create a custom exception handler that returns a consistent JSON error format:
  ```json
  { "error": "Description", "code": "ERROR_CODE" }
  ```
- [x] Add CORS headers (install `django-cors-headers`) for development

### Users
- [x] `POST /api/users/` — create anonymous user
  - [x] Accepts `display_name`, `avatar_emoji`, `device_token`
  - [x] Returns the created user with status 201
- [x] `GET /api/users/me/` — fetch user by ID (passed via `X-User-Id` header)

### Lists
- [x] `POST /api/lists/` — create a new list
  - [x] Auto-generate a unique `share_code`
  - [x] Insert the creator as a `ListMember` with role `owner` in the same transaction
- [x] `GET /api/lists/{id}/` — fetch list details with members and items
- [x] `POST /api/lists/join/` — join a list via `share_code`
  - [x] Validate that the user is not already a member
  - [x] Insert with role `member`
- [x] `PATCH /api/lists/{id}/` — rename or archive a list (owner only)
- [x] `GET /api/lists/` — list all lists the current user belongs to

### Items
- [x] `POST /api/lists/{list_id}/items/` — add an item
  - [x] Validate that the user is a member before inserting
  - [x] Update or create a record in `ItemHistory` incrementing `times_added`
- [x] `PATCH /api/items/{id}/check/` — check or uncheck an item
  - [x] Set `checked_by` and `checked_at` when checking; null both when unchecking
- [x] `PATCH /api/items/{id}/` — edit item details (name, quantity, note)
- [x] `DELETE /api/items/{id}/` — delete an item (only `added_by` or list owner)
- [x] `GET /api/lists/{list_id}/suggestions/` — return top 10 frequent items from `ItemHistory`

### Validation & permissions
- [x] Create a `IsMember` DRF permission class that checks `ListMember` before any write
- [x] Create a `IsOwner` DRF permission class for owner-only actions
- [x] All write endpoints must validate the `X-User-Id` header and return 403 if membership check fails

### Testing
- [x] Test the full flow in Postman/Insomnia **or** via automated tests (`make test`):
  - [x] Create user → create list → join list with a second user → add items → check items
- [x] Confirm `ItemHistory` is updated correctly after adding items
- [x] Create unit tests for each endpoint that was implemented (`apps/users`, `apps/lists`, `apps/items` + integration flow in `apps/users/tests/test_integration_phase3.py`)

---

## Phase 4 — WebSocket (Real-time)

> Goal: changes made by one member appear instantly on all other connected devices.

### Backend setup
- [x] Install and configure `channels` and `channels-redis` in `INSTALLED_APPS` (+ `daphne` for ASGI server)
- [x] Set `ASGI_APPLICATION = 'config.asgi.application'` in `settings.py` (repo uses `config/`, not `core/`)
- [x] Configure the channel layer in `settings.py` (Redis via `REDIS_URL` in Docker; `InMemoryChannelLayer` when unset — e.g. tests)
- [x] Update `config/asgi.py` to route HTTP to Django and WebSocket to `URLRouter(websocket_urlpatterns)`
- [x] Verify Redis is running and reachable from Django (`redis` service in `docker-compose.yml`, `depends_on` + healthcheck)

### Consumer
- [x] Create `apps/lists/consumers.py` with a `ListConsumer(AsyncWebsocketConsumer)`:
  - [x] `connect()`: validate membership, add to channel group `list_{list_id}`, accept connection
  - [x] `disconnect()`: remove from channel group
  - [x] `receive()`: parse incoming JSON event (optional `event: ping` → `pong`)
- [x] Add the WebSocket URL pattern to `config/routing.py`:
  ```
  ws://host/ws/lists/{list_id}/?user_id={user_id}
  ```

### Broadcast events
- [x] After `POST /items/` succeeds, broadcast `item.added` to the list group
- [x] After `PATCH /items/check/` succeeds, broadcast `item.checked` to the list group
- [x] After `DELETE /items/` succeeds, broadcast `item.deleted` to the list group
- [x] After `POST /lists/join/` succeeds, broadcast `member.joined` to the list group
- [x] Broadcast must exclude the originating user (no echo)

### Event format
All events must follow:
```json
{ "event": "item.added", "payload": { ... } }
```

### Testing
- [ ] Use a WebSocket client (e.g. Postman or `websocat`) to connect to two sessions simultaneously
- [ ] Add an item in one session and confirm the other session receives `item.added`
- [ ] Check an item and confirm both sessions are in sync

---

## Phase 5 — React Web App (responsive)

> Goal: responsive SPA (desktop + mobile browsers), connected to the API and WebSocket, with working real-time sync. No in-app purchases. Code lives in `frontend/` (Vite + TypeScript).

### Setup & dependencies
- [x] Install project dependencies (`frontend/package.json`): `axios`, `react-router-dom`, `zustand`, Vite + React + TypeScript
- [x] `localStorage` — persist `user_id` / profile (replaces AsyncStorage)
- [ ] Browser `WebSocket` API — real-time (see hooks below)
- [x] Base folder structure under `frontend/src/`:
  - [x] `api/` — Axios client + `X-User-Id` interceptor
  - [x] `pages/` — routed screens
  - [ ] `components/` — reusable UI (expand as features land)
  - [x] `store/` — Zustand session store
  - [ ] `hooks/` — custom hooks (e.g. `useListSync`)
  - [ ] `constants/` — WS event names, spacing (optional)

### API layer
- [x] Axios instance with `VITE_API_BASE_URL` (`frontend/src/api/client.ts`)
- [x] Request interceptor: `X-User-Id` from `localStorage` when present
- [ ] Service modules: `usersApi`, `listsApi`, `itemsApi` (optional split from inline calls)

### State management (Zustand)
- [x] Session store — current user (id, name, emoji)
- [ ] `listStore` — active list data (members, items)
- [ ] `uiStore` — loading / errors

### Navigation
- [x] `BrowserRouter` + routes: bootstrap from `localStorage`, `/login` vs `/`
- [ ] Additional routes: `List` / list detail

### Screens
- [x] **Login (apelido + avatar)** — `POST /api/users/` → `localStorage` → Home (`/login`)
- [ ] **Home** — lists the user belongs to; create list; join by code
- [ ] **List** — items, check, delete, add item, suggestions
- [ ] Responsive layout (CSS; mobile-first)

### WebSocket integration
- [ ] Create `hooks/useListSync.ts` that:
  - [ ] Connects to `ws(s)://host/ws/lists/{listId}/?user_id={userId}` (use `src/utils/wsUrl.ts`)
  - [ ] Disconnects on unmount
  - [ ] Exponential backoff reconnection (1s → … → 60s cap)
  - [ ] Dispatch events into `listStore`: `item.added`, `item.checked`, `item.deleted`, `member.joined`
- [ ] Use `useListSync` on the list page

### Offline support
- [ ] Cache list data (e.g. `localStorage` or IndexedDB) when `listStore` updates
- [ ] Stale-while-revalidate on load
- [ ] Offline banner (`navigator.onLine` / events)

---

## Phase 6 — Polish & Deploy

> Goal: the app is stable, the backend is containerized, and both are running in production.

- [ ] Add global error handling in the API layer — show a toast on network failure
- [ ] Add pull-to-refresh on `ListScreen`
- [ ] Add empty state illustrations (no items yet, no lists yet)
- [ ] Add a loading skeleton while the list is fetching for the first time
- [ ] Create `Dockerfile` for the Django backend (multi-stage: build + slim runtime)
- [ ] Add the `backend` service to `docker-compose.yml` alongside Postgres and Redis
- [ ] Run `collectstatic` and configure Django to serve static files properly
- [ ] Set `DEBUG=False` and configure `ALLOWED_HOSTS` for production
- [ ] Deploy the backend to Railway, Fly.io or a VPS:
  - [ ] Set all environment variables in the platform dashboard
  - [ ] Run migrations on deploy (`python manage.py migrate`)
  - [ ] Confirm the WebSocket endpoint is reachable (check WSS support)
- [ ] Update `VITE_API_BASE_URL` / `VITE_WS_BASE_URL` for production
- [ ] Build and deploy the SPA (`npm run build` in `frontend/`, serve `dist/` via CDN or static host)
- [ ] Smoke-test the full flow on desktop and a mobile browser

---

*Version: 2.1 | Stack: Django + React (web) | Updated: March 2026*
