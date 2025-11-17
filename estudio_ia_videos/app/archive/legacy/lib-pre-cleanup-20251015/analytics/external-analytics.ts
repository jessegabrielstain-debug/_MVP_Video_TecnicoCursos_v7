
/**
 * Sprint 41: External Analytics Integration
 * Integração com Amplitude, Mixpanel e outras ferramentas
 */

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface UserProperties {
  userId: string;
  email?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  signupDate?: Date;
  [key: string]: any;
}

export class ExternalAnalytics {
  private static amplitudeApiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  private static mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

  /**
   * Envia evento para Amplitude
   */
  static async sendToAmplitude(event: AnalyticsEvent): Promise<void> {
    if (!this.amplitudeApiKey) {
      console.warn('[ExternalAnalytics] Amplitude API key not configured');
      return;
    }

    try {
      // Amplitude HTTP API v2
      const response = await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.amplitudeApiKey,
          events: [
            {
              user_id: event.userId,
              event_type: event.eventName,
              event_properties: event.properties || {},
              time: event.timestamp?.getTime() || Date.now(),
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('[ExternalAnalytics] Amplitude error:', await response.text());
      }
    } catch (error) {
      console.error('[ExternalAnalytics] Error sending to Amplitude:', error);
    }
  }

  /**
   * Envia evento para Mixpanel
   */
  static async sendToMixpanel(event: AnalyticsEvent): Promise<void> {
    if (!this.mixpanelToken) {
      console.warn('[ExternalAnalytics] Mixpanel token not configured');
      return;
    }

    try {
      const data = {
        event: event.eventName,
        properties: {
          ...event.properties,
          distinct_id: event.userId,
          time: event.timestamp?.getTime() || Date.now(),
          token: this.mixpanelToken,
        },
      };

      const response = await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([data]),
      });

      if (!response.ok) {
        console.error('[ExternalAnalytics] Mixpanel error:', await response.text());
      }
    } catch (error) {
      console.error('[ExternalAnalytics] Error sending to Mixpanel:', error);
    }
  }

  /**
   * Envia evento para múltiplas plataformas
   */
  static async track(event: AnalyticsEvent): Promise<void> {
    console.log('[ExternalAnalytics] Tracking event:', event);

    // Enviar para todas as plataformas configuradas
    await Promise.all([
      this.sendToAmplitude(event),
      this.sendToMixpanel(event),
      // Adicionar outros providers aqui (Google Analytics, etc)
    ]);
  }

  /**
   * Identifica usuário nas plataformas de analytics
   */
  static async identify(userProperties: UserProperties): Promise<void> {
    console.log('[ExternalAnalytics] Identifying user:', userProperties);

    // Amplitude Identify
    if (this.amplitudeApiKey) {
      try {
        await fetch('https://api2.amplitude.com/identify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: this.amplitudeApiKey,
            identification: [
              {
                user_id: userProperties.userId,
                user_properties: userProperties,
              },
            ],
          }),
        });
      } catch (error) {
        console.error('[ExternalAnalytics] Error identifying user in Amplitude:', error);
      }
    }

    // Mixpanel People Set
    if (this.mixpanelToken) {
      try {
        await fetch('https://api.mixpanel.com/engage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            {
              $token: this.mixpanelToken,
              $distinct_id: userProperties.userId,
              $set: userProperties,
            },
          ]),
        });
      } catch (error) {
        console.error('[ExternalAnalytics] Error identifying user in Mixpanel:', error);
      }
    }
  }

  /**
   * Rastreia eventos críticos de produto
   */
  static async trackProductEvent(
    eventName: string,
    userId: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.track({
      eventName,
      userId,
      properties: {
        ...properties,
        source: 'web_app',
        environment: process.env.NODE_ENV,
      },
    });
  }

  /**
   * Rastreia eventos de conversão
   */
  static async trackConversion(
    conversionType: 'signup' | 'upgrade' | 'trial_start' | 'purchase',
    userId: string,
    value?: number,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.track({
      eventName: `conversion_${conversionType}`,
      userId,
      properties: {
        ...properties,
        conversion_type: conversionType,
        value: value || 0,
        currency: 'BRL',
      },
    });
  }

  /**
   * Rastreia eventos de retenção
   */
  static async trackRetentionEvent(
    eventType: 'd1' | 'd7' | 'd30',
    userId: string,
    retained: boolean
  ): Promise<void> {
    await this.track({
      eventName: `retention_${eventType}`,
      userId,
      properties: {
        retained,
        retention_type: eventType,
      },
    });
  }

  /**
   * Rastreia eventos de engagement
   */
  static async trackEngagement(
    feature: string,
    userId: string,
    duration?: number
  ): Promise<void> {
    await this.track({
      eventName: 'feature_used',
      userId,
      properties: {
        feature,
        duration,
      },
    });
  }
}
