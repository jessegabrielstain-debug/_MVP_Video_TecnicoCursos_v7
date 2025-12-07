import { NextResponse } from 'next/server';

export async function GET() {
  const models = [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      type: 'text',
      capabilities: ['text-generation', 'reasoning', 'coding'],
      maxTokens: 128000,
      costPerToken: 0.00001,
      isAvailable: true,
      description: 'Most capable model for complex tasks'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      type: 'text',
      capabilities: ['text-generation', 'chat'],
      maxTokens: 16000,
      costPerToken: 0.000001,
      isAvailable: true,
      description: 'Fast and cost-effective for simple tasks'
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      type: 'text',
      capabilities: ['text-generation', 'reasoning', 'analysis'],
      maxTokens: 200000,
      costPerToken: 0.000015,
      isAvailable: true,
      description: 'High intelligence and reasoning'
    }
  ];

  return NextResponse.json(models);
}
