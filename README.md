# Sajedar AI News

Frontend and backend for `sajedar.com`, built with React, Vite, and Express.

## Structure

```text
frontend/  React and Vite public news website
backend/   Express API, newsroom endpoints, uploads, and JSON post store
mobile_app/ Flutter Android/iOS app for Sajedar AI News
```

## Run locally

```bash
npm install
npm run clean:logo
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:5050`

## Admin

Open `http://localhost:5173/admin`.

Default local credentials:

```text
username: admin
password: admin123
```

Create a `.env` file from `.env.example` before deploying and change
`ADMIN_USER`, `ADMIN_PASSWORD`, and `ADMIN_TOKEN`.

## Content

Posts are stored in `backend/data/posts.json`. The newsroom panel can create, edit, publish,
feature, delete, and upload images for posts. Uploaded images are saved under
`backend/uploads`.

## Production

```bash
npm run build
npm start
```

The Express server serves the built frontend from `frontend/dist` and the API from `/api`.

## Mobile App

```bash
cd mobile_app
flutter pub get
flutter run --dart-define=SAJEDAR_API_BASE=http://10.0.2.2:5050
```

For Google Play, configure `mobile_app/android/key.properties` from
`mobile_app/android/key.properties.example`, then build:

```bash
flutter build appbundle --release --dart-define=SAJEDAR_API_BASE=https://sajedar.com
```

Upload `mobile_app/build/app/outputs/bundle/release/app-release.aab` in Google
Play Console after completing the store listing, app content declarations, data
safety form, privacy policy, screenshots, and internal testing.
