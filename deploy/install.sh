#!/usr/bin/env bash
#
# Instalação completa do MatchScope em uma VPS (Ubuntu/Debian).
#
# Uso (na raiz do projeto, após enviar/clonar o código):
#   sudo bash deploy/install.sh
#
# Variáveis opcionais:
#   INSTALL_DIR=/var/www/matchscope
#   SERVICE_USER=www-data
#   PORT=3000
#   TZ=America/Sao_Paulo
#   DOMAIN=matchscope.seudominio.com    # se definido, configura nginx
#   GIT_REPO=https://github.com/voce/matchscope.git  # clone em vez de rsync
#   GIT_BRANCH=main
#   THE_ODDS_API_KEY=...          # ou será solicitada interativamente
#   SKIP_NGINX=1                  # não instala/configura nginx
#   SKIP_NODE_INSTALL=1           # não tenta instalar Node.js
#
set -euo pipefail

# ── Cores ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
fail()  { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

# ── Caminhos ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INSTALL_DIR="${INSTALL_DIR:-/var/www/matchscope}"
SERVICE_USER="${SERVICE_USER:-www-data}"
SERVICE_NAME="${SERVICE_NAME:-matchscope}"
PORT="${PORT:-3000}"
TZ_CRON="${TZ:-America/Sao_Paulo}"
DOMAIN="${DOMAIN:-}"
GIT_REPO="${GIT_REPO:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
SKIP_NGINX="${SKIP_NGINX:-0}"
SKIP_NODE_INSTALL="${SKIP_NODE_INSTALL:-0}"

# ── Root ──────────────────────────────────────────────────────────────────────
if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  fail "Execute com sudo: sudo bash deploy/install.sh"
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  MatchScope — Instalação na VPS${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""
info "Diretório de instalação: ${INSTALL_DIR}"
info "Usuário do serviço:      ${SERVICE_USER}"
info "Porta HTTP interna:      ${PORT}"
info "Fuso horário (cron):     ${TZ_CRON}"
[[ -n "$DOMAIN" ]] && info "Domínio (nginx):         ${DOMAIN}"
echo ""

# ── Pacotes do sistema ────────────────────────────────────────────────────────
info "Instalando dependências do sistema (git, curl)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates rsync >/dev/null
ok "git e curl instalados"

if [[ "$SKIP_NGINX" != "1" && -n "$DOMAIN" ]]; then
  if ! dpkg -s nginx >/dev/null 2>&1; then
    info "Instalando nginx..."
    apt-get install -y -qq nginx >/dev/null
    ok "nginx instalado"
  else
    ok "nginx já instalado"
  fi
fi

# ── Node.js ─────────────────────────────────────────────────────────────────
need_node_install=false
if ! command -v node >/dev/null 2>&1; then
  need_node_install=true
elif [[ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]]; then
  warn "Node $(node -v) detectado — recomendado v20+"
  need_node_install=true
fi

if [[ "$need_node_install" == true && "$SKIP_NODE_INSTALL" != "1" ]]; then
  info "Instalando Node.js 20.x (NodeSource)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
  ok "Node.js $(node -v) instalado"
elif command -v node >/dev/null 2>&1; then
  ok "Node.js $(node -v) disponível"
else
  fail "Node.js não encontrado. Instale manualmente ou remova SKIP_NODE_INSTALL=1"
fi

NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

# ── Usuário do serviço ────────────────────────────────────────────────────────
if ! id "$SERVICE_USER" &>/dev/null; then
  info "Criando usuário ${SERVICE_USER}..."
  useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
  ok "Usuário ${SERVICE_USER} criado"
fi

# ── Código da aplicação ───────────────────────────────────────────────────────
USE_GIT=false

if [[ -n "$GIT_REPO" ]]; then
  USE_GIT=true
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    info "Repositório git já existe em ${INSTALL_DIR} — git pull..."
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" git fetch origin "$GIT_BRANCH" 2>/dev/null || \
      git fetch origin "$GIT_BRANCH"
    sudo -u "$SERVICE_USER" git pull --ff-only origin "$GIT_BRANCH" 2>/dev/null || \
      git pull --ff-only origin "$GIT_BRANCH"
    ok "Código atualizado via git"
  elif [[ -d "$INSTALL_DIR" ]] && [[ -n "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]]; then
    fail "${INSTALL_DIR} existe mas não é um clone git. Remova ou defina outro INSTALL_DIR."
  else
    info "Clonando ${GIT_REPO} → ${INSTALL_DIR}..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone --branch "$GIT_BRANCH" "$GIT_REPO" "$INSTALL_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    ok "Repositório clonado"
  fi
elif [[ -d "$INSTALL_DIR/.git" ]]; then
  USE_GIT=true
  ok "Diretório de instalação já é um repositório git: ${INSTALL_DIR}"
elif [[ "$(realpath "$PROJECT_ROOT")" != "$(realpath "$INSTALL_DIR")" ]]; then
  info "Copiando projeto para ${INSTALL_DIR} (sem git — use GIT_REPO para deploy automático)..."
  mkdir -p "$INSTALL_DIR"
  rsync -a --delete \
    --exclude node_modules \
    --exclude dist \
    --exclude .git \
    --exclude data/openfootball-worldcup \
    "$PROJECT_ROOT/" "$INSTALL_DIR/"
  ok "Código copiado"
else
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    USE_GIT=true
  fi
  ok "Usando diretório atual: ${INSTALL_DIR}"
fi

cd "$INSTALL_DIR"

# ── .env ──────────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  info "Configurando .env..."
  cp .env.example .env

  if [[ -z "${THE_ODDS_API_KEY:-}" ]]; then
    echo ""
    read -rp "The Odds API Key (THE_ODDS_API_KEY): " THE_ODDS_API_KEY
  fi

  if [[ -n "${THE_ODDS_API_KEY:-}" ]]; then
    sed -i "s|^THE_ODDS_API_KEY=.*|THE_ODDS_API_KEY=${THE_ODDS_API_KEY}|" .env
  else
    warn "THE_ODDS_API_KEY vazio — configure depois em ${INSTALL_DIR}/.env"
  fi

  # Chaves legadas (opcionais)
  if [[ -n "${API_FOOTBALL_KEY:-}" ]]; then
    sed -i "s|^API_FOOTBALL_KEY=.*|API_FOOTBALL_KEY=${API_FOOTBALL_KEY}|" .env
  fi
  if [[ -n "${FOOTBALL_DATA_TOKEN:-}" ]]; then
    sed -i "s|^FOOTBALL_DATA_TOKEN=.*|FOOTBALL_DATA_TOKEN=${FOOTBALL_DATA_TOKEN}|" .env
  fi

  chmod 600 .env
  ok ".env criado"
else
  ok ".env já existe — mantido"
fi

# ── Permissões ────────────────────────────────────────────────────────────────
info "Ajustando permissões em ${INSTALL_DIR} para ${SERVICE_USER}..."
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
PARENT_DIR="$(dirname "$INSTALL_DIR")"
if [[ "$PARENT_DIR" == /home/* && -d "$PARENT_DIR" ]]; then
  chmod o+x "$PARENT_DIR" 2>/dev/null || true
fi
ok "Permissões ok"

# ── Build ─────────────────────────────────────────────────────────────────────
NPM_CACHE="${INSTALL_DIR}/.npm-cache"
mkdir -p "$NPM_CACHE"
chown "$SERVICE_USER:$SERVICE_USER" "$NPM_CACHE"

info "Instalando dependências npm..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" ci 2>/dev/null \
  || sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" install

info "Gerando build de produção..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" run build

info "Exportando catálogo de jogos..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" "$NODE_BIN" server/export-match-catalog.mjs

info "Removendo devDependencies (opcional, economiza espaço)..."
sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" npm_config_cache="$NPM_CACHE" \
  "$NPM_BIN" prune --omit=dev 2>/dev/null || true

mkdir -p data
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
ok "Build concluído"

# ── Dados iniciais ────────────────────────────────────────────────────────────
info "Buscando odds iniciais (The Odds API)..."
if sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" "$NODE_BIN" server/fetch-odds.mjs morning; then
  ok "odds.json atualizado"
else
  warn "fetch-odds falhou — verifique THE_ODDS_API_KEY em .env"
fi

info "Sincronizando placares (openfootball/worldcup.json)..."
if sudo -u "$SERVICE_USER" env HOME="$INSTALL_DIR" "$NODE_BIN" server/pull-worldcup.mjs; then
  ok "matches-sync.json atualizado"
else
  warn "pull-worldcup falhou — verifique se git está acessível"
fi

# ── Logs ──────────────────────────────────────────────────────────────────────
touch /var/log/matchscope-odds.log /var/log/matchscope-worldcup.log /var/log/matchscope-deploy.log
chown "$SERVICE_USER:$SERVICE_USER" /var/log/matchscope-odds.log /var/log/matchscope-worldcup.log /var/log/matchscope-deploy.log
chmod 644 /var/log/matchscope-odds.log /var/log/matchscope-worldcup.log /var/log/matchscope-deploy.log
ok "Logs em /var/log/matchscope-*.log"

# ── systemd ─────────────────────────────────────────────────────────────────
info "Configurando serviço systemd (${SERVICE_NAME})..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=MatchScope
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env
Environment=PORT=${PORT}
Environment=NODE_ENV=production
ExecStart=${NODE_BIN} server/index.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}" >/dev/null
systemctl restart "${SERVICE_NAME}"
sleep 1

if systemctl is-active --quiet "${SERVICE_NAME}"; then
  ok "Serviço ${SERVICE_NAME} ativo na porta ${PORT}"
else
  fail "Serviço não iniciou. Verifique: journalctl -u ${SERVICE_NAME} -n 50"
fi

# ── Cron ──────────────────────────────────────────────────────────────────────
info "Configurando crontab (${SERVICE_USER})..."
CRON_FILE="/tmp/matchscope-cron-${SERVICE_USER}"
cat > "$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
TZ=${TZ_CRON}

# The Odds API — 4×/dia
0 8 * * * cd ${INSTALL_DIR} && ${NODE_BIN} server/fetch-odds.mjs morning >> /var/log/matchscope-odds.log 2>&1
0 14 * * * cd ${INSTALL_DIR} && ${NODE_BIN} server/fetch-odds.mjs afternoon >> /var/log/matchscope-odds.log 2>&1
0 20 * * * cd ${INSTALL_DIR} && ${NODE_BIN} server/fetch-odds.mjs evening >> /var/log/matchscope-odds.log 2>&1
0 2 * * * cd ${INSTALL_DIR} && ${NODE_BIN} server/fetch-odds.mjs night >> /var/log/matchscope-odds.log 2>&1

# openfootball/worldcup.json — a cada 10 min
*/10 * * * * cd ${INSTALL_DIR} && ${NODE_BIN} server/pull-worldcup.mjs >> /var/log/matchscope-worldcup.log 2>&1
EOF

if [[ "$USE_GIT" == true ]]; then
  cat > "/etc/cron.d/${SERVICE_NAME}-deploy" <<EOF
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
# MatchScope — deploy automático do GitHub (git pull + build + restart)
*/5 * * * * root bash ${INSTALL_DIR}/deploy/update.sh >> /var/log/matchscope-deploy.log 2>&1
EOF
  chmod 644 "/etc/cron.d/${SERVICE_NAME}-deploy"
fi

crontab -u "$SERVICE_USER" "$CRON_FILE"
rm -f "$CRON_FILE"
if [[ "$USE_GIT" == true ]]; then
  ok "Crontab instalado (odds 4×/dia + worldcup 10 min + deploy git 5 min via /etc/cron.d)"
else
  ok "Crontab instalado (odds 4×/dia + worldcup a cada 10 min)"
fi

# ── Nginx (opcional) ──────────────────────────────────────────────────────────
if [[ "$SKIP_NGINX" != "1" && -n "$DOMAIN" ]]; then
  info "Configurando nginx para ${DOMAIN}..."
  NGINX_SITE="/etc/nginx/sites-available/${SERVICE_NAME}"
  sed -e "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" \
      -e "s|PORT_PLACEHOLDER|${PORT}|g" \
      "$SCRIPT_DIR/nginx.conf.example" > "$NGINX_SITE"

  ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${SERVICE_NAME}"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t
  systemctl reload nginx
  ok "nginx configurado — http://${DOMAIN}"
  echo ""
  warn "HTTPS: após o DNS apontar para esta VPS, rode:"
  echo "       sudo apt install -y certbot python3-certbot-nginx"
  echo "       sudo certbot --nginx -d ${DOMAIN}"
elif [[ "$SKIP_NGINX" == "1" ]]; then
  warn "nginx ignorado (SKIP_NGINX=1)"
else
  warn "DOMAIN não definido — app disponível em http://SEU_IP:${PORT}"
  echo "       Para nginx: sudo DOMAIN=matchscope.seudominio.com bash deploy/install.sh"
fi

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Instalação concluída!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  App:      ${INSTALL_DIR}"
if [[ -n "$DOMAIN" && "$SKIP_NGINX" != "1" ]]; then
  echo "  URL:      http://${DOMAIN}"
else
  echo "  URL:      http://$(hostname -I | awk '{print $1}'):${PORT}"
fi
echo "  Serviço:  systemctl status ${SERVICE_NAME}"
echo "  Logs:     journalctl -u ${SERVICE_NAME} -f"
echo "  Odds:     tail -f /var/log/matchscope-odds.log"
echo "  Jogos:    tail -f /var/log/matchscope-worldcup.log"
if [[ "$USE_GIT" == true ]]; then
  echo "  Deploy:   tail -f /var/log/matchscope-deploy.log"
fi
echo "  .env:     ${INSTALL_DIR}/.env"
echo ""
echo "  Comandos úteis:"
echo "    sudo systemctl restart ${SERVICE_NAME}"
echo "    sudo -u ${SERVICE_USER} ${NODE_BIN} server/fetch-odds.mjs morning"
echo "    sudo -u ${SERVICE_USER} ${NODE_BIN} server/pull-worldcup.mjs"
echo ""
