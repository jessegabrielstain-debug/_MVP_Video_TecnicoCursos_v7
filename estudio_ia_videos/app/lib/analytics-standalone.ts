/**
 * Analytics Standalone
 * Sistema de analytics autônomo (não depende de DB)
 */

export interface AnalyticsEvent {
  type: string;
  timestamp: Date;
  userId?: string;
  data: Record<string, unknown>;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  activeUsers: number;
  requests: number;
}

export interface UserMetrics {
  userId: string;
  events: number;
  lastSeen: Date;
  activities: Array<{ type: string; count: number }>;
}

export class AnalyticsStandalone {
  private events: AnalyticsEvent[] = [];
  
  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: new Date(),
    });
  }
  
  getEvents(filters?: Partial<AnalyticsEvent>): AnalyticsEvent[] {
    if (!filters) return [...this.events];
    
    return this.events.filter(event => {
      return Object.entries(filters).every(([key, value]) => {
        return event[key as keyof AnalyticsEvent] === value;
      });
    });
  }
  
  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      activeUsers: this.events.filter(e => 
        e.timestamp.getTime() > Date.now() - 3600000
      ).length,
      requests: this.events.length
    };
  }
  
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    const userEvents = this.events.filter(e => e.userId === userId);
    const activityMap = new Map<string, number>();
    
    userEvents.forEach(event => {
      activityMap.set(event.type, (activityMap.get(event.type) || 0) + 1);
    });
    
    return {
      userId,
      events: userEvents.length,
      lastSeen: userEvents[userEvents.length - 1]?.timestamp || new Date(),
      activities: Array.from(activityMap.entries()).map(([type, count]) => ({ type, count }))
    };
  }
  
  clear(): void {
    this.events = [];
  }
}

export const analytics = new AnalyticsStandalone();
