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
- **Items** (membro da lista; header `X-User-Id`):
  - `POST /api/lists/{list_id}/items/` — adicionar item
  - `PATCH /api/items/{item_id}/check/` — marcar/desmarcar
  - `PATCH /api/items/{item_id}/` — editar
  - `DELETE /api/items/{item_id}/` — autor do item ou dono da lista
  - `GET /api/lists/{list_id}/suggestions/` — sugestões (`ItemHistory`)
- `GET /api/schema/` — OpenAPI schema (JSON)
- `GET /api/schema/swagger-ui/` — Swagger UI (Phase 3)
- `GET /api/docs/` — alias da Swagger UI (compatibilidade)

## Automated tests (Phase 3)

From the repo root (requires Docker Compose + Postgres for the test DB):

```bash
make test
```

Or:

```bash
docker compose run --rm backend python manage.py test apps.users apps.lists apps.items
```

Coverage includes: user create / `me`, lists CRUD + join + owner patch, items add / check / patch / delete / suggestions, `ItemHistory` increments, and an end-to-end flow (two users → list → join → item → check).

Manual checks in Postman/Insomnia are optional; use header `X-User-Id` with a user UUID from `POST /api/users/`.

## Lint (flake8 + Black + isort)

From the repo root:

```bash
make lint
```

Runs, inside Docker: **flake8** (estilo e checagens), **Black** (`--check`, formatação), **isort** (`--check`, ordem de imports). Dependências em `requirements-dev.txt`; config em `.flake8` e `pyproject.toml`.

Para aplicar formatação automaticamente:

```bash
make format
```

## Notes

- Uses PostgreSQL connection settings from environment variables.
- Current WebSocket layer is scaffold-ready through Channels ASGI entrypoint.
