# ShopShare Mobile (Expo + React Native)

This folder contains the new React Native app (Expo + TypeScript) that will replace the Flutter app.

## Quick start

1. Install dependencies:

```bash
make mobile-setup
```

2. Start dev server:

```bash
make mobile
```

3. Optional API base URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000 npm run start
```

## Current scope

- Session bootstrap with local storage
- Onboarding screen (`POST /api/users`)
- Home screen placeholder
- Root navigation with authenticated vs unauthenticated split
