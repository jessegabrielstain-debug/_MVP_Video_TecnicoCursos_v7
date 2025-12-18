#!/bin/bash

###############################################################################
# ROLLBACK SCRIPT
# Versão: 1.0
# Data: 17 de Dezembro de 2025
# 
# Reverte o deploy para um commit anterior
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}Erro: Informe o commit hash para rollback${NC}"
    echo "Uso: ./scripts/rollback.sh <commit-hash>"
    echo ""
    echo "Últimos commits:"
    git log --oneline -10
    exit 1
fi

ROLLBACK_COMMIT=$1
CURRENT_COMMIT=$(git rev-parse HEAD)
BACKUP_DIR="backups/rollback_$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                    ROLLBACK DE DEPLOY                         ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Commit atual:  ${CURRENT_COMMIT}"
echo -e "Rollback para: ${ROLLBACK_COMMIT}"
echo ""

# Confirm
read -p "Deseja continuar com o rollback? (digite 'SIM'): " confirm

if [ "$confirm" != "SIM" ]; then
    echo -e "${RED}Rollback cancelado.${NC}"
    exit 1
fi

###############################################################################
# 1. Create Backup
###############################################################################
echo ""
echo -e "${BLUE}[1/8] Criando backup do estado atual...${NC}"

mkdir -p "$BACKUP_DIR"
echo "$CURRENT_COMMIT" > "$BACKUP_DIR/current_commit.txt"
echo "Backup criado em: $BACKUP_DIR"

###############################################################################
# 2. Stop Services
###############################################################################
echo ""
echo -e "${BLUE}[2/8] Parando serviços...${NC}"

if command -v pm2 &> /dev/null; then
    pm2 stop estudio-ia-videos || true
    echo -e "${GREEN}✓${NC} Serviços parados"
else
    echo -e "${YELLOW}⚠${NC} PM2 não disponível. Pare os serviços manualmente."
fi

###############################################################################
# 3. Git Checkout
###############################################################################
echo ""
echo -e "${BLUE}[3/8] Revertendo código...${NC}"

# Stash any uncommitted changes
git stash

# Checkout to rollback commit
if git checkout "$ROLLBACK_COMMIT"; then
    echo -e "${GREEN}✓${NC} Código revertido para $ROLLBACK_COMMIT"
else
    echo -e "${RED}✗${NC} Falha ao reverter código"
    git checkout "$CURRENT_COMMIT"
    exit 1
fi

###############################################################################
# 4. Install Dependencies
###############################################################################
echo ""
echo -e "${BLUE}[4/8] Instalando dependências...${NC}"

cd app
npm ci --production

echo -e "${GREEN}✓${NC} Dependências instaladas"

###############################################################################
# 5. Database Rollback (opcional)
###############################################################################
echo ""
echo -e "${BLUE}[5/8] Banco de dados...${NC}"

read -p "Deseja fazer rollback do banco? (s/N): " db_rollback

if [ "$db_rollback" = "s" ] || [ "$db_rollback" = "S" ]; then
    echo "Liste os backups disponíveis:"
    ls -lt backups/ | head -10
    echo ""
    read -p "Informe o diretório do backup: " backup_path
    
    if [ -f "$backup_path/database.sql" ]; then
        echo "Restaurando banco..."
        psql $DATABASE_URL < "$backup_path/database.sql"
        echo -e "${GREEN}✓${NC} Banco restaurado"
    else
        echo -e "${YELLOW}⚠${NC} Backup não encontrado. Pule o rollback do banco."
    fi
else
    echo -e "${YELLOW}⚠${NC} Rollback do banco pulado"
fi

###############################################################################
# 6. Build Application
###############################################################################
echo ""
echo -e "${BLUE}[6/8] Building aplicação...${NC}"

if npm run build; then
    echo -e "${GREEN}✓${NC} Build concluído"
else
    echo -e "${RED}✗${NC} Build falhou"
    echo ""
    echo -e "${RED}Revertendo para commit original...${NC}"
    git checkout "$CURRENT_COMMIT"
    exit 1
fi

###############################################################################
# 7. Start Services
###############################################################################
echo ""
echo -e "${BLUE}[7/8] Iniciando serviços...${NC}"

if command -v pm2 &> /dev/null; then
    pm2 restart estudio-ia-videos || pm2 start npm --name "estudio-ia-videos" -- start
    pm2 save
    echo -e "${GREEN}✓${NC} Serviços iniciados"
else
    echo -e "${YELLOW}⚠${NC} Inicie os serviços manualmente"
fi

###############################################################################
# 8. Health Check
###############################################################################
echo ""
echo -e "${BLUE}[8/8] Verificando saúde do sistema...${NC}"

sleep 10

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"

if curl -f "$HEALTH_URL" &>/dev/null; then
    echo -e "${GREEN}✓${NC} Sistema saudável"
else
    echo -e "${RED}✗${NC} Health check falhou"
    echo "Verifique os logs: pm2 logs estudio-ia-videos"
fi

###############################################################################
# SUMMARY
###############################################################################
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                ✓ ROLLBACK CONCLUÍDO                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Detalhes:"
echo "  - De: $CURRENT_COMMIT"
echo "  - Para: $ROLLBACK_COMMIT"
echo "  - Backup: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Monitorar logs: pm2 logs estudio-ia-videos"
echo "  2. Verificar funcionalidades críticas"
echo "  3. Notificar equipe sobre rollback"
echo ""
echo -e "${BLUE}Para reverter o rollback (voltar):${NC}"
echo "  git checkout $CURRENT_COMMIT"
echo "  npm ci"
echo "  npm run build"
echo "  pm2 restart estudio-ia-videos"
echo ""
