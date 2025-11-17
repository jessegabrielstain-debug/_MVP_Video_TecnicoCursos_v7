/**
 * Hook React - useNotifications
 * 
 * Hook customizado para integração com o sistema de notificações
 * 
 * @module useNotifications
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification, NotificationType } from '@/lib/websocket/notification-system';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationHookConfig {
  /** ID do usuário */
  userId: string;
  /** Canais para inscrever automaticamente */
  channels?: string[];
  /** Intervalo de polling (ms) quando WebSocket não disponível */
  pollingInterval?: number;
  /** Auto-conectar ao montar */
  autoConnect?: boolean;
}

interface NotificationHookReturn {
  /** Lista de notificações não lidas */
  notifications: Notification[];
  /** Número de não lidas */
  unreadCount: number;
  /** Status da conexão */
  isConnected: boolean;
  /** Carregando */
  isLoading: boolean;
  /** Marcar como lida */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Marcar todas como lidas */
  markAllAsRead: () => Promise<void>;
  /** Buscar histórico */
  fetchHistory: (options?: { limit?: number; offset?: number; type?: NotificationType }) => Promise<Notification[]>;
  /** Conectar manualmente */
  connect: () => Promise<void>;
  /** Desconectar */
  disconnect: () => Promise<void>;
  /** Inscrever em canal */
  subscribe: (channel: string) => Promise<void>;
  /** Desinscrever de canal */
  unsubscribe: (channel: string) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para gerenciar notificações em tempo real
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     notifications,
 *     unreadCount,
 *     isConnected,
 *     markAsRead,
 *   } = useNotifications({
 *     userId: 'user123',
 *     channels: ['user:user123', 'global'],
 *   });
 * 
 *   return (
 *     <div>
 *       <h2>Notificações ({unreadCount})</h2>
 *       {notifications.map(n => (
 *         <div key={n.id} onClick={() => markAsRead(n.id)}>
 *           <h3>{n.title}</h3>
 *           <p>{n.message}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotifications(config: NotificationHookConfig): NotificationHookReturn {
  const {
    userId,
    channels = [],
    pollingInterval = 30000,
    autoConnect = true,
  } = config;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const clientIdRef = useRef<string>();
  const pollingTimerRef = useRef<NodeJS.Timeout>();

  // Gerar client ID único
  useEffect(() => {
    if (!clientIdRef.current) {
      clientIdRef.current = `client_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [userId]);

  /**
   * Busca notificações não lidas
   */
  const fetchUnread = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&status=unread&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  /**
   * Conecta ao sistema
   */
  const connect = useCallback(async () => {
    if (!clientIdRef.current) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          clientId: clientIdRef.current,
          userId,
          channels,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect');
      }

      setIsConnected(true);
      
      // Buscar notificações iniciais
      await fetchUnread();

      // Iniciar polling como fallback
      startPolling();

    } catch (error) {
      console.error('Error connecting:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId, channels, fetchUnread]);

  /**
   * Desconecta do sistema
   */
  const disconnect = useCallback(async () => {
    if (!clientIdRef.current) return;

    try {
      stopPolling();

      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          clientId: clientIdRef.current,
        }),
      });

      setIsConnected(false);
      
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, []);

  /**
   * Inicia polling
   */
  const startPolling = useCallback(() => {
    stopPolling();
    
    pollingTimerRef.current = setInterval(() => {
      fetchUnread();
    }, pollingInterval);
  }, [fetchUnread, pollingInterval]);

  /**
   * Para polling
   */
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = undefined;
    }
  }, []);

  /**
   * Marca notificação como lida
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Remover da lista local
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [userId]);

  /**
   * Marca todas como lidas
   */
  const markAllAsRead = useCallback(async () => {
    const promises = notifications.map(n => markAsRead(n.id));
    await Promise.all(promises);
  }, [notifications, markAsRead]);

  /**
   * Busca histórico
   */
  const fetchHistory = useCallback(async (options: {
    limit?: number;
    offset?: number;
    type?: NotificationType;
  } = {}) => {
    const { limit = 50, offset = 0, type } = options;
    
    try {
      const params = new URLSearchParams({
        userId,
        status: 'history',
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      return data.notifications || [];
      
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }, [userId]);

  /**
   * Inscreve em canal
   */
  const subscribe = useCallback(async (channel: string) => {
    if (!clientIdRef.current) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          clientId: clientIdRef.current,
          channel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

    } catch (error) {
      console.error('Error subscribing:', error);
    }
  }, []);

  /**
   * Desinscreve de canal
   */
  const unsubscribe = useCallback(async (channel: string) => {
    if (!clientIdRef.current) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unsubscribe',
          clientId: clientIdRef.current,
          channel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }, []);

  // Auto-conectar
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    notifications,
    unreadCount: notifications.length,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchHistory,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

// ============================================================================
// COMPONENTE DE NOTIFICAÇÃO
// ============================================================================

/**
 * Componente de Badge de Notificação
 */
export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Componente de Item de Notificação
 */
export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead?: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'video:complete':
        return '🎬';
      default:
        return 'ℹ️';
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'normal':
        return 'bg-blue-50 border-blue-200';
      case 'low':
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor()}`}
      onClick={() => onRead?.(notification.id)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <span className="text-xs text-gray-400 mt-2 block">
            {new Date(notification.timestamp).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de Lista de Notificações
 */
export function NotificationList({ userId }: { userId: string }) {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    userId,
    channels: [`user:${userId}`, 'global'],
  });

  if (isLoading) {
    return <div className="p-4 text-center">Carregando notificações...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Notificações
          {unreadCount > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'})
            </span>
          )}
        </h2>
        
        <div className="flex items-center gap-4">
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            {isConnected ? '● Conectado' : '○ Desconectado'}
          </span>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma notificação não lida
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
