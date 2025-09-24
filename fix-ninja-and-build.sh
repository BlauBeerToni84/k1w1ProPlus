#!/usr/bin/env bash
set -euo pipefail
G=$(tput setaf 2); N=$(tput sgr0); log(){ echo "${G}[INFO]${N} $*";}
log "Hole Ninja 1.11.1 für ARM64 ..."
mkdir -p ~/tools && cd ~/tools
wget -q https://github.com/ninja-build/ninja/releases/download/v1.11.1/ninja-linux-aarch64.zip
unzip -q ninja-linux-aarch64.zip && chmod +x ninja
log "Installiere Ninja ins SDK ..."
mkdir -p ~/android-sdk/cmake/3.22.1/bin
cp ~/tools/ninja ~/android-sdk/cmake/3.22.1/bin/ninja && chmod +x ~/android-sdk/cmake/3.22.1/bin/ninja
log "Baue APK ..."
cd ~/k1w1ProPlus/android
./gradlew clean
./gradlew assembleRelease -Pandroid.cmake.path="$HOME/cmake-3.22.1/bin/cmake" -Pandroid.cmake.version=3.22.1 --no-daemon --max-workers=1
APK="$HOME/k1w1ProPlus/android/app/build/outputs/apk/release/app-release.apk"
[ -f "$APK" ] && echo "FERTIG: $APK" || { echo "Build fehlgeschlagen"; exit 1; }
