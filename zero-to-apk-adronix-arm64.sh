#!/usr/bin/env bash
# ------------------------------------------------------------------
# Zero-to-APK – VOLL-AUTO für Adronix (Ubuntu ARM64, Termux-Chroot)
# Baut CMake 3.22.1 selbst, da SDK-Version nur x86_64 liefert
# ------------------------------------------------------------------
set -euo pipefail

PROJECT_DIR="$HOME/k1w1ProPlus"
ANDROID_SDK_ROOT="$HOME/android-sdk"
CMAKE_INSTALL="$HOME/cmake-3.22.1"

# Farben
G=$(tput setaf 2)
N=$(tput sgr0)
log()  { echo "${G}[INFO]${N} $*" ; }

# ----------------------------------------------------------
# 1. System-Abhängigkeiten
# ----------------------------------------------------------
log "Installiere Build-Tools ..."
apt update -qq
apt install -y build-essential wget unzip openjdk-17-jdk python3 curl git cmake-deps || true

# ----------------------------------------------------------
# 2. CMake 3.22.1 selbst bauen (ARM64)
# ----------------------------------------------------------
if [ ! -f "$CMAKE_INSTALL/bin/cmake" ]; then
  log "Bauen CMake 3.22.1 für ARM64 ..."
  mkdir -p "$HOME/cmake-build"
  cd "$HOME/cmake-build"
  wget https://github.com/Kitware/CMake/releases/download/v3.22.1/cmake-3.22.1.tar.gz
  tar xf cmake-3.22.1.tar.gz
  cd cmake-3.22.1
  ./bootstrap --prefix="$CMAKE_INSTALL" --parallel=$(nproc)
  make -j$(nproc)
  make install
fi

export PATH="$CMAKE_INSTALL/bin:$PATH"

# ----------------------------------------------------------
# 3. Android-SDK einrichten
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

export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" >/dev/null

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
# 9. APK bauen (mit selbst gebautem CMake)
# ----------------------------------------------------------
log "Baue Release-APK (mit ARM64-CMake) ..."
cd android
./gradlew clean
./gradlew assembleRelease \
  -Pandroid.cmake.path="$CMAKE_INSTALL/bin/cmake" \
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
