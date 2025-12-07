# ⚡ Quick Start - Sistema de Notificações

**Guia de 5 minutos para começar a usar notificações em tempo real**

---

## 🚀 Início Rápido

### 1. Backend (API)

```typescript
// app/api/my-endpoint/route.ts
import { createProductionNotificationSystem } from '@/lib/websocket/notification-system';

const notifier = createProductionNotificationSystem();
await notifier.initialize();

export async function POST(req: Request) {
  const { userId } = await req.json();

  // Enviar notificação
  await notifier.send({
    type: 'success',
    channel: `user:${userId}`,
    title: 'Ação Concluída!',
    message: 'Sua operação foi realizada com sucesso',
    priority: 'normal',
    recipients: [userId],
  });

  return Response.json({ success: true });
}
```

### 2. Frontend (React)

```typescript
// components/NotificationCenter.tsx
'use client';

import { useNotifications, NotificationList } from '@/lib/hooks/useNotifications';

export default function NotificationCenter({ userId }: { userId: string }) {
  return <NotificationList userId={userId} />;
}
```

### 3. Uso Simples

```typescript
// components/MyComponent.tsx
'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';

export default function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications({
    userId: 'user123',
    channels: ['user:user123'],
  });

  return (
    <div>
      <h2>Você tem {unreadCount} notificações</h2>
      {notifications.map(n => (
        <div key={n.id} onClick={() => markAsRead(n.id)}>
          <h3>{n.title}</h3>
          <p>{n.message}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📡 Exemplos de Uso

### Notificação de Progresso

```typescript
// Ao iniciar tarefa
await notifier.send({
  type: 'video:progress',
  channel: `user:${userId}`,
  title: 'Processando...',
  message: 'Iniciando processamento do vídeo',
  data: { videoId, progress: 0 },
  priority: 'normal',
  recipients: [userId],
});

// Ao completar
await notifier.send({
  type: 'video:complete',
  channel: `user:${userId}`,
  title: 'Pronto!',
  message: 'Seu vídeo está disponível',
  data: { videoId, url: videoUrl },
  priority: 'high',
  recipients: [userId],
});
```

### Notificação de Erro

```typescript
await notifier.send({
  type: 'error',
  channel: `user:${userId}`,
  title: 'Erro no Processamento',
  message: 'Ocorreu um erro. Tente novamente.',
  priority: 'critical',
  recipients: [userId],
});
```

### Broadcast Global

```typescript
await notifier.send({
  type: 'info',
  channel: 'global',
  title: 'Nova Feature!',
  message: 'Agora você pode exportar em 4K',
  priority: 'low',
});
```

---

## 🎨 Componentes Prontos

### Badge de Notificações

```typescript
import { NotificationBadge } from '@/lib/hooks/useNotifications';

<div className="relative">
  <BellIcon />
  <NotificationBadge count={unreadCount} />
</div>
```

### Item de Notificação

```typescript
import { NotificationItem } from '@/lib/hooks/useNotifications';

<NotificationItem 
  notification={notification} 
  onRead={markAsRead} 
/>
```

### Lista Completa

```typescript
import { NotificationList } from '@/lib/hooks/useNotifications';

<NotificationList userId="user123" />
```

---

## 🔧 Configuração Mínima

```env
REDIS_URL=redis://localhost:6379
```

---

## ✅ Pronto!

Seu sistema de notificações está funcionando! 🎉

Para mais detalhes, veja:
- **[Documentação Completa](./DOCUMENTACAO_NOTIFICACOES_10_OUT_2025.md)**
- **[Relatório Final](./RELATORIO_FINAL_COMPLETO_10_OUT_2025.md)**
