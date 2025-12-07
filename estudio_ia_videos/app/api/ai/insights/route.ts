import { NextResponse } from 'next/server';

export async function POST() {
  const insights = [
    {
      id: 'insight-1',
      type: 'content_suggestion',
      title: 'Improve Readability',
      description: 'Your recent content has a high complexity score. Consider using simpler language to reach a wider audience.',
      priority: 'medium',
      category: 'Content Quality',
      data: { complexityScore: 85, targetScore: 60 },
      actionable: true,
      actions: [
        {
          id: 'simplify-text',
          label: 'Simplify Text',
          type: 'auto',
          description: 'Automatically rewrite content for better readability'
        }
      ],
      createdAt: new Date().toISOString(),
      isRead: false,
      isActioned: false
    },
    {
      id: 'insight-2',
      type: 'trend_analysis',
      title: 'Rising Topic: AI Ethics',
      description: 'There is a growing interest in AI Ethics. Consider creating content around this topic.',
      priority: 'high',
      category: 'Trends',
      data: { trendScore: 92, growthRate: 15 },
      actionable: true,
      actions: [
        {
          id: 'generate-outline',
          label: 'Generate Outline',
          type: 'auto',
          description: 'Create a content outline for AI Ethics'
        }
      ],
      createdAt: new Date().toISOString(),
      isRead: false,
      isActioned: false
    }
  ];

  return NextResponse.json(insights);
}
