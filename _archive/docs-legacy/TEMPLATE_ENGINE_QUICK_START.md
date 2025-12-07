# 🚀 Video Template Engine - Guia Rápido de Uso

## 🎯 Início Rápido (5 minutos)

### 1. Instalação

```typescript
import { 
  createBasicTemplateEngine,
  VideoTemplate,
  TemplatePlaceholder 
} from '@/lib/video/template-engine';
```

### 2. Criar Engine

```typescript
// Engine básica
const engine = createBasicTemplateEngine();

// OU para alta performance
import { createHighPerformanceEngine } from '@/lib/video/template-engine';
const engine = createHighPerformanceEngine();
```

### 3. Criar Template

```typescript
const templateId = engine.createTemplate(
  'Vídeo Promocional',  // nome
  1920,                  // largura
  1080,                  // altura
  {
    fps: 30,
    duration: 15  // segundos
  }
);
```

### 4. Adicionar Placeholders

```typescript
// Texto
engine.addPlaceholder(templateId, {
  name: 'title',
  type: 'text',
  required: true,
  x: 100,
  y: 100,
  width: 800,
  height: 100,
  startTime: 0,
  duration: 5,
  style: {
    fontSize: 48,
    color: '#ffffff'
  }
});

// Imagem
engine.addPlaceholder(templateId, {
  name: 'logo',
  type: 'image',
  required: true,
  x: 1600,
  y: 50,
  width: 200,
  height: 200,
  startTime: 0,
  duration: 15
});
```

### 5. Validar e Renderizar

```typescript
// Validar
const validation = engine.validateTemplate(templateId, {
  title: 'Novo Produto!',
  logo: '/assets/logo.png'
});

if (validation.valid) {
  // Renderizar
  const result = await engine.renderTemplate(
    templateId,
    {
      title: 'Novo Produto!',
      logo: '/assets/logo.png'
    },
    {
      format: 'mp4',
      quality: 'high',
      outputPath: './output/promo.mp4'
    }
  );
  
  if (result.success) {
    console.log('✅ Vídeo criado:', result.outputPath);
  }
}
```

---

## 📋 Tipos de Placeholder

### 1. Text
```typescript
{
  type: 'text',
  style: {
    fontSize: 48,
    fontFamily: 'Arial',
    color: '#ffffff',
    bold: true
  }
}
```

### 2. Image
```typescript
{
  type: 'image',
  style: {
    objectFit: 'cover',
    opacity: 1
  }
}
```

### 3. Video
```typescript
{
  type: 'video',
  style: {
    muted: false,
    loop: false
  }
}
```

### 4. Audio
```typescript
{
  type: 'audio',
  style: {
    volume: 0.8,
    fadeIn: 1,
    fadeOut: 1
  }
}
```

### 5. Shape
```typescript
{
  type: 'shape',
  style: {
    shape: 'rectangle', // rectangle, circle, triangle
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2
  }
}
```

### 6. Animation
```typescript
{
  type: 'animation',
  animation: {
    type: 'fade-in', // 10 tipos disponíveis
    duration: 1,
    easing: 'ease-in-out'
  }
}
```

---

## 🎨 Tipos de Animação

```typescript
// Fade
'fade-in'      // Aparecer gradualmente
'fade-out'     // Desaparecer gradualmente

// Slide
'slide-left'   // Deslizar da direita para esquerda
'slide-right'  // Deslizar da esquerda para direita
'slide-up'     // Deslizar de baixo para cima
'slide-down'   // Deslizar de cima para baixo

// Zoom
'zoom-in'      // Ampliar
'zoom-out'     // Reduzir

// Outros
'rotate'       // Rotação
'bounce'       // Efeito de quique
```

### Exemplo com Animação

```typescript
engine.addPlaceholder(templateId, {
  name: 'animated-title',
  type: 'text',
  required: true,
  x: 100,
  y: 100,
  width: 800,
  height: 100,
  startTime: 0,
  duration: 5,
  animation: {
    type: 'fade-in',
    duration: 1,
    easing: 'ease-in-out'
  }
});
```

---

## 🔄 Batch Rendering

### Renderizar Múltiplos Vídeos

```typescript
const results = await engine.renderBatch([
  {
    templateId: template1,
    data: { title: 'Produto A', price: '$99' },
    config: { 
      format: 'mp4', 
      quality: 'high', 
      outputPath: './video1.mp4' 
    }
  },
  {
    templateId: template2,
    data: { title: 'Produto B', price: '$149' },
    config: { 
      format: 'mp4', 
      quality: 'high', 
      outputPath: './video2.mp4' 
    }
  },
  {
    templateId: template3,
    data: { title: 'Produto C', price: '$199' },
    config: { 
      format: 'mp4', 
      quality: 'high', 
      outputPath: './video3.mp4' 
    }
  }
]);

// Verificar resultados
const successful = results.filter(r => r.success);
console.log(`✅ ${successful.length}/${results.length} vídeos criados`);
```

---

## 💾 Export/Import de Templates

### Exportar Template

```typescript
// Exportar um template
const json = engine.exportTemplate(templateId);
if (json) {
  fs.writeFileSync('./templates/promo.json', json);
}

// Exportar todos os templates
const allTemplates = engine.exportAllTemplates();
fs.writeFileSync('./templates/all.json', allTemplates);
```

### Importar Template

```typescript
const templateJson = fs.readFileSync('./templates/promo.json', 'utf-8');
const newTemplateId = engine.importTemplate(templateJson);

if (newTemplateId) {
  console.log('✅ Template importado:', newTemplateId);
}
```

---

## 📊 Validação

### Validar Antes de Renderizar

```typescript
const validation = engine.validateTemplate(templateId, {
  title: 'Meu Título',
  logo: '/assets/logo.png'
});

if (validation.valid) {
  console.log('✅ Template válido');
} else {
  console.log('❌ Erros:', validation.errors);
  console.log('⚠️  Avisos:', validation.warnings);
}
```

### Validações Automáticas

- ✅ Campos obrigatórios preenchidos
- ✅ Tipos de dados corretos
- ✅ Placeholders dentro dos limites
- ✅ Timing válido
- ✅ Performance warnings

---

## 🎯 Formatos de Exportação

```typescript
// MP4 (padrão)
{ format: 'mp4', quality: 'high' }

// WebM
{ format: 'webm', quality: 'high' }

// MOV
{ format: 'mov', quality: 'ultra' }

// AVI
{ format: 'avi', quality: 'medium' }

// JSON (template apenas)
{ format: 'json', quality: 'high' }
```

### Níveis de Qualidade

```typescript
'low'     // Baixa qualidade, arquivo menor
'medium'  // Qualidade média, bom equilíbrio
'high'    // Alta qualidade (padrão)
'ultra'   // Máxima qualidade, arquivo maior
```

---

## 📡 Eventos

### Monitorar Progresso

```typescript
// Criação de template
engine.on('template:created', (template) => {
  console.log('Novo template:', template.name);
});

// Início de renderização
engine.on('render:started', (templateId, config) => {
  console.log('Renderizando:', templateId);
});

// Renderização completa
engine.on('render:completed', (result) => {
  console.log('✅ Concluído:', result.outputPath);
  console.log('Duração:', result.duration, 'ms');
  console.log('Tamanho:', result.fileSize, 'bytes');
});

// Erros
engine.on('error', (error) => {
  console.error('❌ Erro:', error);
});

// Batch rendering
engine.on('batch-render:started', (count) => {
  console.log(`Iniciando batch de ${count} vídeos`);
});

engine.on('batch-render:completed', (results) => {
  const successful = results.filter(r => r.success);
  console.log(`✅ ${successful.length}/${results.length} concluídos`);
});
```

---

## 🚀 Factory Presets

### 1. Basic Engine (Padrão)

```typescript
const engine = createBasicTemplateEngine();

// Configuração:
// - Resolução: 1920x1080
// - Placeholders: até 20
// - Cache: desabilitado
// - FPS: 30
// - Duração: 10s
```

**Uso:** Projetos gerais, vídeos simples

### 2. High Performance Engine

```typescript
import { createHighPerformanceEngine } from '@/lib/video/template-engine';
const engine = createHighPerformanceEngine();

// Configuração:
// - Resolução: 4096x4096
// - Placeholders: até 50
// - Cache: habilitado
// - FPS: 60
// - Duração: 30s
```

**Uso:** Projetos complexos, alto volume

### 3. Development Engine

```typescript
import { createDevelopmentEngine } from '@/lib/video/template-engine';
const engine = createDevelopmentEngine();

// Configuração:
// - Resolução: 1280x720
// - Placeholders: até 10
// - Cache: desabilitado
// - Validação: desabilitada
// - FPS: 24
// - Duração: 5s
```

**Uso:** Testes, desenvolvimento, debugging

---

## 💡 Exemplos Práticos

### Exemplo 1: Vídeo de Produto

```typescript
const engine = createBasicTemplateEngine();

// Criar template
const productVideo = engine.createTemplate('Vídeo de Produto', 1920, 1080, {
  fps: 30,
  duration: 10
});

// Adicionar elementos
engine.addPlaceholder(productVideo, {
  name: 'product-name',
  type: 'text',
  required: true,
  x: 100,
  y: 100,
  width: 1720,
  height: 150,
  startTime: 0,
  duration: 3,
  animation: { type: 'fade-in', duration: 0.5 }
});

engine.addPlaceholder(productVideo, {
  name: 'product-image',
  type: 'image',
  required: true,
  x: 460,
  y: 300,
  width: 1000,
  height: 600,
  startTime: 1,
  duration: 8
});

engine.addPlaceholder(productVideo, {
  name: 'price',
  type: 'text',
  required: true,
  x: 100,
  y: 900,
  width: 1720,
  height: 100,
  startTime: 4,
  duration: 6,
  animation: { type: 'zoom-in', duration: 0.5 }
});

// Renderizar
const result = await engine.renderTemplate(
  productVideo,
  {
    'product-name': 'Smartphone XYZ',
    'product-image': '/assets/phone.png',
    'price': 'Apenas R$ 1.999'
  },
  {
    format: 'mp4',
    quality: 'high',
    outputPath: './videos/produto-xyz.mp4'
  }
);
```

### Exemplo 2: Vídeos em Massa

```typescript
const engine = createHighPerformanceEngine();

// Template base
const templateId = engine.createTemplate('Template Social', 1080, 1080, {
  fps: 30,
  duration: 5
});

// Configurar placeholders
engine.addPlaceholder(templateId, {
  name: 'background',
  type: 'image',
  required: true,
  x: 0, y: 0, width: 1080, height: 1080,
  startTime: 0, duration: 5
});

engine.addPlaceholder(templateId, {
  name: 'message',
  type: 'text',
  required: true,
  x: 100, y: 400, width: 880, height: 280,
  startTime: 0, duration: 5,
  animation: { type: 'fade-in', duration: 0.5 }
});

// Dados para múltiplos vídeos
const messages = [
  { bg: '/bg1.jpg', text: 'Mensagem 1' },
  { bg: '/bg2.jpg', text: 'Mensagem 2' },
  { bg: '/bg3.jpg', text: 'Mensagem 3' },
  // ... mais mensagens
];

// Renderizar todos em batch
const renders = messages.map((msg, i) => ({
  templateId,
  data: {
    background: msg.bg,
    message: msg.text
  },
  config: {
    format: 'mp4',
    quality: 'high',
    outputPath: `./videos/msg-${i + 1}.mp4`
  }
}));

const results = await engine.renderBatch(renders);
console.log(`✅ ${results.filter(r => r.success).length} vídeos criados`);
```

### Exemplo 3: Template Reutilizável

```typescript
// Criar template
const newsTemplate = engine.createTemplate('Notícia', 1920, 1080, {
  fps: 30,
  duration: 15
});

// Configurar placeholders com defaults
engine.addPlaceholder(newsTemplate, {
  name: 'headline',
  type: 'text',
  required: true,
  defaultValue: 'Breaking News',
  x: 100, y: 100, width: 1720, height: 150,
  startTime: 0, duration: 15
});

engine.addPlaceholder(newsTemplate, {
  name: 'logo',
  type: 'image',
  required: false,
  defaultValue: '/default-logo.png',
  x: 1600, y: 50, width: 250, height: 100,
  startTime: 0, duration: 15
});

// Exportar template
const templateJson = engine.exportTemplate(newsTemplate);
fs.writeFileSync('./templates/news.json', templateJson);

// Usar template importado
const importedId = engine.importTemplate(
  fs.readFileSync('./templates/news.json', 'utf-8')
);

// Renderizar com defaults
await engine.renderTemplate(
  importedId,
  { headline: 'Nova Notícia Importante' },
  { format: 'mp4', quality: 'high', outputPath: './news.mp4' }
);
```

---

## 📈 Estatísticas

### Obter Métricas

```typescript
const stats = engine.getStatistics();

console.log('Templates:', {
  total: stats.totalTemplates,
  válidos: stats.validTemplates,
  inválidos: stats.invalidTemplates,
  renderizados: stats.renderedTemplates
});

console.log('Renders:', {
  total: stats.totalRenders,
  tempoMédio: stats.averageRenderTime + 'ms'
});

console.log('Cache:', {
  hits: stats.cacheHits,
  misses: stats.cacheMisses,
  taxaAcerto: (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(2) + '%'
});
```

---

## 🔧 Configuração

### Atualizar Configuração

```typescript
engine.updateConfig({
  maxPlaceholders: 30,
  cacheTemplates: true,
  defaultFps: 60
});

// Verificar configuração atual
const config = engine.getConfig();
console.log(config);
```

### Resetar Engine

```typescript
// Limpar todos os templates e cache
engine.reset();
```

---

## ✅ Checklist de Uso

### Antes de Começar
- [ ] Engine criada (basic/high-performance/development)
- [ ] Template criado com dimensões corretas
- [ ] FPS e duração definidos

### Adicionando Conteúdo
- [ ] Placeholders adicionados
- [ ] Tipos corretos definidos
- [ ] Posições e tamanhos configurados
- [ ] Timing (startTime, duration) definido
- [ ] Animações configuradas (opcional)

### Antes de Renderizar
- [ ] Template validado
- [ ] Dados fornecidos para todos os placeholders obrigatórios
- [ ] Formato de saída escolhido
- [ ] Caminho de output definido

### Após Renderização
- [ ] Resultado verificado (success)
- [ ] Arquivo de saída existe
- [ ] Qualidade do vídeo OK
- [ ] Estatísticas revisadas (opcional)

---

## 🆘 Solução de Problemas

### Template Inválido

```typescript
const validation = engine.validateTemplate(templateId, data);
if (!validation.valid) {
  console.log('Erros:', validation.errors);
  // Corrigir erros antes de renderizar
}
```

### Renderização Falhou

```typescript
const result = await engine.renderTemplate(templateId, data, config);
if (!result.success) {
  console.error('Erro:', result.error);
  // Verificar logs, dados e configuração
}
```

### Cache Não Funcionando

```typescript
const config = engine.getConfig();
if (!config.cacheTemplates) {
  engine.updateConfig({ cacheTemplates: true });
}
```

---

## 📚 Recursos Adicionais

- 📖 [Documentação Completa](./SPRINT60_TEMPLATE_ENGINE_COMPLETE.md)
- 🧪 [Exemplos de Testes](../app/__tests__/lib/video/template-engine.test.ts)
- 💻 [Código Fonte](../app/lib/video/template-engine.ts)

---

**Última atualização:** Sprint 60  
**Status:** ✅ Produção
