# Mobile package size

## Changes (2026-11-08)

- Converted 65 runtime illustrations (60 Momo portraits, three leaderboard
  mascots, reef background and local Palace preview) from PNG to WebP quality 90.
  Original dimensions are unchanged; transparency was checked byte for byte.
  These are lossy RGB encodings, not lossless replacements.
- The converted images total **51,364,758 → 8,053,744 bytes** (48.99 → 7.68 MiB).
  This is source asset size, not an APK download or installed-size measurement.
- Removed 45 unused preview images/favicon, totaling 7,921,726 bytes. Most were
  authoring previews already excluded from the app bundle, so their deletion
  primarily reduces workspace size.
- Kept native launcher/notification icons and splash images as PNG. Kept editable
  Rive source artwork. Kept all 60 Momo states and existing offline functionality.
- Load the seven registered Baloo/Nunito fonts from their individual weight
  modules. Import Ionicons directly instead of the vector-icons barrel, which
  statically loads other icon families.
- Removed unused `expo-symbols`, `react-native-linear-gradient` and
  `@rive-app/react-canvas`. The existing Rive authoring tool now declares its
  `@rive-app/canvas` dependency explicitly as a development dependency.
- Enabled Android release R8 minification, resource shrinking and JS bundle
  compression through `expo-build-properties`.

## Build profiles

### Local Android verification

| Measurement | Existing APK | Optimized APK |
| --- | ---: | ---: |
| APK bytes | 123,392,001 | 41,257,400 |
| APK MiB | 117.68 | 39.35 |
| Packaged TTF files (including dependency fonts) | 48 | 13 |
| DEX compressed bytes | 17,517,562 | 6,203,218 |
| Resources compressed bytes | 55,543,713 | 13,710,889 |
| Native library compressed bytes | 38,485,928 | 13,788,628 |

This local APK comparison shows a **66.6% reduction**. Both APKs contain only
`x86_64`; the baseline is a previously built APK, not a clean before/after build
from the same source revision. It is a useful local comparison, not a measured
Play Store download or universal production APK size. The Metro asset graph now
contains eight TTF files; the final APK also includes five dependency fonts.
All 65 runtime WebP files were confirmed in the APK by SHA-256 content matching.

The optimized verification APK is at
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`; this is a
local emulator/test artifact, not a signed store release. Build and comparison
reports are under the temporary `memopal-size-baseline` directory listed below.

`npm run check:mobile` passes (181 tests; five existing lint warnings).
Asset audit: 69 runtime image files, zero missing references and zero unreferenced
images under `apps/mobile/assets`. Android release assemble, R8 and resource
shrinking completed successfully.

### Distribution

Run Expo/EAS commands from **`apps/mobile`**, not the monorepo root.

```powershell
Set-Location apps/mobile
npx eas-cli build --platform android --profile production
npx eas-cli build --platform android --profile production-apk
```

`production` produces an AAB for store delivery. `production-apk` produces a direct
APK and sets `MEMOPAL_COMPACT_APK=1`, enabling compressed native-library packaging.
The latter reduces the APK file but requires library extraction at installation;
it is not a promise of an equally large reduction in installed storage. Normal
store builds retain the platform's default uncompressed library packaging.
No device ABI was removed from either EAS profile.

For a local emulator-only size comparison:

```powershell
Set-Location apps/mobile
npx expo prebuild --platform android --no-install
Set-Location android
.\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=x86_64' '-Pexpo.useLegacyPackaging=true' --max-workers=2
```

After changing an asset extension, old generated PNG files can remain in an
incremental Android build and cause duplicate-resource errors. Clean the app's
generated build outputs before rebuilding; do not remove editable source assets.
The existing local debug CMake cache had missing Gradle transform paths during
verification. Cleaning app outputs while excluding the two native clean tasks
avoids invoking that unrelated stale debug cache:

```powershell
.\gradlew.bat :app:clean :app:assembleRelease -x :app:externalNativeBuildCleanDebug -x :app:externalNativeBuildCleanRelease '-PreactNativeArchitectures=x86_64' '-Pexpo.useLegacyPackaging=true' --max-workers=2
```

## Asset maintenance

From the repository root:

```powershell
npm run audit:assets --workspace=memopal
npm run check:mobile
```

The audit reports missing literal local image references and unreferenced images
under `apps/mobile/assets`. It does not delete anything and is not proof that an
arbitrary dynamically constructed path is unused. Current runtime asset maps use
literal requires. Inspect new dynamic references and config plugins manually.

For newly added PNGs in the known runtime illustration folders:

```powershell
uv run --no-project --with pillow python apps/mobile/scripts/optimize-runtime-images.py --backup-dir C:/Temp/memopal-original-images
```

The script backs up originals outside the repository, preserves dimensions and
alpha, updates literal local requires, and leaves server URLs untouched. Review
visual quality before accepting each batch. Do not repeatedly transcode WebP.
Keep font/icon imports directed at individual families/weights to avoid
reintroducing bundled assets that the UI never uses.

Originals from this run are outside the repository at
`C:/Users/jingy/AppData/Local/Temp/memopal-size-baseline/original-images`; deleted
previews are in the sibling `removed-previews` directory. Temporary directories
can be removed by OS maintenance; retain a durable artwork backup if needed.

## Validation limits

The monorepo's old ignored root Android generated project was accidentally
refreshed once by a prebuild from the wrong directory. The root package changes
from that command were restored; subsequent prebuild/build work used
`apps/mobile/android`. No root native generated files are included in this change.

No iOS build or physical-device release smoke test was performed on Windows.
Verify WebP rendering, font loading, OCR, Google sign-in, notifications and
learning feedback in the signed release before distribution, especially after
enabling R8. Existing development servers were not restarted for this work.

## Further reductions

Use the production AAB for store delivery so users receive their device's ABI
and applicable resources. Measure an ARM64 release on a target phone before
setting a download-size budget. The x86_64 comparison is not that measurement.

The largest remaining native-library payload is 38,485,928 uncompressed bytes
in the local x86_64 APK. The existing offline OCR model and React Native runtime
are functional dependencies; removing them just to improve the file-size number
would change product behavior. A downloaded OCR model or remotely cached Momo
art could reduce the initial package further, but would require an explicit
offline/loading policy and is not implemented here.

References: [Expo build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/),
[Expo app-size guidance](https://docs.expo.dev/distribution/app-size/).
