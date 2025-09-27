#!/usr/bin/env bash
set -euo pipefail

APP="$HOME/k1w1ProPlus"
LOGDIR="$APP/.dev_audit"
LOG="$LOGDIR/REPORT.txt"

# ---------- Env (Andronix/Proot freundlich) ----------
export CHOKIDAR_USEPOLLING=1
export CHOKIDAR_INTERVAL=900
export EXPO_NO_DEBUG=1
export CI=true

mkdir -p "$HOME/.npm-global" "$HOME/bin" "$LOGDIR"
npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
export PATH="$HOME/.npm-global/bin:$HOME/bin:$PATH"

# Optional: Watchman drosseln/aufräumen
if command -v watchman >/dev/null 2>&1; then
  printf '{ "ignore_dirs": ["node_modules",".git",".expo",".expo-shared"] }\n' > "$HOME/.watchmanconfig"
  watchman watch-del-all >/dev/null 2>&1 || true
  watchman shutdown-server >/dev/null 2>&1 || true
fi

# ---------- Projekt wechseln ----------
cd "$APP" || { echo "[ERR] Projektordner fehlt: $APP"; exit 1; }

# Metro-Config (falls kaputt) temporär beiseite legen
[ -f metro.config.js ] && mv -f metro.config.js metro.config.js.bak || true

# Expo-Temp & Cache klein halten
rm -rf .expo .expo-shared node_modules/.cache 2>/dev/null || true

# Nur ein Lockfile behalten (wir nutzen npm)
[ -f yarn.lock ] && rm -f yarn.lock || true
[ -f pnpm-lock.yaml ] && rm -f pnpm-lock.yaml || true

# ---------- Diagnose ----------
echo "== k1w1ProPlus DEV REPORT ==" > "$LOG"
echo "- Node: $(node -v 2>/dev/null || echo n/a)" >> "$LOG"
echo "- NPM : $(npm -v 2>/dev/null || echo n/a)"  >> "$LOG"
echo "- PWD : $(pwd)"                              >> "$LOG"

# Expo Doctor
echo -e "\n--- expo doctor ---" >> "$LOG"
npx -y expo doctor | tee -a "$LOG" || true

# Versionscheck & ggf. Alignment
echo -e "\n--- expo install --check ---" >> "$LOG"
if npx -y expo install --check 2>&1 | tee -a "$LOG" | grep -qi "mismatch"; then
  echo -e "\n[INFO] Versionen werden mit 'npx expo install' ausgerichtet…" | tee -a "$LOG"
  npx -y expo install | tee -a "$LOG" || true
fi

# ESLint Auto-Fix (nur wenn Config existiert)
if [ -f "eslint.config.js" ] || ls .eslintrc.* >/dev/null 2>&1; then
  echo -e "\n--- eslint --fix ---" >> "$LOG"
  npx -y eslint . --ext .js,.jsx,.ts,.tsx --fix | tee -a "$LOG" || true
fi

# Deps aufräumen
echo -e "\n--- npm prune & dedupe ---" >> "$LOG"
npm prune --production=false >/dev/null 2>&1 || true
npm dedupe >/dev/null 2>&1 || true

# Kurzer Status
echo -e "\n--- git status (optional) ---" >> "$LOG"
git status -s 2>/dev/null | tee -a "$LOG" || true

echo -e "\n== REPORT ENDE ==\n" >> "$LOG"
echo "[OK] Audit abgeschlossen → $LOG"

# ---------- Dev-Server starten (LAN, ohne Debug-UI) ----------
echo "[INFO] Starte Expo Dev-Server…"
npx expo start --clear --lan