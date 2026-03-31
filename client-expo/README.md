# Student App (Expo)

## Prerequisites
- Node.js >= 20.19.4 (recommended for the React Native / Metro versions installed)
- Expo Go app for quick device testing (Android/iOS)

## Environment Configuration
Create a `.env` file in `client-expo`:

### For Development (Local Server)
```
EXPO_PUBLIC_API_URL=http://localhost:8085
```

### For Production / APK Builds
```
EXPO_PUBLIC_API_URL=https://registration-form-17dw.onrender.com
```

**Note:** The production URL is also configured in:
- `app.config.js` (for build-time injection)
- `eas.json` (for EAS Build)
- `shared/config/api.ts` (as fallback)

This ensures the API URL works in all environments: Expo Go, development builds, and production APKs.

Use the server root (no `/api` suffix).

## Run Commands
From `client-expo`:

```
npm run start
```

Then:
- Press `w` for web
- Press `a` for Android (emulator)
- Press `i` for iOS (macOS only)

Direct shortcuts:
```
npm run web
npm run android
npm run ios
```

## Notes
- The student app uses Expo Router with these routes:
  - `/login`
  - `/student-panel`
  - `/student-result`
  - `/student-result-detail/[quizAttemptId]`
  - `/student-quiz/[testId]`
  - `/student-change-password`
  - `/register`
  - `/forgot-password`
