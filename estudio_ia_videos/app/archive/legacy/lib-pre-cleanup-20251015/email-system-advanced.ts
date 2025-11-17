/**
 * Sistema Avançado de Email com Templates
 * 
 * Features:
 * - Templates HTML responsivos
 * - Sistema de filas para envio em massa
 * - Anexos e imagens inline
 * - Tracking de abertura e cliques
 * - Retry automático
 * - Personalização e variáveis
 * - Múltiplos provedores (SMTP, SendGrid, AWS SES)
 * - Estatísticas e relatórios
 * 
 * @module EmailSystem
 */

import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  category: 'transactional' | 'marketing' | 'notification' | 'system';
  variables: string[]; // Lista de variáveis esperadas
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string; // Template ID
  variables?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string; // Content ID para imagens inline
}

export interface EmailJob {
  id: string;
  options: EmailOptions;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'bounced';
  attempts: number;
  maxAttempts: number;
  error?: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
}

export interface EmailStats {
  sent: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EmailProvider {
  name: 'smtp' | 'sendgrid' | 'ses' | 'mailgun';
  config: any;
  enabled: boolean;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const DEFAULT_TEMPLATES: Record<string, EmailTemplate> = {
  welcome: {
    id: 'welcome',
    name: 'Boas-vindas',
    subject: 'Bem-vindo ao {{appName}}!',
    category: 'transactional',
    variables: ['userName', 'appName', 'loginUrl'],
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo, {{userName}}! 🎉</h1>
          </div>
          <div class="content">
            <p>Estamos muito felizes em ter você conosco no <strong>{{appName}}</strong>!</p>
            <p>Sua conta foi criada com sucesso e você já pode começar a usar todos os nossos recursos.</p>
            <p style="text-align: center;">
              <a href="{{loginUrl}}" class="button">Acessar Plataforma</a>
            </p>
            <p>Se você tiver alguma dúvida, nossa equipe de suporte está sempre disponível para ajudar.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{appName}}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: 'Bem-vindo ao {{appName}}, {{userName}}! Acesse: {{loginUrl}}',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  passwordReset: {
    id: 'passwordReset',
    name: 'Redefinição de Senha',
    subject: 'Redefinir sua senha - {{appName}}',
    category: 'transactional',
    variables: ['userName', 'appName', 'resetUrl', 'expiresIn'],
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Redefinir Senha 🔐</h2>
          <p>Olá, {{userName}}</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no {{appName}}.</p>
          <div class="alert">
            <strong>⚠️ Atenção:</strong> Este link expira em {{expiresIn}}.
          </div>
          <p style="text-align: center;">
            <a href="{{resetUrl}}" class="button">Redefinir Senha</a>
          </p>
          <p>Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.</p>
          <p style="color: #666; font-size: 12px;">
            Se o botão não funcionar, copie e cole este link no navegador:<br>
            {{resetUrl}}
          </p>
        </div>
      </body>
      </html>
    `,
    textContent: 'Redefinir senha: {{resetUrl}} (expira em {{expiresIn}})',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  renderComplete: {
    id: 'renderComplete',
    name: 'Renderização Concluída',
    subject: 'Seu vídeo está pronto! 🎬',
    category: 'notification',
    variables: ['userName', 'projectName', 'videoUrl', 'thumbnailUrl', 'duration'],
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .video-preview { text-align: center; margin: 20px 0; }
          .video-preview img { max-width: 100%; border-radius: 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Vídeo Renderizado com Sucesso! 🎉</h2>
          <p>Olá, {{userName}}</p>
          <div class="success">
            <strong>✅ Seu projeto "{{projectName}}" foi renderizado!</strong>
          </div>
          <div class="video-preview">
            <img src="{{thumbnailUrl}}" alt="Thumbnail">
            <p><strong>Duração:</strong> {{duration}}</p>
          </div>
          <p style="text-align: center;">
            <a href="{{videoUrl}}" class="button">Assistir Vídeo</a>
          </p>
        </div>
      </body>
      </html>
    `,
    textContent: 'Seu vídeo "{{projectName}}" está pronto! Assista: {{videoUrl}}',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  quotaAlert: {
    id: 'quotaAlert',
    name: 'Alerta de Cota',
    subject: '⚠️ Você atingiu {{percentage}}% da sua cota',
    category: 'notification',
    variables: ['userName', 'percentage', 'used', 'total', 'upgradeUrl'],
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .progress { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; }
          .progress-bar { background: #ffc107; height: 100%; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Alerta de Cota ⚠️</h2>
          <p>Olá, {{userName}}</p>
          <div class="warning">
            <strong>Atenção:</strong> Você está usando {{used}} de {{total}} da sua cota mensal.
          </div>
          <div class="progress">
            <div class="progress-bar" style="width: {{percentage}}%"></div>
          </div>
          <p>{{percentage}}% utilizado</p>
          <p>Considere fazer upgrade do seu plano para continuar usando sem interrupções.</p>
          <p style="text-align: center;">
            <a href="{{upgradeUrl}}" class="button">Ver Planos</a>
          </p>
        </div>
      </body>
      </html>
    `,
    textContent: 'Alerta: Você usou {{percentage}}% da sua cota ({{used}}/{{total}}). Upgrade: {{upgradeUrl}}',
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// ============================================================================
// EMAIL SYSTEM CLASS
// ============================================================================

export class EmailSystem {
  private static instance: EmailSystem;
  private transporter: Transporter | null = null;
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;
  private templates: Map<string, EmailTemplate> = new Map();
  private stats: Map<string, EmailStats> = new Map();

  private config = {
    provider: (process.env.EMAIL_PROVIDER || 'smtp') as 'smtp' | 'sendgrid' | 'ses',
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Estúdio IA Vídeos',
    trackingDomain: process.env.TRACKING_DOMAIN || 'http://localhost:3000',
    maxRetries: 3,
    retryDelay: 60000 // 1 minuto
  };

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    // Inicializa fila BullMQ
    this.queue = new Queue('emails', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.config.retryDelay
        },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    });

    // Inicializa worker
    this.worker = new Worker(
      'emails',
      async (job: Job) => await this.processEmailJob(job),
      { connection: this.redis }
    );

    this.setupTransporter();
    this.loadTemplates();
    this.setupEventHandlers();
  }

  public static getInstance(): EmailSystem {
    if (!EmailSystem.instance) {
      EmailSystem.instance = new EmailSystem();
    }
    return EmailSystem.instance;
  }

  // ============================================================================
  // TRANSPORTER SETUP
  // ============================================================================

  /**
   * Configura transporter baseado no provider
   */
  private setupTransporter(): void {
    switch (this.config.provider) {
      case 'smtp':
        this.setupSMTP();
        break;
      case 'sendgrid':
        this.setupSendGrid();
        break;
      case 'ses':
        this.setupSES();
        break;
    }
  }

  /**
   * Configura SMTP
   */
  private setupSMTP(): void {
    const config: SMTPTransport.Options = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    this.transporter = createTransport(config);
    console.log('✅ SMTP transporter configurado');
  }

  /**
   * Configura SendGrid
   */
  private setupSendGrid(): void {
    this.transporter = createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY || ''
      }
    });
    console.log('✅ SendGrid transporter configurado');
  }

  /**
   * Configura AWS SES
   */
  private setupSES(): void {
    this.transporter = createTransport({
      host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
      port: 587,
      auth: {
        user: process.env.AWS_SES_USER || '',
        pass: process.env.AWS_SES_PASS || ''
      }
    });
    console.log('✅ AWS SES transporter configurado');
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Carrega templates padrão
   */
  private loadTemplates(): void {
    for (const [id, template] of Object.entries(DEFAULT_TEMPLATES)) {
      this.templates.set(id, template);
    }
    console.log(`✅ ${this.templates.size} templates carregados`);
  }

  /**
   * Adiciona template customizado
   */
  public addTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const newTemplate: EmailTemplate = {
      ...template,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    console.log(`✅ Template adicionado: ${newTemplate.name}`);
    return newTemplate;
  }

  /**
   * Renderiza template com variáveis
   */
  private renderTemplate(templateId: string, variables: Record<string, unknown>): { html: string; text: string; subject: string } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    // Compila com Handlebars
    const htmlTemplate = Handlebars.compile(template.htmlContent);
    const textTemplate = Handlebars.compile(template.textContent || '');
    const subjectTemplate = Handlebars.compile(template.subject);

    return {
      html: htmlTemplate(variables),
      text: textTemplate(variables),
      subject: subjectTemplate(variables)
    };
  }

  // ============================================================================
  // EMAIL SENDING
  // ============================================================================

  /**
   * Envia email (adiciona à fila)
   */
  public async sendEmail(options: EmailOptions): Promise<string> {
    // Se template especificado, renderiza
    if (options.template) {
      const rendered = this.renderTemplate(options.template, options.variables || {});
      options.html = rendered.html;
      options.text = rendered.text;
      options.subject = rendered.subject;
    }

    // Adiciona tracking se habilitado
    if (options.trackOpens) {
      options.html = this.addOpenTracking(options.html || '', randomUUID());
    }

    if (options.trackClicks) {
      options.html = this.addClickTracking(options.html || '', randomUUID());
    }

    // Adiciona à fila
    const job = await this.queue.add('send-email', {
      options,
      createdAt: new Date()
    });

    console.log(`📧 Email adicionado à fila: ${job.id}`);
    return job.id as string;
  }

  /**
   * Envia email imediatamente (sem fila)
   */
  public async sendEmailNow(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('Transporter não configurado');
    }

    const mailOptions: SendMailOptions = {
      from: `${this.config.fromName} <${this.config.from}>`,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      priority: options.priority,
      attachments: options.attachments as any
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado: ${info.messageId}`);
      
      // Atualiza estatísticas
      this.updateStats('sent');
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      this.updateStats('failed');
      throw error;
    }
  }

  /**
   * Processa job de email
   */
  private async processEmailJob(job: Job): Promise<void> {
    const { options } = job.data;

    try {
      await this.sendEmailNow(options);
      console.log(`✅ Email job processado: ${job.id}`);
    } catch (error) {
      console.error(`❌ Erro no email job ${job.id}:`, error);
      throw error; // BullMQ vai fazer retry
    }
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Adiciona pixel de tracking de abertura
   */
  private addOpenTracking(html: string, trackingId: string): string {
    const pixel = `<img src="${this.config.trackingDomain}/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="">`;
    return html.replace('</body>', `${pixel}</body>`);
  }

  /**
   * Adiciona tracking de cliques
   */
  private addClickTracking(html: string, trackingId: string): string {
    // Substitui links href por URLs de tracking
    return html.replace(
      /href="([^"]+)"/g,
      (match, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `href="${this.config.trackingDomain}/track/click/${trackingId}?url=${encodedUrl}"`;
      }
    );
  }

  /**
   * Registra abertura de email
   */
  public async trackOpen(trackingId: string): Promise<void> {
    await this.redis.sadd(`email:opened`, trackingId);
    this.updateStats('opened');
    console.log(`📖 Email aberto: ${trackingId}`);
  }

  /**
   * Registra clique em link
   */
  public async trackClick(trackingId: string, url: string): Promise<void> {
    await this.redis.sadd(`email:clicked`, trackingId);
    await this.redis.lpush(`email:${trackingId}:clicks`, url);
    this.updateStats('clicked');
    console.log(`🖱️ Link clicado em ${trackingId}: ${url}`);
  }

  // ============================================================================
  // BATCH SENDING
  // ============================================================================

  /**
   * Envia emails em lote
   */
  public async sendBatch(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<string[]> {
    const jobIds: string[] = [];

    for (const recipient of recipients) {
      const jobId = await this.sendEmail({
        ...options,
        to: recipient
      });
      jobIds.push(jobId);
    }

    console.log(`📬 ${recipients.length} emails adicionados à fila em lote`);
    return jobIds;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Atualiza estatísticas
   */
  private updateStats(metric: keyof EmailStats): void {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.stats.get(today) || {
      sent: 0,
      failed: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0
    };

    stats[metric]++;

    // Recalcula taxas
    if (stats.sent > 0) {
      stats.openRate = (stats.opened / stats.sent) * 100;
      stats.clickRate = (stats.clicked / stats.sent) * 100;
      stats.bounceRate = (stats.bounced / stats.sent) * 100;
    }

    this.stats.set(today, stats);
  }

  /**
   * Obtém estatísticas
   */
  public getStats(date?: string): EmailStats {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.stats.get(targetDate) || {
      sent: 0,
      failed: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0
    };
  }

  /**
   * Obtém estatísticas de período
   */
  public getStatsRange(startDate: Date, endDate: Date): EmailStats {
    const aggregated: EmailStats = {
      sent: 0,
      failed: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0
    };

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const stats = this.stats.get(dateStr);
      
      if (stats) {
        aggregated.sent += stats.sent;
        aggregated.failed += stats.failed;
        aggregated.bounced += stats.bounced;
        aggregated.opened += stats.opened;
        aggregated.clicked += stats.clicked;
      }

      current.setDate(current.getDate() + 1);
    }

    // Recalcula taxas
    if (aggregated.sent > 0) {
      aggregated.openRate = (aggregated.opened / aggregated.sent) * 100;
      aggregated.clickRate = (aggregated.clicked / aggregated.sent) * 100;
      aggregated.bounceRate = (aggregated.bounced / aggregated.sent) * 100;
    }

    return aggregated;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Configura event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`✅ Email job completado: ${job.id}`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Email job falhou: ${job?.id}`, error);
      this.updateStats('failed');
    });

    this.queue.on('error', (error) => {
      console.error('❌ Erro na fila de emails:', error);
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Lista templates disponíveis
   */
  public listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Obtém template por ID
   */
  public getTemplate(id: string): EmailTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Verifica configuração do transporter
   */
  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Conexão com servidor de email verificada');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const emailSystem = EmailSystem.getInstance();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Envia email de boas-vindas
 */
export async function sendWelcomeEmail(to: string, userName: string): Promise<string> {
  return await emailSystem.sendEmail({
    to,
    template: 'welcome',
    variables: {
      userName,
      appName: 'Estúdio IA Vídeos',
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    },
    trackOpens: true,
    trackClicks: true
  });
}

/**
 * Envia email de redefinição de senha
 */
export async function sendPasswordResetEmail(to: string, userName: string, resetToken: string): Promise<string> {
  return await emailSystem.sendEmail({
    to,
    template: 'passwordReset',
    variables: {
      userName,
      appName: 'Estúdio IA Vídeos',
      resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
      expiresIn: '24 horas'
    },
    trackOpens: true
  });
}

/**
 * Envia notificação de vídeo renderizado
 */
export async function sendRenderCompleteEmail(
  to: string,
  userName: string,
  projectName: string,
  videoUrl: string,
  thumbnailUrl: string,
  duration: string
): Promise<string> {
  return await emailSystem.sendEmail({
    to,
    template: 'renderComplete',
    variables: {
      userName,
      projectName,
      videoUrl,
      thumbnailUrl,
      duration
    },
    trackOpens: true,
    trackClicks: true
  });
}

/**
 * Envia alerta de cota
 */
export async function sendQuotaAlertEmail(
  to: string,
  userName: string,
  percentage: number,
  used: string,
  total: string
): Promise<string> {
  return await emailSystem.sendEmail({
    to,
    template: 'quotaAlert',
    variables: {
      userName,
      percentage,
      used,
      total,
      upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/plans`
    },
    trackOpens: true,
    trackClicks: true
  });
}
