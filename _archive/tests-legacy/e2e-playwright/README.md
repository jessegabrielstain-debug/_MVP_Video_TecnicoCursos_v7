# 🎭 Testes E2E Playwright - UI/Frontend

Testes End-to-End focados na **interface do usuário** usando Playwright, complementando os testes Jest de integração de API.

## 📋 Testes Disponíveis

### 1. PPTX Upload UI
**Arquivo**: `pptx-upload-ui.spec.ts`

**Cobre**:
- Visualização da página de upload
- Seleção de arquivo PPTX
- Upload e processamento
- Feedback visual (loading)
- Visualização de slides extraídos
- Navegação entre slides
- Validação de arquivo inválido
- Thumbnails
- Deleção de projetos

**Total**: 9 testes UI

---

### 2. Analytics Dashboard UI
**Arquivo**: `analytics-dashboard-ui.spec.ts`

**Cobre**:
- Visualização de métricas principais
- Estatísticas de eventos
- Filtros de período
- Gráficos e charts
- Top eventos por categoria
- Tabela de eventos recentes
- Atualização em tempo real
- Export de relatórios
- Performance metrics
- Distribuição de dispositivos/navegadores
- Tempo de carregamento

**Total**: 12 testes UI

---

### 3. Compliance NR UI
**Arquivo**: `compliance-nr-ui.spec.ts`

**Cobre**:
- Lista de templates NR (12 templates)
- Seleção de template NR
- Novos templates (NR-17, NR-24, NR-26)
- Validação de projeto
- Visualização de relatório
- Tópicos obrigatórios
- Pontos críticos
- Recomendações
- Status de aprovação
- Filtros de status
- Histórico de validações

**Total**: 11 testes UI

---

### 4. Render Progress UI
**Arquivo**: `render-progress-ui.spec.ts`

**Cobre**:
- Opções de renderização (qualidade, resolução, codec)
- Ativação de watermark
- Iniciar renderização
- Barra de progresso
- Porcentagem de progresso
- Tempo estimado
- Atualização em tempo real
- Mensagem de conclusão
- Download de vídeo
- Lista de renders em fila
- Status de cada render
- Cancelar renderização
- Mensagens de erro
- Persistência de estado

**Total**: 15 testes UI

---

## 📊 ESTATÍSTICAS

### Cobertura Total

| Suite | Testes | Timeout | Navegadores |
|-------|--------|---------|-------------|
| **PPTX Upload** | 9 | 60s | 5 |
| **Analytics Dashboard** | 12 | 60s | 5 |
| **Compliance NR** | 11 | 60s | 5 |
| **Render Progress** | 15 | 60s | 5 |
| **TOTAL** | **47** | - | **5** |

### Navegadores Suportados

- ✅ **Chromium** (Desktop Chrome)
- ✅ **Firefox** (Desktop Firefox)
- ✅ **WebKit** (Desktop Safari)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)

---

## 🚀 COMO EXECUTAR

### Executar Todos os Testes

```bash
npx playwright test
```

### Executar Teste Específico

```bash
# PPTX Upload
npx playwright test pptx-upload-ui

# Analytics Dashboard
npx playwright test analytics-dashboard-ui

# Compliance NR
npx playwright test compliance-nr-ui

# Render Progress
npx playwright test render-progress-ui
```

### Executar em Navegador Específico

```bash
# Apenas Chromium
npx playwright test --project=chromium

# Apenas Firefox
npx playwright test --project=firefox

# Apenas WebKit (Safari)
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project=mobile-chrome

# Mobile Safari
npx playwright test --project=mobile-safari
```

### Modo com Interface Gráfica (UI Mode)

```bash
npx playwright test --ui
```

### Modo Debug

```bash
npx playwright test --debug
```

### Modo Headed (Ver Navegador)

```bash
npx playwright test --headed
```

### Ver Relatório

```bash
npx playwright show-report qa/artifacts/html-report
```

---

## ⚙️ CONFIGURAÇÃO

### 1. Variáveis de Ambiente

```env
# Base URL da aplicação
BASE_URL=http://localhost:3000
```

### 2. Playwright Config

Arquivo: `playwright.config.ts`

```typescript
{
  testDir: './tests/e2e',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

---

## 🔍 DEBUGGING

### Ver Trace de Teste Falhado

```bash
npx playwright show-trace qa/artifacts/trace.zip
```

### Screenshots

Screenshots de testes falhados ficam em:
```
qa/artifacts/screenshots/
```

### Vídeos

Vídeos de testes falhados ficam em:
```
qa/artifacts/videos/
```

---

## 📈 RESULTADOS ESPERADOS

### ✅ Sucesso

```bash
Running 47 tests using 5 workers
  47 passed (2m 15s)

To open last HTML report run:
  npx playwright show-report qa/artifacts/html-report
```

### ⚠️ Avisos Comuns

- `Timeout waiting for locator` - Elemento não encontrado (pode ser interface diferente)
- `Navigation timeout` - Aplicação não está rodando (verifique `npm run dev`)
- `No tests found` - Verifique path do testDir

---

## 🎯 MELHORES PRÁTICAS

### 1. Seletores

Use na ordem de preferência:
1. `[data-testid="elemento"]` (mais confiável)
2. `role="button"` (acessibilidade)
3. `text="Texto"` (menos confiável, pode mudar com i18n)

### 2. Esperas

```typescript
// ✅ BOM: Esperar elemento específico
await page.waitForSelector('[data-testid="result"]')

// ❌ RUIM: Espera fixa
await page.waitForTimeout(5000)
```

### 3. Assertions

```typescript
// ✅ BOM: Auto-retry até timeout
await expect(page.locator('#status')).toHaveText('Success')

// ❌ RUIM: Sem retry
const text = await page.locator('#status').textContent()
expect(text).toBe('Success')
```

---

## 🧪 CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: qa/artifacts/html-report/
```

---

## 📝 ESTRUTURA DE ARQUIVOS

```
e2e-playwright/
├── pptx-upload-ui.spec.ts       (9 testes)
├── analytics-dashboard-ui.spec.ts (12 testes)
├── compliance-nr-ui.spec.ts     (11 testes)
├── render-progress-ui.spec.ts   (15 testes)
└── README.md

qa/artifacts/
├── html-report/
├── screenshots/
├── videos/
└── trace.zip
```

---

## 🎉 COMPARAÇÃO COM TESTES JEST

| Aspecto | Jest E2E | Playwright UI |
|---------|----------|---------------|
| **Foco** | API/Backend | UI/Frontend |
| **Navegador** | N/A | 5 navegadores |
| **Testes** | 45 | 47 |
| **Screenshots** | ❌ | ✅ |
| **Vídeos** | ❌ | ✅ |
| **Trace** | ❌ | ✅ |
| **Mobile** | ❌ | ✅ |

---

## ✅ CHECKLIST

Antes de executar os testes:

- [x] Aplicação rodando (`npm run dev`)
- [x] Playwright instalado (`npm install @playwright/test`)
- [x] Navegadores instalados (`npx playwright install`)
- [x] Base URL configurada
- [x] Fixtures disponíveis (PPTX)

---

**Última atualização**: 09/10/2025  
**Autor**: DeepAgent AI  
**Status**: ✅ Completo - 47 testes UI Playwright implementados  
**Navegadores**: 5 (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)

