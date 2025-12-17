/**
 * 🛡️ Security Middleware
 * MVP Vídeos TécnicoCursos v7
 * 
 * Implementa medidas de segurança avançadas para produção
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/utils/rate-limit';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// ===========================================
// Security Configuration
// ===========================================

const SECURITY_CONFIG = {
    maxRequestSize: 100 * 1024 * 1024, // 100MB
    maxHeaderSize: 8 * 1024, // 8KB
    maxUrlLength: 2048,
    maxCookieSize: 4096,
    allowedFileTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    blockedUserAgents: [
        'bot', 'spider', 'crawler', 'scraper', 'harvester'
    ],
    suspiciousPatterns: [
        // SQL Injection
        /(union|select|insert|update|delete|drop|create|alter)\s/i,
        // XSS
        /<script|javascript:|vbscript:|onload=|onerror=/i,
        // Path traversal
        /\.\.(\/|\\)/,
        // Command injection
        /[;&|`$]/,
        // LDAP injection
        /[()&|!]/
    ]
};

// ===========================================
// Security Headers
// ===========================================

export function generateSecurityHeaders() {
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const headers = new Headers();
    
    // HTTPS enforcement
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // XSS protection
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    
    // CSP with nonce
    const cspDirectives = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');
    
    headers.set('Content-Security-Policy', cspDirectives);
    
    // Additional security headers
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    
    // Remove server information
    headers.delete('Server');
    headers.delete('X-Powered-By');
    
    return { headers, nonce };
}

export function securityHeadersMiddleware() {
    return (req: NextRequest) => {
        const response = NextResponse.next();
        const { headers } = generateSecurityHeaders();
        
        // Apply security headers
        headers.forEach((value, key) => {
            response.headers.set(key, value);
        });
        
        return response;
    };
}

// ===========================================
// Input Validation & Sanitization
// ===========================================

export function sanitizeInput(input: unknown): unknown {
    if (typeof input === 'string') {
        // Remove NULL bytes
        let sanitized = input.replace(/\0/g, '');
        
        // Detect and block suspicious patterns
        for (const pattern of SECURITY_CONFIG.suspiciousPatterns) {
            if (pattern.test(sanitized)) {
                logger.warn('Suspicious input detected', {
                    pattern: pattern.toString(),
                    input: sanitized.substring(0, 100)
                });
                throw new Error('Invalid input detected');
            }
        }
        
        // HTML encode dangerous characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        return sanitized.trim();
    }
    
    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }
    
    if (typeof input === 'object' && input !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return input;
}

export function validateInputMiddleware<T extends z.ZodSchema>(schema: T) {
    return async (req: NextRequest) => {
        try {
            // Check request size
            const contentLength = parseInt(req.headers.get('content-length') || '0');
            if (contentLength > SECURITY_CONFIG.maxRequestSize) {
                logger.warn('Request too large', { size: contentLength });
                return NextResponse.json(
                    { error: 'Request too large' },
                    { status: 413 }
                );
            }
            
            // Parse and sanitize body
            let body;
            try {
                const text = await req.text();
                body = JSON.parse(text);
                body = sanitizeInput(body);
            } catch (error) {
                logger.warn('Invalid JSON in request', { error: error.message });
                return NextResponse.json(
                    { error: 'Invalid JSON' },
                    { status: 400 }
                );
            }
            
            // Validate with schema
            const result = schema.safeParse(body);
            if (!result.success) {
                logger.warn('Validation failed', {
                    errors: result.error.errors,
                    ip: req.ip
                });
                
                return NextResponse.json(
                    {
                        error: 'Validation failed',
                        details: result.error.errors
                    },
                    { status: 400 }
                );
            }
            
            // Add validated data to request - extending NextRequest with custom property
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest extension pattern
            (req as NextRequest & { validatedData: unknown }).validatedData = result.data;
            
            return NextResponse.next();
            
        } catch (error) {
            logger.error('Input validation error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

// ===========================================
// Rate Limiting
// ===========================================

export function createRateLimiter(options: {
    windowMs?: number;
    max?: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}) {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100,
        message = 'Too many requests, please try again later.',
        skipSuccessfulRequests = false
    } = options;
    
    return async (req: NextRequest) => {
        const identifier = req.ip || 'anonymous';
        
        const { success, limit, remaining, reset } = await rateLimit(
            identifier,
            windowMs,
            max
        );
        
        if (!success) {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.headers.get('user-agent'),
                url: req.url
            });
            
            const response = NextResponse.json(
                { error: message },
                { status: 429 }
            );
            
            response.headers.set('X-RateLimit-Limit', limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
            response.headers.set('X-RateLimit-Reset', reset.toString());
            response.headers.set('Retry-After', Math.round(windowMs / 1000).toString());
            
            return response;
        }
        
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', reset.toString());
        
        return response;
    };
}

// Rate limiters for different endpoints
export const authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
});

export const apiRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'API rate limit exceeded, please slow down.'
});

export const uploadRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Upload rate limit exceeded, please try again later.'
});

// ===========================================
// CSRF Protection
// ===========================================

export function generateCSRFToken(): string {
    return crypto.randomBytes(24).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false;
    
    try {
        return crypto.timingSafeEqual(
            Buffer.from(token, 'hex'),
            Buffer.from(sessionToken, 'hex')
        );
    } catch {
        return false;
    }
}

export function csrfMiddleware() {
    return (req: NextRequest) => {
        // Skip CSRF for GET, HEAD, OPTIONS
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return NextResponse.next();
        }
        
        const csrfHeader = req.headers.get('x-csrf-token');
        const csrfCookie = req.cookies.get('csrf-token')?.value;
        
        if (!csrfHeader || !csrfCookie || !validateCSRFToken(csrfHeader, csrfCookie)) {
            logger.warn('CSRF token validation failed', {
                ip: req.ip,
                method: req.method,
                url: req.url
            });
            
            return NextResponse.json(
                { error: 'CSRF token validation failed' },
                { status: 403 }
            );
        }
        
        return NextResponse.next();
    };
}

// ===========================================
// File Upload Security
// ===========================================

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > SECURITY_CONFIG.maxRequestSize) {
        return { valid: false, error: 'File too large' };
    }
    
    // Check file type
    if (!SECURITY_CONFIG.allowedFileTypes.includes(file.type)) {
        return { valid: false, error: 'File type not allowed' };
    }
    
    // Check file name
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { valid: false, error: 'Invalid file name' };
    }
    
    return { valid: true };
}

export function fileUploadMiddleware() {
    return async (req: NextRequest) => {
        if (!req.headers.get('content-type')?.startsWith('multipart/form-data')) {
            return NextResponse.next();
        }
        
        try {
            const formData = await req.formData();
            
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    const validation = validateFileUpload(value);
                    
                    if (!validation.valid) {
                        logger.warn('File upload validation failed', {
                            fileName: value.name,
                            fileType: value.type,
                            fileSize: value.size,
                            error: validation.error,
                            ip: req.ip
                        });
                        
                        return NextResponse.json(
                            { error: validation.error },
                            { status: 400 }
                        );
                    }
                }
            }
            
            return NextResponse.next();
            
        } catch (error) {
            logger.error('File upload middleware error:', error);
            return NextResponse.json(
                { error: 'File upload processing failed' },
                { status: 500 }
            );
        }
    };
}

// ===========================================
// Bot Detection
// ===========================================

export function botDetectionMiddleware() {
    return (req: NextRequest) => {
        const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
        
        // Check for common bot patterns
        const isBot = SECURITY_CONFIG.blockedUserAgents.some(pattern =>
            userAgent.includes(pattern)
        );
        
        if (isBot && !userAgent.includes('googlebot') && !userAgent.includes('bingbot')) {
            logger.warn('Bot detected and blocked', {
                userAgent,
                ip: req.ip,
                url: req.url
            });
            
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }
        
        return NextResponse.next();
    };
}

// ===========================================
// Main Security Middleware
// ===========================================

export function securityMiddleware() {
    return (req: NextRequest) => {
        // Apply security headers
        const response = securityHeadersMiddleware()(req);
        
        // Log security events
        logger.debug('Security middleware applied', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.headers.get('user-agent')
        });
        
        return response;
    };
}

export {
    SECURITY_CONFIG,
    generateSecurityHeaders
};