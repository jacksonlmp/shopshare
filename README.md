# ShopShare

ShopShare is now maintained with the following stacks only:

- Django backend in `backend/`
- React Native (Expo + TypeScript) mobile app in `mobile/`

## Repository Structure

| Folder | Description |
|---|---|
| `backend/` | Django + DRF API backend (Docker) |
| `mobile/` | React Native app with Expo |

## Quick Start

```bash
# 1) Start PostgreSQL
make up

# 2) Build images and run migrations
make dev-setup

# 3) Start mobile (backend already in Docker)
make dev
```

## Useful Commands

- `make up` — start backend and database via Docker
- `make migrate` — run Django migrations inside Docker
- `make backend-logs` — tail Django container logs
- `make mobile` — start Expo dev server
- `make mobile-android` — run Expo on Android
- `make mobile-ios` — run Expo on iOS
- `make mobile-web` — run Expo on Web