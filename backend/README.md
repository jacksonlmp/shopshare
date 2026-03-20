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
- **Lists** (sempre enviar header `X-User-Id` com o UUID do usuário):
  - `GET /api/lists/` — listas em que o usuário é membro (`my_role`: `owner` | `member`)
  - `POST /api/lists/` — criar lista (body: `name`, opcional `is_archived`; dono = `X-User-Id`)
  - `GET /api/lists/{id}/` — detalhe com `members` e `items` (só membros)
  - `POST /api/lists/join/` — entrar por código (body: `share_code`)
  - `PATCH /api/lists/{id}/` — renomear / arquivar (só o dono)
- `POST /api/items`
- `GET /api/schema/` — OpenAPI schema (JSON)
- `GET /api/schema/swagger-ui/` — Swagger UI (Phase 3)
- `GET /api/docs/` — alias da Swagger UI (compatibilidade)

## Notes

- Uses PostgreSQL connection settings from environment variables.
- Current WebSocket layer is scaffold-ready through Channels ASGI entrypoint.
