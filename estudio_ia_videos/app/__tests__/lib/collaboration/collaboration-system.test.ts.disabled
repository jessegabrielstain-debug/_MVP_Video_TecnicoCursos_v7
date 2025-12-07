/**
 * Testes do Video Collaboration System
 * 
 * Cobertura completa:
 * - User management
 * - Comments system
 * - Versioning
 * - Permissions
 * - Approvals
 * - Real-time sync
 * - Presence tracking
 * - Resource locking
 * - Activities
 * - Configuration
 */

import {
  VideoCollaborationSystem,
  CollaborationUser,
  TimelineComment,
  ProjectVersion,
  UserPermission,
  ApprovalRequest,
  UserPresence,
  ResourceLock,
  Activity,
  createBasicCollaborationSystem,
  createEnterpriseCollaborationSystem,
  createDevelopmentCollaborationSystem,
} from '../../../lib/collaboration/collaboration-system';

describe('VideoCollaborationSystem', () => {
  let system: VideoCollaborationSystem;
  let errorHandler: jest.Mock;

  beforeEach(() => {
    system = new VideoCollaborationSystem();
    
    // Capturar eventos de erro para evitar crashes
    errorHandler = jest.fn();
    system.on('error', errorHandler);
  });

  afterEach(() => {
    system.destroy();
  });

  /**
   * Helper para setup de usuário owner com permissões
   */
  const setupOwner = () => {
    const ownerId = system.addUser({ 
      id: 'owner', 
      name: 'Owner User', 
      email: 'owner@example.com', 
      role: 'owner' 
    });
    return ownerId;
  };

  /**
   * Helper para dar permissões a um usuário
   */
  const setupUserWithPermissions = (userId: string, projectId: string, role: 'editor' | 'viewer' | 'admin' = 'editor') => {
    const ownerId = setupOwner();
    system.addUser({ id: userId, name: `User ${userId}`, email: `${userId}@example.com`, role });
    system.grantPermission(userId, projectId, role, ownerId);
  };

  // ===========================================================================
  // USER MANAGEMENT
  // ===========================================================================

  describe('User Management', () => {
    it('should add user', () => {
      const userId = system.addUser({
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'editor',
      });

      expect(userId).toBe('user1');

      const user = system.getUser('user1');
      expect(user).toBeDefined();
      expect(user?.name).toBe('John Doe');
      expect(user?.online).toBe(false);
    });

    it('should get all users', () => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'viewer' });

      const users = system.getAllUsers();
      expect(users).toHaveLength(2);
    });

    it('should set user online status', () => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });

      const result = system.setUserOnlineStatus('user1', true);
      expect(result).toBe(true);

      const user = system.getUser('user1');
      expect(user?.online).toBe(true);
    });

    it('should get online users', () => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'viewer' });

      system.setUserOnlineStatus('user1', true);

      const online = system.getOnlineUsers();
      expect(online).toHaveLength(1);
      expect(online[0].id).toBe('user1');
    });
  });

  // ===========================================================================
  // COMMENTS SYSTEM
  // ===========================================================================

  describe('Comments System', () => {
    beforeEach(() => {
      setupUserWithPermissions('user1', 'project1', 'editor');
    });

    it('should create comment', () => {
      const commentId = system.createComment(
        'user1',
        'project1',
        5.5,
        'Great scene!',
        ['user2']
      );

      expect(commentId).toBeDefined();
      expect(commentId).toMatch(/^comment-/);

      const stats = system.getStatistics();
      expect(stats.totalComments).toBe(1);
      expect(stats.openComments).toBe(1);
    });

    it('should not create comment without permission', () => {
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'viewer' });

      const errorSpy = jest.fn();
      system.on('error', errorSpy);

      const commentId = system.createComment('user2', 'project1', 5.5, 'Comment');

      expect(commentId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'permission-denied' })
      );
    });

    it('should reply to comment', () => {
      const commentId = system.createComment('user1', 'project1', 5.5, 'Original comment');

      const replyId = system.replyToComment(commentId!, 'user1', 'Reply here');

      expect(replyId).toBeDefined();
      expect(replyId).toMatch(/^reply-/);
    });

    it('should update comment', () => {
      const commentId = system.createComment('user1', 'project1', 5.5, 'Original');

      const result = system.updateComment(commentId!, 'user1', 'Updated content');

      expect(result).toBe(true);
    });

    it('should resolve comment', () => {
      const commentId = system.createComment('user1', 'project1', 5.5, 'Fix this');

      const result = system.resolveComment(commentId!, 'user1');

      expect(result).toBe(true);

      const stats = system.getStatistics();
      expect(stats.openComments).toBe(0);
      expect(stats.resolvedComments).toBe(1);
    });

    it('should delete comment', () => {
      const commentId = system.createComment('user1', 'project1', 5.5, 'To be deleted');

      const result = system.deleteComment(commentId!, 'user1');

      expect(result).toBe(true);

      const stats = system.getStatistics();
      expect(stats.openComments).toBe(0);
    });

    it('should get project comments', () => {
      system.createComment('user1', 'project1', 5.5, 'Comment 1');
      system.createComment('user1', 'project1', 10.0, 'Comment 2');

      const comments = system.getProjectComments('project1');

      expect(comments).toHaveLength(2);
    });

    it('should get comments at timestamp', () => {
      system.createComment('user1', 'project1', 5.0, 'Comment at 5s');
      system.createComment('user1', 'project1', 5.5, 'Comment at 5.5s');
      system.createComment('user1', 'project1', 15.0, 'Comment at 15s');

      const comments = system.getCommentsAtTimestamp('project1', 5.0, 1);

      expect(comments).toHaveLength(2);
    });

    it('should not exceed max comments', () => {
      const testSystem = new VideoCollaborationSystem({ maxCommentsPerProject: 2 });
      testSystem.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      testSystem.grantPermission('user1', 'project1', 'editor', 'owner');

      const errorSpy = jest.fn();
      testSystem.on('error', errorSpy);

      testSystem.createComment('user1', 'project1', 1, 'Comment 1');
      testSystem.createComment('user1', 'project1', 2, 'Comment 2');
      const comment3 = testSystem.createComment('user1', 'project1', 3, 'Comment 3');

      expect(comment3).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'max-comments' })
      );
    });
  });

  // ===========================================================================
  // VERSIONING
  // ===========================================================================

  describe('Versioning', () => {
    beforeEach(() => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
    });

    it('should create version', () => {
      const versionId = system.createVersion(
        'project1',
        'user1',
        'Version 1',
        { data: 'test' },
        'Initial version',
        ['stable']
      );

      expect(versionId).toBeDefined();
      expect(versionId).toMatch(/^version-project1-/);

      const stats = system.getStatistics();
      expect(stats.totalVersions).toBe(1);
    });

    it('should get version', () => {
      const versionId = system.createVersion('project1', 'user1', 'v1', { data: 'test' });

      const version = system.getVersion(versionId!);

      expect(version).toBeDefined();
      expect(version?.name).toBe('v1');
      expect(version?.versionNumber).toBe(1);
    });

    it('should get project versions', () => {
      system.createVersion('project1', 'user1', 'v1', { data: 'test1' });
      system.createVersion('project1', 'user1', 'v2', { data: 'test2' });
      system.createVersion('project2', 'user1', 'v1', { data: 'test3' });

      const versions = system.getProjectVersions('project1');

      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(2); // Sorted descending
    });

    it('should restore version', async () => {
      system.grantPermission('user1', 'project1', 'editor', 'owner');

      const v1 = system.createVersion('project1', 'user1', 'v1', { data: 'original' });
      system.createVersion('project1', 'user1', 'v2', { data: 'modified' });

      const result = await system.restoreVersion(v1!, 'user1');

      expect(result).toBe(true);

      const versions = system.getProjectVersions('project1');
      expect(versions).toHaveLength(3); // v1, v2, restored
    });

    it('should compare versions', () => {
      const v1 = system.createVersion('project1', 'user1', 'v1', { a: 1, b: 2 });
      const v2 = system.createVersion('project1', 'user1', 'v2', { a: 1, b: 3, c: 4 });

      const comparison = system.compareVersions(v1!, v2!);

      expect(comparison).toBeDefined();
      expect(comparison.differences.added).toContain('c');
      expect(comparison.differences.modified).toHaveLength(1);
    });

    it('should not create version when disabled', () => {
      const testSystem = new VideoCollaborationSystem({ enableVersioning: false });
      testSystem.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });

      const errorSpy = jest.fn();
      testSystem.on('error', errorSpy);

      const versionId = testSystem.createVersion('project1', 'user1', 'v1', { data: 'test' });

      expect(versionId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'versioning-disabled' })
      );
    });
  });

  // ===========================================================================
  // PERMISSIONS
  // ===========================================================================

  describe('Permissions', () => {
    beforeEach(() => {
      system.addUser({ id: 'owner', name: 'Owner', email: 'owner@example.com', role: 'owner' });
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
    });

    it('should grant permission', () => {
      const result = system.grantPermission('user1', 'project1', 'editor', 'owner');

      expect(result).toBe(true);

      const perm = system.getUserPermission('user1', 'project1');
      expect(perm).toBeDefined();
      expect(perm?.role).toBe('editor');
    });

    it('should revoke permission', () => {
      system.grantPermission('user1', 'project1', 'editor', 'owner');

      const result = system.revokePermission('user1', 'project1', 'owner');

      expect(result).toBe(true);

      const perm = system.getUserPermission('user1', 'project1');
      expect(perm).toBeUndefined();
    });

    it('should check comment permission', () => {
      system.grantPermission('user1', 'project1', 'editor', 'owner');

      const canComment = system.canUserComment('user1', 'project1');

      expect(canComment).toBe(true);
    });

    it('should check edit permission', () => {
      system.grantPermission('user1', 'project1', 'editor', 'owner');

      const canEdit = system.canUserEdit('user1', 'project1');

      expect(canEdit).toBe(true);
    });

    it('should check approve permission', () => {
      system.grantPermission('user1', 'project1', 'admin', 'owner');

      const canApprove = system.canUserApprove('user1', 'project1');

      expect(canApprove).toBe(true);
    });

    it('should get project users', () => {
      system.grantPermission('user1', 'project1', 'editor', 'owner');
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'viewer' });
      system.grantPermission('user2', 'project1', 'viewer', 'owner');

      const users = system.getProjectUsers('project1');

      expect(users).toHaveLength(2);
    });

    it('should handle expired permissions', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      system.grantPermission('user1', 'project1', 'editor', 'owner', {
        expiresAt: yesterday,
      });

      const perm = system.getUserPermission('user1', 'project1');

      expect(perm).toBeUndefined();
    });
  });

  // ===========================================================================
  // APPROVALS
  // ===========================================================================

  describe('Approvals', () => {
    beforeEach(() => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      system.addUser({ id: 'approver1', name: 'Approver 1', email: 'app1@example.com', role: 'admin' });
      system.addUser({ id: 'approver2', name: 'Approver 2', email: 'app2@example.com', role: 'admin' });
      
      // Ativar requireApproval ou usar priority critical em todos os testes
      system.updateConfig({ requireApproval: true });
    });

    it('should create approval request', () => {
      const requestId = system.createApprovalRequest(
        'project1',
        'version1',
        'user1',
        ['approver1', 'approver2'],
        'Please review changes',
        'high'
      );

      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^approval-/);

      const stats = system.getStatistics();
      expect(stats.pendingApprovals).toBe(1);
    });

    it('should vote on approval', () => {
      const requestId = system.createApprovalRequest(
        'project1',
        'version1',
        'user1',
        ['approver1', 'approver2'],
        'Review'
      );

      const result = system.voteApproval(requestId!, 'approver1', true, 'Looks good');

      expect(result).toBe(true);
    });

    it('should approve when all vote yes', () => {
      const requestId = system.createApprovalRequest(
        'project1',
        'version1',
        'user1',
        ['approver1', 'approver2'],
        'Review',
        'high'
      );

      system.voteApproval(requestId!, 'approver1', true);
      system.voteApproval(requestId!, 'approver2', true);

      const stats = system.getStatistics();
      expect(stats.pendingApprovals).toBe(0);
    });

    it('should reject when any vote no', () => {
      const requestId = system.createApprovalRequest(
        'project1',
        'version1',
        'user1',
        ['approver1', 'approver2'],
        'Review',
        'high'
      );

      system.voteApproval(requestId!, 'approver1', true);
      system.voteApproval(requestId!, 'approver2', false, 'Needs changes');

      const stats = system.getStatistics();
      expect(stats.pendingApprovals).toBe(0);
    });

    it('should not allow non-approver to vote', () => {
      const requestId = system.createApprovalRequest(
        'project1',
        'version1',
        'user1',
        ['approver1'],
        'Review',
        'high'
      );

      const errorSpy = jest.fn();
      system.on('error', errorSpy);

      const result = system.voteApproval(requestId!, 'approver2', true);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'not-approver' })
      );
    });

    it('should cancel approval request', () => {
      const requestId = system.createApprovalRequest(
        'project1',
        'version1',
        'user1',
        ['approver1'],
        'Review',
        'high'
      );

      const result = system.cancelApprovalRequest(requestId!, 'user1');

      expect(result).toBe(true);

      const stats = system.getStatistics();
      expect(stats.pendingApprovals).toBe(0);
    });

    it('should get pending approvals', () => {
      // Criar approvals com priority critical para garantir criação
      system.createApprovalRequest('project1', 'v1', 'user1', ['approver1'], 'Review 1', 'critical');
      system.createApprovalRequest('project1', 'v2', 'user1', ['approver1'], 'Review 2', 'critical');

      const pending = system.getPendingApprovals('project1');

      expect(pending).toHaveLength(2);
    });
  });

  // ===========================================================================
  // REAL-TIME SYNC
  // ===========================================================================

  describe('Real-time Sync', () => {
    it('should add sync change', () => {
      const changeId = system.addSyncChange('user1', 'project1', 'edit', { field: 'value' });

      expect(changeId).toBeDefined();
      expect(changeId).toMatch(/^sync-/);
    });

    it('should resolve conflict', () => {
      // Simular conflito manualmente
      const conflict = {
        id: 'conflict-1',
        changes: [
          {
            id: 'sync-1',
            userId: 'user1',
            projectId: 'project1',
            type: 'edit',
            data: { field: 'value1' },
            timestamp: new Date(),
            applied: false,
          },
          {
            id: 'sync-2',
            userId: 'user2',
            projectId: 'project1',
            type: 'edit',
            data: { field: 'value2' },
            timestamp: new Date(),
            applied: false,
          },
        ],
      };

      // @ts-ignore - acessando propriedade privada para teste
      system['conflicts'].push(conflict);
      // @ts-ignore
      system['stats'].syncConflicts++;

      const result = system.resolveConflict('conflict-1', 'user1', { field: 'resolved' });

      expect(result).toBe(true);

      const stats = system.getStatistics();
      expect(stats.syncConflicts).toBe(0);
    });
  });

  // ===========================================================================
  // PRESENCE & LOCKS
  // ===========================================================================

  describe('Presence & Locks', () => {
    beforeEach(() => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
    });

    it('should update presence', () => {
      system.updatePresence('user1', 'project1', 'timeline', true, 5.5);

      const presences = system.getProjectPresences('project1');

      expect(presences).toHaveLength(1);
      expect(presences[0].userId).toBe('user1');
      expect(presences[0].editing).toBe(true);
    });

    it('should get project presences', () => {
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'editor' });

      system.updatePresence('user1', 'project1', 'timeline', true);
      system.updatePresence('user2', 'project1', 'effects', false);

      const presences = system.getProjectPresences('project1');

      expect(presences).toHaveLength(2);
    });

    it('should lock resource', () => {
      const result = system.lockResource('scene1', 'scene', 'user1');

      expect(result).toBe(true);

      const stats = system.getStatistics();
      expect(stats.activeLocks).toBe(1);
    });

    it('should not lock already locked resource', () => {
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'editor' });

      const errorSpy = jest.fn();
      system.on('error', errorSpy);

      system.lockResource('scene1', 'scene', 'user1', 60000);
      const result = system.lockResource('scene1', 'scene', 'user2');

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'resource-locked' })
      );
    });

    it('should unlock resource', () => {
      system.lockResource('scene1', 'scene', 'user1');

      const result = system.unlockResource('scene1', 'user1');

      expect(result).toBe(true);

      const stats = system.getStatistics();
      expect(stats.activeLocks).toBe(0);
    });

    it('should not unlock resource by different user', () => {
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'editor' });

      const errorSpy = jest.fn();
      system.on('error', errorSpy);

      system.lockResource('scene1', 'scene', 'user1');
      const result = system.unlockResource('scene1', 'user2');

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'not-lock-owner' })
      );
    });

    it('should check if resource is locked', () => {
      system.lockResource('scene1', 'scene', 'user1');

      const isLocked = system.isResourceLocked('scene1');

      expect(isLocked).toBe(true);
    });
  });

  // ===========================================================================
  // ACTIVITIES
  // ===========================================================================

  describe('Activities', () => {
    beforeEach(() => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      system.grantPermission('user1', 'project1', 'editor', 'owner');
    });

    it('should log activity on comment creation', () => {
      system.createComment('user1', 'project1', 5.5, 'Test comment');

      const activities = system.getProjectActivities('project1');

      expect(activities.length).toBeGreaterThan(0);
      
      // Buscar atividade de comment:created (pode não ser a primeira por causa de permission:changed)
      const commentActivity = activities.find(a => a.type === 'comment:created');
      expect(commentActivity).toBeDefined();
      expect(commentActivity?.type).toBe('comment:created');
    });

    it('should get project activities', () => {
      system.createComment('user1', 'project1', 5.5, 'Comment 1');
      system.createComment('user1', 'project1', 10.0, 'Comment 2');

      const activities = system.getProjectActivities('project1');

      expect(activities.length).toBeGreaterThanOrEqual(2);
    });

    it('should get user activities', () => {
      system.createComment('user1', 'project1', 5.5, 'Comment');
      system.createVersion('project1', 'user1', 'v1', { data: 'test' });

      const activities = system.getUserActivities('user1');

      expect(activities.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit activities', () => {
      for (let i = 0; i < 100; i++) {
        system.createComment('user1', 'project1', i, `Comment ${i}`);
      }

      const activities = system.getProjectActivities('project1', 10);

      expect(activities).toHaveLength(10);
    });
  });

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  describe('Configuration', () => {
    it('should get configuration', () => {
      const config = system.getConfig();

      expect(config).toBeDefined();
      expect(config.maxCommentsPerProject).toBeDefined();
      expect(config.enableRealtime).toBeDefined();
    });

    it('should update configuration', () => {
      system.updateConfig({
        maxCommentsPerProject: 2000,
        enableRealtime: false,
      });

      const config = system.getConfig();

      expect(config.maxCommentsPerProject).toBe(2000);
      expect(config.enableRealtime).toBe(false);
    });
  });

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  describe('Statistics', () => {
    beforeEach(() => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      system.grantPermission('user1', 'project1', 'editor', 'owner');
    });

    it('should track user statistics', () => {
      system.addUser({ id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'viewer' });
      system.setUserOnlineStatus('user1', true);

      const stats = system.getStatistics();

      expect(stats.totalUsers).toBe(2);
      expect(stats.onlineUsers).toBe(1);
    });

    it('should track comment statistics', () => {
      const c1 = system.createComment('user1', 'project1', 5.5, 'Comment 1');
      system.createComment('user1', 'project1', 10.0, 'Comment 2');
      system.resolveComment(c1!, 'user1');

      const stats = system.getStatistics();

      expect(stats.totalComments).toBe(2);
      expect(stats.openComments).toBe(1);
      expect(stats.resolvedComments).toBe(1);
    });

    it('should track version statistics', () => {
      system.createVersion('project1', 'user1', 'v1', { data: 'test' });
      system.createVersion('project1', 'user1', 'v2', { data: 'test' });

      const stats = system.getStatistics();

      expect(stats.totalVersions).toBe(2);
    });

    it('should track lock statistics', () => {
      system.lockResource('scene1', 'scene', 'user1');

      const stats = system.getStatistics();

      expect(stats.activeLocks).toBe(1);
    });
  });

  // ===========================================================================
  // FACTORY FUNCTIONS
  // ===========================================================================

  describe('Factory Functions', () => {
    it('should create basic collaboration system', () => {
      const basic = createBasicCollaborationSystem();

      expect(basic).toBeInstanceOf(VideoCollaborationSystem);

      const config = basic.getConfig();
      expect(config.maxCommentsPerProject).toBe(500);
      expect(config.enableRealtime).toBe(true);
      
      // Limpar recursos
      basic.destroy();
    });

    it('should create enterprise collaboration system', () => {
      const enterprise = createEnterpriseCollaborationSystem();

      expect(enterprise).toBeInstanceOf(VideoCollaborationSystem);

      const config = enterprise.getConfig();
      expect(config.maxCommentsPerProject).toBe(2000);
      expect(config.requireApproval).toBe(true);
      
      // Limpar recursos
      enterprise.destroy();
    });

    it('should create development collaboration system', () => {
      const dev = createDevelopmentCollaborationSystem();

      expect(dev).toBeInstanceOf(VideoCollaborationSystem);

      const config = dev.getConfig();
      expect(config.maxCommentsPerProject).toBe(100);
      expect(config.enableRealtime).toBe(false);
      
      // Limpar recursos
      dev.destroy();
    });
  });

  // ===========================================================================
  // SYSTEM RESET
  // ===========================================================================

  describe('System Reset', () => {
    it('should reset system', () => {
      system.addUser({ id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'editor' });
      system.grantPermission('user1', 'project1', 'editor', 'owner');
      system.createComment('user1', 'project1', 5.5, 'Comment');
      system.createVersion('project1', 'user1', 'v1', { data: 'test' });

      system.reset();

      const stats = system.getStatistics();
      expect(stats.totalUsers).toBe(0);
      expect(stats.totalComments).toBe(0);
      expect(stats.totalVersions).toBe(0);

      const users = system.getAllUsers();
      expect(users).toHaveLength(0);
    });
  });
});
