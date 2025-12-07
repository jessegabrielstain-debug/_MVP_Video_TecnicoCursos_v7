

/**
 * 📊 Voice Analyzer Component
 * Análise avançada de voz em tempo real
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Activity,
  Volume2,
  Brain,
  Zap,
  Mic
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface Session {
  isPlaying: boolean;
  [key: string]: unknown;
}

interface WaveformPoint {
  time: number;
  amplitude: number;
  pitch: number;
}

interface VoiceAnalyzerProps {
  session: Session | null;
}

export default function VoiceAnalyzer({ session }: VoiceAnalyzerProps) {
  const [voiceData, setVoiceData] = useState({
    pitch: 0,
    tone: 'neutro',
    emotion: 'calmo',
    clarity: 0,
    volume: 0,
    speed: 0
  });

  const [waveformData, setWaveformData] = useState<WaveformPoint[]>([]);

  useEffect(() => {
    if (session?.isPlaying) {
      const interval = setInterval(() => {
        // Simular análise de voz em tempo real
        const newData = {
          pitch: 150 + Math.random() * 200,
          tone: ['grave', 'médio', 'agudo'][Math.floor(Math.random() * 3)],
          emotion: ['calmo', 'animado', 'sério', 'amigável'][Math.floor(Math.random() * 4)],
          clarity: 80 + Math.random() * 20,
          volume: Math.random() * 100,
          speed: 120 + Math.random() * 80 // WPM
        };

        setVoiceData(newData);

        // Atualizar dados do gráfico de forma
        setWaveformData(prev => {
          const newPoint = {
            time: Date.now(),
            amplitude: newData.volume,
            pitch: newData.pitch
          };
          return [...prev.slice(-20), newPoint]; // Manter últimos 20 pontos
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [session?.isPlaying]);

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span>Análise de Voz</span>
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Pitch:</span>
              <span className="font-medium">{voiceData.pitch.toFixed(0)} Hz</span>
            </div>
            <Progress value={(voiceData.pitch / 500) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Clareza:</span>
              <span className="font-medium">{voiceData.clarity.toFixed(0)}%</span>
            </div>
            <Progress value={voiceData.clarity} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Volume:</span>
              <span className="font-medium">{voiceData.volume.toFixed(0)}%</span>
            </div>
            <Progress value={voiceData.volume} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Velocidade:</span>
              <span className="font-medium">{voiceData.speed.toFixed(0)} WPM</span>
            </div>
            <Progress value={(voiceData.speed / 200) * 100} className="h-2" />
          </div>
        </div>

        {/* Voice Characteristics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Tom:</span>
            <Badge variant="outline" className="text-xs capitalize">
              {voiceData.tone}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Emoção:</span>
            <Badge variant="outline" className="text-xs capitalize">
              {voiceData.emotion}
            </Badge>
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Forma de Onda:</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waveformData}>
                <XAxis hide />
                <YAxis hide />
                <CartesianGrid strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="amplitude" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Processando em tempo real</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>IA Ativa</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
