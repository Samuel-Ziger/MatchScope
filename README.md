# MatchScope

Plataforma de análise de probabilidades da Copa do Mundo FIFA 2026.

## Fontes de dados

| Métrica | Fonte | Referência |
|---------|-------|------------|
| Prob. de título | Kalshi + Polymarket | [DeFi Rate](https://defirate.com/prediction-markets/world-cup-odds/) |
| Prob. de grupo/oitavas | Kalshi / Polymarket | DeFi Rate World Cup Tracker |
| Rating Elo | World Football Elo Ratings | [eloratings.net](https://www.eloratings.net/) |
| Ranking FIFA | FIFA World Ranking | [fifa.com](https://www.fifa.com/fifa-world-ranking/men) |

Dados compilados em **23 de junho de 2026**.

## Funcionalidades

- **Visão Geral** — KPIs e resumo do mercado
- **Probabilidades** — Tabela completa com 48 seleções, filtros e ordenação
- **Simulação** — Monte Carlo com parâmetros ajustáveis
- **Confronto** — Head-to-head baseado em Elo
- **Análise** — Gráficos comparativos Kalshi vs Polymarket
- **Metodologia** — Documentação das fontes e cálculos

## Executar (desenvolvimento)

```bash
npm install
npm run dev
```

## Instalação automática na VPS

Na VPS (Ubuntu/Debian), após clonar ou enviar o projeto:

```bash
cd matchscope   # pasta do projeto
sudo bash deploy/install.sh
```

Com domínio e chave da Odds API (sem prompts):

```bash
sudo DOMAIN=matchscope.seudominio.com \
     THE_ODDS_API_KEY=sua_chave \
     TZ=America/Sao_Paulo \
     bash deploy/install.sh
```

O script instala Node.js, git, faz build, configura `.env`, systemd, crontab (odds + worldcup) e nginx (se `DOMAIN` estiver definido).

### Deploy automático do GitHub

São **dois pulls separados** na VPS:

| Repositório | O quê | Onde fica | Cron |
|-------------|-------|-----------|------|
| **Seu** MatchScope no GitHub | Código do app (frontend + servidor) | `/var/www/matchscope` | A cada **5 min** (`deploy/update.sh`) |
| **openfootball/worldcup.json** | Placares da Copa | `data/openfootball-worldcup/` | A cada **10 min** (`pull-worldcup.mjs`) |

Instalação recomendada (clone + cron de deploy):

```bash
sudo GIT_REPO=https://github.com/SEU_USUARIO/matchscope.git \
     GIT_BRANCH=main \
     DOMAIN=matchscope.seudominio.com \
     THE_ODDS_API_KEY=sua_chave \
     TZ=America/Sao_Paulo \
     bash deploy/install.sh
```

Ou clone manualmente e rode o install dentro da pasta:

```bash
sudo git clone https://github.com/SEU_USUARIO/matchscope.git /var/www/matchscope
cd /var/www/matchscope
sudo bash deploy/install.sh
```

Depois de cada `git push` no GitHub, a VPS atualiza sozinha em até 5 minutos (pull → build → restart).

Teste manual do deploy:

```bash
sudo bash /var/www/matchscope/deploy/update.sh
tail -f /var/log/matchscope-deploy.log
```

**Repositório privado:** configure uma [deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) no servidor (SSH) e use `GIT_REPO=git@github.com:SEU_USUARIO/matchscope.git`.

Arquivos gerados na VPS (`data/odds.json`, `data/votes.json`, `data/matches-sync.json`) estão no `.gitignore` e **não são sobrescritos** pelo pull do app.

## Hospedar na VPS (manual)

### 1. Build e variáveis

```bash
npm install
npm run build
cp .env.example .env   # preencher chaves
```

### 2. Servidor Node (systemd)

```bash
sudo cp deploy/matchscope.service.example /etc/systemd/system/matchscope.service
# Edite WorkingDirectory e User no arquivo
sudo systemctl daemon-reload
sudo systemctl enable --now matchscope
```

O app fica em `http://0.0.0.0:3000` (ou atrás de nginx na porta 80/443).

### 3. Cron — The Odds API (4×/dia)

As odds **não** são buscadas pelo botão Atualizar nem pelo navegador. O cron na VPS grava `data/odds.json`:

```bash
crontab -e
# Cole o conteúdo de deploy/crontab.example (ajuste o caminho)
```

Horários padrão: **08:00, 14:00, 20:00 e 02:00** (fuso do servidor — use `TZ=America/Sao_Paulo` no crontab se precisar).

Teste manual:

```bash
npm run fetch-odds morning
```

### Arquitetura

| Dado | Origem | Quando |
|------|--------|--------|
| Placares (grupos) | [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) | Cron na VPS — **a cada 10 min** (`git pull`) |
| Prob. de título | The Odds API | Cron na VPS — 4×/dia |
| Botão **Atualizar** | Recarrega `data/matches-sync.json` | Sob demanda |

### 4. Cron — openfootball (10 min)

```bash
# Já incluído em deploy/crontab.example:
*/10 * * * * cd /var/www/matchscope && node server/pull-worldcup.mjs >> /var/log/matchscope-worldcup.log 2>&1
```

Teste manual:

```bash
npm run export-catalog   # gera data/match-catalog.json a partir de matches.ts
npm run pull-worldcup    # git pull + parse → data/matches-sync.json
```

**Requisito na VPS:** `git` instalado (o script clona `openfootball/worldcup.json` em `data/openfootball-worldcup/`).

### Arquitetura (odds)
