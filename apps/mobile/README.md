# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## EAS Android builds

Android APKs are built from the repository root through the manually triggered
`Build MemoPal Android` GitHub Actions workflow at
`.github/workflows/build-mobile-android.yml`. Choose `uat` to use the EAS
`preview` profile or `prod` to use the `production-apk` profile. The workflow
syncs the selected environment's API, media, and Google OAuth variables to EAS
before building, then publishes the APK as both an Actions artifact and a
GitHub Release asset.

Configure these secrets in each GitHub Environment (`uat` and/or `prod`):

- `EXPO_TOKEN`
- `MEMOPAL_MOBILE_API_BASE_URL`
- `MEMOPAL_MOBILE_MEDIA_BASE_URL`
- `MEMOPAL_GOOGLE_WEB_CLIENT_ID`
- Optional: `MEMOPAL_GOOGLE_IOS_CLIENT_ID`, `MEMOPAL_GOOGLE_HOSTED_DOMAIN`

The regular `npm run android` command remains a local Expo native build and
does not invoke EAS or a cloud build.

You can start developing by editing the files inside the `src/app` and
`src/features` directories. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Memory module structure

Product features live under `src/features/<feature>`. Each feature owns its
screens, components, hooks, services, API clients, repositories, and types.
Folders use the same vocabulary across features. Expo Router files under
`src/app` are thin route adapters and import screens from the feature's public
`index.ts`.

Large features can use vertical slices such as `palace-list`, `palace-details`,
or `lesson-review`. A slice keeps its screen, model hooks, and UI components
together. Code reused by multiple slices belongs in that feature's `shared`
folder; unused folders should not be created.

The shared module contract and registry are in `src/core/memory`. Add a new
technique by creating its feature folder, exporting its module definition, and
registering that definition in `src/core/memory/memory-registry.ts`.

Module availability is controlled centrally by `src/core/memory/memory-flags.ts`.
The default configuration enables both current modules. For a staged local
build, set Expo public variables before starting the app:

```text
EXPO_PUBLIC_ENABLE_PALACE=true
EXPO_PUBLIC_ENABLE_NUMBER_PEG=false
```

The Practice screen lists only enabled modules, and each module route checks the
same flag before rendering. These build-time flags can later be replaced or
merged with backend settings without changing feature screens.

Palace, Number Peg, Community, Home, Auth, Profile, Gamification,
Notifications, Subscription, Referral, Support, Onboarding, and Tutorial each
live in their own feature folder. Cross-feature infrastructure lives under
`src/core` (HTTP/API transport, settings, sync, shared hooks, and shared
types). Generic UI components, database code, contexts, constants, and utility
functions remain in their shared top-level folders. New feature-specific code
should not be added to those shared folders.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
