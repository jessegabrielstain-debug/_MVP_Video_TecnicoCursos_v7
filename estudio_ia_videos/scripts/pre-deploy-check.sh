#!/bin/bash

###############################################################################
# PRE-DEPLOY VALIDATION SCRIPT
# Versão: 1.0
# Data: 17 de Dezembro de 2025
# 
# Este script executa todas as validações necessárias antes do deploy
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       PRE-DEPLOY VALIDATION - Estúdio IA Vídeos        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# 1. Environment Check
###############################################################################
echo -e "${BLUE}[1/10] Verificando ambiente...${NC}"

if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} Arquivo .env.production encontrado"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Arquivo .env.production não encontrado"
    ((FAILED++))
fi

# Check required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "ELEVENLABS_API_KEY"
    "DATABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var=" .env.production 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $var configurado"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $var não configurado"
        ((FAILED++))
    fi
done

echo ""

###############################################################################
# 2. Dependencies Check
###############################################################################
echo -e "${BLUE}[2/10] Verificando dependências...${NC}"

cd app

if npm list pptxgenjs &>/dev/null; then
    echo -e "${GREEN}✓${NC} pptxgenjs instalado"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} pptxgenjs não instalado"
    ((FAILED++))
fi

if npm list socket.io &>/dev/null; then
    echo -e "${GREEN}✓${NC} socket.io instalado"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} socket.io não instalado"
    ((FAILED++))
fi

if npm list socket.io-client &>/dev/null; then
    echo -e "${GREEN}✓${NC} socket.io-client instalado"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} socket.io-client não instalado"
    ((FAILED++))
fi

echo ""

###############################################################################
# 3. TypeScript Check
###############################################################################
echo -e "${BLUE}[3/10] Verificando TypeScript...${NC}"

if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
    echo -e "${RED}✗${NC} Erros TypeScript encontrados"
    ((FAILED++))
else
    echo -e "${GREEN}✓${NC} Zero erros TypeScript"
    ((PASSED++))
fi

echo ""

###############################################################################
# 4. Mock Files Check
###############################################################################
echo -e "${BLUE}[4/10] Verificando remoção de mocks...${NC}"

MOCK_FILES=(
    "lib/render-jobs/mock-store.ts"
    "lib/projects/mockStore.ts"
    "lib/slides/mockStore.ts"
)

for file in "${MOCK_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}✗${NC} Mock file encontrado: $file"
        ((FAILED++))
    else
        echo -e "${GREEN}✓${NC} Mock removido: $file"
        ((PASSED++))
    fi
done

# Check for mock patterns in code
if grep -r "Buffer.from('mock-" lib/ 2>/dev/null | grep -v node_modules | grep -q "mock-"; then
    echo -e "${YELLOW}⚠${NC} Padrões de mock encontrados no código"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} Sem padrões de mock no código"
    ((PASSED++))
fi

echo ""

###############################################################################
# 5. Security Check
###############################################################################
echo -e "${BLUE}[5/10] Verificando segurança...${NC}"

# Check for hardcoded secrets
if grep -rn "api_key.*=.*['\"]sk-" . 2>/dev/null | grep -v node_modules | grep -v ".git" | head -1; then
    echo -e "${RED}✗${NC} API keys hardcoded encontradas"
    ((FAILED++))
else
    echo -e "${GREEN}✓${NC} Sem API keys hardcoded"
    ((PASSED++))
fi

# Check for console.logs
CONSOLE_LOGS=$(grep -r "console.log" api/ lib/ 2>/dev/null | grep -v node_modules | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} $CONSOLE_LOGS console.logs encontrados (considere usar logger)"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} Sem console.logs"
    ((PASSED++))
fi

echo ""

###############################################################################
# 6. Database Check
###############################################################################
echo -e "${BLUE}[6/10] Verificando banco de dados...${NC}"

# Check if prisma schema exists
if [ -f "../../prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓${NC} Schema Prisma encontrado"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Schema Prisma não encontrado"
    ((WARNINGS++))
fi

echo ""

###############################################################################
# 7. Build Check
###############################################################################
echo -e "${BLUE}[7/10] Testando build...${NC}"

if npm run build &>/dev/null || npx next build &>/dev/null; then
    echo -e "${GREEN}✓${NC} Build executado com sucesso"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Build falhou"
    ((FAILED++))
fi

echo ""

###############################################################################
# 8. Critical Files Check
###############################################################################
echo -e "${BLUE}[8/10] Verificando arquivos críticos...${NC}"

CRITICAL_FILES=(
    "lib/video-render-pipeline.ts"
    "lib/avatar-engine.ts"
    "lib/pptx/pptx-generator.ts"
    "lib/notifications/websocket-server.ts"
    "api/v1/video-jobs/route.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file presente"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file ausente"
        ((FAILED++))
    fi
done

echo ""

###############################################################################
# 9. Performance Check
###############################################################################
echo -e "${BLUE}[9/10] Verificando configurações de performance...${NC}"

# Check if cache is implemented
if grep -q "cache" lib/video-render-pipeline.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Cache implementado"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Cache não encontrado"
    ((WARNINGS++))
fi

# Check rate limiting
if grep -q "rate.*limit" api/v1/video-jobs/route.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Rate limiting implementado"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Rate limiting não encontrado"
    ((FAILED++))
fi

echo ""

###############################################################################
# 10. Documentation Check
###############################################################################
echo -e "${BLUE}[10/10] Verificando documentação...${NC}"

DOCS=(
    "../IMPLEMENTACOES_17_DEZ_2025.md"
    "../CODE_REVIEW_CHECKLIST.md"
    "../VARREDURA_PROFUNDA_PLANO_ACAO.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $(basename $doc) presente"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $(basename $doc) ausente"
        ((WARNINGS++))
    fi
done

echo ""

###############################################################################
# SUMMARY
###############################################################################
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    RESUMO DA VALIDAÇÃO                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Testes Passados:${NC}    $PASSED"
echo -e "${RED}Testes Falhados:${NC}    $FAILED"
echo -e "${YELLOW}Avisos:${NC}             $WARNINGS"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "Taxa de Sucesso: ${SUCCESS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✓ PRONTO PARA DEPLOY EM PRODUÇÃO                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         ✗ CORRIJA OS ERROS ANTES DO DEPLOY              ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
