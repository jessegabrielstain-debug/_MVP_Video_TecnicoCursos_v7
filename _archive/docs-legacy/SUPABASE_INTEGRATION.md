# Integração com Supabase

Este documento descreve a integração completa com o Supabase implementada neste projeto, incluindo autenticação, banco de dados em tempo real, armazenamento e funções serverless.

## Configuração Inicial

1. As variáveis de ambiente necessárias já estão configuradas no arquivo `.env` na raiz do projeto.
2. A estrutura de arquivos da integração está localizada em `lib/supabase/`.

## Serviços Implementados

### 1. Autenticação

- Login/Registro com email e senha
- Autenticação com provedores OAuth (Google, GitHub)
- Recuperação de senha
- Gerenciamento de sessão

**Uso:**
```typescript
import { signInWithEmail, signUpWithEmail, signOut } from '@/lib/supabase/auth';

// Login
await signInWithEmail('usuario@exemplo.com', 'senha123');

// Registro
await signUpWithEmail('novo@exemplo.com', 'senha123', { name: 'Novo Usuário' });

// Logout
await signOut();
```

### 2. Banco de Dados em Tempo Real

- CRUD completo para entidades principais (cursos, vídeos, progresso)
- Subscrições em tempo real para atualizações
- Políticas de segurança RLS implementadas

**Uso:**
```typescript
import { getCourses, getVideosByCourseId, updateUserProgress } from '@/lib/supabase/database';

// Buscar cursos
const courses = await getCourses();

// Buscar vídeos de um curso
const videos = await getVideosByCourseId('curso-id');

// Atualizar progresso do usuário
await updateUserProgress('usuario-id', 'video-id', 75, false);
```

### 3. Armazenamento

- Upload de vídeos, thumbnails e avatares
- Gerenciamento de buckets com permissões adequadas
- URLs assinadas para conteúdo privado

**Uso:**
```typescript
import { uploadVideo, uploadThumbnail, uploadAvatar } from '@/lib/supabase/storage';

// Upload de vídeo
const videoUrl = await uploadVideo(videoFile, 'curso-id');

// Upload de thumbnail
const thumbnailUrl = await uploadThumbnail(imageFile, 'curso-id');

// Upload de avatar
const avatarUrl = await uploadAvatar(avatarFile, 'usuario-id');
```

### 4. Funções Serverless

- Processamento de vídeos
- Geração de thumbnails
- Transcrição de vídeos
- Envio de notificações
- Geração de relatórios

**Uso:**
```typescript
import { processVideo, generateThumbnail, transcribeVideo } from '@/lib/supabase/functions';

// Processar vídeo
await processVideo('https://url-do-video.mp4', { title: 'Meu Vídeo' });

// Gerar thumbnail
const thumbnailUrl = await generateThumbnail('https://url-do-video.mp4');

// Transcrever vídeo
const transcription = await transcribeVideo('https://url-do-video.mp4', 'pt-BR');
```

### 5. Tratamento de Erros

- Tratamento centralizado de erros
- Mapeamento de códigos de erro para mensagens amigáveis
- Logging estruturado

**Uso:**
```typescript
import { handleSupabaseError, logError } from '@/lib/supabase/error-handler';

try {
  // Operação com Supabase
} catch (error) {
  const supabaseError = handleSupabaseError(error);
  logError('MeuComponente', supabaseError, { contextoAdicional: 'valor' });
}
```

## Políticas de Segurança (RLS)

As políticas de segurança Row Level Security (RLS) estão definidas no arquivo `supabase/rls-policies.sql` e devem ser aplicadas no SQL Editor do Supabase.

Estas políticas garantem que:
- Usuários só podem acessar seus próprios dados
- Autores só podem editar seus próprios cursos e vídeos
- Administradores têm acesso total ao sistema

## Teste da Integração

Para testar a integração, acesse:
- `/supabase-test` - Interface visual para testar os serviços
- `/api/supabase-test` - Endpoint de API para testar a conexão

## Próximos Passos

1. Implementar testes automatizados para cada serviço
2. Configurar monitoramento e alertas
3. Otimizar consultas para melhor performance
4. Implementar cache para reduzir custos