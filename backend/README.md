# ShopShare Django Backend (Migration)

This folder contains the Django backend running through Docker Compose.

## Quick start

1. Install dependencies:

```bash
make build
```

2. Run migrations:

```bash
make migrate
```

3. Run server:

```bash
make up
```

4. See backend logs:

```bash
make backend-logs
```

## Endpoints (initial scaffold)

- `GET /health/`
- `POST /api/users/` — criar usuário anônimo (`display_name`, `avatar_emoji`, `device_token` opcional)
- `GET /api/users/me/` — usuário atual (header `X-User-Id`)
- `POST /api/lists`
- `POST /api/items`
- `GET /api/schema/` — OpenAPI schema (JSON)
- `GET /api/schema/swagger-ui/` — Swagger UI (Phase 3)
- `GET /api/docs/` — alias da Swagger UI (compatibilidade)

## Notes

- Uses PostgreSQL connection settings from environment variables.
- Current WebSocket layer is scaffold-ready through Channels ASGI entrypoint.
