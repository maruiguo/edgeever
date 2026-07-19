# EdgeEver Mobile Builds

EdgeEver Mobile is built with Expo and React Native. Daily Android test packages are built directly on GitHub Actions, without using EAS Build quota.

## App Updates

Installed release builds use EAS Update for compatible JavaScript and asset updates. The app checks once shortly after launch and, at most once every six hours, when it returns to the foreground. Users can also open **My** -> **General settings** -> **App updates** to check manually. A downloaded update is only applied after the user confirms a restart, so an active editing session is not interrupted automatically.

The `production` build and locally generated Play build read from the `production` update channel. Preview EAS builds read from `preview`. Publish and verify an update on `preview` before promoting the same change to production:

```sh
bunx eas-cli update --channel preview --environment preview --message "Describe the update"
bunx eas-cli update --channel production --environment production --message "Describe the update"
```

The update runtime uses the app-version policy. Any native dependency, Expo SDK, native module, or native configuration change requires incrementing `expo.version` and shipping a new store build before publishing code that depends on that native change. EAS Update does not replace Google Play or App Store updates for native binaries.

## Android Debug APK

The `Build EdgeEver Mobile` workflow runs on GitHub Actions and produces a debug APK artifact.

It runs:

```sh
bun install --frozen-lockfile
bun run typecheck:mobile
cd apps/mobile
bunx expo prebuild --platform android --non-interactive --clean
cd android
./gradlew assembleDebug
```

The APK is uploaded as a GitHub Actions artifact named `edgeever-android-debug-apk`.

## Release Builds

### Recommended local Play build

Routine Google Play bundles should be built on the release Mac instead of in
GitHub Actions. Keep the upload keystore and signing environment outside the
repository:

```sh
mkdir -p "$HOME/.config/edgeever/android"
cp .env.android.local.example "$HOME/.config/edgeever/android/signing.env"
chmod 600 "$HOME/.config/edgeever/android/signing.env"
```

Fill in the existing upload key's absolute path and credentials. Android
keystore formats and local environment files are ignored by Git.

```sh
bun run build:android:play:local
```

This produces:

```text
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
apps/mobile/android/app/build/outputs/mapping/release/mapping.txt
```

The command builds all Play-supported Android architectures by default,
verifies the AAB signature, and requires a non-empty R8 mapping file. Keep an
encrypted backup of `signing.env` and the upload keystore outside the
repository. Do not replace or regenerate the upload key for an existing Play
app unless the key reset has been completed in Play Console.

Set `EDGE_EVER_ANDROID_ENV_FILE` to use a different secure environment file.

### GitHub Actions fallback

Run the workflow manually to build a signed Android App Bundle. The workflow
uses the following GitHub Actions secrets:

```text
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

The resulting app bundle is uploaded as `edgeever-android-release-aab`. Release
builds enable R8 code minification and resource shrinking, and the matching
deobfuscation file is uploaded as `edgeever-android-release-mapping`. Upload
that `mapping.txt` alongside the same app bundle version in Google Play Console
so production crash and ANR stack traces can be decoded correctly. The upload
keystore is only used to prove ownership when uploading bundles; Google Play
App Signing manages the app signing key delivered to users. Keep an encrypted
backup of the upload keystore and its credentials outside the repository.

iOS device builds and App Store submissions require Apple Developer Program enrollment, certificates, and provisioning profiles. Until those credentials are available, iOS can be developed locally with Expo Go or simulator builds, but installable device `.ipa` release automation should wait.

## EAS

The project is linked to Expo/EAS for optional future use, but routine CI builds should use GitHub Actions local Android builds to avoid consuming EAS monthly build quota.
