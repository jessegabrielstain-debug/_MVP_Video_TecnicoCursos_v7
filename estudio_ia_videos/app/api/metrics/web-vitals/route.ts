import { NextResponse } from 'next/server';

// Memória simples para agregação (reset a cada deployment)
const vitals: { samples: number; metrics: Record<string, number[]> } = {
  samples: 0,
  metrics: {}
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, value } = data || {};
    if (typeof name === 'string' && typeof value === 'number') {
      if (!vitals.metrics[name]) vitals.metrics[name] = [];
      vitals.metrics[name].push(value);
      vitals.samples++;
    }
    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }
}

export async function GET() {
  const summary: Record<string, { count: number; p50: number; p90: number }> = {};
  for (const [k, values] of Object.entries(vitals.metrics)) {
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
    summary[k] = { count: sorted.length, p50, p90 };
  }
  return NextResponse.json({ samples: vitals.samples, summary });
}
/**
 * API: Web Vitals Metrics Storage
 */

import { NextRequest, NextResponse } from 'next/server'

// Storage temporário (em produção, usar Redis ou banco de dados)
let webVitalsReports: any[] = []

export async function POST(req: NextRequest) {
  try {
    const report = await req.json()

    // Adicionar ao storage
    webVitalsReports.push({
      ...report,
      receivedAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent')
    })

    // Manter apenas os últimos 1000 reports
    if (webVitalsReports.length > 1000) {
      webVitalsReports = webVitalsReports.slice(-1000)
    }

    // Atualizar métricas do Prometheus
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: report.name.toLowerCase() + '_' + 
                (report.name === 'FID' ? 'milliseconds' : 
                 report.name === 'CLS' ? 'score' : 'seconds'),
        value: report.value,
        operation: 'add'
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Web Vital reportado'
    })
  } catch (error) {
    console.error('Erro ao processar Web Vital:', error)
    return NextResponse.json(
      { error: 'Erro ao processar Web Vital' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')
    const metric = req.nextUrl.searchParams.get('metric')

    let reports = webVitalsReports

    // Filtrar por métrica específica
    if (metric) {
      reports = reports.filter(r => r.name === metric)
    }

    // Limitar resultados
    reports = reports.slice(-limit)

    // Calcular estatísticas
    const stats = {
      total: reports.length,
      averages: {} as Record<string, number>,
      p95: {} as Record<string, number>,
      ratings: {} as Record<string, { good: number; needsImprovement: number; poor: number }>
    }

    for (const metricName of ['LCP', 'FID', 'FCP', 'CLS', 'TTFB']) {
      const metricReports = reports.filter(r => r.name === metricName)
      if (metricReports.length > 0) {
        const values = metricReports.map(r => r.value).sort((a, b) => a - b)
        stats.averages[metricName] = values.reduce((a, b) => a + b, 0) / values.length
        stats.p95[metricName] = values[Math.floor(values.length * 0.95)]
        
        stats.ratings[metricName] = {
          good: metricReports.filter(r => r.rating === 'good').length,
          needsImprovement: metricReports.filter(r => r.rating === 'needs-improvement').length,
          poor: metricReports.filter(r => r.rating === 'poor').length
        }
      }
    }

    return NextResponse.json({
      success: true,
      reports,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao buscar Web Vitals:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar Web Vitals' },
      { status: 500 }
    )
  }
}
