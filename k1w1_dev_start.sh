#!/usr/bin/env bash
set -euo pipefail

APP="$HOME/k1w1ProPlus"

# --- Andronix/Proot: Watcher entlasten ---
export CHOKIDAR_USEPOLLING=1
export CHOKIDAR_INTERVAL=900
export EXPO_NO_DEBUG=1
export CI=true

# PATH & npm-User-Prefix (kein sudo nötig)
mkdir -p "$HOME/.npm-global" "$HOME/bin"
npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
export PATH="$HOME/.npm-global/bin:$HOME/bin:$PATH"

# Watchman optional, aber hilfreich
if command -v watchman >/dev/null 2>&1; then
  printf '{ "ignore_dirs": ["node_modules",".git",".expo",".expo-shared"] }
' > "$HOME/.watchmanconfig"
  watchman watch-del-all >/dev/null 2>&1 || true
  watchman shutdown-server >/dev/null 2>&1 || true
fi

# Kaputte Metro-Konfig aus dem Weg räumen
[ -f "$APP/metro.config.js" ] && mv "$APP/metro.config.js" "$APP/metro.config.js.bak"

cd "$APP"
# Start ohne Cache & ohne Debug-Overhead
npx expo start --clear --lan
