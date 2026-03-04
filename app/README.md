# ShopShare — App

Mobile project for ShopShare, built with **Flutter**.

## Stack

| Technology | Purpose |
|---|---|
| [Flutter](https://flutter.dev/) | Cross-platform UI (iOS & Android) |
| [Riverpod](https://riverpod.dev/) | Reactive state management |
| [go_router](https://pub.dev/packages/go_router) | Declarative navigation |
| [Dio](https://pub.dev/packages/dio) | HTTP client with interceptors |
| `web_socket_channel` | Real-time WebSocket connection |
| [Drift](https://drift.simonbinder.eu/) + `sqlite3` | Offline local cache |
| `shared_preferences` | Simple data persistence (user_id) |

## Structure

```
app/
└── lib/
    ├── main.dart
    ├── router.dart               ← go_router with redirect logic
    ├── models/                   ← domain entities (user, list, item, category)
    ├── services/
    │   ├── api_client.dart       ← Dio configured with headers and error handling
    │   └── websocket_service.dart ← WS with automatic reconnection
    ├── providers/                ← Riverpod providers (user, list, apiClient, ws)
    └── screens/
        ├── onboarding_screen.dart ← first launch: name + emoji
        ├── home_screen.dart       ← user's list of shopping lists
        └── list_screen.dart       ← main shared list screen
```

## Navigation Flow

```
App launch
  ↓
user_id saved?
  ├── NO  → /onboarding
  └── YES → /home → /list/:id
```

## Running Locally

```bash
cd app

# Install dependencies
flutter pub get

# Run on Linux desktop (WSL2 — displays via WSLg)
flutter run -d linux
```

> **WSL2 note:** `flutter devices` only detects the Linux desktop target in WSL2.
> The app window is rendered via WSLg and appears on your Windows display.
>
> To run on an Android emulator, start an AVD from Android Studio on Windows first,
> then expose the ADB bridge to WSL:
> ```bash
> export ADB_SERVER_SOCKET=tcp:localhost:5037
> flutter run -d <device-id>
> ```

Make sure the backend is running at `http://localhost:8080` before starting the app.
