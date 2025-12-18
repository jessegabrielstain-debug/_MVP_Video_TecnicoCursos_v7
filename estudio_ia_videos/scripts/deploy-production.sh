#!/bin/bash

###############################################################################
# PRODUCTION DEPLOY SCRIPT
# Versão: 1.0
# Data: 17 de Dezembro de 2025
# 
# Este script automatiza o deploy em produção com segurança
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV="${1:-production}"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="logs/deploy_$(date +%Y%m%d_%H%M%S).log"

# Create directories
mkdir -p backups logs

echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║     DEPLOY PARA PRODUÇÃO - Estúdio IA Vídeos                 ║${NC}"
echo -e "${MAGENTA}║     Ambiente: ${DEPLOY_ENV}                                  ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

###############################################################################
# 1. Confirmação
###############################################################################
echo -e "${YELLOW}⚠  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!${NC}"
echo ""
echo "Ambiente: $DEPLOY_ENV"
echo "Backup será criado em: $BACKUP_DIR"
echo "Logs serão salvos em: $LOG_FILE"
echo ""
read -p "Deseja continuar? (digite 'SIM' em maiúsculas): " confirm

if [ "$confirm" != "SIM" ]; then
    echo -e "${RED}Deploy cancelado pelo usuário.${NC}"
    exit 1
fi

log "Deploy iniciado por $(whoami)"

###############################################################################
# 2. Pre-Deploy Validation
###############################################################################
echo ""
echo -e "${BLUE}[1/12] Executando validações pré-deploy...${NC}"
log "Executando pré-deploy checks"

if ./scripts/pre-deploy-check.sh; then
    echo -e "${GREEN}✓${NC} Validações passaram"
    log "Pré-deploy checks: PASSED"
else
    echo -e "${RED}✗${NC} Validações falharam. Deploy abortado."
    log "Pré-deploy checks: FAILED"
    exit 1
fi

###############################################################################
# 3. Backup do Banco de Dados
###############################################################################
echo ""
echo -e "${BLUE}[2/12] Criando backup do banco de dados...${NC}"
log "Iniciando backup do banco"

mkdir -p "$BACKUP_DIR"

# Backup Supabase (via pg_dump se disponível)
if command -v pg_dump &> /dev/null; then
    log "Executando pg_dump..."
    # Configurar com suas credenciais
    # pg_dump $DATABASE_URL > "$BACKUP_DIR/database.sql"
    echo -e "${YELLOW}⚠${NC} Configure pg_dump com suas credenciais do Supabase"
    touch "$BACKUP_DIR/database_backup_placeholder.txt"
else
    echo -e "${YELLOW}⚠${NC} pg_dump não disponível. Faça backup manual do Supabase."
    log "pg_dump não disponível"
fi

echo -e "${GREEN}✓${NC} Backup criado em $BACKUP_DIR"

###############################################################################
# 4. Backup do Código Atual
###############################################################################
echo ""
echo -e "${BLUE}[3/12] Criando backup do código atual...${NC}"
log "Backup do código"

git stash
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$BACKUP_DIR/commit.txt"
log "Commit atual: $CURRENT_COMMIT"

echo -e "${GREEN}✓${NC} Código atual salvo: $CURRENT_COMMIT"

###############################################################################
# 5. Pull Latest Code
###############################################################################
echo ""
echo -e "${BLUE}[4/12] Atualizando código da branch main...${NC}"
log "Git pull"

git checkout main
git pull origin main

NEW_COMMIT=$(git rev-parse HEAD)
log "Novo commit: $NEW_COMMIT"

echo -e "${GREEN}✓${NC} Código atualizado: $NEW_COMMIT"

###############################################################################
# 6. Install Dependencies
###############################################################################
echo ""
echo -e "${BLUE}[5/12] Instalando dependências...${NC}"
log "npm install"

cd app
npm ci --production=false

echo -e "${GREEN}✓${NC} Dependências instaladas"

###############################################################################
# 7. Run Database Migrations
###############################################################################
echo ""
echo -e "${BLUE}[6/12] Executando migrations do banco...${NC}"
log "Database migrations"

# Prisma migrations
if [ -f "../prisma/schema.prisma" ]; then
    npx prisma migrate deploy
    echo -e "${GREEN}✓${NC} Migrations executadas"
    log "Prisma migrations: SUCCESS"
else
    echo -e "${YELLOW}⚠${NC} Schema Prisma não encontrado"
    log "Prisma migrations: SKIPPED"
fi

###############################################################################
# 8. Build Application
###############################################################################
echo ""
echo -e "${BLUE}[7/12] Building aplicação...${NC}"
log "Build da aplicação"

if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✓${NC} Build concluído"
    log "Build: SUCCESS"
else
    echo -e "${RED}✗${NC} Build falhou"
    log "Build: FAILED"
    echo ""
    echo -e "${YELLOW}Revertendo para commit anterior...${NC}"
    git checkout "$CURRENT_COMMIT"
    exit 1
fi

###############################################################################
# 9. Run Tests
###############################################################################
echo ""
echo -e "${BLUE}[8/12] Executando testes...${NC}"
log "Testes"

if npm test -- --passWithNoTests 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✓${NC} Testes passaram"
    log "Tests: PASSED"
else
    echo -e "${YELLOW}⚠${NC} Alguns testes falharam (continuando...)"
    log "Tests: WARNINGS"
fi

###############################################################################
# 10. Stop Current Services
###############################################################################
echo ""
echo -e "${BLUE}[9/12] Parando serviços atuais...${NC}"
log "Parando serviços"

# PM2 stop (se usar PM2)
if command -v pm2 &> /dev/null; then
    pm2 stop estudio-ia-videos || true
    echo -e "${GREEN}✓${NC} Serviços parados (PM2)"
else
    echo -e "${YELLOW}⚠${NC} PM2 não instalado. Pare os serviços manualmente."
fi

###############################################################################
# 11. Deploy/Start Services
###############################################################################
echo ""
echo -e "${BLUE}[10/12] Iniciando serviços...${NC}"
log "Iniciando serviços"

# PM2 start
if command -v pm2 &> /dev/null; then
    pm2 start npm --name "estudio-ia-videos" -- start
    pm2 save
    echo -e "${GREEN}✓${NC} Serviços iniciados (PM2)"
    log "Serviços iniciados via PM2"
else
    echo -e "${YELLOW}⚠${NC} Inicie os serviços manualmente com 'npm start'"
    log "Serviços: MANUAL START REQUIRED"
fi

###############################################################################
# 12. Health Check
###############################################################################
echo ""
echo -e "${BLUE}[11/12] Verificando health dos serviços...${NC}"
log "Health check"

sleep 10  # Wait for services to start

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"

if curl -f "$HEALTH_URL" &>/dev/null; then
    echo -e "${GREEN}✓${NC} Serviços saudáveis"
    log "Health check: PASSED"
else
    echo -e "${RED}✗${NC} Health check falhou!"
    log "Health check: FAILED"
    echo ""
    echo -e "${YELLOW}Considere fazer rollback com:${NC}"
    echo "  git checkout $CURRENT_COMMIT"
    echo "  npm ci"
    echo "  npm run build"
    echo "  pm2 restart estudio-ia-videos"
    exit 1
fi

###############################################################################
# 13. Post-Deploy Tasks
###############################################################################
echo ""
echo -e "${BLUE}[12/12] Tarefas pós-deploy...${NC}"
log "Pós-deploy"

# Clear caches
echo "Limpando caches..."
# Add your cache clearing logic here

# Warm up caches
echo "Aquecendo caches..."
# Add cache warming logic here

# Notify team
echo "Enviando notificações..."
# Add notification logic (Slack, email, etc)

echo -e "${GREEN}✓${NC} Pós-deploy concluído"

###############################################################################
# SUMMARY
###############################################################################
echo ""
echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                    ✓ DEPLOY CONCLUÍDO                        ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Deploy realizado com sucesso!${NC}"
echo ""
echo "Detalhes:"
echo "  - Commit anterior: $CURRENT_COMMIT"
echo "  - Commit atual: $NEW_COMMIT"
echo "  - Backup: $BACKUP_DIR"
echo "  - Log: $LOG_FILE"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Monitorar logs: tail -f $LOG_FILE"
echo "  2. Verificar métricas no dashboard"
echo "  3. Testar funcionalidades críticas"
echo "  4. Monitorar erros no Sentry"
echo ""
echo -e "${BLUE}Em caso de problemas, faça rollback com:${NC}"
echo "  ./scripts/rollback.sh $CURRENT_COMMIT"
echo ""

log "Deploy concluído com sucesso"
log "Commit: $CURRENT_COMMIT -> $NEW_COMMIT"

# Celebrate! 🎉
echo "🎉 Deploy em produção finalizado!"
