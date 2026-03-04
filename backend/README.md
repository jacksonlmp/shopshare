# ShopShare — Backend

[![Powered by Dart Frog](https://img.shields.io/endpoint?url=https://tinyurl.com/dartfrog-badge)](https://dart-frog.dev)
[![style: dart frog lint][dart_frog_lint_badge]][dart_frog_lint_link]
[![License: MIT][license_badge]][license_link]

Backend for [ShopShare](../README.md) — a real-time shared shopping list app. Built with **Dart Frog**.

## Stack

| Technology | Purpose |
|---|---|
| [Dart Frog](https://dartfrog.vgv.dev/) | HTTP/WebSocket framework in Dart |
| [Drift](https://drift.simonbinder.eu/) + `drift_postgres` | ORM for PostgreSQL |
| [PostgreSQL 16](https://www.postgresql.org/) | Relational database |
| `uuid` | UUID generation for entities |
| `dotenv` | Environment variable loading |

## Structure

```
backend/
├── main.dart                   ← server entry point
├── pubspec.yaml
├── .env                        ← local variables (do not commit)
├── routes/
│   ├── _middleware.dart        ← CORS + dependency injection
│   ├── api/
│   │   ├── users/index.dart    ← POST /api/users
│   │   ├── lists/              ← list CRUD
│   │   └── items/              ← item check and delete
│   └── ws/
│       └── lists/[listId].dart ← real-time WebSocket
├── database/
│   ├── app_database.dart       ← Drift singleton + PG connection
│   └── tables/                 ← table definitions
├── daos/                       ← Data Access Objects per entity
└── services/
    └── connection_manager.dart ← manages active WebSocket channels
```

## Running Locally

> Requires Docker.

```bash
# From the monorepo root
docker-compose up -d postgres

# Start the server in dev mode
dart_frog dev
```

Server runs at `http://localhost:8080`.

## Environment Variables

Create a `.env` file inside `backend/` based on `.env.example` at the repo root:

```
DATABASE_URL=postgresql://shopuser:shoppassword@localhost:5432/shopshare
PORT=8080
```

[dart_frog_lint_badge]: https://img.shields.io/badge/style-dart_frog_lint-1DF9D2.svg
[dart_frog_lint_link]: https://pub.dev/packages/dart_frog_lint
[license_badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license_link]: https://opensource.org/licenses/MIT