'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
  id: string;
}

export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastMessage: WebSocketMessage | null;
  connectionAttempts: number;
  error: string | null;
}

export interface WebSocketActions {
  connect: () => void;
  disconnect: () => void;
  send: (message: unknown) => boolean;
  sendMessage: (type: string, data: unknown) => boolean;
  reconnect: () => void;
}

const DEFAULT_OPTIONS: Partial<WebSocketOptions> = {
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  debug: false,
};

export const useWebSocket = (options: WebSocketOptions): WebSocketState & WebSocketActions => {
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });
  const [state, setState] = useState<WebSocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    lastMessage: null,
    connectionAttempts: 0,
    error: null,
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdRef = useRef(0);

  const log = useCallback((message: string, ...args: unknown[]) => {
    if (optionsRef.current.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }, []);

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${++messageIdRef.current}`;
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
    }

    if (optionsRef.current.heartbeatInterval && optionsRef.current.heartbeatInterval > 0) {
      heartbeatTimeoutRef.current = setInterval(() => {
        if (state.socket && state.socket.readyState === WebSocket.OPEN) {
          const heartbeatMessage = {
            type: 'heartbeat',
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
            id: generateMessageId(),
          };
          
          try {
            state.socket.send(JSON.stringify(heartbeatMessage));
            log('Heartbeat sent');
          } catch (error) {
            log('Failed to send heartbeat:', error);
          }
        }
      }, optionsRef.current.heartbeatInterval);
    }
  }, [state.socket, log, generateMessageId]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (state.connectionAttempts < (optionsRef.current.reconnectAttempts || 5)) {
      setState(prev => ({ ...prev, isReconnecting: true }));
      
      reconnectTimeoutRef.current = setTimeout(() => {
        log(`Attempting to reconnect... (${state.connectionAttempts + 1}/${optionsRef.current.reconnectAttempts})`);
        connect();
      }, optionsRef.current.reconnectInterval || 3000);
    } else {
      log('Max reconnection attempts reached');
      setState(prev => ({
        ...prev,
        isReconnecting: false,
        error: 'Failed to connect after maximum attempts'
      }));
      
      toast.error('Conexão WebSocket perdida. Verifique sua conexão.');
    }
  }, [state.connectionAttempts]);

  const connect = useCallback(() => {
    if (state.socket?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      connectionAttempts: prev.isReconnecting ? prev.connectionAttempts + 1 : 0
    }));

    try {
      log(`Connecting to ${optionsRef.current.url}`);
      
      const socket = new WebSocket(
        optionsRef.current.url,
        optionsRef.current.protocols
      );

      socket.onopen = (event) => {
        log('Connected');
        setState(prev => ({
          ...prev,
          socket,
          isConnected: true,
          isConnecting: false,
          isReconnecting: false,
          connectionAttempts: 0,
          error: null,
        }));

        startHeartbeat();
        optionsRef.current.onOpen?.(event);
        
        if (state.connectionAttempts > 0) {
          toast.success('Conexão WebSocket restabelecida');
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          const message: WebSocketMessage = {
            type: parsedData.type || 'message',
            data: parsedData.data || parsedData,
            timestamp: parsedData.timestamp || Date.now(),
            id: parsedData.id || generateMessageId(),
          };

          log('Message received:', message);
          
          setState(prev => ({ ...prev, lastMessage: message }));
          optionsRef.current.onMessage?.(message);
          
        } catch (error) {
          log('Failed to parse message:', error);
          
          // Handle raw messages
          const message: WebSocketMessage = {
            type: 'raw',
            data: event.data,
            timestamp: Date.now(),
            id: generateMessageId(),
          };
          
          setState(prev => ({ ...prev, lastMessage: message }));
          optionsRef.current.onMessage?.(message);
        }
      };

      socket.onerror = (error) => {
        log('Error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'WebSocket error occurred',
          isConnecting: false 
        }));
        
        optionsRef.current.onError?.(error);
      };

      socket.onclose = (event) => {
        log('Connection closed:', event.code, event.reason);
        
        setState(prev => ({
          ...prev,
          socket: null,
          isConnected: false,
          isConnecting: false,
          error: event.code !== 1000 ? `Connection closed: ${event.reason || 'Unknown reason'}` : null,
        }));

        stopHeartbeat();
        optionsRef.current.onClose?.(event);

        // Auto-reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('Failed to create WebSocket:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: `Failed to connect: ${errorMessage}`,
      }));
    }
  }, [state.socket, state.connectionAttempts, startHeartbeat, stopHeartbeat, scheduleReconnect, log, generateMessageId]);

  const disconnect = useCallback(() => {
    log('Disconnecting...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (state.socket) {
      state.socket.close(1000, 'Client disconnected');
    }

    setState(prev => ({
      ...prev,
      socket: null,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      connectionAttempts: 0,
      error: null,
    }));
  }, [state.socket, stopHeartbeat, log]);

  const send = useCallback((message: unknown): boolean => {
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
      log('Cannot send message: not connected');
      return false;
    }

    try {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      state.socket.send(messageToSend);
      log('Message sent:', message);
      return true;
    } catch (error) {
      log('Failed to send message:', error);
      return false;
    }
  }, [state.socket, log]);

  const sendMessage = useCallback((type: string, data: unknown): boolean => {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: generateMessageId(),
    };

    return send(message);
  }, [send, generateMessageId]);

  const reconnect = useCallback(() => {
    log('Manual reconnect requested');
    disconnect();
    setTimeout(() => connect(), 100);
  }, [disconnect, connect, log]);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = { ...DEFAULT_OPTIONS, ...options };
  }, [options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
      if (state.socket) {
        state.socket.close(1000, 'Component unmounted');
      }
    };
  }, [state.socket, stopHeartbeat]);

  return {
    // State
    socket: state.socket,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    isReconnecting: state.isReconnecting,
    lastMessage: state.lastMessage,
    connectionAttempts: state.connectionAttempts,
    error: state.error,
    
    // Actions
    connect,
    disconnect,
    send,
    sendMessage,
    reconnect,
  };
};