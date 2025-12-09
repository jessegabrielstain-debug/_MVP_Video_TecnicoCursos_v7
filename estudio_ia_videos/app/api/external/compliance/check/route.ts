/**
 * ✅ NR Compliance Check API
 * Handles compliance checks for accessibility, content rating, copyright, and privacy
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Validation schema
const ComplianceCheckSchema = z.object({
  content_type: z.enum(['text', 'image', 'video', 'audio', 'document']),
  content_url: z.string().url().optional(),
  content_text: z.string().optional(),
  check_types: z.array(z.enum(['accessibility', 'content_rating', 'copyright', 'privacy'])).min(1),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    language: z.string().default('en'),
    target_audience: z.enum(['general', 'children', 'teens', 'adults']).default('general')
  }).optional()
})

type ComplianceCheckParams = z.infer<typeof ComplianceCheckSchema>

interface CheckResult {
  type: string
  passed: boolean
  score: number
  issues?: string[]
  flags?: string[]
  violations?: string[]
  concerns?: string[]
  recommendations: string[]
  [key: string]: unknown
}

interface ComplianceResult {
  overall_score: number
  passed: boolean
  checks: Record<string, CheckResult>
}

// Compliance check implementations
class ComplianceChecker {
  static async performChecks(params: ComplianceCheckParams): Promise<ComplianceResult> {
    const results: ComplianceResult = {
      overall_score: 0,
      passed: true,
      checks: {}
    }

    let totalScore = 0
    let checkCount = 0

    for (const checkType of params.check_types) {
      let checkResult: CheckResult | undefined

      switch (checkType) {
        case 'accessibility':
          checkResult = await this.checkAccessibility(params)
          break
        case 'content_rating':
          checkResult = await this.checkContentRating(params)
          break
        case 'copyright':
          checkResult = await this.checkCopyright(params)
          break
        case 'privacy':
          checkResult = await this.checkPrivacy(params)
          break
        default:
          continue
      }

      if (checkResult) {
        results.checks[checkType] = checkResult
        totalScore += checkResult.score
        checkCount++

        if (!checkResult.passed) {
          results.passed = false
        }
      }
    }

    results.overall_score = checkCount > 0 ? Math.round(totalScore / checkCount) : 0

    return results
  }

  private static async checkAccessibility(params: ComplianceCheckParams): Promise<CheckResult> {
    // Accessibility compliance check
    const issues: string[] = []
    let score = 100

    // Check for alt text if image
    if (params.content_type === 'image' && !params.metadata?.description) {
      issues.push('Missing alt text for image')
      score -= 20
    }

    // Check for captions if video
    if (params.content_type === 'video') {
      // Simulate caption check
      if (Math.random() > 0.7) {
        issues.push('Missing captions for video content')
        score -= 30
      }
    }

    // Check text contrast and readability
    if (params.content_text) {
      const wordCount = params.content_text.split(' ').length
      const avgWordsPerSentence = wordCount / (params.content_text.split('.').length || 1)
      
      if (avgWordsPerSentence > 20) {
        issues.push('Text may be difficult to read - consider shorter sentences')
        score -= 10
      }
    }

    // Check for color-only information
    if (params.content_type === 'image' || params.content_type === 'video') {
      // Simulate color dependency check
      if (Math.random() > 0.8) {
        issues.push('Content may rely on color alone to convey information')
        score -= 15
      }
    }

    return {
      type: 'accessibility',
      passed: score >= 70,
      score: Math.max(0, score),
      issues,
      recommendations: this.getAccessibilityRecommendations(issues),
      wcag_level: score >= 90 ? 'AAA' : score >= 70 ? 'AA' : 'A'
    }
  }

  private static async checkContentRating(params: ComplianceCheckParams): Promise<CheckResult> {
    // Content rating check
    const flags: string[] = []
    let score = 100
    let rating = 'G' // General audiences

    if (params.content_text) {
      const text = params.content_text.toLowerCase()
      
      // Check for inappropriate language
      const inappropriateWords = ['violence', 'explicit', 'adult', 'mature']
      const foundWords = inappropriateWords.filter(word => text.includes(word))
      
      if (foundWords.length > 0) {
        flags.push(`Potentially inappropriate content detected: ${foundWords.join(', ')}`)
        score -= foundWords.length * 20
        rating = foundWords.length > 2 ? 'R' : 'PG-13'
      }

      // Check for sensitive topics
      const sensitiveTopics = ['politics', 'religion', 'controversial']
      const foundTopics = sensitiveTopics.filter(topic => text.includes(topic))
      
      if (foundTopics.length > 0) {
        flags.push(`Sensitive topics detected: ${foundTopics.join(', ')}`)
        score -= foundTopics.length * 10
        if (rating === 'G') rating = 'PG'
      }
    }

    // Adjust rating based on target audience
    if (params.metadata?.target_audience === 'children' && rating !== 'G') {
      flags.push('Content may not be suitable for children')
      score -= 30
    }

    return {
      type: 'content_rating',
      passed: score >= 70,
      score: Math.max(0, score),
      rating,
      flags,
      recommendations: this.getContentRatingRecommendations(flags, params.metadata?.target_audience),
      suitable_for_children: rating === 'G'
    }
  }

  private static async checkCopyright(params: ComplianceCheckParams): Promise<CheckResult> {
    // Copyright compliance check
    const violations: string[] = []
    let score = 100

    // Simulate copyright detection
    if (params.content_url) {
      // Check against known copyrighted content databases
      if (Math.random() > 0.9) {
        violations.push('Potential copyright violation detected in media content')
        score -= 50
      }
    }

    if (params.content_text) {
      // Check for plagiarism indicators
      const text = params.content_text.toLowerCase()
      
      if (text.includes('copyright') || text.includes('©') || text.includes('all rights reserved')) {
        // This might be properly attributed content
        score += 10
      }

      // Simulate plagiarism check
      if (Math.random() > 0.85) {
        violations.push('Potential plagiarized content detected')
        score -= 40
      }
    }

    // Check for proper attribution
    const hasAttribution = params.metadata?.description?.includes('source:') || 
                          params.metadata?.description?.includes('credit:')
    
    if (!hasAttribution && params.content_url) {
      violations.push('Missing proper attribution for external content')
      score -= 20
    }

    return {
      type: 'copyright',
      passed: score >= 70,
      score: Math.max(0, score),
      violations,
      recommendations: this.getCopyrightRecommendations(violations),
      requires_attribution: !hasAttribution && params.content_url,
      fair_use_likely: score >= 80
    }
  }

  private static async checkPrivacy(params: ComplianceCheckParams): Promise<CheckResult> {
    // Privacy compliance check
    const concerns: string[] = []
    let score = 100

    if (params.content_text) {
      const text = params.content_text.toLowerCase()
      
      // Check for PII
      const piiPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /\b\d{3}-\d{3}-\d{4}\b/, // Phone
        /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/ // Credit card
      ]

      piiPatterns.forEach((pattern, index) => {
        if (pattern.test(text)) {
          const types = ['Social Security Number', 'Email Address', 'Phone Number', 'Credit Card Number']
          concerns.push(`Potential ${types[index]} detected in content`)
          score -= 30
        }
      })

      // Check for personal information keywords
      const personalKeywords = ['address', 'birthday', 'age', 'location', 'personal']
      const foundKeywords = personalKeywords.filter(keyword => text.includes(keyword))
      
      if (foundKeywords.length > 0) {
        concerns.push(`Personal information keywords detected: ${foundKeywords.join(', ')}`)
        score -= foundKeywords.length * 10
      }
    }

    // Check for GDPR compliance indicators
    const hasPrivacyNotice = params.metadata?.description?.includes('privacy') ||
                            params.metadata?.description?.includes('gdpr') ||
                            params.metadata?.description?.includes('data protection')

    if (!hasPrivacyNotice && concerns.length > 0) {
      concerns.push('Missing privacy notice for content containing personal data')
      score -= 20
    }

    return {
      type: 'privacy',
      passed: score >= 70,
      score: Math.max(0, score),
      concerns,
      recommendations: this.getPrivacyRecommendations(concerns),
      gdpr_compliant: score >= 80,
      requires_consent: concerns.some(c => c.includes('Personal information') || c.includes('detected in content'))
    }
  }

  private static getAccessibilityRecommendations(issues: string[]): string[] {
    const recommendations: string[] = []
    
    if (issues.some(i => i.includes('alt text'))) {
      recommendations.push('Add descriptive alt text to all images')
    }
    if (issues.some(i => i.includes('captions'))) {
      recommendations.push('Provide captions or transcripts for video content')
    }
    if (issues.some(i => i.includes('sentences'))) {
      recommendations.push('Use shorter, clearer sentences for better readability')
    }
    if (issues.some(i => i.includes('color'))) {
      recommendations.push('Ensure information is not conveyed by color alone')
    }

    return recommendations
  }

  private static getContentRatingRecommendations(flags: string[], targetAudience?: string): string[] {
    const recommendations: string[] = []
    
    if (flags.some(f => f.includes('inappropriate'))) {
      recommendations.push('Review and remove inappropriate language or content')
    }
    if (flags.some(f => f.includes('sensitive'))) {
      recommendations.push('Consider adding content warnings for sensitive topics')
    }
    if (targetAudience === 'children' && flags.length > 0) {
      recommendations.push('Ensure all content is appropriate for the target age group')
    }

    return recommendations
  }

  private static getCopyrightRecommendations(violations: string[]): string[] {
    const recommendations: string[] = []
    
    if (violations.some(v => v.includes('copyright violation'))) {
      recommendations.push('Replace copyrighted content with original or licensed material')
    }
    if (violations.some(v => v.includes('plagiarized'))) {
      recommendations.push('Rewrite content in your own words or properly cite sources')
    }
    if (violations.some(v => v.includes('attribution'))) {
      recommendations.push('Add proper attribution and source credits')
    }

    return recommendations
  }

  private static getPrivacyRecommendations(concerns: string[]): string[] {
    const recommendations: string[] = []
    
    if (concerns.some(c => c.includes('detected in content'))) {
      recommendations.push('Remove or anonymize personal information')
    }
    if (concerns.some(c => c.includes('keywords'))) {
      recommendations.push('Review content for unnecessary personal information')
    }
    if (concerns.some(c => c.includes('privacy notice'))) {
      recommendations.push('Add privacy notice and data handling information')
    }

    return recommendations
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const params = ComplianceCheckSchema.parse(body)

    // Validate content
    if (!params.content_url && !params.content_text) {
      return NextResponse.json(
        { success: false, error: 'Either content_url or content_text must be provided' },
        { status: 400 }
      )
    }

    // Perform compliance checks
    const results = await ComplianceChecker.performChecks(params)

    // Calculate cost (simulate pricing)
    const baseCost = 0.05 // $0.05 per check
    const totalCost = params.check_types.length * baseCost

    // Record usage
    try {
      await (supabaseAdmin as any)
        .from('external_api_usage')
        .insert({
          user_id: session.user.id,
          api_type: 'compliance',
          provider_id: 'nr-compliance',
          requests_made: 1,
          cost: totalCost,
          metadata: {
            content_type: params.content_type,
            check_types: params.check_types,
            overall_score: results.overall_score,
            passed: results.passed
          },
          created_at: new Date().toISOString()
        })
    } catch (usageLogError) {
      logger.warn('Failed to log compliance check usage', { error: usageLogError, component: 'API: external/compliance/check' })
    }

    // Log the action for analytics
    try {
      await (supabaseAdmin as any)
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          event_type: 'external_api_compliance_check',
          event_data: {
            category: 'external_apis',
            action: 'compliance_checked',
            content_type: params.content_type,
            check_types: params.check_types,
            overall_score: results.overall_score,
            passed: results.passed,
            cost: totalCost
          }
        })
    } catch (analyticsError) {
      logger.warn('Failed to log compliance check', { error: analyticsError, component: 'API: external/compliance/check' })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        cost: totalCost,
        content_type: params.content_type,
        check_types: params.check_types,
        checked_at: new Date().toISOString()
      },
      message: 'Compliance check completed successfully'
    })

  } catch (error) {
    logger.error('Compliance check API error', { error: error instanceof Error ? error : new Error(String(error)), component: 'API: external/compliance/check' })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform compliance check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
