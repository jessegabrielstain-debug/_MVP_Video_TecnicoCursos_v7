# ⚡ Sprint 61 - Quick Start Guide
## Video Collaboration System - Início Rápido

**Tempo estimado:** 5 minutos  
**Nível:** Iniciante a Intermediário

---

## 🚀 Instalação e Importação

### 1. Importar o Sistema

```typescript
import {
  VideoCollaborationSystem,
  createBasicCollaborationSystem,
  createEnterpriseCollaborationSystem,
  createDevelopmentCollaborationSystem,
} from './lib/collaboration/collaboration-system';
```

### 2. Criar Instância

```typescript
// Opção 1: Sistema básico (uso geral)
const collab = createBasicCollaborationSystem();

// Opção 2: Sistema enterprise (produção)
const collab = createEnterpriseCollaborationSystem();

// Opção 3: Sistema development (testes)
const collab = createDevelopmentCollaborationSystem();

// Opção 4: Sistema customizado
const collab = new VideoCollaborationSystem({
  maxCommentsPerProject: 1000,
  maxVersionsPerProject: 100,
  enableRealtime: true,
  syncInterval: 1000, // 1 segundo
});
```

---

## 👥 User Management - 2 minutos

### Adicionar Usuários

```typescript
// Adicionar owner (administrador total)
const ownerId = collab.addUser({
  id: 'user-001',
  name: 'João Silva',
  email: 'joao@empresa.com',
  role: 'owner', // owner, admin, editor, viewer
});

// Adicionar editor
collab.addUser({
  id: 'user-002',
  name: 'Maria Santos',
  email: 'maria@empresa.com',
  role: 'editor',
});

// Adicionar viewer
collab.addUser({
  id: 'user-003',
  name: 'Pedro Costa',
  email: 'pedro@empresa.com',
  role: 'viewer',
});
```

### Controlar Status Online

```typescript
// Marcar usuário online
collab.setUserOnlineStatus('user-001', true);

// Marcar usuário offline
collab.setUserOnlineStatus('user-001', false);

// Listar usuários online
const onlineUsers = collab.getOnlineUsers();
console.log(`${onlineUsers.length} usuários online`);
```

---

## 🔐 Permissions - 3 minutos

### Conceder Permissões

```typescript
// Owner concede permissão a editor
collab.grantPermission(
  'user-002',       // usuário que recebe
  'project-123',    // projeto
  'editor',         // role
  'user-001'        // quem concede (owner/admin)
);

// Conceder com opções customizadas
collab.grantPermission(
  'user-003',
  'project-123',
  'viewer',
  'user-001',
  {
    canComment: true,        // pode comentar
    canEdit: false,          // não pode editar
    canApprove: false,       // não pode aprovar
    expiresAt: new Date(2025, 11, 31), // expira em 31/12/2025
  }
);
```

### Verificar Permissões

```typescript
// Verificar se pode comentar
if (collab.canUserComment('user-002', 'project-123')) {
  console.log('Usuário pode comentar');
}

// Verificar se pode editar
if (collab.canUserEdit('user-002', 'project-123')) {
  console.log('Usuário pode editar');
}

// Verificar se pode aprovar
if (collab.canUserApprove('user-002', 'project-123')) {
  console.log('Usuário pode aprovar');
}

// Obter permissão completa
const permission = collab.getUserPermission('user-002', 'project-123');
console.log(permission);
```

---

## 💬 Comments - 5 minutos

### Criar Comentários

```typescript
// Comentário simples em timestamp
const commentId = collab.createComment(
  'user-002',          // quem comenta
  'project-123',       // projeto
  5.5,                 // timestamp (5.5 segundos)
  'Ótima transição!'   // conteúdo
);

// Comentário com menções
const commentId2 = collab.createComment(
  'user-002',
  'project-123',
  10.0,
  '@Maria o que acha desta cena?',
  ['user-003'] // IDs dos mencionados
);
```

### Responder Comentários

```typescript
const replyId = collab.replyToComment(
  commentId,           // comentário pai
  'user-003',          // quem responde
  'Concordo! Ficou perfeito.'
);
```

### Atualizar e Resolver

```typescript
// Atualizar conteúdo
collab.updateComment(
  commentId,
  'user-002',
  'Ótima transição! Sugestão: adicionar fade-out'
);

// Marcar como resolvido
collab.resolveComment(commentId, 'user-002');

// Deletar comentário (soft delete)
collab.deleteComment(commentId, 'user-002');
```

### Buscar Comentários

```typescript
// Todos os comentários do projeto
const allComments = collab.getProjectComments('project-123');

// Apenas comentários não resolvidos
const openComments = collab.getProjectComments('project-123', false);

// Comentários próximos a um timestamp (±1 segundo)
const nearbyComments = collab.getCommentsAtTimestamp(
  'project-123',
  5.5,  // timestamp
  1.0   // range (±1 segundo)
);
```

---

## 📦 Versioning - 4 minutos

### Criar Versões

```typescript
// Criar primeira versão
const v1 = collab.createVersion(
  'project-123',                // projeto
  'user-002',                   // criador
  'Versão Inicial',             // nome
  { /* dados do projeto */ },   // snapshot de dados
  'Primeira versão do projeto'  // descrição
);

// Criar versão baseada em anterior
const v2 = collab.createVersion(
  'project-123',
  'user-002',
  'v1.1 - Com correções',
  { /* novos dados */ },
  'Corrigido problemas de áudio',
  ['fix', 'audio'] // tags opcionais
);
```

### Restaurar Versões

```typescript
// Restaurar versão anterior
await collab.restoreVersion(v1, 'user-002');

// Evento disparado: 'version:restored'
collab.on('version:restored', (data) => {
  console.log(`Versão ${data.versionId} restaurada`);
});
```

### Comparar Versões

```typescript
// Comparar duas versões
const diff = collab.compareVersions(v1, v2);

if (diff) {
  console.log('Modificado por:', diff.modifiedBy);
  console.log('Dias entre versões:', diff.daysBetween);
  console.log('Mudanças:', diff.changes);
}
```

### Listar Versões

```typescript
// Todas as versões do projeto (ordenadas por número)
const versions = collab.getProjectVersions('project-123');

versions.forEach(v => {
  console.log(`v${v.versionNumber}: ${v.name} (${v.tags?.join(', ')})`);
});
```

---

## ✅ Approval Workflow - 5 minutos

### Ativar Sistema de Aprovações

```typescript
// Configurar para exigir aprovações
collab.updateConfig({ requireApproval: true });
```

### Criar Solicitação de Aprovação

```typescript
const requestId = collab.createApprovalRequest(
  'project-123',              // projeto
  v2,                         // versão a ser aprovada
  'user-002',                 // solicitante
  ['user-001', 'user-004'],   // aprovadores necessários
  'Aprovar nova versão com correções de áudio',
  'high',                     // priority: low, medium, high, critical
  new Date(2025, 1, 15)       // deadline opcional
);
```

### Votar em Aprovação

```typescript
// Aprovador 1 vota SIM
collab.voteApproval(
  requestId,
  'user-001',
  true,  // approved
  'Aprovado! Ótimo trabalho.'
);

// Aprovador 2 vota NÃO
collab.voteApproval(
  requestId,
  'user-004',
  false, // rejected
  'Precisa ajustar o volume do áudio.'
);

// Eventos disparados:
// - approval:rejected (se algum voto for NÃO)
// - approval:approved (se todos votarem SIM)
```

### Cancelar Aprovação

```typescript
// Solicitante cancela
collab.cancelApprovalRequest(requestId, 'user-002');
```

### Listar Aprovações Pendentes

```typescript
// Todas as pendentes
const allPending = collab.getPendingApprovals();

// Apenas do projeto
const projectPending = collab.getPendingApprovals('project-123');

projectPending.forEach(req => {
  console.log(`${req.description} (${req.priority})`);
  console.log(`Votos: ${req.approvals.length}/${req.approvers.length}`);
});
```

---

## 🔄 Real-time Sync - 3 minutos

### Adicionar Mudanças

```typescript
// Adicionar mudança de edição
const changeId = collab.addSyncChange(
  'user-002',
  'project-123',
  'edit',
  { field: 'duration', value: 30 }
);

// Mudanças são processadas automaticamente a cada `syncInterval`
```

### Detectar e Resolver Conflitos

```typescript
// Conflitos são detectados automaticamente
collab.on('sync:conflict', (conflict) => {
  console.log('Conflito detectado:', conflict.description);
  console.log('Mudanças conflitantes:', conflict.conflictingChanges);
  
  // Resolver conflito manualmente
  collab.resolveConflict(
    conflict.id,
    'user-001',
    'keep-latest' // ou 'keep-first' ou 'merge'
  );
});
```

---

## 👁️ Presence & Locks - 4 minutos

### Atualizar Presença

```typescript
// Atualizar presença do usuário
collab.updatePresence(
  'user-002',
  'project-123',
  'timeline',           // seção atual
  true,                 // está editando
  { x: 100, y: 200 }    // posição do cursor (opcional)
);

// Listar quem está no projeto
const presences = collab.getProjectPresences('project-123');

presences.forEach(p => {
  console.log(`${p.userId} em ${p.currentSection} (editing: ${p.editing})`);
});
```

### Bloquear Recursos

```typescript
// Bloquear recurso para edição exclusiva
const locked = collab.lockResource(
  'clip-456',        // ID do recurso
  'clip',            // tipo de recurso
  'user-002',        // quem bloqueia
  300000             // timeout em ms (5 minutos)
);

if (locked) {
  console.log('Recurso bloqueado com sucesso');
  
  // Fazer edições...
  
  // Desbloquear quando terminar
  collab.unlockResource('clip-456', 'user-002');
} else {
  console.log('Recurso já está bloqueado');
}
```

### Verificar Bloqueios

```typescript
// Verificar se está bloqueado
if (collab.isResourceLocked('clip-456')) {
  console.log('Recurso está bloqueado');
}

// Locks expirados são limpos automaticamente
```

---

## 📊 Activities & Statistics - 2 minutos

### Obter Atividades

```typescript
// Atividades do projeto (últimas 50)
const projectActivities = collab.getProjectActivities('project-123');

projectActivities.forEach(activity => {
  console.log(`[${activity.type}] ${activity.description}`);
  console.log(`  Por: ${activity.userId} em ${activity.timestamp}`);
});

// Atividades do usuário
const userActivities = collab.getUserActivities('user-002', 20);

// Atividades limitadas
const recent = collab.getProjectActivities('project-123', 10);
```

### Obter Estatísticas

```typescript
const stats = collab.getStatistics();

console.log('Estatísticas do Sistema:');
console.log(`  Usuários: ${stats.totalUsers} (${stats.onlineUsers} online)`);
console.log(`  Comentários: ${stats.totalComments} (${stats.openComments} abertos)`);
console.log(`  Versões: ${stats.totalVersions}`);
console.log(`  Aprovações pendentes: ${stats.pendingApprovals}`);
console.log(`  Locks ativos: ${stats.activeLocks}`);
console.log(`  Conflitos: ${stats.syncConflicts}`);
```

---

## 🎧 Event Listeners - 3 minutos

### Escutar Eventos

```typescript
// Novo comentário
collab.on('comment:created', (comment) => {
  console.log(`Novo comentário em ${comment.timestamp}s`);
  // Notificar usuários, atualizar UI, etc.
});

// Nova versão
collab.on('version:created', (version) => {
  console.log(`v${version.versionNumber}: ${version.name}`);
});

// Aprovação solicitada
collab.on('approval:requested', (request) => {
  console.log(`Nova aprovação: ${request.description}`);
  // Notificar aprovadores
});

// Aprovação aprovada
collab.on('approval:approved', (request) => {
  console.log(`Aprovação concluída: ${request.id}`);
});

// Conflito de sync
collab.on('sync:conflict', (conflict) => {
  console.log('Conflito detectado!');
  // Mostrar UI de resolução
});

// Presença atualizada
collab.on('presence:updated', (presence) => {
  console.log(`${presence.userId} agora em ${presence.currentSection}`);
  // Atualizar indicadores de presença
});

// Erros
collab.on('error', (error) => {
  console.error(`Erro: ${error.type} - ${error.message}`);
});
```

### Remover Listeners

```typescript
const handler = (comment) => console.log('Comentário criado');

// Adicionar
collab.on('comment:created', handler);

// Remover
collab.off('comment:created', handler);

// Remover todos de um evento
collab.removeAllListeners('comment:created');
```

---

## ⚙️ Configuration - 2 minutos

### Obter Configuração

```typescript
const config = collab.getConfig();

console.log('Configuração Atual:');
console.log(`  Max comentários: ${config.maxCommentsPerProject}`);
console.log(`  Max versões: ${config.maxVersionsPerProject}`);
console.log(`  Real-time: ${config.enableRealtime}`);
console.log(`  Intervalo sync: ${config.syncInterval}ms`);
console.log(`  Retenção: ${config.versionRetentionDays} dias`);
```

### Atualizar Configuração

```typescript
// Atualizar múltiplas opções
collab.updateConfig({
  maxCommentsPerProject: 1500,
  enableRealtime: false,
  requireApproval: true,
});

// Evento disparado
collab.on('config:updated', (newConfig) => {
  console.log('Configuração atualizada');
});
```

---

## 🧹 Cleanup & Reset

### Destruir Sistema

```typescript
// Limpar todos os recursos (timers, listeners)
collab.destroy();

// Use quando não precisar mais do sistema
// Importante para evitar memory leaks!
```

### Resetar Sistema

```typescript
// Limpar todos os dados mas manter configuração
collab.reset();

// Eventos disparados
collab.on('system:reset', () => {
  console.log('Sistema resetado');
});
```

---

## 🎯 Casos de Uso Completos

### Caso 1: Workflow de Revisão de Vídeo

```typescript
// 1. Setup
const collab = createEnterpriseCollaborationSystem();

// 2. Adicionar equipe
const director = collab.addUser({
  id: 'dir-001',
  name: 'Diretora Ana',
  email: 'ana@studio.com',
  role: 'owner',
});

const editor = collab.addUser({
  id: 'ed-001',
  name: 'Editor Carlos',
  email: 'carlos@studio.com',
  role: 'editor',
});

const reviewer = collab.addUser({
  id: 'rev-001',
  name: 'Revisor Paulo',
  email: 'paulo@studio.com',
  role: 'admin',
});

// 3. Conceder permissões
collab.grantPermission(editor, 'project-video-001', 'editor', director);
collab.grantPermission(reviewer, 'project-video-001', 'admin', director);

// 4. Editor faz comentários durante edição
collab.updatePresence(editor, 'project-video-001', 'timeline', true);

const c1 = collab.createComment(
  editor,
  'project-video-001',
  15.5,
  'Precisa cortar esta parte?'
);

const c2 = collab.createComment(
  editor,
  'project-video-001',
  30.0,
  '@Diretora Ana, qual transição prefere aqui?',
  [director]
);

// 5. Diretora responde
collab.replyToComment(c2, director, 'Use fade-in suave');

// 6. Editor cria versão
const v1 = collab.createVersion(
  'project-video-001',
  editor,
  'v1.0 - Corte inicial',
  { duration: 120, clips: 15 },
  'Primeira versão com cortes sugeridos'
);

// 7. Solicitar aprovação
const approval = collab.createApprovalRequest(
  'project-video-001',
  v1,
  editor,
  [director, reviewer],
  'Aprovar versão v1.0',
  'high'
);

// 8. Aprovadores votam
collab.voteApproval(approval, director, true, 'Aprovado!');
collab.voteApproval(approval, reviewer, true, 'Ok para mim');

// 9. Versão aprovada! Criar final
const v2 = collab.createVersion(
  'project-video-001',
  editor,
  'v1.0 Final - APROVADO',
  { duration: 118, clips: 14 },
  'Versão aprovada pela equipe',
  ['approved', 'final']
);

// 10. Cleanup
collab.destroy();
```

### Caso 2: Colaboração em Tempo Real

```typescript
const collab = createBasicCollaborationSystem();

// Usuário A bloqueia clip para editar
collab.lockResource('clip-123', 'clip', 'user-a', 180000); // 3 min

// Atualizar presença
collab.updatePresence('user-a', 'project-x', 'clip-123', true);

// Fazer mudanças
collab.addSyncChange('user-a', 'project-x', 'edit', {
  clip: 'clip-123',
  property: 'trim',
  value: { start: 5, end: 15 },
});

// Usuário B tenta editar o mesmo clip
const locked = collab.lockResource('clip-123', 'clip', 'user-b');
// locked = false (já bloqueado por user-a)

// Usuário B recebe erro
collab.on('error', (error) => {
  if (error.type === 'resource-locked') {
    console.log('Aguarde, outro usuário está editando este clip');
  }
});

// User A termina e desbloqueia
collab.unlockResource('clip-123', 'user-a');

// Agora user B pode editar
const locked2 = collab.lockResource('clip-123', 'clip', 'user-b');
// locked2 = true
```

---

## 📚 Próximos Passos

### Documentação Completa
- **API Reference:** `SPRINT61_API_REFERENCE.md`
- **Implementation Report:** `SPRINT61_IMPLEMENTATION_REPORT.md`
- **Final Report:** `SPRINT61_FINAL_REPORT.md`

### Testes
```bash
npm test -- collaboration-system.test.ts
```

### Integração
```typescript
// Integrar com seu sistema de vídeo
import { VideoCollaborationSystem } from './lib/collaboration/collaboration-system';
import { VideoEditor } from './lib/editor/video-editor';

const collab = new VideoCollaborationSystem();
const editor = new VideoEditor();

// Conectar eventos
collab.on('comment:created', (comment) => {
  editor.showCommentMarker(comment.timestamp);
});

collab.on('version:restored', async (data) => {
  await editor.loadVersion(data.versionId);
});
```

---

## 🆘 Troubleshooting

### Problema: Comentários não estão sendo criados
```typescript
// Verificar se usuário tem permissão
const canComment = collab.canUserComment('user-id', 'project-id');
console.log('Pode comentar?', canComment);

// Se não, conceder permissão primeiro
collab.grantPermission('user-id', 'project-id', 'editor', 'owner-id');
```

### Problema: Approval requests retornam null
```typescript
// Ativar requireApproval OU usar priority critical
collab.updateConfig({ requireApproval: true });

// Ou
collab.createApprovalRequest(
  'project',
  'version',
  'user',
  ['approver'],
  'Description',
  'critical' // força criação mesmo sem requireApproval
);
```

### Problema: Memory leaks com timers
```typescript
// SEMPRE chamar destroy() quando não precisar mais
collab.destroy();

// Ou desabilitar realtime se não usar
collab.updateConfig({ enableRealtime: false });
```

---

**Pronto para usar!** 🚀

Para exemplos avançados e referência completa da API, consulte `SPRINT61_API_REFERENCE.md`.
