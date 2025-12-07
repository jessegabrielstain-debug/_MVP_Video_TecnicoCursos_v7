# 📖 Sprint 61 - API Reference
## Video Collaboration System - Complete API Documentation

**Version:** 1.0.0  
**Module:** #17 - Video Collaboration System  
**File:** `lib/collaboration/collaboration-system.ts`

---

## Table of Contents

1. [Types & Interfaces](#types--interfaces)
2. [VideoCollaborationSystem Class](#videocollaborationsystem-class)
3. [Factory Functions](#factory-functions)
4. [Events](#events)
5. [Configuration](#configuration)

---

## Types & Interfaces

### UserRole
```typescript
type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';
```

### CommentStatus
```typescript
type CommentStatus = 'open' | 'resolved' | 'deleted';
```

### ActivityType
```typescript
type ActivityType =
  | 'comment:created' | 'comment:replied' | 'comment:resolved'
  | 'version:created' | 'version:restored'
  | 'permission:changed' | 'approval:requested' | 'approval:approved';
```

### ApprovalStatus
```typescript
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
```

### ChangePriority
```typescript
type ChangePriority = 'low' | 'medium' | 'high' | 'critical';
```

### CollaborationUser
```typescript
interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  online: boolean;
  lastSeen: Date;
}
```

### TimelineComment
```typescript
interface TimelineComment {
  id: string;
  userId: string;
  projectId: string;
  timestamp: number;
  content: string;
  status: CommentStatus;
  replies: TimelineComment[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ProjectVersion
```typescript
interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  data: any;
  parentVersionId?: string;
  tags?: string[];
}
```

### UserPermission
```typescript
interface UserPermission {
  userId: string;
  projectId: string;
  role: UserRole;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  canComment: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canShare: boolean;
}
```

### ApprovalRequest
```typescript
interface ApprovalRequest {
  id: string;
  projectId: string;
  versionId: string;
  requestedBy: string;
  requestedAt: Date;
  status: ApprovalStatus;
  approvers: string[];
  approvals: ApprovalVote[];
  deadline?: Date;
  priority: ChangePriority;
  description: string;
  resolvedAt?: Date;
}
```

### UserPresence
```typescript
interface UserPresence {
  userId: string;
  projectId: string;
  lastActivity: Date;
  currentSection?: string;
  editing?: boolean;
  cursorPosition?: { x: number; y: number };
}
```

### ResourceLock
```typescript
interface ResourceLock {
  resourceId: string;
  resourceType: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
}
```

### Activity
```typescript
interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  projectId: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### CollaborationConfig
```typescript
interface CollaborationConfig {
  maxCommentsPerProject: number;
  maxVersionsPerProject: number;
  versionRetentionDays: number;
  enableRealtime: boolean;
  syncInterval: number;
  lockTimeout: number;
  requireApproval: boolean;
}
```

### CollaborationStats
```typescript
interface CollaborationStats {
  totalUsers: number;
  onlineUsers: number;
  totalComments: number;
  openComments: number;
  resolvedComments: number;
  totalVersions: number;
  totalActivities: number;
  pendingApprovals: number;
  activeLocks: number;
  syncConflicts: number;
}
```

---

## VideoCollaborationSystem Class

### Constructor

```typescript
constructor(config?: Partial<CollaborationConfig>)
```

**Parameters:**
- `config` (optional): Partial configuration object

**Example:**
```typescript
const system = new VideoCollaborationSystem({
  maxCommentsPerProject: 1000,
  enableRealtime: true,
});
```

---

### User Management

#### addUser()
```typescript
addUser(user: Omit<CollaborationUser, 'online' | 'lastSeen'>): string
```

Adds a new user to the system.

**Parameters:**
- `user`: User object without `online` and `lastSeen` (auto-generated)

**Returns:** User ID

**Events:** `user:added`

**Example:**
```typescript
const userId = system.addUser({
  id: 'user-001',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'editor',
});
```

#### getUser()
```typescript
getUser(userId: string): CollaborationUser | undefined
```

Gets a user by ID.

**Returns:** User object or undefined if not found

#### getAllUsers()
```typescript
getAllUsers(): CollaborationUser[]
```

Gets all users in the system.

**Returns:** Array of users

#### setUserOnlineStatus()
```typescript
setUserOnlineStatus(userId: string, online: boolean): boolean
```

Sets user's online status.

**Returns:** `true` if successful, `false` if user not found

**Events:** `user:status-changed`

#### getOnlineUsers()
```typescript
getOnlineUsers(): CollaborationUser[]
```

Gets all online users.

**Returns:** Array of online users

---

### Comments System

#### createComment()
```typescript
createComment(
  userId: string,
  projectId: string,
  timestamp: number,
  content: string,
  mentions?: string[]
): string | null
```

Creates a new timeline comment.

**Returns:** Comment ID or `null` if failed (no permission or limit reached)

**Events:** `comment:created`, `mentions:created`

**Errors:** `permission-denied`, `max-comments`

#### replyToComment()
```typescript
replyToComment(
  commentId: string,
  userId: string,
  content: string,
  mentions?: string[]
): string | null
```

Replies to an existing comment.

**Returns:** Reply ID or `null` if failed

#### updateComment()
```typescript
updateComment(commentId: string, userId: string, content: string): boolean
```

Updates comment content.

**Returns:** `true` if successful

**Events:** `comment:updated`

#### resolveComment()
```typescript
resolveComment(commentId: string, userId: string): boolean
```

Marks comment as resolved.

**Returns:** `true` if successful

**Events:** `comment:resolved`

#### deleteComment()
```typescript
deleteComment(commentId: string, userId: string): boolean
```

Soft deletes a comment (changes status to 'deleted').

**Returns:** `true` if successful

**Events:** `comment:deleted`

#### getProjectComments()
```typescript
getProjectComments(projectId: string, includeResolved?: boolean): TimelineComment[]
```

Gets all comments for a project.

**Parameters:**
- `includeResolved` (default: `true`): Include resolved comments

**Returns:** Array of comments sorted by timestamp

#### getCommentsAtTimestamp()
```typescript
getCommentsAtTimestamp(
  projectId: string,
  timestamp: number,
  range?: number
): TimelineComment[]
```

Gets comments near a specific timestamp.

**Parameters:**
- `range` (default: `0.5`): Time range in seconds (±)

**Returns:** Comments within timestamp ± range

---

### Versioning

#### createVersion()
```typescript
createVersion(
  projectId: string,
  userId: string,
  name: string,
  data: any,
  description?: string,
  tags?: string[]
): string | null
```

Creates a new project version.

**Returns:** Version ID or `null` if limit reached

**Events:** `version:created`

#### getVersion()
```typescript
getVersion(versionId: string): ProjectVersion | undefined
```

Gets a version by ID.

#### getProjectVersions()
```typescript
getProjectVersions(projectId: string): ProjectVersion[]
```

Gets all versions for a project (sorted by version number).

#### restoreVersion()
```typescript
async restoreVersion(versionId: string, userId: string): Promise<boolean>
```

Restores a previous version.

**Returns:** Promise resolving to `true` if successful

**Events:** `version:restored`

#### compareVersions()
```typescript
compareVersions(versionId1: string, versionId2: string): VersionComparison | null
```

Compares two versions.

**Returns:** Comparison object with `version1`, `version2`, `modifiedBy`, `daysBetween`, `changes`

---

### Permissions

#### grantPermission()
```typescript
grantPermission(
  userId: string,
  projectId: string,
  role: UserRole,
  grantedBy: string,
  options?: {
    expiresAt?: Date;
    canComment?: boolean;
    canEdit?: boolean;
    canApprove?: boolean;
    canShare?: boolean;
  }
): boolean
```

Grants permission to a user.

**Returns:** `true` if successful

**Events:** `permission:granted`

**Errors:** `permission-denied`

#### revokePermission()
```typescript
revokePermission(userId: string, projectId: string, revokedBy: string): boolean
```

Revokes user's permission.

**Returns:** `true` if successful

**Events:** `permission:revoked`

#### getUserPermission()
```typescript
getUserPermission(userId: string, projectId: string): UserPermission | undefined
```

Gets user's permission for a project.

#### canUserComment()
```typescript
canUserComment(userId: string, projectId: string): boolean
```

Checks if user can comment.

#### canUserEdit()
```typescript
canUserEdit(userId: string, projectId: string): boolean
```

Checks if user can edit.

#### canUserApprove()
```typescript
canUserApprove(userId: string, projectId: string): boolean
```

Checks if user can approve.

#### getProjectUsers()
```typescript
getProjectUsers(projectId: string): UserPermission[]
```

Gets all users with permissions on a project.

---

### Approvals

#### createApprovalRequest()
```typescript
createApprovalRequest(
  projectId: string,
  versionId: string,
  userId: string,
  approvers: string[],
  description: string,
  priority?: ChangePriority,
  deadline?: Date
): string | null
```

Creates an approval request.

**Returns:** Request ID or `null` if not required (unless priority is 'critical')

**Events:** `approval:requested`

#### voteApproval()
```typescript
voteApproval(
  requestId: string,
  userId: string,
  approved: boolean,
  comment?: string
): boolean
```

Votes on an approval request.

**Returns:** `true` if successful

**Events:** `approval:approved` or `approval:rejected`

**Errors:** `not-approver`

#### cancelApprovalRequest()
```typescript
cancelApprovalRequest(requestId: string, userId: string): boolean
```

Cancels an approval request.

**Returns:** `true` if successful

**Events:** `approval:cancelled`

#### getPendingApprovals()
```typescript
getPendingApprovals(projectId?: string): ApprovalRequest[]
```

Gets pending approval requests.

**Parameters:**
- `projectId` (optional): Filter by project

**Returns:** Array of pending requests

---

### Real-time Sync

#### addSyncChange()
```typescript
addSyncChange(
  userId: string,
  projectId: string,
  type: string,
  data: any
): string
```

Adds a change to the sync queue.

**Returns:** Change ID

**Events:** `sync:change-added`

#### resolveConflict()
```typescript
resolveConflict(
  conflictId: string,
  userId: string,
  resolution: 'keep-first' | 'keep-latest' | 'merge'
): boolean
```

Resolves a sync conflict.

**Returns:** `true` if successful

**Events:** `sync:conflict-resolved`

---

### Presence & Locks

#### updatePresence()
```typescript
updatePresence(
  userId: string,
  projectId: string,
  currentSection?: string,
  editing?: boolean,
  cursorPosition?: { x: number; y: number }
): void
```

Updates user's presence.

**Events:** `presence:updated`

#### getProjectPresences()
```typescript
getProjectPresences(projectId: string): UserPresence[]
```

Gets all presences for a project.

#### lockResource()
```typescript
lockResource(
  resourceId: string,
  resourceType: string,
  userId: string,
  duration?: number
): boolean
```

Locks a resource for exclusive editing.

**Parameters:**
- `duration` (default: `config.lockTimeout`): Lock duration in ms

**Returns:** `true` if locked successfully

**Events:** `lock:acquired`

**Errors:** `resource-locked`

#### unlockResource()
```typescript
unlockResource(resourceId: string, userId: string): boolean
```

Unlocks a resource.

**Returns:** `true` if successful

**Events:** `lock:released`

#### isResourceLocked()
```typescript
isResourceLocked(resourceId: string): boolean
```

Checks if a resource is locked.

---

### Activities

#### getProjectActivities()
```typescript
getProjectActivities(projectId: string, limit?: number): Activity[]
```

Gets activities for a project.

**Parameters:**
- `limit` (default: `50`): Max activities to return

**Returns:** Array of activities (sorted newest first)

#### getUserActivities()
```typescript
getUserActivities(userId: string, limit?: number): Activity[]
```

Gets activities for a user.

---

### Configuration & Stats

#### getConfig()
```typescript
getConfig(): CollaborationConfig
```

Gets current configuration.

#### updateConfig()
```typescript
updateConfig(updates: Partial<CollaborationConfig>): void
```

Updates configuration.

**Events:** `config:updated`

#### getStatistics()
```typescript
getStatistics(): CollaborationStats
```

Gets system statistics.

#### reset()
```typescript
reset(): void
```

Resets system (clears all data).

**Events:** `system:reset`

#### destroy()
```typescript
destroy(): void
```

Destroys system and cleans up resources (timers, listeners).

---

## Factory Functions

### createBasicCollaborationSystem()
```typescript
function createBasicCollaborationSystem(): VideoCollaborationSystem
```

Creates a basic system with standard settings.

**Config:**
- 500 max comments
- 50 max versions
- 30 days retention
- Realtime enabled
- 2s sync interval
- 3min lock timeout

### createEnterpriseCollaborationSystem()
```typescript
function createEnterpriseCollaborationSystem(): VideoCollaborationSystem
```

Creates an enterprise system for production.

**Config:**
- 2000 max comments
- 200 max versions
- 180 days retention
- Realtime enabled
- 500ms sync interval
- 10min lock timeout
- Approval required

### createDevelopmentCollaborationSystem()
```typescript
function createDevelopmentCollaborationSystem(): VideoCollaborationSystem
```

Creates a development system for testing.

**Config:**
- 100 max comments
- 20 max versions
- 7 days retention
- Realtime disabled
- 5s sync interval
- 1min lock timeout

---

## Events

All events are emitted via the EventEmitter pattern.

### Event Types

| Event | Payload | Description |
|-------|---------|-------------|
| `user:added` | `CollaborationUser` | New user added |
| `user:status-changed` | `{ userId, online }` | User status changed |
| `comment:created` | `TimelineComment` | Comment created |
| `comment:replied` | `{ commentId, reply }` | Reply added |
| `comment:updated` | `TimelineComment` | Comment updated |
| `comment:resolved` | `TimelineComment` | Comment resolved |
| `comment:deleted` | `TimelineComment` | Comment deleted |
| `mentions:created` | `{ commentId, mentions, userId }` | Users mentioned |
| `version:created` | `ProjectVersion` | Version created |
| `version:restored` | `{ versionId, restoredBy }` | Version restored |
| `versions:cleaned` | `{ projectId, count }` | Old versions cleaned |
| `permission:granted` | `UserPermission` | Permission granted |
| `permission:revoked` | `{ userId, projectId }` | Permission revoked |
| `approval:requested` | `ApprovalRequest` | Approval requested |
| `approval:approved` | `ApprovalRequest` | Approval approved |
| `approval:rejected` | `ApprovalRequest` | Approval rejected |
| `approval:cancelled` | `ApprovalRequest` | Approval cancelled |
| `sync:change-added` | `SyncChange` | Sync change added |
| `sync:change-applied` | `SyncChange` | Change applied |
| `sync:conflict` | `SyncConflict` | Conflict detected |
| `sync:conflict-resolved` | `SyncConflict` | Conflict resolved |
| `presence:updated` | `UserPresence` | Presence updated |
| `lock:acquired` | `ResourceLock` | Resource locked |
| `lock:released` | `{ resourceId, userId }` | Resource unlocked |
| `lock:expired` | `ResourceLock` | Lock expired |
| `activity:logged` | `Activity` | Activity logged |
| `config:updated` | `CollaborationConfig` | Config updated |
| `system:reset` | `void` | System reset |
| `error` | `{ type, message }` | Error occurred |

### Error Types

| Type | Description |
|------|-------------|
| `permission-denied` | User lacks required permission |
| `max-comments` | Comment limit reached |
| `resource-locked` | Resource is locked by another user |
| `not-approver` | User is not in approver list |

---

## Configuration

### Default Configuration

```typescript
{
  maxCommentsPerProject: 500,
  maxVersionsPerProject: 50,
  versionRetentionDays: 30,
  enableRealtime: true,
  syncInterval: 2000,
  lockTimeout: 180000,
  requireApproval: false,
}
```

### Configuration Options

- **maxCommentsPerProject**: Maximum comments per project
- **maxVersionsPerProject**: Maximum versions per project
- **versionRetentionDays**: Days to keep versions before cleanup
- **enableRealtime**: Enable real-time sync processing
- **syncInterval**: Milliseconds between sync queue processing
- **lockTimeout**: Milliseconds before locks expire
- **requireApproval**: Require approval for all changes

---

**For usage examples, see `SPRINT61_QUICK_START.md`**
