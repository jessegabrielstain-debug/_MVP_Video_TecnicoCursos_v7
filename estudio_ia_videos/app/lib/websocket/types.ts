
export enum TimelineEvent {
  JOIN_PROJECT = 'join-project',
  LEAVE_PROJECT = 'leave-project',
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  ACTIVE_USERS = 'active-users',
  CURSOR_MOVE = 'cursor-move',
  SELECTION_CHANGE = 'selection-change',
  COMMENT = 'comment',
  NEW_COMMENT = 'new-comment',
  TIMELINE_UPDATE = 'timeline-update',
  TIMELINE_UPDATED = 'timeline-updated',
  CLIP_ADDED = 'clip-added',
  NOTIFICATION = 'notification',
  CONFLICT = 'conflict',
  TRACK_LOCKED = 'track-locked',
  TRACK_UNLOCKED = 'track-unlocked',
  PRESENCE_UPDATE = 'presence-update'
}

export interface SocketUser {
  userId: string;
  userName?: string;
  userImage?: string;
  projectId?: string;
}

export interface JoinProjectPayload {
  projectId: string;
  userName?: string;
  userImage?: string;
}

export interface CursorMoveData {
  x: number;
  y: number;
  elementId?: string;
  userId?: string;
  userName?: string;
}

export interface SelectionChangeData {
  selectedIds: string[];
  range?: { start: number; end: number };
  userId?: string;
}

export interface WebSocketMessage<T = unknown> {
  event: TimelineEvent;
  data: T;
  timestamp: number;
  userId: string;
  projectId: string;
}

export interface TimelineUpdatePayload {
  projectId: string;
  changes: unknown; // Pode ser refinado se tivermos a estrutura exata das mudanças
  userId: string;
}

export interface CommentPayload {
  projectId: string;
  content: string;
  userId: string;
  timestamp: string;
}
