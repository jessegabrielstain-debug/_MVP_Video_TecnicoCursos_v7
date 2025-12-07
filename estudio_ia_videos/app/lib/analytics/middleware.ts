/**
 * Analytics Middleware
 * Middleware para tracking e analytics de requisições
 */

import { NextRequest, NextResponse } from 'next/server';

export interface AnalyticsEvent {
  path: string;
  method: string;
  timestamp: Date;
  userId?: string;
}

const events: AnalyticsEvent[] = [];

export function withAnalytics(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const event: AnalyticsEvent = {
      path: req.nextUrl.pathname,
      method: req.method,
      timestamp: new Date(),
    };

    events.push(event);

    if (events.length > 1000) {
      events.shift();
    }

    return handler(req);
  };
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  return [...events];
}
