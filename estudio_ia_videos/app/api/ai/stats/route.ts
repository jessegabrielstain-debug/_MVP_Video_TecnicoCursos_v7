import { NextResponse } from 'next/server';

export async function GET() {
  const stats = {
    totalRequests: 1250,
    totalTokensUsed: 5000000,
    totalCost: 15.50,
    requestsByType: {
      text: 1000,
      image: 200,
      audio: 50
    },
    requestsByModel: {
      'gpt-4-turbo': 800,
      'gpt-3.5-turbo': 450
    },
    averageResponseTime: 1.2,
    successRate: 99.5,
    costByDay: [
      { date: '2023-10-01', cost: 2.50 },
      { date: '2023-10-02', cost: 3.00 },
      { date: '2023-10-03', cost: 1.50 },
      { date: '2023-10-04', cost: 4.00 },
      { date: '2023-10-05', cost: 4.50 }
    ],
    popularFeatures: [
      { feature: 'Content Generation', usage: 800 },
      { feature: 'Summarization', usage: 300 },
      { feature: 'Translation', usage: 150 }
    ],
    userSatisfaction: 4.8
  };

  return NextResponse.json(stats);
}
