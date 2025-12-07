#!/bin/bash
# Lighthouse Performance Audit Script (Bash)
# Executa auditoria de performance, acessibilidade, SEO e best practices

set -euo pipefail

# Configuração
URL="${1:-http://localhost:3000}"
DEVICE="${2:-both}"  # mobile, desktop, both
OUTPUT_DIR="evidencias/lighthouse"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_PATH="$OUTPUT_DIR/$TIMESTAMP"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "  Lighthouse Performance Audit"
echo -e "========================================${NC}\n"

# Verificar se lighthouse está instalado
if ! command -v lighthouse &> /dev/null; then
    echo -e "${RED}❌ Lighthouse não encontrado!${NC}"
    echo -e "${YELLOW}Instale com: npm install -g lighthouse${NC}"
    exit 1
fi

# Criar diretório de output
mkdir -p "$OUTPUT_PATH"

echo -e "${CYAN}📁 Output: $OUTPUT_PATH${NC}"
echo -e "${CYAN}🌐 URL: $URL${NC}\n"

# Função para executar Lighthouse
run_lighthouse_audit() {
    local url=$1
    local form_factor=$2
    local output_path=$3
    
    local report_name="lighthouse-$form_factor-$(date +%Y%m%d-%H%M%S)"
    local html_report="$output_path/$report_name.html"
    local json_report="$output_path/$report_name.json"
    
    echo -e "${YELLOW}🔍 Auditando ($form_factor)...${NC}"
    
    local lighthouse_args=(
        "$url"
        "--output=html"
        "--output=json"
        "--output-path=$output_path/$report_name"
        "--form-factor=$form_factor"
        "--chrome-flags=\"--headless --no-sandbox --disable-dev-shm-usage\""
        "--quiet"
    )
    
    if [ "$form_factor" = "mobile" ]; then
        lighthouse_args+=("--emulated-device=\"Moto G4\"")
    else
        lighthouse_args+=("--preset=desktop")
    fi
    
    if lighthouse "${lighthouse_args[@]}" 2>&1; then
        echo -e "${GREEN}✅ Auditoria $form_factor concluída${NC}\n"
        
        # Ler scores do JSON
        if [ -f "$json_report" ]; then
            local perf=$(jq -r '.categories.performance.score * 100 | floor' "$json_report")
            local a11y=$(jq -r '.categories.accessibility.score * 100 | floor' "$json_report")
            local bp=$(jq -r '.categories."best-practices".score * 100 | floor' "$json_report")
            local seo=$(jq -r '.categories.seo.score * 100 | floor' "$json_report")
            
            echo -e "${CYAN}📊 Scores ($form_factor):${NC}"
            echo -e "  Performance:    $perf%"
            echo -e "  Accessibility:  $a11y%"
            echo -e "  Best Practices: $bp%"
            echo -e "  SEO:            $seo%\n"
            
            echo "$json_report"
            return 0
        fi
    else
        echo -e "${RED}❌ Falha na auditoria $form_factor${NC}"
        return 1
    fi
}

# Executar auditorias
reports=()

if [ "$DEVICE" = "mobile" ] || [ "$DEVICE" = "both" ]; then
    if mobile_report=$(run_lighthouse_audit "$URL" "mobile" "$OUTPUT_PATH"); then
        reports+=("$mobile_report")
    fi
fi

if [ "$DEVICE" = "desktop" ] || [ "$DEVICE" = "both" ]; then
    if desktop_report=$(run_lighthouse_audit "$URL" "desktop" "$OUTPUT_PATH"); then
        reports+=("$desktop_report")
    fi
fi

# Gerar resumo markdown
if [ ${#reports[@]} -gt 0 ]; then
    summary_path="$OUTPUT_PATH/RESUMO.md"
    
    cat > "$summary_path" << EOF
# Lighthouse Audit - $TIMESTAMP

**URL:** $URL  
**Data:** $(date '+%Y-%m-%d %H:%M:%S')

---

EOF
    
    for report in "${reports[@]}"; do
        form_factor=$(basename "$report" | grep -oP '(mobile|desktop)')
        
        perf=$(jq -r '.categories.performance.score * 100 | floor' "$report")
        a11y=$(jq -r '.categories.accessibility.score * 100 | floor' "$report")
        bp=$(jq -r '.categories."best-practices".score * 100 | floor' "$report")
        seo_score=$(jq -r '.categories.seo.score * 100 | floor' "$report")
        
        cat >> "$summary_path" << EOF

## $(if [ "$form_factor" = "mobile" ]; then echo "📱 Mobile"; else echo "🖥️ Desktop"; fi)

| Métrica | Score | Status |
|---------|-------|--------|
| Performance | ${perf}% | $(if [ $perf -ge 90 ]; then echo "✅"; elif [ $perf -ge 50 ]; then echo "⚠️"; else echo "❌"; fi) |
| Accessibility | ${a11y}% | $(if [ $a11y -ge 90 ]; then echo "✅"; elif [ $a11y -ge 50 ]; then echo "⚠️"; else echo "❌"; fi) |
| Best Practices | ${bp}% | $(if [ $bp -ge 90 ]; then echo "✅"; elif [ $bp -ge 50 ]; then echo "⚠️"; else echo "❌"; fi) |
| SEO | ${seo_score}% | $(if [ $seo_score -ge 90 ]; then echo "✅"; elif [ $seo_score -ge 50 ]; then echo "⚠️"; else echo "❌"; fi) |

**Relatório HTML:** [Ver Relatório]($(basename "$report" .json).html)

---

EOF
    done
    
    echo -e "${GREEN}📄 Resumo salvo: $summary_path${NC}"
fi

echo -e "\n${CYAN}========================================"
echo -e "✅ Auditoria Lighthouse Concluída"
echo -e "========================================${NC}\n"
echo -e "${CYAN}📁 Relatórios: $OUTPUT_PATH${NC}\n"
