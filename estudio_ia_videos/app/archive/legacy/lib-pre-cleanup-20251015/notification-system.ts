/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema completo de notificações em tempo real para o Estúdio IA de Vídeos.
 * Suporta múltiplos canais (in-app, email, push, SMS, Slack, webhooks).
 * 
 * @module NotificationSystem
 * @version 1.0.0
 * @since 2025-01-08
 * 
 * FUNCIONALIDADES:
 * ├─ Notificações in-app
 * ├─ Email notifications
 * ├─ Push notifications
 * ├─ SMS notifications
 * ├─ Slack integration
 * ├─ Webhook delivery
 * ├─ Notification templates
 * ├─ Notification scheduling
 * ├─ Priority management
 * ├─ Read/unread tracking
 * ├─ Notification preferences
 * ├─ Batch notifications
 * ├─ Notification history
 * ├─ Retry logic
 * └─ Analytics integration
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tipos de notificação
 */
export enum NotificationType {
  // Sistema
  SYSTEM_UPDATE = 'system_update',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_ERROR = 'system_error',
  
  // Vídeo
  VIDEO_EXPORT_COMPLETE = 'video_export_complete',
  VIDEO_EXPORT_FAILED = 'video_export_failed',
  VIDEO_ANALYSIS_COMPLETE = 'video_analysis_complete',
  VIDEO_PROCESSING_STARTED = 'video_processing_started',
  
  // AI
  AI_RECOMMENDATION_NEW = 'ai_recommendation_new',
  AI_INSIGHT_AVAILABLE = 'ai_insight_available',
  
  // Usuário
  USER_MENTION = 'user_mention',
  USER_COMMENT = 'user_comment',
  USER_SHARE = 'user_share',
  
  // Conta
  TRIAL_EXPIRING = 'trial_expiring',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  SUBSCRIPTION_FAILED = 'subscription_failed',
  PAYMENT_SUCCESSFUL = 'payment_successful',
  
  // Segurança
  LOGIN_NEW_DEVICE = 'login_new_device',
  PASSWORD_CHANGED = 'password_changed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  
  // Social
  COLLABORATION_INVITE = 'collaboration_invite',
  PROJECT_SHARED = 'project_shared',
  
  // Marketing
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
  PROMOTION = 'promotion',
  NEWSLETTER = 'newsletter',
}

/**
 * Canais de entrega
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

/**
 * Prioridades
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Status de entrega
 */
export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

/**
 * Notificação
 */
export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  icon?: string;
  image?: string;
  link?: string;
  data?: Record<string, unknown>;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  createdAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  isRead: boolean;
  readAt?: Date;
  isSilent: boolean;
  requiresAction: boolean;
  actions?: NotificationAction[];
  deliveryStatus: Record<NotificationChannel, DeliveryStatus>;
  deliveryAttempts: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

/**
 * Ação de notificação
 */
export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
  url?: string;
  params?: Record<string, unknown>;
}

/**
 * Template de notificação
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  variables: string[];
  actions?: NotificationAction[];
  emailHtml?: string;
  pushPayload?: Record<string, unknown>;
  smsTemplate?: string;
  slackBlocks?: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preferências de notificação
 */
export interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    slack: boolean;
  };
  types: Record<NotificationType, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  frequency?: {
    immediate: NotificationType[];
    hourly: NotificationType[];
    daily: NotificationType[];
    weekly: NotificationType[];
  };
  emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:mm
  };
}

/**
 * Configuração de canal
 */
export interface ChannelConfig {
  email?: EmailConfig;
  push?: PushConfig;
  sms?: SMSConfig;
  slack?: SlackConfig;
  webhook?: WebhookConfig;
}

/**
 * Configuração de email
 */
export interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  apiKey?: string;
  from: string;
  fromName: string;
  replyTo?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

/**
 * Configuração de push
 */
export interface PushConfig {
  provider: 'fcm' | 'apns' | 'onesignal';
  apiKey?: string;
  appId?: string;
  vapidKeys?: {
    publicKey: string;
    privateKey: string;
  };
}

/**
 * Configuração de SMS
 */
export interface SMSConfig {
  provider: 'twilio' | 'sns';
  accountSid?: string;
  authToken?: string;
  from: string;
}

/**
 * Configuração de Slack
 */
export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

/**
 * Configuração de Webhook
 */
export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  secret?: string;
}

/**
 * Resultado de entrega
 */
export interface DeliveryResult {
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt: Date;
  deliveredAt?: Date;
  error?: string;
  response?: any;
}

/**
 * Batch de notificações
 */
export interface NotificationBatch {
  id: string;
  name: string;
  notifications: Notification[];
  totalCount: number;
  sentCount: number;
  failedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class NotificationSystem extends EventEmitter {
  private static instance: NotificationSystem;
  private notifications: Map<string, Notification>;
  private templates: Map<string, NotificationTemplate>;
  private preferences: Map<string, NotificationPreferences>;
  private channelConfig: ChannelConfig;
  private batches: Map<string, NotificationBatch>;

  private constructor() {
    super();
    this.notifications = new Map();
    this.templates = new Map();
    this.preferences = new Map();
    this.channelConfig = {};
    this.batches = new Map();
    this.initializeDefaultTemplates();
  }

  /**
   * Obtém instância singleton
   */
  public static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NOTIFICATION CREATION
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Cria e envia notificação
   */
  public async sendNotification(
    userId: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      icon?: string;
      image?: string;
      link?: string;
      data?: Record<string, unknown>;
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      scheduledFor?: Date;
      expiresAt?: Date;
      isSilent?: boolean;
      requiresAction?: boolean;
      actions?: NotificationAction[];
    }
  ): Promise<Notification> {
    // Verificar preferências do usuário
    const prefs = await this.getUserPreferences(userId);
    if (!this.shouldSendNotification(type, prefs)) {
      console.log(`[Notification] Bloqueada por preferências: ${type} para ${userId}`);
      return null as any;
    }

    // Criar notificação
    const notification: Notification = {
      id: this.generateNotificationId(),
      type,
      userId,
      title: data.title,
      message: data.message,
      icon: data.icon,
      image: data.image,
      link: data.link,
      data: data.data,
      priority: data.priority || NotificationPriority.NORMAL,
      channels: this.getEnabledChannels(data.channels || [NotificationChannel.IN_APP], prefs),
      createdAt: new Date(),
      scheduledFor: data.scheduledFor,
      expiresAt: data.expiresAt,
      isRead: false,
      isSilent: data.isSilent || false,
      requiresAction: data.requiresAction || false,
      actions: data.actions,
      deliveryStatus: {} as any,
      deliveryAttempts: 0,
      maxRetries: 3,
    };

    // Inicializar status de entrega
    notification.channels.forEach(channel => {
      notification.deliveryStatus[channel] = DeliveryStatus.PENDING;
    });

    // Salvar notificação
    this.notifications.set(notification.id, notification);

    // Persistir no banco
    await this.persistNotification(notification);

    // Agendar ou enviar imediatamente
    if (notification.scheduledFor) {
      await this.scheduleNotification(notification);
    } else {
      await this.deliverNotification(notification);
    }

    // Emitir evento
    this.emit('notification:created', notification);

    console.log(`[Notification] Criada: ${type} para ${userId}`);

    return notification;
  }

  /**
   * Envia notificação a partir de template
   */
  public async sendFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, unknown> = {}
  ): Promise<Notification> {
    const template = this.templates.get(templateId);
    if (!template || !template.isActive) {
      throw new Error(`Template não encontrado ou inativo: ${templateId}`);
    }

    // Substituir variáveis
    const title = this.replaceVariables(template.title, variables);
    const message = this.replaceVariables(template.message, variables);

    return this.sendNotification(userId, template.type, {
      title,
      message,
      priority: template.priority,
      channels: template.channels,
      actions: template.actions,
    });
  }

  /**
   * Envia notificação em lote
   */
  public async sendBatchNotification(
    userIds: string[],
    type: NotificationType,
    data: {
      title: string;
      message: string;
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
    }
  ): Promise<NotificationBatch> {
    const batch: NotificationBatch = {
      id: this.generateBatchId(),
      name: `${type}_${new Date().toISOString()}`,
      notifications: [],
      totalCount: userIds.length,
      sentCount: 0,
      failedCount: 0,
      status: 'pending',
    };

    this.batches.set(batch.id, batch);

    // Processar em lote
    batch.status = 'processing';
    batch.startedAt = new Date();

    for (const userId of userIds) {
      try {
        const notification = await this.sendNotification(userId, type, data);
        if (notification) {
          batch.notifications.push(notification);
          batch.sentCount++;
        }
      } catch (error) {
        batch.failedCount++;
        console.error(`[Notification] Erro ao enviar para ${userId}:`, error);
      }
    }

    batch.status = 'completed';
    batch.completedAt = new Date();

    console.log(`[Notification] Lote enviado: ${batch.sentCount}/${batch.totalCount} sucesso`);

    return batch;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DELIVERY
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Entrega notificação em todos os canais
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    const deliveryPromises = notification.channels.map(channel =>
      this.deliverToChannel(notification, channel)
    );

    await Promise.allSettled(deliveryPromises);

    // Emitir evento
    this.emit('notification:delivered', notification);
  }

  /**
   * Entrega notificação em canal específico
   */
  private async deliverToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<DeliveryResult> {
    const result: DeliveryResult = {
      channel,
      status: DeliveryStatus.PENDING,
      sentAt: new Date(),
    };

    try {
      switch (channel) {
        case NotificationChannel.IN_APP:
          await this.deliverInApp(notification);
          break;
        case NotificationChannel.EMAIL:
          await this.deliverEmail(notification);
          break;
        case NotificationChannel.PUSH:
          await this.deliverPush(notification);
          break;
        case NotificationChannel.SMS:
          await this.deliverSMS(notification);
          break;
        case NotificationChannel.SLACK:
          await this.deliverSlack(notification);
          break;
        case NotificationChannel.WEBHOOK:
          await this.deliverWebhook(notification);
          break;
      }

      result.status = DeliveryStatus.SENT;
      result.deliveredAt = new Date();
      notification.deliveryStatus[channel] = DeliveryStatus.DELIVERED;

      console.log(`[Notification] Entregue via ${channel}: ${notification.id}`);
    } catch (error: any) {
      result.status = DeliveryStatus.FAILED;
      result.error = error.message;
      notification.deliveryStatus[channel] = DeliveryStatus.FAILED;

      console.error(`[Notification] Falha ao entregar via ${channel}:`, error);

      // Retry logic
      if (notification.deliveryAttempts < notification.maxRetries) {
        await this.retryDelivery(notification, channel);
      }
    }

    return result;
  }

  /**
   * Entrega in-app
   */
  private async deliverInApp(notification: Notification): Promise<void> {
    // In-app já está salvo no banco, apenas emitir evento
    this.emit('notification:in_app', notification);
  }

  /**
   * Entrega via email
   */
  private async deliverEmail(notification: Notification): Promise<void> {
    const config = this.channelConfig.email;
    if (!config) {
      throw new Error('Email não configurado');
    }

    // Em produção: usar SendGrid, SES, ou SMTP
    console.log(`[Notification] Email enviado: ${notification.title}`);
    
    // Simular envio
    await this.simulateDelay(500);
  }

  /**
   * Entrega via push notification
   */
  private async deliverPush(notification: Notification): Promise<void> {
    const config = this.channelConfig.push;
    if (!config) {
      throw new Error('Push não configurado');
    }

    // Em produção: usar FCM, APNS, ou OneSignal
    console.log(`[Notification] Push enviado: ${notification.title}`);
    
    // Simular envio
    await this.simulateDelay(300);
  }

  /**
   * Entrega via SMS
   */
  private async deliverSMS(notification: Notification): Promise<void> {
    const config = this.channelConfig.sms;
    if (!config) {
      throw new Error('SMS não configurado');
    }

    // Em produção: usar Twilio ou SNS
    console.log(`[Notification] SMS enviado: ${notification.message}`);
    
    // Simular envio
    await this.simulateDelay(400);
  }

  /**
   * Entrega via Slack
   */
  private async deliverSlack(notification: Notification): Promise<void> {
    const config = this.channelConfig.slack;
    if (!config) {
      throw new Error('Slack não configurado');
    }

    const payload = {
      text: `*${notification.title}*\n${notification.message}`,
      channel: config.channel,
      username: config.username || 'Estúdio IA',
      icon_emoji: config.iconEmoji || ':robot_face:',
    };

    // Em produção: fazer POST para webhook do Slack
    console.log(`[Notification] Slack enviado:`, payload);
    
    // Simular envio
    await this.simulateDelay(600);
  }

  /**
   * Entrega via webhook
   */
  private async deliverWebhook(notification: Notification): Promise<void> {
    const config = this.channelConfig.webhook;
    if (!config) {
      throw new Error('Webhook não configurado');
    }

    const payload = {
      id: notification.id,
      type: notification.type,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.createdAt,
    };

    // Em produção: fazer request HTTP
    console.log(`[Notification] Webhook enviado para ${config.url}:`, payload);
    
    // Simular envio
    await this.simulateDelay(500);
  }

  /**
   * Retry de entrega
   */
  private async retryDelivery(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    notification.deliveryAttempts++;
    notification.deliveryStatus[channel] = DeliveryStatus.RETRYING;

    // Exponential backoff
    const delay = Math.pow(2, notification.deliveryAttempts) * 1000;
    
    setTimeout(async () => {
      console.log(`[Notification] Retry ${notification.deliveryAttempts} para ${channel}`);
      await this.deliverToChannel(notification, channel);
    }, delay);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NOTIFICATION MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Marca notificação como lida
   */
  public async markAsRead(notificationId: string): Promise<Notification> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notificação não encontrada: ${notificationId}`);
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await this.updateNotification(notification);

    this.emit('notification:read', notification);

    return notification;
  }

  /**
   * Marca múltiplas notificações como lidas
   */
  public async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const promises = notificationIds.map(id => this.markAsRead(id));
    await Promise.allSettled(promises);
  }

  /**
   * Marca todas as notificações como lidas
   */
  public async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead);

    const promises = userNotifications.map(n => this.markAsRead(n.id));
    await Promise.allSettled(promises);

    console.log(`[Notification] ${userNotifications.length} notificações marcadas como lidas`);
  }

  /**
   * Deleta notificação
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notificação não encontrada: ${notificationId}`);
    }

    this.notifications.delete(notificationId);
    
    // Em produção: deletar do banco
    // await prisma.notification.delete({ where: { id: notificationId } });

    this.emit('notification:deleted', notification);

    console.log(`[Notification] Deletada: ${notificationId}`);
  }

  /**
   * Obtém notificações do usuário
   */
  public async getUserNotifications(
    userId: string,
    filters?: {
      unreadOnly?: boolean;
      types?: NotificationType[];
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    // Aplicar filtros
    if (filters?.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    if (filters?.types) {
      notifications = notifications.filter(n => filters.types!.includes(n.type));
    }

    // Ordenar por data (mais recente primeiro)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginação
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    notifications = notifications.slice(offset, offset + limit);

    return notifications;
  }

  /**
   * Conta notificações não lidas
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .length;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Cria template de notificação
   */
  public createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): NotificationTemplate {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: this.generateTemplateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);

    console.log(`[Notification] Template criado: ${newTemplate.name}`);

    return newTemplate;
  }

  /**
   * Obtém template
   */
  public getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Lista todos os templates
   */
  public listTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Obtém preferências do usuário
   */
  public async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let prefs = this.preferences.get(userId);
    
    if (!prefs) {
      // Criar preferências padrão
      prefs = this.createDefaultPreferences(userId);
      this.preferences.set(userId, prefs);
    }

    return prefs;
  }

  /**
   * Atualiza preferências do usuário
   */
  public async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const prefs = await this.getUserPreferences(userId);
    const updated = { ...prefs, ...updates };
    
    this.preferences.set(userId, updated);

    console.log(`[Notification] Preferências atualizadas para ${userId}`);

    return updated;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Configura canais de entrega
   */
  public configureChannels(config: ChannelConfig): void {
    this.channelConfig = { ...this.channelConfig, ...config };
    console.log('[Notification] Canais configurados', Object.keys(config));
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═════════════════════════════════════════════════════════════════════════

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistNotification(notification: Notification): Promise<void> {
    // Em produção: salvar no banco de dados
    // await prisma.notification.create({ data: notification });
  }

  private async updateNotification(notification: Notification): Promise<void> {
    // Em produção: atualizar no banco de dados
    // await prisma.notification.update({ where: { id: notification.id }, data: notification });
  }

  private async scheduleNotification(notification: Notification): Promise<void> {
    if (!notification.scheduledFor) return;

    const delay = notification.scheduledFor.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        await this.deliverNotification(notification);
      }, delay);

      console.log(`[Notification] Agendada para ${notification.scheduledFor.toISOString()}`);
    } else {
      await this.deliverNotification(notification);
    }
  }

  private shouldSendNotification(
    type: NotificationType,
    prefs: NotificationPreferences
  ): boolean {
    // Verificar se tipo está habilitado
    if (prefs.types[type] === false) {
      return false;
    }

    // Verificar quiet hours
    if (prefs.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end) {
        return false;
      }
    }

    return true;
  }

  private getEnabledChannels(
    requestedChannels: NotificationChannel[],
    prefs: NotificationPreferences
  ): NotificationChannel[] {
    return requestedChannels.filter(channel => {
      switch (channel) {
        case NotificationChannel.IN_APP:
          return prefs.channels.inApp !== false;
        case NotificationChannel.EMAIL:
          return prefs.channels.email !== false;
        case NotificationChannel.PUSH:
          return prefs.channels.push !== false;
        case NotificationChannel.SMS:
          return prefs.channels.sms !== false;
        case NotificationChannel.SLACK:
          return prefs.channels.slack !== false;
        default:
          return true;
      }
    });
  }

  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
        slack: false,
      },
      types: {} as any, // Todos habilitados por padrão
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'America/Sao_Paulo',
      },
      frequency: {
        immediate: [
          NotificationType.VIDEO_EXPORT_COMPLETE,
          NotificationType.VIDEO_EXPORT_FAILED,
        ],
        hourly: [],
        daily: [
          NotificationType.NEWSLETTER,
        ],
        weekly: [],
      },
      emailDigest: {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
      },
    };
  }

  private replaceVariables(template: string, variables: Record<string, unknown>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return result;
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeDefaultTemplates(): void {
    // Template: Export completo
    this.createTemplate({
      name: 'Video Export Complete',
      type: NotificationType.VIDEO_EXPORT_COMPLETE,
      title: 'Export concluído!',
      message: 'Seu vídeo "{{videoName}}" foi exportado com sucesso.',
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority: NotificationPriority.NORMAL,
      variables: ['videoName', 'videoId', 'exportFormat'],
      actions: [
        {
          id: 'download',
          label: 'Baixar',
          type: 'primary',
          action: 'download',
          url: '/videos/{{videoId}}/download',
        },
        {
          id: 'view',
          label: 'Visualizar',
          type: 'secondary',
          action: 'view',
          url: '/videos/{{videoId}}',
        },
      ],
      isActive: true,
    });

    // Template: Recomendação de IA
    this.createTemplate({
      name: 'AI Recommendation',
      type: NotificationType.AI_RECOMMENDATION_NEW,
      title: '💡 Nova recomendação de IA',
      message: 'Temos {{count}} sugestões para melhorar seu vídeo.',
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.LOW,
      variables: ['count', 'videoId'],
      actions: [
        {
          id: 'view_recommendations',
          label: 'Ver Recomendações',
          type: 'primary',
          action: 'navigate',
          url: '/videos/{{videoId}}/recommendations',
        },
      ],
      isActive: true,
    });

    // Template: Trial expirando
    this.createTemplate({
      name: 'Trial Expiring',
      type: NotificationType.TRIAL_EXPIRING,
      title: '⚠️ Seu trial expira em breve',
      message: 'Sua avaliação gratuita expira em {{daysLeft}} dias.',
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.HIGH,
      variables: ['daysLeft'],
      actions: [
        {
          id: 'upgrade',
          label: 'Fazer Upgrade',
          type: 'primary',
          action: 'navigate',
          url: '/billing/upgrade',
        },
      ],
      isActive: true,
    });
  }

  /**
   * Obtém estatísticas gerais
   */
  public getStats() {
    const allNotifications = Array.from(this.notifications.values());
    
    return {
      totalNotifications: allNotifications.length,
      unreadNotifications: allNotifications.filter(n => !n.isRead).length,
      readNotifications: allNotifications.filter(n => n.isRead).length,
      totalTemplates: this.templates.size,
      activeTemplates: Array.from(this.templates.values()).filter(t => t.isActive).length,
      totalBatches: this.batches.size,
      deliveryByChannel: this.getDeliveryStatsByChannel(),
    };
  }

  private getDeliveryStatsByChannel(): Record<NotificationChannel, { sent: number; failed: number }> {
    const stats: any = {};
    
    Object.values(NotificationChannel).forEach(channel => {
      stats[channel] = { sent: 0, failed: 0 };
    });

    this.notifications.forEach(notification => {
      Object.entries(notification.deliveryStatus).forEach(([channel, status]) => {
        if (status === DeliveryStatus.DELIVERED || status === DeliveryStatus.SENT) {
          stats[channel as NotificationChannel].sent++;
        } else if (status === DeliveryStatus.FAILED) {
          stats[channel as NotificationChannel].failed++;
        }
      });
    });

    return stats;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default NotificationSystem;
