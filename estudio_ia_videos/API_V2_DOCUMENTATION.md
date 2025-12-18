# 📚 API V2 - DOCUMENTAÇÃO COMPLETA

**Versão:** 2.0.0  
**Data:** 17 de Dezembro de 2025  
**Base URL:** `https://seu-dominio.com/api/v2`

---

## 📋 ÍNDICE

1. [Templates](#templates-api)
2. [Export Multi-Formato](#export-api)
3. [AI Transitions](#ai-transitions-api)
4. [Plugins](#plugins-api)
5. [Autenticação](#autenticação)
6. [Rate Limiting](#rate-limiting)
7. [Códigos de Erro](#códigos-de-erro)

---

## 🎨 TEMPLATES API

### Listar Templates

```http
GET /api/v2/templates
```

**Query Parameters:**
- `category` (opcional) - Filtrar por categoria
- `tags` (opcional) - Filtrar por tags (separadas por vírgula)
- `search` (opcional) - Buscar por nome ou descrição

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "template-123",
      "name": "Apresentação Corporativa",
      "description": "Template profissional para empresas",
      "category": "business",
      "tags": ["corporate", "professional"],
      "thumbnail": "https://...",
      "variables": [
        {
          "name": "companyName",
          "type": "text",
          "required": true
        }
      ],
      "metadata": {
        "author": "user-id",
        "usageCount": 42
      }
    }
  ],
  "count": 1
}
```

### Criar Template

```http
POST /api/v2/templates
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Meu Template",
  "description": "Descrição do template",
  "category": "education",
  "tags": ["tutorial", "animated"],
  "variables": [
    {
      "name": "title",
      "type": "text",
      "required": true,
      "validation": {
        "min": 3,
        "max": 100
      }
    },
    {
      "name": "logo",
      "type": "image",
      "required": false
    }
  ],
  "slides": [
    {
      "id": "slide-1",
      "order": 0,
      "layout": "title",
      "elements": [
        {
          "id": "title-text",
          "type": "text",
          "variable": "title",
          "position": { "x": 50, "y": 50, "width": 800, "height": 100 },
          "style": {
            "fontSize": 48,
            "color": "#333333"
          }
        }
      ],
      "duration": 5
    }
  ],
  "theme": {
    "colors": ["#4A90E2", "#F5F5F5"],
    "fonts": ["Arial", "Helvetica"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template-new-123"
  }
}
```

### Renderizar Template

```http
POST /api/v2/templates/:id/render
```

**Body:**
```json
{
  "variables": {
    "title": "Minha Apresentação",
    "logo": "https://exemplo.com/logo.png",
    "slides": [
      { "title": "Slide 1", "content": "Conteúdo..." }
    ]
  },
  "outputFormat": "pptx",
  "quality": "high",
  "includeAnimations": true,
  "watermark": {
    "text": "Confidencial",
    "position": "bottom-right",
    "opacity": 0.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "template-123",
      "name": "Meu Template",
      "slides": [...]
    },
    "options": {...}
  }
}
```

---

## 🎬 EXPORT API

### Exportar Vídeo em Novo Formato

```http
POST /api/v2/export
Authorization: Bearer <token>
```

**Body:**
```json
{
  "videoId": "video-123",
  "format": "webm",
  "quality": "high",
  "resolution": "1080p",
  "fps": 30,
  "watermark": {
    "imagePath": "/path/to/logo.png",
    "position": "bottom-right",
    "opacity": 0.7
  },
  "subtitles": {
    "path": "/path/to/subtitles.srt",
    "language": "pt-BR"
  }
}
```

**Formatos Suportados:**
- `mp4` - MPEG-4 (H.264)
- `webm` - WebM (VP9)
- `gif` - GIF animado
- `hls` - HTTP Live Streaming (.m3u8)
- `dash` - Dynamic Adaptive Streaming (.mpd)
- `mov` - QuickTime
- `avi` - Audio Video Interleave

**Resoluções:**
- `360p` (640x360)
- `480p` (854x480)
- `720p` (1280x720) HD
- `1080p` (1920x1080) Full HD
- `1440p` (2560x1440) 2K
- `4k` (3840x2160) Ultra HD

**Qualidades:**
- `low` - Rápido, menor qualidade
- `medium` - Balanceado
- `high` - Alta qualidade (recomendado)
- `ultra` - Máxima qualidade

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "video-123-1702826400000",
    "format": "webm",
    "outputPath": "/tmp/output.webm",
    "fileSize": 15728640,
    "duration": 3500,
    "metadata": {
      "format": "webm",
      "resolution": "1920x1080",
      "bitrate": "5000k",
      "codec": "vp9"
    }
  }
}
```

---

## 🤖 AI TRANSITIONS API

### Recomendar Transições Inteligentes

```http
POST /api/v2/ai/transitions
```

**Body:**
```json
{
  "fromVideoPath": "/path/to/scene1.mp4",
  "toVideoPath": "/path/to/scene2.mp4",
  "fromStartTime": 0,
  "toStartTime": 0,
  "count": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fromScene": {
      "id": "scene-0",
      "brightness": 70,
      "motionIntensity": 45,
      "sentiment": "neutral",
      "dominantColors": ["#4A90E2", "#F5F5F5", "#333333"]
    },
    "toScene": {
      "id": "scene-0",
      "brightness": 85,
      "motionIntensity": 60,
      "sentiment": "energetic",
      "dominantColors": ["#E74C3C", "#FFFFFF"]
    },
    "recommendations": [
      {
        "type": "whipPan",
        "duration": 400,
        "easing": "ease-out",
        "confidence": "85%",
        "reason": "High energy with significant change"
      },
      {
        "type": "fade",
        "duration": 500,
        "easing": "ease-in-out",
        "confidence": "80%",
        "reason": "Safe classic fade"
      },
      {
        "type": "zoom",
        "duration": 700,
        "easing": "ease-in",
        "confidence": "60%",
        "reason": "Attention-grabbing zoom"
      }
    ]
  }
}
```

**Tipos de Transições:**
- `fade` - Fade suave
- `dissolve` - Dissolve gradual
- `slide` - Deslizamento
- `wipe` - Wipe direcional
- `zoom` - Zoom in/out
- `morphing` - Morphing suave
- `glitch` - Efeito glitch
- `blur` - Blur transition
- `whipPan` - Pan rápido
- `filmBurn` - Film burn
- `lightLeak` - Light leak

---

## 🔌 PLUGINS API

### Listar Plugins

```http
GET /api/v2/plugins?enabled=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "auto-watermark",
      "name": "Auto Watermark",
      "version": "1.0.0",
      "author": "Estúdio IA",
      "description": "Adiciona watermark automaticamente",
      "enabled": true,
      "config": {
        "watermarkPath": "/assets/watermark.png",
        "position": "bottom-right",
        "opacity": 0.7
      }
    }
  ],
  "count": 1
}
```

### Registrar Plugin

```http
POST /api/v2/plugins
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "id": "my-custom-plugin",
  "name": "Meu Plugin",
  "version": "1.0.0",
  "author": "Seu Nome",
  "description": "Plugin customizado",
  "enabled": false,
  "hooks": {
    "beforeRender": "function(data) { return data; }",
    "afterRender": "function(data) { return data; }"
  },
  "config": {}
}
```

### Habilitar/Desabilitar Plugin

```http
POST /api/v2/plugins/:id/toggle
Authorization: Bearer <token>
```

**Body:**
```json
{
  "action": "enable"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pluginId": "my-custom-plugin",
    "enabled": true,
    "message": "Plugin enabled successfully"
  }
}
```

---

## 🔐 AUTENTICAÇÃO

Todas as APIs v2 requerem autenticação via Bearer token:

```http
Authorization: Bearer <seu-token-supabase>
```

Para obter um token:
1. Fazer login via Supabase Auth
2. Obter access token da sessão
3. Incluir no header Authorization

---

## ⚡ RATE LIMITING

**Limites por Endpoint:**

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/templates` (GET) | 100 req | 1 minuto |
| `/templates` (POST) | 10 req | 1 minuto |
| `/templates/:id/render` | 30 req | 1 minuto |
| `/export` | 20 req | 1 minuto |
| `/ai/transitions` | 50 req | 1 minuto |
| `/plugins` (GET) | 100 req | 1 minuto |
| `/plugins` (POST) | 5 req | 1 minuto |

**Response quando rate limit excedido:**
```json
{
  "code": "RATE_LIMITED",
  "message": "Muitas requisições. Tente novamente em breve."
}
```

Headers incluídos:
- `Retry-After`: Segundos até poder tentar novamente

---

## ❌ CÓDIGOS DE ERRO

| Código | Descrição | HTTP Status |
|--------|-----------|-------------|
| `VALIDATION_ERROR` | Dados inválidos no request | 400 |
| `UNAUTHORIZED` | Token ausente ou inválido | 401 |
| `FORBIDDEN` | Sem permissão para a ação | 403 |
| `NOT_FOUND` | Recurso não encontrado | 404 |
| `RATE_LIMITED` | Rate limit excedido | 429 |
| `DB_ERROR` | Erro no banco de dados | 500 |
| `UNEXPECTED` | Erro inesperado | 500 |

**Formato de Erro:**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (opcional)"
}
```

---

## 📊 EXEMPLOS PRÁTICOS

### Exemplo 1: Criar e Renderizar Template

```javascript
// 1. Criar template
const createResponse = await fetch('/api/v2/templates', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Template Educacional',
    category: 'education',
    variables: [
      { name: 'courseName', type: 'text', required: true },
      { name: 'instructorName', type: 'text', required: true }
    ],
    slides: [...]
  })
});

const { data: { id } } = await createResponse.json();

// 2. Renderizar template
const renderResponse = await fetch(`/api/v2/templates/${id}/render`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    variables: {
      courseName: 'TypeScript Avançado',
      instructorName: 'João Silva'
    },
    outputFormat: 'pptx',
    quality: 'high'
  })
});

const result = await renderResponse.json();
```

### Exemplo 2: Exportar Vídeo em Múltiplos Formatos

```javascript
const videoId = 'video-123';
const formats = ['mp4', 'webm', 'gif'];

const exports = await Promise.all(
  formats.map(format =>
    fetch('/api/v2/export', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoId,
        format,
        quality: 'high',
        resolution: '1080p'
      })
    }).then(r => r.json())
  )
);

console.log('Exports:', exports);
```

### Exemplo 3: Usar AI para Recomendar Transições

```javascript
const response = await fetch('/api/v2/ai/transitions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromVideoPath: '/videos/intro.mp4',
    toVideoPath: '/videos/main-content.mp4',
    count: 5
  })
});

const { data } = await response.json();

// Usar a melhor recomendação
const bestTransition = data.recommendations[0];
console.log(`Use ${bestTransition.type} transition for ${bestTransition.duration}ms`);
console.log(`Reason: ${bestTransition.reason}`);
```

### Exemplo 4: Gerenciar Plugins

```javascript
// Listar plugins habilitados
const pluginsResponse = await fetch('/api/v2/plugins?enabled=true');
const { data: plugins } = await pluginsResponse.json();

// Habilitar plugin
await fetch('/api/v2/plugins/auto-watermark/toggle', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'enable'
  })
});

// Desabilitar plugin
await fetch('/api/v2/plugins/analytics-tracker/toggle', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'disable'
  })
});
```

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente Necessárias

```bash
# AWS (para exportação e storage avançado)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=meu-bucket
AWS_CLOUDFRONT_DISTRIBUTION_ID=E123...
AWS_CLOUDFRONT_DOMAIN=cdn.meusite.com
AWS_MEDIACONVERT_ENDPOINT=https://...
AWS_MEDIACONVERT_ROLE_ARN=arn:aws:iam::...

# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# FFmpeg (já configurado)
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Plugins
AUTO_REGISTER_PLUGINS=true
```

---

## 📈 LIMITES E COTAS

### Limites por Usuário

| Recurso | Limite | Período |
|---------|--------|---------|
| Templates criados | 50 | Por conta |
| Renderizações | 100 | Por dia |
| Exports | 50 | Por dia |
| Análises de IA | 200 | Por dia |
| Plugins ativos | 10 | Por conta |

### Tamanhos Máximos

| Tipo | Limite |
|------|--------|
| Upload de vídeo | 500 MB |
| Upload de PPTX | 100 MB |
| Template JSON | 1 MB |
| Duração de vídeo | 30 minutos |

---

## 🚀 PERFORMANCE

### Tempos Médios de Resposta

| Endpoint | Tempo Médio | p95 |
|----------|-------------|-----|
| GET /templates | 50ms | 150ms |
| POST /templates/:id/render | 2s | 5s |
| POST /export (MP4) | 30s | 60s |
| POST /export (GIF) | 45s | 90s |
| POST /ai/transitions | 5s | 10s |
| GET /plugins | 30ms | 100ms |

---

## 📞 SUPORTE

- **Documentação:** `/docs/api-v2`
- **Changelog:** `/docs/changelog-v2`
- **Issues:** GitHub Issues
- **Email:** suporte@estudio-ia.com

---

**Última Atualização:** 17 de Dezembro de 2025  
**Versão:** 2.0.0
