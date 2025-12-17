'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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

export const useRealTimeCollaboration = (projectId?: string) => {
  const supabase = createBrowserSupabaseClient();
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize collaboration session
  const initializeSession = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Mock initial session data since we don't have a backend for it yet
      // In a real implementation, this would fetch from Supabase tables
      const initialSession: CollaborationSession = {
        id: `session_${projectId}`,
        projectId,
        users: [],
        comments: [],
        versions: [],
        notifications: [],
        currentVersion: 'v1',
        isRecording: false,
        settings: {
          autoSave: true,
          autoSaveInterval: 30000,
          allowComments: true,
          allowVersioning: true,
          maxVersions: 50,
          notificationSettings: {
            comments: true,
            mentions: true,
            userActivity: true,
            versionChanges: true
          }
        }
      };
      
      setSession(initialSession);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const collabUser: CollaborationUser = {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'Anonymous',
          email: user.email || '',
          avatar: user.user_metadata?.avatar_url,
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          isOnline: true,
          lastSeen: new Date(),
          role: 'editor' // Default role
        };
        setCurrentUser(collabUser);
        connectSupabaseRealtime(collabUser);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize collaboration');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  // Supabase Realtime connection management
  const connectSupabaseRealtime = useCallback((user: CollaborationUser) => {
    if (channelRef.current || !projectId) return;

    try {
      const channel = supabase.channel(`collaboration:${projectId}`, {
        config: {
          presence: {
            key: user.id,
          },
          broadcast: {
            self: false, 
          }
        }
      });

      channel
        // Presence
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<CollaborationUser>();
          const users: CollaborationUser[] = [];
          
          Object.values(state).forEach(presences => {
            presences.forEach(p => users.push(p));
          });
          
          setSession(prev => prev ? { ...prev, users } : null);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
           // Handle join
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
           // Handle leave
        })

        // Broadcast Events
        .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
          setSession(prev => prev ? {
            ...prev,
            users: prev.users.map(u => 
              u.id === payload.userId 
                ? { ...u, cursor: payload.cursor }
                : u
            )
          } : null);
        })
        .on('broadcast', { event: 'comment-added' }, ({ payload }) => {
          setSession(prev => prev ? {
            ...prev,
            comments: [...prev.comments, payload.comment]
          } : null);
        })
        .on('broadcast', { event: 'comment-updated' }, ({ payload }) => {
          setSession(prev => prev ? {
            ...prev,
            comments: prev.comments.map(c => 
              c.id === payload.comment.id ? payload.comment : c
            )
          } : null);
        })
        .on('broadcast', { event: 'version-created' }, ({ payload }) => {
          setSession(prev => prev ? {
            ...prev,
            versions: [...prev.versions, payload.version]
          } : null);
        })
        .on('broadcast', { event: 'element-changed' }, ({ payload }) => {
           if (payload.change) {
            window.dispatchEvent(new CustomEvent('collaboration:element_changed', {
              detail: payload.change
            }));
          }
        })

        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
            
            // Track presence
            await channel.track(user);
          } else if (status === 'CHANNEL_ERROR') {
            setError('Connection error');
            setIsConnected(false);
          } else if (status === 'TIMED_OUT') {
            setError('Connection timeout');
            setIsConnected(false);
          }
        });

      channelRef.current = channel;

    } catch (err) {
      setError('Failed to establish Realtime connection');
    }
  }, [projectId, supabase]);

  // User management
  const joinSession = useCallback(async (user: Omit<CollaborationUser, 'isOnline' | 'lastSeen'>) => {
    // In Supabase Realtime, joining is handled by .track() in connectSupabaseRealtime
    // This method is kept for compatibility but might not be needed if we auto-connect
  }, []);

  const leaveSession = useCallback(async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
      setSession(null);
      setCurrentUser(null);
    }
  }, [supabase]);

  const updateCursor = useCallback((position: CursorPosition) => {
    if (currentUser && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: { userId: currentUser.id, cursor: position }
      });
    }
  }, [currentUser]);

  // Comment management
  const addComment = useCallback(async (comment: Omit<Comment, 'id' | 'timestamp' | 'resolved' | 'replies'>) => {
    const newComment: Comment = {
      ...comment,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      resolved: false,
      replies: []
    };

    // Optimistic update
    setSession(prev => prev ? {
      ...prev,
      comments: [...prev.comments, newComment]
    } : null);

    // Broadcast
    channelRef.current?.send({
      type: 'broadcast',
      event: 'comment-added',
      payload: { comment: newComment }
    });

    return newComment;
  }, []);

  const updateComment = useCallback(async (commentId: string, updates: Partial<Comment>) => {
    // Find current comment to merge updates
    const currentComment = session?.comments.find(c => c.id === commentId);
    if (!currentComment) return null;

    const updatedComment = { ...currentComment, ...updates };

    // Optimistic update
    setSession(prev => prev ? {
      ...prev,
      comments: prev.comments.map(c => c.id === commentId ? updatedComment : c)
    } : null);

    // Broadcast
    channelRef.current?.send({
      type: 'broadcast',
      event: 'comment-updated',
      payload: { comment: updatedComment }
    });

    return updatedComment;
  }, [session?.comments]);

  const resolveComment = useCallback(async (commentId: string) => {
    return updateComment(commentId, { resolved: true });
  }, [updateComment]);

  const addCommentReply = useCallback(async (commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>) => {
    const newReply: CommentReply = {
      ...reply,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const currentComment = session?.comments.find(c => c.id === commentId);
    if (currentComment) {
      const updatedComment = {
        ...currentComment,
        replies: [...currentComment.replies, newReply]
      };
      
      // Optimistic update
      setSession(prev => prev ? {
        ...prev,
        comments: prev.comments.map(c => c.id === commentId ? updatedComment : c)
      } : null);

      // Broadcast
      channelRef.current?.send({
        type: 'broadcast',
        event: 'comment-updated',
        payload: { comment: updatedComment }
      });
    }

    return newReply;
  }, [session?.comments]);

  // Version management
  const createVersion = useCallback(async (version: Omit<ProjectVersion, 'id' | 'timestamp' | 'isMerged'>) => {
    const newVersion: ProjectVersion = {
      ...version,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      isMerged: false
    };

    // Optimistic update
    setSession(prev => prev ? {
      ...prev,
      versions: [...prev.versions, newVersion]
    } : null);

    // Broadcast
    channelRef.current?.send({
      type: 'broadcast',
      event: 'version-created',
      payload: { version: newVersion }
    });

    return newVersion;
  }, []);

  const mergeVersion = useCallback(async (versionId: string, targetVersionId: string) => {
    // Mock implementation
    return { success: true };
  }, []);

  const revertToVersion = useCallback(async (versionId: string) => {
    // Mock implementation
    return { success: true };
  }, []);

  // Notification management
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setSession(prev => prev ? {
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    } : null);
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setSession(prev => prev ? {
      ...prev,
      notifications: []
    } : null);
  }, []);

  // Element change tracking
  const trackElementChange = useCallback((change: Omit<VersionChange, 'id' | 'timestamp'>) => {
    if (currentUser) {
      const fullChange = {
        ...change,
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: currentUser.id
      };

      channelRef.current?.send({
        type: 'broadcast',
        event: 'element-changed',
        payload: { change: fullChange }
      });
    }
  }, [currentUser]);

  // Generic broadcast
  const broadcastUpdate = useCallback((event: string, payload: any) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }, [isConnected]);

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
    const lastActivity = new Date(); // Simplified

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
      lastActivity,
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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [initializeSession, supabase]);

  // Share document
  const shareDocument = useCallback(async (type: string, data: any): Promise<string> => {
    // Mock implementation
    return `https://example.com/share/${projectId}`;
  }, [projectId]);

  // Invite user
  const inviteUser = useCallback(async (email: string, role: 'viewer' | 'editor' | 'admin') => {
    // Mock implementation
    logger.debug(`Invited ${email} as ${role}`, { email, role, component: 'useRealTimeCollaboration' });
  }, []);

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
    inviteUser,

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
    broadcastUpdate,
    shareDocument,

    // Utilities
    initializeSession,
    connectWebSocket: () => {} // No-op for compatibility
  };
};
