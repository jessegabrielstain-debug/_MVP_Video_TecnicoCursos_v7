'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CursorPosition {
  x: number;
  y: number;
}

export type SerializedProjectState = Record<string, unknown>;
export type ChangeSnapshot = Record<string, unknown> | null;

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
  isOnline: boolean;
  lastSeen: Date;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  elementId?: string;
  timestamp: Date;
  resolved: boolean;
  replies: CommentReply[];
  mentions: string[];
  attachments?: CommentAttachment[];
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  mentions: string[];
}

export interface CommentAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size: number;
}

export interface ProjectVersion {
  id: string;
  name: string;
  description?: string;
  timestamp: Date;
  userId: string;
  data: SerializedProjectState;
  changes: VersionChange[];
  parentVersionId?: string;
  isMerged: boolean;
  conflictResolution?: ConflictResolution[];
}

export interface VersionChange {
  id: string;
  type: 'add' | 'update' | 'delete' | 'move';
  elementId: string;
  elementType: string;
  before?: ChangeSnapshot;
  after?: ChangeSnapshot;
  timestamp: Date;
  userId: string;
}

export interface ConflictResolution {
  id: string;
  conflictType: 'content' | 'position' | 'style' | 'deletion';
  elementId: string;
  resolution: 'accept_local' | 'accept_remote' | 'merge' | 'manual';
  resolvedBy: string;
  timestamp: Date;
}

export interface ActivityNotification {
  id: string;
  type: 'comment' | 'mention' | 'version_created' | 'user_joined' | 'user_left' | 'element_changed';
  userId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  users: CollaborationUser[];
  comments: Comment[];
  versions: ProjectVersion[];
  notifications: ActivityNotification[];
  currentVersion: string;
  isRecording: boolean;
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    allowComments: boolean;
    allowVersioning: boolean;
    maxVersions: number;
    notificationSettings: {
      comments: boolean;
      mentions: boolean;
      userActivity: boolean;
      versionChanges: boolean;
    };
  };
}

export interface CollaborationStats {
  totalUsers: number;
  activeUsers: number;
  totalComments: number;
  unresolvedComments: number;
  totalVersions: number;
  lastActivity: Date;
  collaborationScore: number;
}

export interface GenericCollaborationMessage {
  type: string;
  [key: string]: unknown;
}

export type CollaborationInboundMessage =
  | { type: 'user_joined'; user: CollaborationUser }
  | { type: 'user_left'; userId: string }
  | { type: 'cursor_update'; userId: string; cursor: CursorPosition }
  | { type: 'comment_added'; comment: Comment }
  | { type: 'comment_updated'; comment: Comment }
  | { type: 'version_created'; version: ProjectVersion }
  | { type: 'notification'; notification: ActivityNotification }
  | { type: 'element_changed'; change?: VersionChange }
  | { type: 'pong' }
  | GenericCollaborationMessage;

export type CollaborationOutboundMessage =
  | { type: 'join_session'; user: CollaborationUser }
  | { type: 'leave_session'; userId: string }
  | { type: 'cursor_update'; userId: string; cursor: CursorPosition }
  | { type: 'comment_added'; comment: Comment }
  | { type: 'comment_updated'; comment: Comment }
  | { type: 'version_created'; version: ProjectVersion }
  | { type: 'notification'; notification: ActivityNotification }
  | { type: 'element_changed'; change: VersionChange }
  | GenericCollaborationMessage;

const isCollaborationInboundMessage = (value: unknown): value is CollaborationInboundMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'type' in value && typeof (value as { type?: unknown }).type === 'string';
};

export const useRealTimeCollaboration = (projectId: string) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize collaboration session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load session data
      const response = await fetch(`/api/collaboration/sessions/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load collaboration session');
      }

      const sessionData = await response.json();
      setSession(sessionData);

      // Initialize WebSocket connection
      connectWebSocket();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize collaboration');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/collaboration/${projectId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (isCollaborationInboundMessage(message)) {
            handleWebSocketMessage(message);
          } else {
            console.warn('Ignoring malformed collaboration message', message);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
      };

    } catch (err) {
      setError('Failed to establish WebSocket connection');
    }
  }, [projectId]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: CollaborationInboundMessage) => {
    switch (message.type) {
      case 'user_joined':
        setSession(prev => prev ? {
          ...prev,
          users: [...prev.users.filter(u => u.id !== message.user.id), message.user]
        } : null);
        break;

      case 'user_left':
        setSession(prev => prev ? {
          ...prev,
          users: prev.users.filter(u => u.id !== message.userId)
        } : null);
        break;

      case 'cursor_update':
        setSession(prev => prev ? {
          ...prev,
          users: prev.users.map(u => 
            u.id === message.userId 
              ? { ...u, cursor: message.cursor }
              : u
          )
        } : null);
        break;

      case 'comment_added':
        setSession(prev => prev ? {
          ...prev,
          comments: [...prev.comments, message.comment]
        } : null);
        break;

      case 'comment_updated':
        setSession(prev => prev ? {
          ...prev,
          comments: prev.comments.map(c => 
            c.id === message.comment.id ? message.comment : c
          )
        } : null);
        break;

      case 'version_created':
        setSession(prev => prev ? {
          ...prev,
          versions: [...prev.versions, message.version]
        } : null);
        break;

      case 'notification':
        setSession(prev => prev ? {
          ...prev,
          notifications: [...prev.notifications, message.notification]
        } : null);
        break;

      case 'element_changed':
        // Handle real-time element updates
        if (message.change) {
          // Emit event for other components to handle
          window.dispatchEvent(new CustomEvent('collaboration:element_changed', {
            detail: message.change
          }));
        }
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }, []);

  // Send WebSocket message
  const sendMessage = useCallback((message: CollaborationOutboundMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // User management
  const joinSession = useCallback(async (user: Omit<CollaborationUser, 'isOnline' | 'lastSeen'>) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      const userData = await response.json();
      setCurrentUser(userData);
      
      sendMessage({
        type: 'join_session',
        user: userData
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    }
  }, [projectId, sendMessage]);

  const leaveSession = useCallback(async () => {
    try {
      if (currentUser) {
        await fetch(`/api/collaboration/sessions/${projectId}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });

        sendMessage({
          type: 'leave_session',
          userId: currentUser.id
        });
      }

      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      setCurrentUser(null);
      setSession(null);
      setIsConnected(false);

    } catch (err) {
      console.error('Failed to leave session:', err);
    }
  }, [currentUser, projectId, sendMessage]);

  const updateCursor = useCallback((position: CursorPosition) => {
    if (currentUser) {
      sendMessage({
        type: 'cursor_update',
        userId: currentUser.id,
        cursor: position
      });
    }
  }, [currentUser, sendMessage]);

  // Comment management
  const addComment = useCallback(async (comment: Omit<Comment, 'id' | 'timestamp' | 'resolved' | 'replies'>) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();
      
      sendMessage({
        type: 'comment_added',
        comment: newComment
      });

      return newComment;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return null;
    }
  }, [projectId, sendMessage]);

  const updateComment = useCallback(async (commentId: string, updates: Partial<Comment>) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const updatedComment = await response.json();
      
      sendMessage({
        type: 'comment_updated',
        comment: updatedComment
      });

      return updatedComment;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      return null;
    }
  }, [projectId, sendMessage]);

  const resolveComment = useCallback(async (commentId: string) => {
    return updateComment(commentId, { resolved: true });
  }, [updateComment]);

  const addCommentReply = useCallback(async (commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reply)
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      const newReply = await response.json();
      
      // Update the comment with the new reply
      const comment = session?.comments.find(c => c.id === commentId);
      if (comment) {
        const updatedComment = {
          ...comment,
          replies: [...comment.replies, newReply]
        };
        
        sendMessage({
          type: 'comment_updated',
          comment: updatedComment
        });
      }

      return newReply;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply');
      return null;
    }
  }, [projectId, session?.comments, sendMessage]);

  // Version management
  const createVersion = useCallback(async (version: Omit<ProjectVersion, 'id' | 'timestamp' | 'isMerged'>) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(version)
      });

      if (!response.ok) {
        throw new Error('Failed to create version');
      }

      const newVersion = await response.json();
      
      sendMessage({
        type: 'version_created',
        version: newVersion
      });

      return newVersion;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
      return null;
    }
  }, [projectId, sendMessage]);

  const mergeVersion = useCallback(async (versionId: string, targetVersionId: string) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/versions/${versionId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersionId })
      });

      if (!response.ok) {
        throw new Error('Failed to merge version');
      }

      const mergeResult = await response.json();
      return mergeResult;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge version');
      return null;
    }
  }, [projectId]);

  const revertToVersion = useCallback(async (versionId: string) => {
    try {
      const response = await fetch(`/api/collaboration/sessions/${projectId}/versions/${versionId}/revert`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to revert to version');
      }

      const revertResult = await response.json();
      return revertResult;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revert to version');
      return null;
    }
  }, [projectId]);

  // Notification management
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/collaboration/sessions/${projectId}/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      setSession(prev => prev ? {
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      } : null);

    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [projectId]);

  const clearAllNotifications = useCallback(async () => {
    try {
      await fetch(`/api/collaboration/sessions/${projectId}/notifications/clear`, {
        method: 'POST'
      });

      setSession(prev => prev ? {
        ...prev,
        notifications: []
      } : null);

    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, [projectId]);

  // Element change tracking
  const trackElementChange = useCallback((change: Omit<VersionChange, 'id' | 'timestamp'>) => {
    if (currentUser) {
      const fullChange = {
        ...change,
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: currentUser.id
      };

      sendMessage({
        type: 'element_changed',
        change: fullChange
      });
    }
  }, [currentUser, sendMessage]);

  // Statistics calculation
  const calculateStats = useCallback((): CollaborationStats => {
    if (!session) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalComments: 0,
        unresolvedComments: 0,
        totalVersions: 0,
        lastActivity: new Date(),
        collaborationScore: 0
      };
    }

    const activeUsers = session.users.filter(u => u.isOnline).length;
    const unresolvedComments = session.comments.filter(c => !c.resolved).length;
    const lastActivity = Math.max(
      ...session.comments.map(c => c.timestamp.getTime()),
      ...session.versions.map(v => v.timestamp.getTime()),
      ...session.notifications.map(n => n.timestamp.getTime())
    );

    // Calculate collaboration score based on activity
    const commentActivity = session.comments.length * 2;
    const versionActivity = session.versions.length * 3;
    const userActivity = activeUsers * 5;
    const collaborationScore = Math.min(100, commentActivity + versionActivity + userActivity);

    return {
      totalUsers: session.users.length,
      activeUsers,
      totalComments: session.comments.length,
      unresolvedComments,
      totalVersions: session.versions.length,
      lastActivity: new Date(lastActivity),
      collaborationScore
    };
  }, [session]);

  // Update stats when session changes
  useEffect(() => {
    if (session) {
      setStats(calculateStats());
    }
  }, [session, calculateStats]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [initializeSession]);

  return {
    // State
    session,
    currentUser,
    isConnected,
    isLoading,
    error,
    stats,

    // User management
    joinSession,
    leaveSession,
    updateCursor,

    // Comment management
    addComment,
    updateComment,
    resolveComment,
    addCommentReply,

    // Version management
    createVersion,
    mergeVersion,
    revertToVersion,

    // Notification management
    markNotificationAsRead,
    clearAllNotifications,

    // Element tracking
    trackElementChange,

    // Utilities
    initializeSession,
    connectWebSocket
  };
};