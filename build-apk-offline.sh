#!/usr/bin/env bash
set -euo pipefail
G=$(tput setaf 2); N=$(tput sgr0); log(){ echo "${G}[INFO]${N} $*";}

# 1. Ninja aus Ubuntu-Quellen bauen (kein externes Binary nötig)
log "Bauen Ninja (ARM64) ..."
sudo apt update && sudo apt install -y ninja-build || \
  { log "Kein sudo – versuche direkt zu bauen ..."; }

# Falls ninja nicht da: selbst bauen
if ! command -v ninja &>/dev/null; then
  mkdir -p ~/ninja-build && cd ~/ninja-build
  git clone --depth 1 --branch v1.11.1 https://github.com/ninja-build/ninja.git .
  ./configure.py --bootstrap
  chmod +x ninja
fi

# 2. Ins SDK-Verzeichnis kopieren
log "Installiere Ninja ins SDK ..."
mkdir -p ~/android-sdk/cmake/3.22.1/bin
cp "$(command -v ninja)" ~/android-sdk/cmake/3.22.1/bin/ninja
chmod +x ~/android-sdk/cmake/3.22.1/bin/ninja

# 3. APK bauen
log "Baue APK ..."
cd ~/k1w1ProPlus/android
./gradlew clean
./gradlew assembleRelease \
  -Pandroid.cmake.path="$HOME/cmake-3.22.1/bin/cmake" \
  -Pandroid.cmake.version=3.22.1 \
  --no-daemon --max-workers=1

APK="$HOME/k1w1ProPlus/android/app/build/outputs/apk/release/app-release.apk"
[ -f "$APK" ] && echo "✅ FERTIG: $APK" || { echo "❌ Build fehlgeschlagen"; exit 1; }
