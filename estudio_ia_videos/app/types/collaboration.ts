export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  elementId?: string;
  position?: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  replies: CommentReply[];
  mentions: string[];
}

export interface CommentReply {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  state: unknown; // Editor state snapshot
  changes: VersionChange[];
  parentVersion?: string;
  isMerged: boolean;
  mergedAt?: Date;
  mergedBy?: string;
}

export interface VersionChange {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  elementId: string;
  elementType: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  userId: string;
  timestamp: Date;
  description: string;
}

export interface ActivityNotification {
  id: string;
  type: 'comment' | 'mention' | 'version' | 'permission' | 'element_change';
  title: string;
  message: string;
  userId: string;
  projectId: string;
  elementId?: string;
  commentId?: string;
  versionId?: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  users: User[];
  activeUsers: string[];
  comments: Comment[];
  versions: ProjectVersion[];
  notifications: ActivityNotification[];
  permissions: ProjectPermissions;
  settings: CollaborationSettings;
}

export interface ProjectPermissions {
  owner: string;
  editors: string[];
  viewers: string[];
  public: boolean;
  allowComments: boolean;
  allowVersioning: boolean;
  requireApproval: boolean;
}

export interface CollaborationSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  showCursors: boolean;
  showComments: boolean;
  enableNotifications: boolean;
  enableVersioning: boolean;
  maxVersions: number;
  conflictResolution: 'manual' | 'auto' | 'last_writer_wins';
}

export interface RealTimeEvent {
  type: 'user_join' | 'user_leave' | 'cursor_move' | 'element_change' | 'comment_add' | 'comment_update' | 'version_create';
  userId: string;
  projectId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface ConflictResolution {
  id: string;
  elementId: string;
  conflictType: 'concurrent_edit' | 'delete_edit' | 'move_conflict';
  localChange: Record<string, unknown>;
  remoteChange: Record<string, unknown>;
  resolution: 'accept_local' | 'accept_remote' | 'merge' | 'manual';
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface MergeRequest {
  id: string;
  sourceVersionId: string;
  targetVersionId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  reviewers: string[];
  conflicts: ConflictResolution[];
  autoMergeable: boolean;
}