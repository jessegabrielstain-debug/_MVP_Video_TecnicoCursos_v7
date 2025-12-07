import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const priceId = process.env.STRIPE_PRICE_ID || body.priceId
    const secret = process.env.STRIPE_SECRET_KEY || ''
    const successUrl = body.successUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cancelUrl = body.cancelUrl || successUrl
    if (!secret || !priceId) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
    }
    const params = new URLSearchParams()
    params.append('mode', 'subscription')
    params.append('success_url', `${successUrl}/billing/success`)
    params.append('cancel_url', `${cancelUrl}/billing/cancel`)
    params.append('line_items[0][price]', priceId)
    params.append('line_items[0][quantity]', '1')
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: 'Stripe error', details: data }, { status: 500 })
    }
    return NextResponse.json({ success: true, sessionId: data.id, url: data.url })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create session', details: String(e) }, { status: 500 })
  }
}

