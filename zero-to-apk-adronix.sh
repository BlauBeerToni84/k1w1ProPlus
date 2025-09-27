#!/usr/bin/env bash
# ------------------------------------------------------------------
# Zero-to-APK – VOLL-AUTO für Adronix (Ubuntu unter Termux, ARM64)
# ------------------------------------------------------------------
set -euo pipefail

PROJECT_DIR="$HOME/k1w1ProPlus"
ANDROID_SDK_ROOT="$HOME/android-sdk"
TERMUX_CMAKE="/data/data/com.termux/files/usr/bin/cmake"

# Farben
G=$(tput setaf 2)
Y=$(tput setaf 3)
N=$(tput sgr0)
log()  { echo "${G}[INFO]${N} $*" ; }

# ----------------------------------------------------------
# 1. Termux-CMake sicherstellen
# ----------------------------------------------------------
log "Installiere CMake in Termux (falls noch nicht da) ..."
pkg install -y cmake

# ----------------------------------------------------------
# 2. Android-SDK einrichten
# ----------------------------------------------------------
log "Richte Android-SDK ein ..."
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"

if [ ! -f "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  CMDLINE_ZIP="$ANDROID_SDK_ROOT/cmdline-tools.zip"
  wget -q -O "$CMDLINE_ZIP" \
    https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip -q -o "$CMDLINE_ZIP" -d "$ANDROID_SDK_ROOT/cmdline-tools"
  mv "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  rm "$CMDLINE_ZIP"
fi

# Umgebung setzen
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Lizenz + Komponenten
yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" >/dev/null

# ----------------------------------------------------------
# 3. Termux-CMake in Adronix verlinken
# ----------------------------------------------------------
log "Verlinke Termux-CMake für Gradle ..."
mkdir -p "$ANDROID_SDK_ROOT/cmake/3.22.1/bin"
ln -sf "$TERMUX_CMAKE" "$ANDROID_SDK_ROOT/cmake/3.22.1/bin/cmake"
ln -sf "/data/data/com.termux/files/usr/bin/ctest" "$ANDROID_SDK_ROOT/cmake/3.22.1/bin/ctest"
ln -sf "/data/data/com.termux/files/usr/bin/cpack" "$ANDROID_SDK_ROOT/cmake/3.22.1/bin/cpack"

# ----------------------------------------------------------
# 4. Projekt anlegen (falls nicht vorhanden)
# ----------------------------------------------------------
[ -d "$PROJECT_DIR" ] || mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

if [ ! -f "package.json" ]; then
  log "Erzeuge neues Expo-Projekt ..."
  pnpm create expo-app . --template blank
fi

# ----------------------------------------------------------
# 5. pnpm + Metro kompatibel machen
# ----------------------------------------------------------
[ -f .npmrc ] || echo "node-linker=hoisted" > .npmrc
log "Installiere Projekt-Abhängigkeiten ..."
pnpm install

# ----------------------------------------------------------
# 6. Assets-Script (Dummy)
# ----------------------------------------------------------
if [ ! -f "generate-assets.sh" ]; then
  cat > generate-assets.sh <<'EOF'
#!/bin/bash
echo "Generiere Assets (Dummy) – hier Icons/Splash-Screens einfügen."
EOF
  chmod +x generate-assets.sh
fi
./generate-assets.sh

# ----------------------------------------------------------
# 7. Android-Prebuild
# ----------------------------------------------------------
log "Erzeuge native Android-Struktur ..."
npx expo prebuild --platform android --clean --no-install

# ----------------------------------------------------------
# 8. local.properties für SDK-Pfad
# ----------------------------------------------------------
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# ----------------------------------------------------------
# 9. APK bauen (mit Termux-CMake)
# ----------------------------------------------------------
log "Baue Release-APK (mit Termux-CMake) ..."
cd android
./gradlew clean
./gradlew assembleRelease \
  -Pandroid.cmake.path="$ANDROID_SDK_ROOT/cmake/3.22.1/bin/cmake" \
  -Pandroid.cmake.version=3.22.1 \
  --no-daemon --max-workers=1

APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  log "Fertig! APK liegt bei:"
  log "  $APK_PATH"
else
  echo "APK wurde nicht erzeugt – siehe Gradle-Output."
  exit 1
fi
