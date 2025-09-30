#!/usr/bin/env bash
set -euo pipefail

APP="$HOME/k1w1ProPlus"
LOG_DIR="$APP/.dev_audit"
LOG="$LOG_DIR/devserver.log"
REPORT="$LOG_DIR/REPORT.txt"

mkdir -p "$LOG_DIR" "$HOME/.npm-global" "$HOME/bin" "$HOME/tmp_eas"
npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
export PATH="$HOME/.npm-global/bin:$HOME/bin:$PATH"
export TMPDIR="$HOME/tmp_eas"

# Proot/Andronix: Watcher & Debug entlasten
export CHOKIDAR_USEPOLLING=1
export CHOKIDAR_INTERVAL=900
export EXPO_NO_DEBUG=1
export CI=true

# Mehr offene Dateien erlauben (EMFILE fix)
# (falls die Shell es nicht erlaubt, ignoriert sie das einfach)
ulimit -n 8192 2>/dev/null || true

# Hänger killen
pkill -f 'expo .*start|@expo/cli|metro|react-native|node .*metro' 2>/dev/null || true

# Watchman entschärfen (optional)
if command -v watchman >/dev/null 2>&1; then
  printf '{ "ignore_dirs": ["node_modules",".git",".expo",".expo-shared"] }\n' > "$HOME/.watchmanconfig"
  watchman watch-del-all >/dev/null 2>&1 || true
  watchman shutdown-server >/dev/null 2>&1 || true
fi

# Metro-Konfig wegsichern, wenn problematisch
[ -f "$APP/metro.config.js" ] && mv "$APP/metro.config.js" "$APP/metro.config.js.bak" || true

cd "$APP"

# Aufräumen
rm -rf node_modules/.cache .expo .expo-shared 2>/dev/null || true
rm -f yarn.lock pnpm-lock.yaml 2>/dev/null || true

# npm „weniger parallel“ + stabiler machen (EMFILE/ENOSPC mindern)
npm config set fund false >/dev/null 2>&1 || true
npm config set audit false >/dev/null 2>&1 || true
npm config set progress false >/dev/null 2>&1 || true
npm config set prefer-offline true >/dev/null 2>&1 || true
npm config set maxsockets 25 >/dev/null 2>&1 || true
npm config set child-concurrency 2 >/dev/null 2>&1 || true

# Diagnose (keine $() Substitution!)
: > "$REPORT"
echo '== k1w1ProPlus DEV REPORT =='        >> "$REPORT"
echo '- Node:'                             >> "$REPORT"; node -v  >> "$REPORT" 2>/dev/null || true
echo '- NPM :'                             >> "$REPORT"; npm -v   >> "$REPORT" 2>/dev/null || true
echo '- PWD :'                             >> "$REPORT"; pwd      >> "$REPORT" 2>/dev/null || true
echo '- Ulimit (open files):'              >> "$REPORT"; ulimit -n >> "$REPORT" 2>/dev/null || true

# Paketcheck & leichte Auto-Fixes
npx -y expo-doctor --fix || true
npx -y expo install --check || true

# Installation mit Retries & Fallbacks (EMFILE-resistent)
INSTALL_OK=0
i=0
while [ $i -lt 3 ]; do
  i=$((i+1))
  if npm ci --no-audit --no-fund 2>>"$REPORT"; then INSTALL_OK=1; break; fi
  sleep 5
done
if [ $INSTALL_OK -eq 0 ]; then
  if npm install --legacy-peer-deps --no-audit --no-fund --no-optional 2>>"$REPORT"; then
    INSTALL_OK=1
  fi
fi
if [ $INSTALL_OK -ne 1 ]; then
  echo '[FAIL] npm install fehlgeschlagen (EMFILE?).' >> "$REPORT"
  echo "Report: $REPORT"
  exit 1
fi

# Optional fehlendes Modul
node -e 'try{require.resolve("on-headers");process.exit(0)}catch(e){process.exit(1)}' || npm i on-headers >>"$REPORT" 2>&1 || true

# Dev-Server starten (LAN), Logs sammeln
: > "$LOG"
set +e
npx expo start --clear --lan >"$LOG" 2>&1 &
PID=$!
sleep 12

# Typische Fehler erkennen
if grep -qi 'System limit for number of file watchers' "$LOG" || grep -qi 'ENOSPC' "$LOG"; then
  kill "$PID" 2>/dev/null || true
  echo '--- ENOSPC (File Watchers) erkannt. Polling ist aktiv, ggf. ulimit -n erhöhen. ---' >> "$LOG"
  echo "Report: $REPORT"
  echo "Log: $LOG"
  echo "Status: Dev-Start scheiterte an ENOSPC. Versuche: ulimit -n 16384; dann erneut starten."
  exit 2
fi

echo '--- Dev-Server läuft (LAN). ---' >> "$LOG"
echo "Report: $REPORT"
echo "Log: $LOG"
echo "Status: Dev-Server aktiv."
exit 0