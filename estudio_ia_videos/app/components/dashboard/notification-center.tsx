/**
 * 🔔 Notification Center Component
 * Intelligent notification system with smart alerts and user preferences
 */

'use client'

import React, { useState } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Filter, 
  Search,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Video,
  Server,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'

const notificationIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  system: Server,
  user: User,
  render: Video,
  message: MessageSquare
}

const notificationColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  system: 'text-gray-500',
  user: 'text-purple-500',
  render: 'text-indigo-500',
  message: 'text-cyan-500'
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    updatePreferences,
    testNotification,
    filters,
    setFilters
  } = useNotifications()

  const [selectedTab, setSelectedTab] = useState('all')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  // Filter notifications based on tab, search, and filters
  const filteredNotifications = notifications?.filter(notification => {
    // Tab filter
    if (selectedTab === 'unread' && notification.read) return false
    if (selectedTab === 'read' && !notification.read) return false

    // Search filter
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && notification.type !== selectedType) return false

    // Priority filter
    if (selectedPriority !== 'all' && notification.priority !== selectedPriority) return false

    return true
  }) || []

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead()
      toast.success('All read notifications deleted')
    } catch (error) {
      toast.error('Failed to delete read notifications')
    }
  }

  const handleUpdatePreferences = async (newPreferences: Record<string, unknown>) => {
    try {
      await updatePreferences(newPreferences)
      toast.success('Notification preferences updated')
    } catch (error) {
      toast.error('Failed to update preferences')
    }
  }

  const handleTestNotification = async (type: string) => {
    try {
      await testNotification(type)
      toast.success('Test notification sent')
    } catch (error) {
      toast.error('Failed to send test notification')
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return notificationDate.toLocaleDateString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading notifications: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Notification Center</h2>
            <p className="text-muted-foreground">
              Stay updated with smart alerts and system notifications
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={handleDeleteAllRead}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Read
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Notification Preferences</DialogTitle>
                <DialogDescription>
                  Configure how and when you receive notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <Label htmlFor="email-enabled">Enable email notifications</Label>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={preferences?.email_enabled || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, email_enabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-digest">Daily digest</Label>
                      <Switch
                        id="email-digest"
                        checked={preferences?.email_digest || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, email_digest: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Push Notifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Push Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <Label htmlFor="push-enabled">Enable push notifications</Label>
                      </div>
                      <Switch
                        id="push-enabled"
                        checked={preferences?.push_enabled || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, push_enabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <Label htmlFor="sound-enabled">Sound alerts</Label>
                      </div>
                      <Switch
                        id="sound-enabled"
                        checked={preferences?.sound_enabled || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, sound_enabled: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notification Types */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="render-notifications">Render completion</Label>
                      <Switch
                        id="render-notifications"
                        checked={preferences?.render_notifications || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, render_notifications: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-notifications">System alerts</Label>
                      <Switch
                        id="system-notifications"
                        checked={preferences?.system_notifications || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, system_notifications: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="collaboration-notifications">Collaboration updates</Label>
                      <Switch
                        id="collaboration-notifications"
                        checked={preferences?.collaboration_notifications || false}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ ...preferences, collaboration_notifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Test Notifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Test Notifications</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleTestNotification('info')}>
                      Test Info
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTestNotification('success')}>
                      Test Success
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTestNotification('warning')}>
                      Test Warning
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTestNotification('error')}>
                      Test Error
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="render">Render</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({notifications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({(notifications?.length || 0) - unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 animate-pulse">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery || selectedType !== 'all' || selectedPriority !== 'all'
                    ? 'No notifications match your filters'
                    : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const IconComponent = notificationIcons[notification.type as keyof typeof notificationIcons] || Info
                  const iconColor = notificationColors[notification.type as keyof typeof notificationColors] || 'text-gray-500'
                  
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 p-4 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 ${iconColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h4>
                              <Badge 
                                className={`${getPriorityColor(notification.priority)} text-white text-xs`}
                                variant="secondary"
                              >
                                {notification.priority}
                              </Badge>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(notification.created_at)}</span>
                              </div>
                              {notification.action_url && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => window.open(notification.action_url, '_blank')}
                                >
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {!notification.read ? (
                                <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as read
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Mark as unread
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}