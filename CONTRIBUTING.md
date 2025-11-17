# Contributing to MVP TécnicoCursos

Obrigado por considerar contribuir para o projeto! 🎉

## 📋 Como Contribuir

### 1. Fork & Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/_MVP_Video_TecnicoCursos.git
cd _MVP_Video_TecnicoCursos

# Adicione o upstream
git remote add upstream https://github.com/aline-jesse/_MVP_Video_TecnicoCursos.git
```

### 2. Crie uma Branch

```bash
# Atualize main
git checkout main
git pull upstream main

# Crie uma nova branch
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bugfix
```

### 3. Desenvolva

```bash
# Configure o ambiente
./setup-project.ps1

# Inicie o desenvolvimento
cd estudio_ia_videos/app
npm run dev
```

### 4. Commit & Push

```bash
# Adicione suas mudanças
git add .

# Commit seguindo o padrão Conventional Commits
git commit -m "feat: adiciona nova funcionalidade"
# ou
git commit -m "fix: corrige bug na renderização"
# ou
git commit -m "docs: atualiza documentação"

# Push para seu fork
git push origin feature/sua-feature
```

### 5. Pull Request

1. Vá para o repositório original no GitHub
2. Clique em "New Pull Request"
3. Selecione sua branch
4. Preencha a descrição detalhada
5. Aguarde a revisão

## 📝 Padrões de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (sem mudanças de código)
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de manutenção

## 🧪 Testes

```bash
# Execute os testes antes de commitar
npm test

# Execute os testes do Supabase
npm run test:supabase

# Verifique a validação do ambiente
npm run validate:env
```

## 🔗 Serviços Centralizados

Toda integração com Supabase, Redis, BullMQ e Logging deve usar os serviços centralizados em `@/lib/services/`.

### Supabase

**✅ Correto:**
```ts
import { createClient, createServerClient } from '@/lib/services'

// Em componentes client-side
const supabase = createClient()

// Em Server Components e API Routes
const supabase = createServerClient()
```

**❌ Evitar:**
```ts
import { createClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
```

### Redis

**✅ Correto:**
```ts
import { redisClient } from '@/lib/services'

// Operações básicas
await redisClient.set('chave', valor, 3600) // TTL em segundos
const valor = await redisClient.get('chave')
await redisClient.del('chave')

// Health check
const health = await redisClient.health()
console.log(`Redis: ${health.status}, Latência: ${health.latency}ms`)

// Namespaces
await redisClient.clearNamespace('cache:users')
```

**Features:**
- Singleton com lazy initialization
- Health checks com latência
- Suporte a TTL
- Operações de contador (incr)
- Limpeza por namespace
- Fallback gracioso em caso de falha

### BullMQ (Filas)

**✅ Correto:**
```ts
import { queueClient } from '@/lib/services'

// Adicionar job
const job = await queueClient.addJob('video-render', 'render-123', {
  videoId: '123',
  resolution: '1080p'
}, { 
  priority: 'high', // high, normal, low
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }
})

// Processar jobs
queueClient.on('video-render', async (job) => {
  console.log('Processando:', job.data)
  // Sua lógica aqui
  return { success: true }
})

// Métricas
const metrics = await queueClient.getMetrics('video-render')
console.log(`Aguardando: ${metrics.waiting}, Ativo: ${metrics.active}`)

// Health check
const health = await queueClient.health()
console.log(`Filas: ${health.queues.join(', ')}`)
```

**Features:**
- Múltiplas filas
- Priorização de jobs (high=1, normal=5, low=10)
- Retry com backoff exponencial
- Métricas detalhadas
- Event listeners
- Cleanup automático

### Logger

**✅ Correto:**
```ts
import { logger } from '@/lib/services'

// Logs básicos
logger.debug('Detalhes técnicos', { data: {...} })
logger.info('Operação iniciada', { userId: '123' })
logger.warn('Recurso próximo do limite', { usage: 85 })
logger.error('Falha na operação', { component: 'VideoRender' }, error)

// Logger contextual
const requestLogger = logger.withContext({ 
  requestId: 'req-456',
  userId: 'user-789'
})
requestLogger.info('Processando requisição')
requestLogger.error('Erro durante processamento', {}, error)

// Timer de performance
const timer = logger.timer()
await minhaOperacao()
const elapsed = timer()
logger.info('Operação concluída', { duration: elapsed })
```

**Features:**
- Níveis: debug, info, warn, error
- Contexto estruturado (userId, requestId, component, etc)
- Saída console + arquivo JSON Lines
- Logger contextual com `withContext()`
- Timer para medição de performance
- **Integração automática com Sentry** (envia erros se SENTRY_DSN configurado)

### Sentry (Observabilidade)

O Sentry é inicializado automaticamente no `app/layout.tsx` se a variável `SENTRY_DSN` estiver configurada.

**Configuração:**
```bash
# No .env.local
SENTRY_DSN=https://sua-chave@sentry.io/projeto
NEXT_PUBLIC_SENTRY_DSN=https://sua-chave@sentry.io/projeto
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Uso:**
- Erros são capturados automaticamente pelo logger
- Use `logger.error()` para enviar erros ao Sentry
- Erros não tratados são capturados automaticamente
- Integração transparente - nenhum código adicional necessário

### Razões do Padrão

1. **Centralização**: Configuração única, fácil manutenção
2. **Testabilidade**: Fácil de mockar em testes unitários
3. **Observabilidade**: Logs estruturados e rastreamento unificado
4. **Resiliência**: Health checks e fallbacks gracioso
5. **Conformidade**: Segue ADR 0004

### Checklist para Novo Código

- [ ] Importa serviços de `@/lib/services`
- [ ] Não instancia clientes diretamente
- [ ] Usa logger para operações críticas
- [ ] Adiciona contexto estruturado aos logs
- [ ] Implementa health checks onde aplicável
- [ ] Trata erros com `logger.error()`


## 📐 Code Style

- **TypeScript**: Tipagem estrita
- **ESLint**: Seguir as regras configuradas
- **Prettier**: Formatação automática
- **Imports**: Organizados alfabeticamente

```bash
# Verifique o linting
npm run lint

# Corrija automaticamente
npm run lint -- --fix
```

## 🏗️ Estrutura de Pastas

```
_MVP_Video_TecnicoCursos/
├── app/                    # Next.js App Router
├── estudio_ia_videos/app/  # Estúdio de vídeos
├── scripts/                # Scripts de automação
├── supabase/              # Migrações de banco
├── avatar-pipeline/       # Pipeline de avatar
├── docs/                  # Documentação
└── ___BIBLIOTECAS/        # Referências técnicas
```

## 🐛 Reportando Bugs

Ao reportar bugs, inclua:

1. **Descrição clara** do problema
2. **Passos para reproduzir**
3. **Comportamento esperado** vs **atual**
4. **Screenshots** (se aplicável)
5. **Ambiente**: OS, Node version, navegador

## 💡 Sugerindo Features

Para sugerir novas funcionalidades:

1. Verifique se já não existe uma issue
2. Descreva o problema que resolve
3. Proponha uma solução
4. Discuta a implementação

## 📞 Comunicação

- **Issues**: Para bugs e features
- **Pull Requests**: Para contribuições de código
- **Discussions**: Para dúvidas gerais

## ✅ Checklist do PR

Antes de abrir um PR, certifique-se:

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commits seguem o padrão Conventional
- [ ] Branch está atualizada com main
- [ ] Build passa sem erros
- [ ] Não há secrets expostos

## 🙏 Obrigado!

Sua contribuição é muito valiosa. Juntos estamos construindo uma plataforma incrível! 🚀
