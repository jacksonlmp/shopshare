# ShopShare

A real-time shared shopping list app for families and groups.

## Repository Structure

| Folder | Description |
|---|---|
| [`backend/`](backend/) | Dart Frog API server + WebSocket + PostgreSQL |
| [`app/`](app/) | Flutter mobile app (iOS & Android) |

See each folder's `README.md` for setup and development instructions.

## Quick Start

```bash
# Start the database
docker-compose up -d postgres

# Run the backend (from backend/)
dart_frog dev

# Run the app (from app/)
flutter run
```