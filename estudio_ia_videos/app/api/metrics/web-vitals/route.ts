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

