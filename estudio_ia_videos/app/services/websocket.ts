import {
  ActivityNotification,
  Comment,
  CommentReply,
  ProjectVersion,
  User,
} from '@/types/collaboration';

export type WebSocketEventType = 
  | 'user_joined'
  | 'user_left'
  | 'cursor_move'
  | 'element_update'
  | 'comment_added'
  | 'comment_reply'
  | 'comment_resolved'
  | 'version_created'
  | 'notification'
  | 'project_update';

export type CursorMovePayload = {
  userId?: string;
  x: number;
  y: number;
  elementId?: string;
};

export type ElementUpdatePayload = {
  elementId: string;
  changes: Record<string, unknown>;
};

export type ProjectUpdatePayload = Record<string, unknown>;

export type WebSocketEventPayloadMap = {
  user_joined: User;
  user_left: string;
  cursor_move: CursorMovePayload;
  element_update: ElementUpdatePayload;
  comment_added: Comment;
  comment_reply: { commentId: string; reply: CommentReply };
  comment_resolved: string;
  version_created: ProjectVersion;
  notification: ActivityNotification;
  project_update: ProjectUpdatePayload;
};

export interface WebSocketMessage<T extends WebSocketEventType = WebSocketEventType> {
  type: T;
  payload: WebSocketEventPayloadMap[T];
  userId: string;
  projectId: string;
  timestamp: Date;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Map<WebSocketEventType, Set<(data: WebSocketEventPayloadMap[WebSocketEventType]) => void>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  constructor(
    private projectId: string,
    private userId: string,
    private wsUrl: string = 'ws://localhost:8080'
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.wsUrl}/collaboration?projectId=${this.projectId}&userId=${this.userId}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyConnectionListeners(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.stopHeartbeat();
          this.notifyConnectionListeners(false);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  send<T extends WebSocketEventType>(type: T, payload: WebSocketEventPayloadMap[T]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = {
        type,
        payload,
        userId: this.userId,
        projectId: this.projectId,
        timestamp: new Date()
      };

      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', type, payload);
    }
  }

  on<T extends WebSocketEventType>(eventType: T, callback: (data: WebSocketEventPayloadMap[T]) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as (data: WebSocketEventPayloadMap[WebSocketEventType]) => void);
  }

  off<T extends WebSocketEventType>(eventType: T, callback: (data: WebSocketEventPayloadMap[T]) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback as (data: WebSocketEventPayloadMap[WebSocketEventType]) => void);
    }
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionListeners.add(callback);
  }

  offConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionListeners.delete(callback);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WebSocketMessage): void {
    // Don't process messages from the same user
    if (message.userId === this.userId) {
      return;
    }

    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message.payload);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}

// Singleton instance for the current project
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(projectId: string, userId: string): WebSocketService {
  if (!wsInstance || wsInstance['projectId'] !== projectId || wsInstance['userId'] !== userId) {
    if (wsInstance) {
      wsInstance.disconnect();
    }
    wsInstance = new WebSocketService(projectId, userId);
  }
  return wsInstance;
}

export function disconnectWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}