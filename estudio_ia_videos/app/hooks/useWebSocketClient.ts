'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  url: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: unknown) => void;
}

interface WebSocketState {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: unknown;
  error: string | null;
}

export function useWebSocketClient(options: WebSocketOptions) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionState: 'disconnected',
    lastMessage: null,
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      setState(prev => ({ ...prev, connectionState: 'connecting', error: null }));
      
      const ws = new WebSocket(options.url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionState: 'connected',
          error: null 
        }));
        reconnectAttemptsRef.current = 0;
        options.onConnect?.();
      };

      ws.onclose = () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          connectionState: 'disconnected' 
        }));
        wsRef.current = null;
        options.onDisconnect?.();

        // Auto-reconnect logic
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.pow(2, reconnectAttemptsRef.current) * 1000);
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          connectionState: 'error',
          error: 'WebSocket connection error'
        }));
        options.onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: data }));
          options.onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        connectionState: 'error',
        error: 'Failed to create WebSocket connection'
      }));
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      connectionState: 'disconnected' 
    }));
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current && state.isConnected) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, [state.isConnected]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (options.autoConnect && typeof window !== 'undefined') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage
  };
}

// Specialized hooks for different data types
export function useRenderProgressClient() {
  const [progress, setProgress] = useState<{
    jobId: string;
    progress: number;
    status: string;
  } | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useWebSocketClient({
    url: 'ws://localhost:8080',
    autoConnect: true,
    onMessage: (data) => {
      if (data.type === 'render_progress') {
        setProgress(data.payload);
        setIsRendering(data.payload.progress < 100);
      }
    }
  });

  return { progress, isRendering };
}

export function useSystemNotificationsClient() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);

  useWebSocketClient({
    url: 'ws://localhost:8080',
    autoConnect: true,
    onMessage: (data) => {
      if (data.type === 'notification') {
        setNotifications(prev => [
          ...prev.slice(-9), // Keep only last 9 notifications
          {
            ...data.payload,
            timestamp: new Date()
          }
        ]);
      }
    }
  });

  return { notifications };
}