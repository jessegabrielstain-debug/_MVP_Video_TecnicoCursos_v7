
/**
 * SPRINT 36 - EMAIL SERVICE
 * SendGrid integration for transactional emails
 */

interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicData?: Record<string, unknown>;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    return false;
  }

  const fromEmail = data.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@treinx.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Estúdio IA de Vídeos';

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: data.to }],
          dynamic_template_data: data.dynamicData || {},
        }],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: data.subject,
        content: data.templateId ? undefined : [
          {
            type: 'text/html',
            value: data.html,
          },
          ...(data.text ? [{
            type: 'text/plain',
            value: data.text,
          }] : []),
        ],
        template_id: data.templateId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return false;
    }

    console.log(`📧 Email sent to ${data.to}`);
    return true;

  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send organization invitation email
 */
export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 Você foi convidado!</h1>
    </div>
    <div class="content">
      <p><strong>${params.inviterName}</strong> convidou você para se juntar à organização <strong>${params.organizationName}</strong> no Estúdio IA de Vídeos.</p>
      
      <p>Como <strong>${params.role}</strong>, você poderá:</p>
      <ul>
        <li>Criar vídeos de treinamento com IA</li>
        <li>Colaborar com sua equipe</li>
        <li>Acessar templates de NRs brasileiras</li>
        <li>Gerenciar projetos e conteúdo</li>
      </ul>

      <div style="text-align: center;">
        <a href="${params.inviteUrl}" class="button">Aceitar Convite</a>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Estúdio IA de Vídeos - Treinamentos de Segurança do Trabalho</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: params.to,
    subject: `Convite para ${params.organizationName} - Estúdio IA de Vídeos`,
    html,
  });
}

/**
 * Send trial activation email
 */
export async function sendTrialActivationEmail(params: {
  to: string;
  userName: string;
  organizationName: string;
  trialDays: number;
  dashboardUrl: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; background: #ffd700; color: #333; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .button { display: inline-block; background: #11998e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { margin: 15px 0; padding-left: 25px; position: relative; }
    .feature:before { content: "✓"; position: absolute; left: 0; color: #11998e; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Seu Trial PRO está ativo!</h1>
      <div class="badge">${params.trialDays} dias GRÁTIS</div>
    </div>
    <div class="content">
      <p>Olá <strong>${params.userName}</strong>,</p>
      
      <p>Bem-vindo ao <strong>${params.organizationName}</strong>! Seu período de teste PRO de ${params.trialDays} dias começou agora.</p>

      <div class="features">
        <h3>🚀 Recursos PRO desbloqueados:</h3>
        <div class="feature">Avatares 3D hiper-realistas ilimitados</div>
        <div class="feature">Texto para voz premium (ElevenLabs, Azure)</div>
        <div class="feature">Templates de NRs brasileiras</div>
        <div class="feature">Exportação em Full HD e 4K</div>
        <div class="feature">Colaboração em equipe</div>
        <div class="feature">White-label e domínio personalizado</div>
        <div class="feature">SSO empresarial</div>
        <div class="feature">Suporte prioritário 24/7</div>
      </div>

      <div style="text-align: center;">
        <a href="${params.dashboardUrl}" class="button">Começar Agora</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        💡 <strong>Dica:</strong> Crie seu primeiro vídeo em menos de 5 minutos usando nossos templates prontos!
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Estúdio IA de Vídeos - Treinamentos de Segurança do Trabalho</p>
      <p>Precisa de ajuda? <a href="mailto:suporte@treinx.com">suporte@treinx.com</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: params.to,
    subject: `🎉 Seu Trial PRO de ${params.trialDays} dias está ativo!`,
    html,
  });
}

/**
 * Send billing alert email
 */
export async function sendBillingAlertEmail(params: {
  to: string;
  organizationName: string;
  alertType: 'trial_ending' | 'trial_ended' | 'payment_failed' | 'subscription_cancelled';
  daysRemaining?: number;
  billingUrl: string;
}): Promise<boolean> {
  let subject = '';
  let headerBg = '#ff6b6b';
  let title = '';
  let message = '';
  let ctaText = '';

  switch (params.alertType) {
    case 'trial_ending':
      subject = `⏰ Seu trial termina em ${params.daysRemaining} dias`;
      headerBg = '#f59e0b';
      title = '⏰ Seu trial está terminando';
      message = `Seu período de teste PRO termina em <strong>${params.daysRemaining} dias</strong>. Não perca acesso aos recursos premium!`;
      ctaText = 'Assinar Agora';
      break;
    case 'trial_ended':
      subject = '❌ Seu trial expirou - Continue com o PRO';
      title = '❌ Seu trial expirou';
      message = 'Seu período de teste terminou. Assine agora para continuar usando todos os recursos PRO!';
      ctaText = 'Ver Planos';
      break;
    case 'payment_failed':
      subject = '⚠️ Problema com seu pagamento';
      title = '⚠️ Falha no pagamento';
      message = 'Não conseguimos processar seu pagamento. Por favor, atualize suas informações de pagamento para manter sua assinatura ativa.';
      ctaText = 'Atualizar Pagamento';
      break;
    case 'subscription_cancelled':
      subject = '😢 Sua assinatura foi cancelada';
      title = '😢 Assinatura cancelada';
      message = 'Sua assinatura foi cancelada. Você ainda pode acessar seus projetos, mas recursos PRO foram desativados.';
      ctaText = 'Reativar Assinatura';
      break;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${headerBg}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: ${headerBg}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <p>${message}</p>

      <div style="text-align: center;">
        <a href="${params.billingUrl}" class="button">${ctaText}</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Tem dúvidas? Entre em contato com nosso suporte: <a href="mailto:suporte@treinx.com">suporte@treinx.com</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Estúdio IA de Vídeos</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: params.to,
    subject,
    html,
  });
}

/**
 * Send welcome email with onboarding steps
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  organizationName: string;
  dashboardUrl: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { margin: 20px 0; padding: 15px; border-left: 4px solid #667eea; background: #f8f9fa; }
    .step-number { display: inline-block; background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 Bem-vindo ao Estúdio IA!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${params.userName}</strong>,</p>
      
      <p>É um prazer ter você na <strong>${params.organizationName}</strong>!</p>

      <p>Para aproveitar ao máximo a plataforma, siga estes passos:</p>

      <div class="steps">
        <div class="step">
          <span class="step-number">1</span>
          <strong>Explore o Dashboard</strong>
          <p>Familiarize-se com os recursos e navegação da plataforma.</p>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <strong>Escolha um Template</strong>
          <p>Comece com um template pronto de NR ou crie do zero.</p>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <strong>Personalize seu Vídeo</strong>
          <p>Adicione avatares, texto para voz e efeitos visuais.</p>
        </div>
        <div class="step">
          <span class="step-number">4</span>
          <strong>Exporte e Compartilhe</strong>
          <p>Renderize seu vídeo e compartilhe com sua equipe!</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${params.dashboardUrl}" class="button">Começar Agora</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        💡 <strong>Dica:</strong> Assista nossos tutoriais rápidos no dashboard para dominar a plataforma em minutos!
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Estúdio IA de Vídeos</p>
      <p>Precisa de ajuda? <a href="mailto:suporte@treinx.com">suporte@treinx.com</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: params.to,
    subject: '🎬 Bem-vindo ao Estúdio IA de Vídeos!',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Redefinir Senha</h1>
    </div>
    <div class="content">
      <p>Você solicitou a redefinição de sua senha.</p>
      
      <p>Clique no botão abaixo para criar uma nova senha:</p>

      <div style="text-align: center;">
        <a href="${params.resetUrl}" class="button">Redefinir Senha</a>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        Este link expira em 1 hora. Se você não solicitou esta redefinição, ignore este email.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Estúdio IA de Vídeos</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: params.to,
    subject: '🔒 Redefinir sua senha',
    html,
  });
}
