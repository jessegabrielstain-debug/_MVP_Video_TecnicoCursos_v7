

/**
 * 👄 Lip Sync Controller Component
 * Controle avançado de sincronização labial
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Volume2,
  VolumeX,
  Activity,
  Zap,
  Eye,
  Settings,
  Mic,
  Waves
} from 'lucide-react';

interface LipSyncSession {
  isPlaying?: boolean;
}

interface LipSyncPhoneme {
  phoneme: string;
  intensity: number;
}

interface LipSyncData {
  phonemes: LipSyncPhoneme[];
  currentPhoneme: string;
  intensity: number;
  accuracy: number;
  fps: number;
}

interface AudioAnalysisSnapshot {
  frequency: number;
  amplitude: number;
  pitch: number;
  formants: number[];
}

interface LipSyncControllerProps {
  session?: LipSyncSession;
}

export default function LipSyncController({ session }: LipSyncControllerProps) {
  const [lipSyncData, setLipSyncData] = useState<LipSyncData>({
    phonemes: [],
    currentPhoneme: '',
    intensity: 0,
    accuracy: 0,
    fps: 60
  });

  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisSnapshot>({
    frequency: 0,
    amplitude: 0,
    pitch: 0,
    formants: []
  });

  // Simulação da análise de áudio em tempo real
  useEffect(() => {
    if (session?.isPlaying) {
      const interval = setInterval(() => {
        // Simular dados de sincronização labial
        const phonemes = ['a', 'e', 'i', 'o', 'u', 'b', 'p', 'm', 'f', 'v'];
        const currentPhoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
        const intensity = Math.random() * 100;
        const accuracy = 85 + Math.random() * 15; // Entre 85-100%

        setLipSyncData({
          phonemes: phonemes.map(p => ({ 
            phoneme: p, 
            intensity: Math.random() * 100 
          })),
          currentPhoneme,
          intensity,
          accuracy,
          fps: 60
        });

        // Simular análise de áudio
        setAudioAnalysis({
          frequency: 200 + Math.random() * 800, // 200-1000 Hz
          amplitude: Math.random() * 100,
          pitch: 150 + Math.random() * 200, // 150-350 Hz
          formants: [
            500 + Math.random() * 300,
            1200 + Math.random() * 500,
            2400 + Math.random() * 600
          ]
        });
      }, 50); // 20 FPS

      return () => clearInterval(interval);
    }
  }, [session?.isPlaying]);

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Waves className="h-4 w-4 text-purple-600" />
          <span>Sincronização Labial</span>
          <Badge className="bg-green-100 text-green-800 text-xs">
            {lipSyncData.accuracy.toFixed(1)}% Precisão
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Sincronização */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Fonema Atual:</span>
              <Badge variant="outline" className="text-xs font-mono">
                {lipSyncData.currentPhoneme || '-'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Intensidade:</span>
              <span className="font-medium">{lipSyncData.intensity.toFixed(0)}%</span>
            </div>
            <Progress value={lipSyncData.intensity} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>FPS:</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {lipSyncData.fps}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Frequência:</span>
              <span className="font-medium">{audioAnalysis.frequency.toFixed(0)} Hz</span>
            </div>
            <Progress value={audioAnalysis.frequency / 10} className="h-2" />
          </div>
        </div>

        {/* Phoneme Visualization */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Visemes Ativos:</div>
          <div className="grid grid-cols-5 gap-1">
            {lipSyncData.phonemes.slice(0, 10).map((phoneme, idx) => (
              <div
                key={idx}
                className={`
                  text-center p-2 rounded text-xs font-mono
                  ${phoneme.phoneme === lipSyncData.currentPhoneme 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                {phoneme.phoneme}
              </div>
            ))}
          </div>
        </div>

        {/* Audio Analysis */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Análise de Áudio:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-medium text-blue-800">Amplitude</div>
              <div className="text-blue-600">{audioAnalysis.amplitude.toFixed(1)}%</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="font-medium text-green-800">Pitch</div>
              <div className="text-green-600">{audioAnalysis.pitch.toFixed(0)} Hz</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="font-medium text-purple-800">Formants</div>
              <div className="text-purple-600">{audioAnalysis.formants.length}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1 flex items-center space-x-1">
            <Settings className="h-3 w-3" />
            <span>Calibrar</span>
          </Button>
          <Button size="sm" variant="outline" className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>Debug</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
