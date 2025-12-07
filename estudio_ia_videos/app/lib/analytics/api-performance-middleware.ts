/**
 * API Performance Middleware
 * Monitora performance de requisições da API
 */

import { NextRequest, NextResponse } from 'next/server';

export interface PerformanceMetrics {
  path: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

const metrics: PerformanceMetrics[] = [];

export function apiPerformanceMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const response = await handler(req);
    const duration = Date.now() - start;

    metrics.push({
      path: req.nextUrl.pathname,
      method: req.method,
      duration,
      statusCode: response.status,
      timestamp: new Date(),
    });

    if (metrics.length > 1000) {
      metrics.shift();
    }

    return response;
  };
}

export function getMetrics(): PerformanceMetrics[] {
  return [...metrics];
}

export const withAnalytics = apiPerformanceMiddleware;
