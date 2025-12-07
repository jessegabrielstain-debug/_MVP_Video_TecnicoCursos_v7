
/**
 * 🛡️ CSRF Token Endpoint
 * 
 * Gera e retorna token CSRF para o cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/security/csrf-protection'
import crypto from 'crypto'

/**
 * GET /api/csrf
 * Retorna novo token CSRF
 */
export async function GET(request: NextRequest) {
  // Gera ou recupera um ID de sessão
  const sessionId = request.cookies.get('session-id')?.value || crypto.randomUUID();
  
  const token = generateCsrfToken(sessionId)
  
  const response = NextResponse.json({
    token,
  })
  
  // Set session ID cookie if not exists
  if (!request.cookies.get('session-id')?.value) {
    response.cookies.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  }
  
  // Set CSRF token cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  
  return response
}

