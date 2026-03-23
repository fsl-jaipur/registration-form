# Student App (Expo)

## Prerequisites
- Node.js >= 20.19.4 (recommended for the React Native / Metro versions installed)
- Expo Go app for quick device testing (Android/iOS)

## Environment
Create a `.env` file in `client-expo`:

```
EXPO_PUBLIC_API_URL=http://localhost:8085
EXPO_PUBLIC_WEB_URL=https://registration-form-17dw.onrender.com
```
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
