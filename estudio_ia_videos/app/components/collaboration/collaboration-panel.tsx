'use client';

import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  GitBranch, 
  Bell, 
  UserPlus, 
  Send, 
  Check, 
  X,
  Clock,
  Eye,
  Edit,
  Crown,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCollaboration } from '@/hooks/useCollaboration';
import { User, Comment, ProjectVersion, ActivityNotification } from '@/types/collaboration';

interface CollaborationPanelProps {
  projectId: string;
  userId: string;
  onElementChange?: (elementId: string, changes: Record<string, unknown>) => void;
}

export function CollaborationPanel({ projectId, userId, onElementChange }: CollaborationPanelProps) {
  const {
    session,
    isConnected,
    currentUser,
    activeUsers,
    comments,
    versions,
    notifications,
    unreadCount,
    addComment,
    replyToComment,
    resolveComment,
    createVersion,
    inviteUser,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCollaboration({ projectId, userId, onElementChange });

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    await addComment(newComment);
    setNewComment('');
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    await replyToComment(commentId, replyContent);
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    await inviteUser(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('viewer');
  };

  const handleCreateVersion = async () => {
    if (!versionName.trim()) return;
    
    // In production, get current editor state
    const currentState = {};
    await createVersion(versionName, versionDescription, currentState);
    setVersionName('');
    setVersionDescription('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'editor': return <Edit className="h-3 w-3 text-blue-500" />;
      case 'viewer': return <Eye className="h-3 w-3 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'text-green-500' : 'text-gray-400';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaboration
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <Circle className={`h-2 w-2 fill-current ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="users" className="h-full">
          <TabsList className="grid w-full grid-cols-4 mx-4">
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="versions" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 px-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Active Users ({activeUsers.length})</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-3 w-3 mr-1" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleInviteUser} className="w-full">
                        Send Invitation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          {getRoleIcon(user.role)}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className={`text-xs ${getStatusColor(user.isOnline)}`}>
                        <Circle className="h-2 w-2 fill-current" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-4 px-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddComment} size="sm" className="w-full">
                  <Send className="h-3 w-3 mr-1" />
                  Add Comment
                </Button>
              </div>

              <Separator />

              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-lg border ${comment.resolved ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.user.avatar} />
                          <AvatarFallback className="text-xs">{comment.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-medium">{comment.user.name}</p>
                            <p className="text-xs text-gray-500">
                              {comment.createdAt.toLocaleTimeString()}
                            </p>
                            {comment.resolved && (
                              <Badge variant="secondary" className="text-xs">Resolved</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          
                          {comment.replies.length > 0 && (
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-2">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={reply.user.avatar} />
                                    <AvatarFallback className="text-xs">{reply.user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <p className="text-xs font-medium">{reply.user.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {reply.createdAt.toLocaleTimeString()}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-600">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs h-6"
                            >
                              Reply
                            </Button>
                            {!comment.resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveComment(comment.id)}
                                className="text-xs h-6"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>

                          {replyingTo === comment.id && (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[40px] text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(comment.id)}
                                  className="text-xs h-6"
                                >
                                  Reply
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(null)}
                                  className="text-xs h-6"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="mt-4 px-4">
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <GitBranch className="h-3 w-3 mr-1" />
                    Create Version
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Version</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="version-name">Version Name</Label>
                      <Input
                        id="version-name"
                        value={versionName}
                        onChange={(e) => setVersionName(e.target.value)}
                        placeholder="v1.0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="version-description">Description</Label>
                      <Textarea
                        id="version-description"
                        value={versionDescription}
                        onChange={(e) => setVersionDescription(e.target.value)}
                        placeholder="Describe the changes..."
                      />
                    </div>
                    <Button onClick={handleCreateVersion} className="w-full">
                      Create Version
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div key={version.id} className="p-3 rounded-lg border bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium">{version.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {version.version}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{version.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {version.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 px-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Activity</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllNotificationsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Bell className={`h-4 w-4 mt-0.5 ${notification.read ? 'text-gray-400' : 'text-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.createdAt.toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}