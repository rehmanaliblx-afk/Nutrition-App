# CLAUDE.md — Nutrition App Development Reference

This file documents every lesson learned during initial build setup.
**Read this before making ANY changes to avoid repeating 4+ hours of debugging.**

---

## Project Stack

- **Expo SDK:** `~54.0.33`
- **React Native:** `0.81.5`
- **New Architecture:** ENABLED (`newArchEnabled: true`)
- **Platform:** Android only (APK)
- **Build system:** GitHub Actions (NOT EAS — free plan exhausted)
- **Database:** SQLite via `expo-sqlite`
- **Navigation:** React Navigation v7 (drawer + native stack)

---

## Exact Package Versions (DO NOT CHANGE WITHOUT CHECKING)

These are the versions verified to work together. Source: `expo/bundledNativeModules.json`.

### Native packages (version-sensitive)
```json
"react-native-gesture-handler": "~2.28.0",
"react-native-screens": "~4.16.0",
"react-native-safe-area-context": "~5.6.0",
"react-native-reanimated": "~4.1.1",
"react-native-worklets": "0.5.1",
"react-native-svg": "15.12.1"
```

### Expo packages
```json
"expo": "~54.0.33",
"expo-camera": "~17.0.10",
"expo-document-picker": "~14.0.8",
"expo-file-system": "~19.0.21",
"expo-sharing": "~14.0.8",
"expo-sqlite": "~16.0.10",
"expo-status-bar": "~3.0.9"
```

### Navigation — ALL must be v7 (mixing v6 and v7 causes runtime crash)
```json
"@react-navigation/native": "^7.2.4",
"@react-navigation/native-stack": "^7.15.1",
"@react-navigation/bottom-tabs": "^7.16.1",
"@react-navigation/drawer": "^7.10.2"
```

### reanimated v4 requires worklets as separate package
```json
"react-native-reanimated": "~4.1.1",
"react-native-worklets": "0.5.1"
```
> Never upgrade reanimated without checking its peer dep for `react-native-worklets` version.
> Run: `cat node_modules/react-native-reanimated/package.json | grep -A5 peerDependencies`

---

## app.json Rules

```json
{
  "expo": {
    "newArchEnabled": true,     ← MUST be true — reanimated v4 requires New Architecture
    "android": {
      "package": "com.rehmanali5018.nutritionapp"
    }
  }
}
```

> **Never set `newArchEnabled: false`** — reanimated v4 will fail with:
> `assertNewArchitectureEnabledTask FAILED`

---

## Required Files

### `.npmrc` (root of project)
```
legacy-peer-deps=true
```
> Required because `@react-navigation/drawer` v7 peer-requires `@react-navigation/native` v7
> but npm strict mode rejects it. This file must always exist.

### `babel.config.js`
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],  ← required for reanimated v4
  };
};
```

### `App.tsx` — Required wrappers
```tsx
import 'react-native-gesture-handler';           // must be first import
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// GestureHandlerRootView MUST wrap everything — without it app crashes on launch
export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DatabaseProvider>
          <RootNavigator />
        </DatabaseProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

---

## Build Approach — GitHub Actions

**Do NOT use EAS Build** — free plan has monthly limit.
**Use GitHub Actions** — free, unlimited, APK ready in ~20 minutes.

Workflow file: `.github/workflows/build-android.yml`

### Critical build command:
```yaml
- name: Generate keystore
  run: |
    keytool -genkeypair -v \
      -keystore ${{ github.workspace }}/release.keystore \
      -alias mykey -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=NutritionApp,O=NutritionApp,C=US" \
      -storepass android -keypass android

- name: Build release APK       ← MUST be release, NOT debug
  run: |
    cd android && ./gradlew assembleRelease \
      -Pandroid.injected.signing.store.file=${{ github.workspace }}/release.keystore \
      -Pandroid.injected.signing.store.password=android \
      -Pandroid.injected.signing.key.alias=mykey \
      -Pandroid.injected.signing.key.password=android \
      --no-daemon
```

> **NEVER use `assembleDebug`** for distribution — debug APK tries to connect
> to Metro dev server and shows "Unable to load script" on physical devices.
> `assembleDebug -PbundleInDebug=true` does NOT work with Expo prebuild projects.
> Always use `assembleRelease` with a keystore.

---

## Mistakes Made & Root Causes

| # | Mistake | Error | Fix |
|---|---------|-------|-----|
| 1 | `safe-area-context ~5.0.0` too old | `compileReleaseKotlin` Kotlin type mismatch | Upgrade to `~5.6.0` |
| 2 | No `.npmrc` | `npm install` peer dep conflict | Add `legacy-peer-deps=true` |
| 3 | `reanimated ^4.3.1` without worklets | `Cannot find module react-native-worklets/plugin` | Add `react-native-worklets 0.5.1` |
| 4 | `newArchEnabled: false` | `assertNewArchitectureEnabledTask FAILED` | Set to `true` |
| 5 | Old expo packages (camera v16, file-system v18, etc.) | `compileDebugKotlin` failures | Use `bundledNativeModules.json` versions |
| 6 | `assembleDebug` without bundle | "Unable to load script" on phone | Switch to `assembleRelease` |
| 7 | Missing `GestureHandlerRootView` | App crash on launch (blank screen) | Wrap root in `GestureHandlerRootView` |
| 8 | Navigation v6+v7 mixed | `undefined is not a function` in DrawerViewBase | All nav packages must be v7 |
| 9 | `reanimated ~3.16/3.17` | `TRACE_TAG_REACT_JAVA_BRIDGE` not found | Use v4 (v3 incompatible with RN 0.81) |
| 10 | `babel.config.js` missing reanimated plugin | JS bundle errors | Add `react-native-reanimated/plugin` |

---

## How to Verify Correct Package Versions

Before adding or upgrading any package, check Expo's official list:
```bash
cat node_modules/expo/bundledNativeModules.json
```
This file contains exact versions tested by Expo team for the current SDK.

---

## How to Add a New Feature

1. Write code changes
2. `git add` + `git commit` + `git push` to `claude/api-response-error-ZxyrV`
3. GitHub Actions auto-triggers — wait ~20 min
4. Download artifact `NutritionApp-release` → install APK

**Do NOT:**
- Change package versions without checking `bundledNativeModules.json`
- Mix navigation v6 and v7
- Set `newArchEnabled: false`
- Use `assembleDebug` for final APK

---

## Database

- SQLite via `expo-sqlite` v16
- DB version: 6 (migrations in `src/db/migrations.ts`)
- DAOs: ingredients, recipes, tracking, water, weight, workout, supplements, body measurements
- `DatabaseProvider` blocks render until DB is open — never remove this guard

---

## Branch

Active development branch: `claude/api-response-error-ZxyrV`

---

## Weight vs Target Graph Location
The weight progress graph (actual vs target with trend line) is in:
Navigation: Workout drawer → Weight Log screen
It shows: actual weight line, target pace line, trend line (linear regression), projected completion date
