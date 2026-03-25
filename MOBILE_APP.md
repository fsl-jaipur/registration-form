# Mobile + Web (Expo) Quick Guide

## App Location
The unified React Native + Web app lives in:

`client-expo`

## Environment
Create `client-expo/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8085
EXPO_PUBLIC_WEB_URL=https://registration-form-17dw.onrender.com
```
Use the server root (no `/api` suffix).

## Run
```
cd client-expo
npm run start
```

Shortcuts:
- `npm run web`
- `npm run android`
- `npm run ios`

## Existing Web App
Your original web app still runs in `client` with Vite:

```
cd client
npm run dev
```
