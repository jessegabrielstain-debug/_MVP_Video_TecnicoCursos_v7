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

Toda integração com Supabase, Redis, BullMQ, Logging e Monitoramento deve usar o módulo unificado em `estudio_ia_videos/app/lib/services/index.ts`.

### Supabase
**Antes (não permitido em novo código):**
```ts
import { createClient } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
```

**Depois (padrão obrigatório):**
```ts
import {
	createBrowserSupabaseClient,
	createServerSupabaseClient,
	supabase,
	supabaseAdmin,
	getCurrentUser,
	isAuthenticated,
	signOut
} from '@/lib/services'
```

Use:
- `createBrowserSupabaseClient()` em componentes client-side / hooks.
- `createServerSupabaseClient()` em rotas API e Server Components.
- `supabaseAdmin` apenas em operações privilegiadas (RLS bypass) dentro de rotas seguras.

### Redis / BullMQ
Exportado via `redis-service` e `bullmq-service` internamente. Não instanciar filas diretamente. Utilize:
```ts
import { getVideoRenderQueue, addRenderJob } from '@/lib/services/bullmq-service'
```

### Logger
Uso padronizado:
```ts
import { logger, createLogger } from '@/lib/services'
logger.info('Render iniciado', { jobId })
const jobLogger = createLogger('RenderJob')
jobLogger.error('Falha no FFmpeg', err)
```

### Monitoring (Sentry Opcional)
Não importe `@sentry/node` diretamente. Utilize wrappers:
```ts
import { captureError, captureException, addBreadcrumb, recordMetric } from '@/lib/services/monitoring-service'
```
Se `SENTRY_DSN` não estiver definido, funções fazem fallback seguro (log local).

### Razões do Padrão
1. Reduz duplicação de configuração.
2. Facilita mocking em testes.
3. Permite instrumentação futura (tracing, métricas, retries) em único ponto.
4. Conformidade com ADR 0004.

### Checklist para Novo Código
- [ ] Usou somente imports de `@/lib/services` para clientes.
- [ ] Evitou instanciar `createClient()` diretamente.
- [ ] Não utilizou service role no front-end.
- [ ] Tratou erros com `captureError` onde aplicável.
- [ ] Logging estruturado com `logger` em operações críticas.


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
