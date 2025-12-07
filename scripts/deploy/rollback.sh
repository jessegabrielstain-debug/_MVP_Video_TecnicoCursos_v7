#!/bin/bash
# Rollback Script para MVP Video TecnicoCursos
# Automatiza reversão de deploy com health checks

set -euo pipefail

# ==============================================
# Configuração
# ==============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/rollback-$(date +%Y%m%d-%H%M%S).log"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_RETRIES=3

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================
# Funções Auxiliares
# ==============================================

log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
  log "INFO" "${BLUE}$@${NC}"
}

log_success() {
  log "SUCCESS" "${GREEN}$@${NC}"
}

log_warning() {
  log "WARNING" "${YELLOW}$@${NC}"
}

log_error() {
  log "ERROR" "${RED}$@${NC}"
}

# ==============================================
# Health Check
# ==============================================

check_health() {
  local url=$1
  local retries=${2:-$HEALTH_CHECK_RETRIES}
  
  log_info "Verificando saúde da aplicação em: $url"
  
  for i in $(seq 1 $retries); do
    if curl -f -s -m $HEALTH_CHECK_TIMEOUT "$url" > /dev/null; then
      log_success "✅ Health check OK (tentativa $i/$retries)"
      return 0
    fi
    
    log_warning "⚠️ Health check falhou (tentativa $i/$retries)"
    if [ $i -lt $retries ]; then
      sleep 5
    fi
  done
  
  log_error "❌ Health check falhou após $retries tentativas"
  return 1
}

# ==============================================
# Git Rollback
# ==============================================

rollback_git() {
  local target_commit=${1:-HEAD~1}
  
  log_info "Iniciando rollback Git para: $target_commit"
  
  cd "$PROJECT_ROOT"
  
  # Verifica se há mudanças não commitadas
  if ! git diff-index --quiet HEAD --; then
    log_error "❌ Há mudanças não commitadas. Commite ou descarte antes de fazer rollback."
    return 1
  fi
  
  # Obtém hash do commit atual (para log)
  local current_commit=$(git rev-parse HEAD)
  log_info "Commit atual: $current_commit"
  
  # Obtém hash do commit de destino
  local target_hash=$(git rev-parse "$target_commit")
  log_info "Commit de destino: $target_hash"
  
  # Confirma rollback
  if [ "${AUTO_APPROVE:-false}" != "true" ]; then
    read -p "Confirma rollback de $current_commit para $target_hash? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      log_warning "⚠️ Rollback cancelado pelo usuário"
      return 1
    fi
  fi
  
  # Executa revert (cria novo commit)
  log_info "Revertendo para $target_hash..."
  if git revert --no-commit "$target_hash..HEAD"; then
    git commit -m "chore: rollback to $target_hash [automated]"
    log_success "✅ Git rollback executado"
    return 0
  else
    log_error "❌ Falha ao executar git revert"
    git revert --abort 2>/dev/null || true
    return 1
  fi
}

# ==============================================
# Database Rollback
# ==============================================

rollback_database() {
  local migration_name=$1
  
  log_info "Executando rollback de migration: $migration_name"
  
  cd "$PROJECT_ROOT"
  
  # Verifica se migration existe
  if [ ! -f "database-migrations/${migration_name}.down.sql" ]; then
    log_error "❌ Migration down não encontrada: $migration_name"
    return 1
  fi
  
  # Executa migration down via Supabase CLI
  if command -v supabase &> /dev/null; then
    log_info "Executando migration down..."
    supabase db push --dry-run "database-migrations/${migration_name}.down.sql"
    
    if [ "${AUTO_APPROVE:-false}" != "true" ]; then
      read -p "Confirma execução da migration down? (yes/no): " confirm
      if [ "$confirm" != "yes" ]; then
        log_warning "⚠️ Database rollback cancelado"
        return 1
      fi
    fi
    
    supabase db push "database-migrations/${migration_name}.down.sql"
    log_success "✅ Database rollback executado"
    return 0
  else
    log_error "❌ Supabase CLI não instalado"
    return 1
  fi
}

# ==============================================
# Service Restart
# ==============================================

restart_services() {
  log_info "Reiniciando serviços..."
  
  # PM2 (produção)
  if command -v pm2 &> /dev/null; then
    log_info "Reiniciando via PM2..."
    pm2 restart all
    sleep 5
    log_success "✅ Serviços PM2 reiniciados"
  fi
  
  # Docker (se aplicável)
  if [ -f "$PROJECT_ROOT/docker-compose.yml" ] && command -v docker-compose &> /dev/null; then
    log_info "Reiniciando via Docker Compose..."
    docker-compose restart
    sleep 10
    log_success "✅ Serviços Docker reiniciados"
  fi
  
  # Systemd (se aplicável)
  if command -v systemctl &> /dev/null && systemctl is-active --quiet mvp-video; then
    log_info "Reiniciando via Systemd..."
    sudo systemctl restart mvp-video
    sleep 5
    log_success "✅ Serviço Systemd reiniciado"
  fi
}

# ==============================================
# Alertas
# ==============================================

send_alerts() {
  local status=$1
  local message=$2
  
  log_info "Enviando alertas: $status"
  
  # Slack (se configurado)
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"🚨 Rollback $status: $message\"}" \
      2>/dev/null || log_warning "Falha ao enviar alerta Slack"
  fi
  
  # Sentry (se configurado)
  if [ -n "${SENTRY_DSN:-}" ] && command -v sentry-cli &> /dev/null; then
    sentry-cli send-event -m "Rollback $status: $message" \
      -t level:error -t environment:production \
      2>/dev/null || log_warning "Falha ao enviar alerta Sentry"
  fi
  
  # Email (se configurado)
  if [ -n "${ALERT_EMAIL:-}" ] && command -v mail &> /dev/null; then
    echo "$message" | mail -s "🚨 Rollback $status" "$ALERT_EMAIL" \
      2>/dev/null || log_warning "Falha ao enviar email"
  fi
}

# ==============================================
# Main Rollback
# ==============================================

main() {
  log_info "=========================================="
  log_info "Iniciando Rollback - MVP Video TecnicoCursos"
  log_info "=========================================="
  
  local rollback_type=${1:-git}
  local rollback_target=${2:-HEAD~1}
  
  case "$rollback_type" in
    git)
      log_info "Tipo: Git Rollback"
      if ! rollback_git "$rollback_target"; then
        send_alerts "FAILED" "Git rollback falhou para $rollback_target"
        exit 1
      fi
      ;;
      
    database)
      log_info "Tipo: Database Rollback"
      if ! rollback_database "$rollback_target"; then
        send_alerts "FAILED" "Database rollback falhou para $rollback_target"
        exit 1
      fi
      ;;
      
    full)
      log_info "Tipo: Full Rollback (Git + Database)"
      local git_target=${2:-HEAD~1}
      local db_target=${3:-latest}
      
      if ! rollback_git "$git_target"; then
        send_alerts "FAILED" "Full rollback - Git falhou"
        exit 1
      fi
      
      if ! rollback_database "$db_target"; then
        send_alerts "FAILED" "Full rollback - Database falhou"
        # Tenta reverter git rollback
        git reset --hard HEAD~1
        exit 1
      fi
      ;;
      
    *)
      log_error "Tipo de rollback inválido: $rollback_type"
      log_info "Uso: $0 [git|database|full] [target]"
      exit 1
      ;;
  esac
  
  # Reinicia serviços
  restart_services
  
  # Health check pós-rollback
  log_info "Verificando saúde pós-rollback..."
  if check_health "$HEALTH_CHECK_URL"; then
    log_success "=========================================="
    log_success "✅ ROLLBACK CONCLUÍDO COM SUCESSO"
    log_success "=========================================="
    send_alerts "SUCCESS" "Rollback executado e aplicação está saudável"
    exit 0
  else
    log_error "=========================================="
    log_error "❌ ROLLBACK CONCLUÍDO MAS HEALTH CHECK FALHOU"
    log_error "=========================================="
    send_alerts "WARNING" "Rollback executado mas health check falhou"
    exit 2
  fi
}

# ==============================================
# Execução
# ==============================================

# Cria diretório de logs
mkdir -p "$(dirname "$LOG_FILE")"

# Executa main com todos os argumentos
main "$@"
