
/**
 * 🛡️ Security Middleware Production-Ready
 * Conjunto completo de middlewares de segurança
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionLogger as logger, alertSystem } from './logger'
import crypto from 'crypto'

// Headers de segurança padrão
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-ancestors 'none';",
}

// Middleware principal de segurança
export function createSecurityMiddleware() {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const start = Date.now()
    const ip = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || ''
    const url = req.url
    
    try {
      // 1. Verificar métodos HTTP permitidos
      const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
      if (!allowedMethods.includes(req.method)) {
        logger.warn('Blocked invalid HTTP method', { method: req.method, ip, url })
        return createSecurityResponse('Method not allowed', 405)
      }
      
      // 2. Verificar tamanho do request
      const contentLength = req.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB
        logger.warn('Blocked oversized request', { contentLength, ip, url })
        return createSecurityResponse('Request too large', 413)
      }
      
      // 3. Detectar User-Agent suspeito
      if (isSuspiciousUserAgent(userAgent)) {
        logger.warn('Blocked suspicious user agent', { userAgent, ip, url })
        alertSystem.alert('warning', 'Suspicious user agent detected', { ip, userAgent, url })
        return createSecurityResponse('Access denied', 403)
      }
      
      // 4. Detectar padrões de ataque
      if (containsAttackPatterns(url)) {
        logger.error('Blocked potential attack', { url, ip, userAgent })
        alertSystem.alert('error', 'Potential attack detected', { ip, url, userAgent })
        return createSecurityResponse('Access denied', 403)
      }
      
      // 5. Verificar headers de segurança do cliente
      const suspiciousHeaders = detectSuspiciousHeaders(req)
      if (suspiciousHeaders.length > 0) {
        logger.warn('Suspicious headers detected', { headers: suspiciousHeaders, ip, url })
      }
      
      // 6. Rate limiting baseado em padrões
      const rateLimitViolation = await checkAdvancedRateLimit(req)
      if (rateLimitViolation) {
        return rateLimitViolation
      }
      
      logger.debug('Security check passed', {
        ip,
        url,
        method: req.method,
        duration: Date.now() - start
      })
      
      return null // Continuar processamento
      
    } catch (error: any) {
      logger.error('Security middleware error', { error: error.message, ip, url })
      // Em caso de erro, permitir acesso mas registrar
      return null
    }
  }
}

// Obter IP do cliente com múltiplas fontes
function getClientIP(req: NextRequest): string {
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ]
  
  for (const header of headers) {
    const value = req.headers.get(header)
    if (value) {
      const ip = value.split(',')[0].trim()
      if (ip && ip !== 'unknown' && isValidIP(ip)) {
        return ip
      }
    }
  }
  
  return 'unknown'
}

// Validar formato de IP
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Detectar User-Agent suspeito
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /harvester/i,
    /extractor/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,
    /go-http/i,
    /scanner/i,
    /vulnerability/i,
    /pentest/i,
    /hack/i,
    /exploit/i,
    /sql/i,
    /injection/i,
    /xss/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i
  ]
  
  // User-Agent muito curto ou vazio
  if (!userAgent || userAgent.length < 10) {
    return true
  }
  
  // Verificar padrões suspeitos
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

// Detectar padrões de ataque na URL
function containsAttackPatterns(url: string): boolean {
  const attackPatterns = [
    // SQL Injection
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
    /('|\"|;|--|\/\*|\*\/)/,
    
    // XSS
    /(<script|<iframe|<object|<embed|<link|<meta|<form)/i,
    /(javascript:|vbscript:|data:text\/html|data:application)/i,
    /(onload|onerror|onclick|onmouseover|onfocus|onblur)=/i,
    
    // Path Traversal
    /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i,
    /(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)/i,
    
    // Command Injection
    /(\||&|;|`|\$\(|\${)/,
    /(cmd|command|exec|eval|system|shell|bash|sh|powershell)/i,
    
    // LDAP Injection
    /(\*\)|\|\||\&\&)/,
    
    // File Inclusion
    /(php:\/\/|file:\/\/|ftp:\/\/|http:\/\/localhost|http:\/\/127\.0\.0\.1)/i,
    
    // Server-Side Template Injection
    /(\{\{|\}\}|\{%|%\}|\{#|#\})/,
    
    // NoSQL Injection
    /(\$where|\$ne|\$gt|\$lt|\$regex|\$in)/i,
    
    // XML/XXE
    /(<!entity|<!doctype|<\?xml)/i,
    
    // General suspicious patterns
    /(%00|%0a|%0d|%09|%20|%22|%27|%3c|%3e|%7c)/i,
    /(base64_decode|eval\(|exec\(|system\(|shell_exec)/i
  ]
  
  const decodedUrl = decodeURIComponent(url).toLowerCase()
  return attackPatterns.some(pattern => pattern.test(decodedUrl))
}

// Detectar headers suspeitos
function detectSuspiciousHeaders(req: NextRequest): string[] {
  const suspicious: string[] = []
  
  // Headers que podem indicar ferramentas automatizadas
  const suspiciousHeaders = [
    'x-scanner',
    'x-pentest',
    'x-exploit',
    'x-hack',
    'x-vulnerability',
    'x-injection'
  ]
  
  for (const header of suspiciousHeaders) {
    if (req.headers.get(header)) {
      suspicious.push(header)
    }
  }
  
  // Verificar Accept header anômalo
  const accept = req.headers.get('accept')
  if (accept && (accept.includes('*/*') && accept.length < 10)) {
    suspicious.push('minimal-accept')
  }
  
  // Verificar ausência de headers comuns em browsers
  const commonHeaders = ['accept-language', 'accept-encoding', 'cache-control']
  const missingHeaders = commonHeaders.filter(h => !req.headers.get(h))
  
  if (missingHeaders.length >= 2) {
    suspicious.push('missing-browser-headers')
  }
  
  return suspicious
}

// Rate limiting avançado baseado em padrões
async function checkAdvancedRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(req)
  const url = req.url
  const method = req.method
  
  // Rate limiting mais agressivo para padrões suspeitos
  const suspiciousPatterns = [
    /\/wp-admin/,
    /\/admin/,
    /\/phpmyadmin/,
    /\/login/,
    /\/api\/.*\/.*\/.*/, // APIs com muitos segmentos
    /\.env/,
    /\.git/,
    /\.svn/,
    /\.htaccess/,
    /config/i,
    /backup/i
  ]
  
  const isSuspiciousPath = suspiciousPatterns.some(pattern => pattern.test(url))
  
  if (isSuspiciousPath) {
    // Rate limit mais restritivo para paths suspeitos
    const key = `suspicious:${ip}`
    // Implementar rate limiting específico aqui
    
    logger.warn('Suspicious path accessed', { ip, url, method })
    alertSystem.alert('warning', 'Suspicious path accessed', { ip, url })
  }
  
  return null
}

// Criar resposta de segurança com headers
function createSecurityResponse(message: string, status: number): NextResponse {
  const response = new NextResponse(
    JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS
      }
    }
  )
  
  return response
}

// Middleware para adicionar headers de segurança
export function addSecurityHeaders() {
  return (response: NextResponse): NextResponse => {
    // Adicionar headers de segurança
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Remover headers que revelam informações do servidor
    response.headers.delete('Server')
    response.headers.delete('X-Powered-By')
    
    return response
  }
}

// Validador de entrada para APIs
export function validateInput(data: any, rules: Record<string, unknown>): {
  valid: boolean
  errors: string[]
  sanitized: any
} {
  const errors: string[] = []
  const sanitized: any = {}
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    
    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }
    
    // Skip validation if not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue
    }
    
    // Type validation
    if (rule.type && typeof value !== rule.type) {
      errors.push(`${field} must be of type ${rule.type}`)
      continue
    }
    
    // String validations
    if (rule.type === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`)
        continue
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must not exceed ${rule.maxLength} characters`)
        continue
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`)
        continue
      }
      
      // Sanitizar string
      sanitized[field] = sanitizeString(value)
    }
    
    // Number validations
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`)
        continue
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must not exceed ${rule.max}`)
        continue
      }
      
      sanitized[field] = value
    }
    
    // Array validations
    if (rule.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${field} must be an array`)
        continue
      }
      
      if (rule.minItems && value.length < rule.minItems) {
        errors.push(`${field} must have at least ${rule.minItems} items`)
        continue
      }
      
      if (rule.maxItems && value.length > rule.maxItems) {
        errors.push(`${field} must not exceed ${rule.maxItems} items`)
        continue
      }
      
      sanitized[field] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    }
    
    // Object validations
    if (rule.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${field} must be an object`)
        continue
      }
      
      sanitized[field] = value
    }
    
    // Se não é string, apenas copiar
    if (rule.type !== 'string') {
      sanitized[field] = value
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

// Sanitizar strings
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script
    .trim()
}

// Gerador de hash seguro
export function generateSecureHash(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512')
  return `${actualSalt}:${hash.toString('hex')}`
}

// Verificar hash seguro
export function verifySecureHash(data: string, hash: string): boolean {
  try {
    const [salt, originalHash] = hash.split(':')
    const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512')
    return originalHash === newHash.toString('hex')
  } catch {
    return false
  }
}

// Gerar token seguro
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Validador de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validador de senha forte
export function isStrongPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain numbers')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain special characters')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Middleware de CORS seguro
export function createSecureCORS(allowedOrigins: string[] = []) {
  return (req: NextRequest): Headers => {
    const headers = new Headers()
    const origin = req.headers.get('origin')
    
    // Verificar se origem é permitida
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin)
    } else if (allowedOrigins.length === 0) {
      // Se não especificado, permitir todas (desenvolvimento)
      headers.set('Access-Control-Allow-Origin', '*')
    }
    
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    headers.set('Access-Control-Max-Age', '86400') // 24 horas
    
    return headers
  }
}

export {
  SECURITY_HEADERS,
  getClientIP,
  isSuspiciousUserAgent,
  containsAttackPatterns
}
