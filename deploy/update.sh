#!/usr/bin/env bash
#
# Atualiza o MatchScope na VPS a partir do GitHub (git pull + build + restart).
# Rode manualmente ou via cron (ex.: a cada 5 min).
#
# Uso:
#   sudo bash deploy/update.sh
#
# Variáveis opcionais:
#   INSTALL_DIR=/var/www/matchscope
#   SERVICE_USER=www-data
#   SERVICE_NAME=matchscope
#   GIT_BRANCH=main
#
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/var/www/matchscope}"
SERVICE_USER="${SERVICE_USER:-www-data}"
SERVICE_NAME="${SERVICE_NAME:-matchscope}"
GIT_BRANCH="${GIT_BRANCH:-main}"
LOG_FILE="${LOG_FILE:-/var/log/matchscope-deploy.log}"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Execute com sudo: sudo bash deploy/update.sh" >&2
  exit 1
fi

if [[ ! -d "${INSTALL_DIR}/.git" ]]; then
  log "ERRO: ${INSTALL_DIR} não é um repositório git. Clone o projeto antes:"
  log "  git clone <seu-repo> ${INSTALL_DIR}"
  exit 1
fi

touch "$LOG_FILE"
chown "${SERVICE_USER}:${SERVICE_USER}" "$LOG_FILE" 2>/dev/null || true

NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"
NPM_CACHE="${INSTALL_DIR}/.npm-cache"

cd "$INSTALL_DIR"

BEFORE="$(git rev-parse HEAD)"
log "git fetch origin ${GIT_BRANCH}..."
git fetch origin "$GIT_BRANCH"

UPSTREAM="origin/${GIT_BRANCH}"
if ! git merge-base --is-ancestor HEAD "$UPSTREAM" 2>/dev/null; then
  log "AVISO: branch local divergiu de ${UPSTREAM} — pull abortado (faça merge manual)"
  exit 1
fi

if git merge-base --is-ancestor "$UPSTREAM" HEAD 2>/dev/null; then
  log "Nenhuma alteração no GitHub (${BEFORE:0:7})"
  exit 0
fi

log "git pull --ff-only origin ${GIT_BRANCH}..."
git pull --ff-only origin "$GIT_BRANCH"
AFTER="$(git rev-parse HEAD)"
log "Atualizado ${BEFORE:0:7} → ${AFTER:0:7}"

mkdir -p "$NPM_CACHE"
chown "$SERVICE_USER:$SERVICE_USER" "$NPM_CACHE"

log "npm ci..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" ci 2>/dev/null \
  || sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" install

log "npm run build..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" run build

log "exportando catálogo de jogos..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" "$NODE_BIN" server/export-match-catalog.mjs

log "npm prune --omit=dev..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" prune --omit=dev 2>/dev/null || true

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

log "reiniciando ${SERVICE_NAME}..."
systemctl restart "$SERVICE_NAME"
log "Deploy concluído."
