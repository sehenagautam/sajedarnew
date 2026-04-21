# Sajedar AI News Mobile App

Flutter mobile app for Sajedar AI News.

## Design Direction

The UI follows Apple-inspired product principles without copying Apple branding:

- clear hierarchy with large titles and readable story cards
- content-first layout with quiet controls
- generous spacing, rounded materials, and subtle depth
- large touch targets and strong contrast
- pull to refresh, search, categories, breaking stories, and saved fallback content

## Run Locally

For Android emulator with the local backend:

```bash
flutter run --dart-define=SAJEDAR_API_BASE=http://10.0.2.2:5050
```

For iOS simulator with the local backend:

```bash
flutter run --dart-define=SAJEDAR_API_BASE=http://127.0.0.1:5050
```

For production, the app defaults to:

```text
https://sajedar.com
```

That domain should serve the backend API at `/api/posts` before release.

## Google Play Release

The Android package id is:

```text
com.sajedar.ainews
```

Create an upload keystore:

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Copy the example signing file:

```bash
cp android/key.properties.example android/key.properties
```

Update `android/key.properties` with the real passwords and keystore path.
Do not commit `android/key.properties` or the keystore file.

Build the Play Console app bundle:

```bash
flutter build appbundle --release --dart-define=SAJEDAR_API_BASE=https://sajedar.com
```

Upload this file in Google Play Console:

```text
build/app/outputs/bundle/release/app-release.aab
```

Before publishing, complete the Play Console app content forms, including News app declarations, Data safety, target audience, store listing, screenshots, privacy policy, and internal testing.
