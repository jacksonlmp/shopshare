# ShopShare — Development Roadmap

## What is ShopShare?

ShopShare is a **real-time shared shopping list mobile app**. The core idea is simple: families and groups can create a shopping list, share it with a 6-character code, and see everyone's updates instantly — no complicated sign-up required.

A user opens the app, picks a name and an emoji avatar, creates or joins a list with a short code, and starts adding items. When someone at the supermarket checks off "Milk", everyone else in the group sees it crossed out in real time. The app works offline too, showing cached data when there's no signal and syncing automatically when the connection is restored.

**The stack:**
- **Backend:** Django + Django REST Framework + Django Channels (WebSocket)
- **Database:** PostgreSQL
- **Mobile App:** React Native (iOS + Android)
- **Real-time:** WebSocket via Django Channels + Redis channel layer
- **Infrastructure:** Docker + docker-compose

Design: https://stitch.withgoogle.com/projects/515881793632764729?pli=1

---

## Phase 1 — Repository & Environment

> Goal: have the monorepo set up, both projects running locally, and the database reachable.

- [ ] Create the GitHub repository (`shopshare`)
- [ ] Initialize with a `README.md` and a `.gitignore` for Python and Node
- [ ] Create the monorepo folder structure at the root:
  - [ ] `backend/` — Django project
  - [ ] `app/` — React Native project
- [ ] Install Python 3.12+ and create a virtual environment inside `backend/`
- [ ] Install Django and project dependencies via `pip`:
  - [ ] `django`, `djangorestframework`, `channels`, `channels-redis`
  - [ ] `psycopg2-binary`, `python-decouple`, `drf-spectacular`
- [ ] Create the Django project inside `backend/` with `django-admin startproject core .`
- [ ] Verify the Django server runs with `python manage.py runserver`
- [ ] Install Node.js 20+ and initialize the React Native project inside `app/`:
  - [ ] Run `npx @react-native-community/cli init ShopShare`
  - [ ] Verify the app launches on an Android emulator or iOS simulator
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
- [ ] Install `drf-spectacular` and configure the auto-generated docs at `/api/schema/swagger-ui/`
- [x] Create a global `api/` URL prefix in `core/urls.py`
- [ ] Create a custom exception handler that returns a consistent JSON error format:
  ```json
  { "error": "Description", "code": "ERROR_CODE" }
  ```
- [x] Add CORS headers (install `django-cors-headers`) for development

### Users
- [ ] `POST /api/users/` — create anonymous user
  - [ ] Accepts `display_name`, `avatar_emoji`, `device_token`
  - [ ] Returns the created user with status 201
- [ ] `GET /api/users/me/` — fetch user by ID (passed via `X-User-Id` header)

### Lists
- [ ] `POST /api/lists/` — create a new list
  - [x] Auto-generate a unique `share_code`
  - [x] Insert the creator as a `ListMember` with role `owner` in the same transaction
- [ ] `GET /api/lists/{id}/` — fetch list details with members and items
- [ ] `POST /api/lists/join/` — join a list via `share_code`
  - [ ] Validate that the user is not already a member
  - [ ] Insert with role `member`
- [ ] `PATCH /api/lists/{id}/` — rename or archive a list (owner only)
- [ ] `GET /api/lists/` — list all lists the current user belongs to

### Items
- [ ] `POST /api/lists/{list_id}/items/` — add an item
  - [ ] Validate that the user is a member before inserting
  - [ ] Update or create a record in `ItemHistory` incrementing `times_added`
- [ ] `PATCH /api/items/{id}/check/` — check or uncheck an item
  - [ ] Set `checked_by` and `checked_at` when checking; null both when unchecking
- [ ] `PATCH /api/items/{id}/` — edit item details (name, quantity, note)
- [ ] `DELETE /api/items/{id}/` — delete an item (only `added_by` or list owner)
- [ ] `GET /api/lists/{list_id}/suggestions/` — return top 10 frequent items from `ItemHistory`

### Validation & permissions
- [ ] Create a `IsMember` DRF permission class that checks `ListMember` before any write
- [ ] Create a `IsOwner` DRF permission class for owner-only actions
- [ ] All write endpoints must validate the `X-User-Id` header and return 403 if membership check fails

### Testing
- [ ] Test the full flow in Postman/Insomnia:
  - [ ] Create user → create list → join list with a second user → add items → check items
- [ ] Confirm `ItemHistory` is updated correctly after adding items

---

## Phase 4 — WebSocket (Real-time)

> Goal: changes made by one member appear instantly on all other connected devices.

### Backend setup
- [ ] Install and configure `channels` and `channels-redis` in `INSTALLED_APPS`
- [ ] Set `ASGI_APPLICATION = 'core.asgi.application'` in `settings.py`
- [ ] Configure the channel layer in `settings.py`:
  ```python
  CHANNEL_LAYERS = {
      "default": {
          "BACKEND": "channels_redis.core.RedisChannelLayer",
          "CONFIG": { "hosts": [REDIS_URL] },
      }
  }
  ```
- [ ] Update `core/asgi.py` to route HTTP to Django and WebSocket to the consumer
- [ ] Verify Redis is running and reachable from Django

### Consumer
- [ ] Create `lists/consumers.py` with a `ListConsumer(AsyncWebsocketConsumer)`:
  - [ ] `connect()`: validate membership, add to channel group `list_{list_id}`, accept connection
  - [ ] `disconnect()`: remove from channel group
  - [ ] `receive()`: parse incoming JSON event and route to the correct handler
- [ ] Add the WebSocket URL pattern to `core/routing.py`:
  ```
  ws://host/ws/lists/{list_id}/?user_id={user_id}
  ```

### Broadcast events
- [ ] After `POST /items/` succeeds, broadcast `item.added` to the list group
- [ ] After `PATCH /items/check/` succeeds, broadcast `item.checked` to the list group
- [ ] After `DELETE /items/` succeeds, broadcast `item.deleted` to the list group
- [ ] After `POST /lists/join/` succeeds, broadcast `member.joined` to the list group
- [ ] Broadcast must exclude the originating user (no echo)

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

## Phase 5 — React Native App

> Goal: all screens built, connected to the API and WebSocket, with working real-time sync.

### Setup & dependencies
- [ ] Install project dependencies:
  - [x] `axios` — HTTP client
  - [x] `@react-navigation/native` + `@react-navigation/native-stack` — navigation
  - [x] `zustand` — state management
  - [x] `@react-native-async-storage/async-storage` — local persistence
  - [ ] `react-native-websocket` or native `WebSocket` API — real-time
  - [ ] `react-native-mmkv` (optional) — faster local storage alternative
- [ ] Create the base folder structure inside `app/src/`:
  - [ ] `api/` — Axios instance and request functions
  - [ ] `screens/` — screen components
  - [ ] `components/` — reusable UI components
  - [ ] `store/` — Zustand stores
  - [ ] `hooks/` — custom hooks
  - [ ] `navigation/` — navigator and route definitions
  - [ ] `constants/` — colors, spacing, WS event names

### API layer
- [ ] Create `api/client.js` with an Axios instance pointing to the backend base URL
- [ ] Add a request interceptor that injects the `X-User-Id` header from AsyncStorage
- [ ] Create individual service files: `usersApi.js`, `listsApi.js`, `itemsApi.js`

### State management (Zustand)
- [ ] Create `store/userStore.js` — current user (id, name, emoji)
- [ ] Create `store/listStore.js` — active list data (members, items)
- [ ] Create `store/uiStore.js` — loading states, error messages

### Navigation
- [ ] Configure `NavigationContainer` in `App.js`
- [ ] Create a `RootNavigator` that checks AsyncStorage on launch:
  - [ ] No `user_id` stored → navigate to `OnboardingScreen`
  - [ ] `user_id` exists → navigate to `HomeScreen`
- [ ] Define screens: `Onboarding`, `Home`, `List`

### Screens
- [ ] **OnboardingScreen**
  - [x] Text input for display name
  - [x] Emoji picker (grid of selectable emojis)
  - [x] On confirm: call `POST /api/users/`, save `user_id` to AsyncStorage, navigate to Home
- [ ] **HomeScreen**
  - [ ] List of groups the user already belongs to
  - [ ] Button "New list" → modal with name input → call `POST /api/lists/`
  - [ ] Input "Enter with code" → 6-character field → call `POST /api/lists/join/`
  - [ ] Navigate to `ListScreen` after creating or joining
- [ ] **ListScreen**
  - [ ] Header with list name, share code (copy button), and member avatars
  - [ ] Items grouped by category, each with a checkbox
  - [ ] Checkbox tap → optimistic update → call `PATCH /api/items/{id}/check/`
  - [ ] Swipe to delete item → call `DELETE /api/items/{id}/`
  - [ ] FAB (floating button) → open `AddItemSheet`
- [ ] **AddItemSheet** (bottom sheet)
  - [ ] Fields: item name, quantity, unit (dropdown), category (chip selector), optional note
  - [ ] Suggestions row showing frequent items from `GET /api/lists/{id}/suggestions/`
  - [ ] On confirm: call `POST /api/lists/{id}/items/`

### WebSocket integration
- [ ] Create `hooks/useListSync.js` that:
  - [ ] Connects to `ws://host/ws/lists/{listId}/?user_id={userId}` when the screen mounts
  - [ ] Disconnects when the screen unmounts
  - [ ] Implements exponential backoff reconnection (1s → 2s → 4s → up to 60s)
  - [ ] Parses incoming events and updates the Zustand `listStore` accordingly:
    - [ ] `item.added` → append item to the list
    - [ ] `item.checked` → update `is_checked` on the matching item
    - [ ] `item.deleted` → remove item from the list
    - [ ] `member.joined` → add new member to the members list
- [ ] Apply `useListSync` in `ListScreen`

### Offline support
- [ ] Cache list data to AsyncStorage every time the listStore updates
- [ ] On screen load, show cached data immediately while the API fetch is in progress
- [ ] Display a "No connection" banner when the device is offline

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
- [ ] Update the Axios `baseURL` and WebSocket URL in the app to point to production
- [ ] Build the Android APK: `npx react-native build-android --mode=release`
- [ ] Install the APK on a physical device and test the full flow end-to-end

---

*Version: 2.0 | Stack: Django + React Native | Updated: March 2026*
