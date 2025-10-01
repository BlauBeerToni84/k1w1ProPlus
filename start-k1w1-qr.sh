#!/usr/bin/env bash
set -euo pipefail

APP="$HOME/k1w1ProPlus"
cd "$APP"

# Clean (keine Watcher-Leichen)
mount proc /proc -t proc 2>/dev/null || true
pkill -f "expo|eas" 2>/dev/null || true
rm -rf .expo .expo-shared node_modules/.cache

# Watcher AUS (ENOSPC killen) + Telemetrie aus
export EXPO_USE_POLLING=1
export CHOKIDAR_USEPOLLING=1
export WATCHPACK_POLLING=true
export USE_POLLING=1
export METRO_DISABLE_WATCHER=1
export EXPO_NO_TELEMETRY=1

# QR-Tool
npx --yes qrcode-terminal@0.12.0 >/dev/null 2>&1 || true

LOGFILE="$(mktemp)"
echo "Logs: $LOGFILE"

# --- LAN-URL sofort ausgeben (funktioniert in deinem WLAN) ---
PORT=8082
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -z "${LAN_IP:-}" ]; then
  LAN_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '/src/ {for(i=1;i<=NF;i++) if ($i=="src") print $(i+1)}' | head -n1)"
fi
if [ -n "${LAN_IP:-}" ]; then
  LAN_URL="exp://${LAN_IP}:${PORT}"
  echo "LAN: ${LAN_URL}"
  npx qrcode-terminal@0.12.0 "${LAN_URL}" || true
else
  echo "Kein LAN-IP gefunden (ok, wir warten auf Tunnel)…"
fi

# --- Expo starten (CI=1 = keine Watcher) ---
CI=1 stdbuf -oL -eL npx expo start --tunnel --port ${PORT} --clear --non-interactive 2>&1 | tee "$LOGFILE" & EXPO_PID=$!

# --- Auf Tunnel-URL warten und QR drucken ---
echo "Warte auf exp.direct (Tunnel)…"
TUN=""
for i in {1..240}; do
  TUN="$(grep -oE 'exp://[a-z0-9\-]+\.exp\.direct[^[:space:]]*' "$LOGFILE" | tail -n1 || true)"
  [ -n "$TUN" ] && break
  sleep 1
done
if [ -n "${TUN:-}" ]; then
  echo "Tunnel: ${TUN}"
  npx qrcode-terminal@0.12.0 "${TUN}" || true
else
  echo "Kein Tunnel gefunden – nutze LAN-QR oben oder prüfe Logs: $LOGFILE"
fi

wait $EXPO_PID || true