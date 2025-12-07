
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, Volume2, VolumeX, Mic, MicOff,
  Activity, Zap, Target, TrendingUp,
  Upload, Download, Settings, RefreshCw,
  CheckCircle, AlertCircle, Clock, Sparkles, Plus
} from 'lucide-react';

interface AudioTrack {
  id: string;
  name: string;
  type: 'narration' | 'music' | 'sfx' | 'original';
  file: string;
  duration: number;
  volume: number;
  muted: boolean;
  waveformData: number[];
  syncStatus: 'synced' | 'syncing' | 'needs-sync' | 'error';
  confidenceScore: number;
}

interface SyncPoint {
  id: string;
  audioTime: number;
  videoTime: number;
  confidence: number;
  type: 'speech' | 'music' | 'manual';
  description: string;
}

interface AIAnalysis {
  speechDetection: {
    segments: { start: number; end: number; text: string; confidence: number }[];
    totalSpeechTime: number;
    silenceRatio: number;
  };
  musicAnalysis: {
    tempo: number;
    key: string;
    energy: number;
    mood: string;
  };
  recommendations: string[];
}

const AudioSyncIASystem = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tracks' | 'analysis' | 'sync'>('tracks');

  const audioContextRef = useRef<AudioContext | null>(null);

  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([
    {
      id: 'narration-1',
      name: 'Narração Principal - NR-10',
      type: 'narration',
      file: 'narration-nr10.mp3',
      duration: 180,
      volume: 85,
      muted: false,
      waveformData: Array.from({ length: 1800 }, () => Math.random() * 100),
      syncStatus: 'synced',
      confidenceScore: 94.2
    },
    {
      id: 'music-1',
      name: 'Trilha Sonora Corporativa',
      type: 'music',
      file: 'corporate-music.mp3',
      duration: 200,
      volume: 35,
      muted: false,
      waveformData: Array.from({ length: 2000 }, () => Math.random() * 60),
      syncStatus: 'synced',
      confidenceScore: 87.5
    },
    {
      id: 'sfx-1',
      name: 'Efeitos Sonoros - Alertas',
      type: 'sfx',
      file: 'alert-sounds.mp3',
      duration: 150,
      volume: 70,
      muted: false,
      waveformData: Array.from({ length: 1500 }, () => Math.random() * 80),
      syncStatus: 'needs-sync',
      confidenceScore: 62.8
    }
  ]);

  const [syncPoints, setSyncPoints] = useState<SyncPoint[]>([
    {
      id: 'sync-1',
      audioTime: 5.2,
      videoTime: 5.5,
      confidence: 0.94,
      type: 'speech',
      description: 'Início da apresentação'
    },
    {
      id: 'sync-2',
      audioTime: 45.8,
      videoTime: 46.1,
      confidence: 0.89,
      type: 'speech',
      description: 'Explicação sobre EPIs'
    },
    {
      id: 'sync-3',
      audioTime: 120.5,
      videoTime: 120.0,
      confidence: 0.76,
      type: 'manual',
      description: 'Transição de slide'
    }
  ]);

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({
    speechDetection: {
      segments: [
        { start: 0, end: 15.5, text: "Bem-vindos ao treinamento de Norma Regulamentadora 10", confidence: 0.95 },
        { start: 20.2, end: 45.8, text: "A segurança em instalações elétricas é fundamental", confidence: 0.92 },
        { start: 50.1, end: 85.6, text: "Os equipamentos de proteção individual devem ser utilizados", confidence: 0.88 }
      ],
      totalSpeechTime: 150.2,
      silenceRatio: 0.15
    },
    musicAnalysis: {
      tempo: 120,
      key: 'C Major',
      energy: 0.6,
      mood: 'Professional'
    },
    recommendations: [
      'Ajustar volume da trilha sonora durante a fala',
      'Adicionar fade-in/fade-out nos pontos de transição',
      'Sincronizar efeitos sonoros com elementos visuais',
      'Melhorar clareza da narração com redução de ruído'
    ]
  });

  // Audio Controls
  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    setCurrentTime(value[0]);
  }, []);

  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    setAudioTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, volume } : track
    ));
  }, []);

  const toggleTrackMute = useCallback((trackId: string) => {
    setAudioTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  }, []);

  // AI-Powered Features
  const analyzeAudioIA = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simular processo de análise IA
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAnalysisProgress(i);
    }

    setIsAnalyzing(false);
    console.log('🤖 Análise de áudio IA concluída!');
  }, []);

  const autoSyncTracks = useCallback(async () => {
    console.log('🎯 Sincronizando tracks automaticamente com IA...');
    
    // Simular processo de sincronização automática
    setAudioTracks(prev => prev.map(track => ({
      ...track,
      syncStatus: 'syncing' as const
    })));

    setTimeout(() => {
      setAudioTracks(prev => prev.map(track => ({
        ...track,
        syncStatus: 'synced' as const,
        confidenceScore: Math.min(95, track.confidenceScore + Math.random() * 10)
      })));
    }, 3000);
  }, []);

  const optimizeAudioLevels = useCallback(() => {
    console.log('📊 Otimizando níveis de áudio com IA...');
    
    // Simular otimização automática de volumes
    setAudioTracks(prev => prev.map(track => {
      let optimalVolume = track.volume;
      
      switch (track.type) {
        case 'narration':
          optimalVolume = 85; // Prioridade máxima para narração
          break;
        case 'music':
          optimalVolume = 25; // Volume baixo durante fala
          break;
        case 'sfx':
          optimalVolume = 60; // Médio para efeitos
          break;
      }
      
      return { ...track, volume: optimalVolume };
    }));
  }, []);

  const detectSpeechPauses = useCallback(() => {
    console.log('🎤 Detectando pausas na fala com IA...');
    // Implementação de detecção de pausas na fala
  }, []);

  // Render waveform
  const renderWaveform = (waveformData: number[], trackColor: string) => {
    const width = 600;
    const height = 60;
    const barWidth = width / waveformData.length;

    return (
      <svg width={width} height={height} className="bg-gray-800 rounded">
        {waveformData.map((amplitude, index) => (
          <rect
            key={index}
            x={index * barWidth}
            y={height - (amplitude / 100) * height}
            width={Math.max(1, barWidth - 0.5)}
            height={(amplitude / 100) * height}
            fill={trackColor}
            opacity={0.8}
          />
        ))}
        
        {/* Playhead */}
        <line
          x1={(currentTime / 180) * width}
          y1={0}
          x2={(currentTime / 180) * width}
          y2={height}
          stroke="#ef4444"
          strokeWidth={2}
        />
        
        {/* Sync points */}
        {syncPoints.map(point => (
          <circle
            key={point.id}
            cx={(point.audioTime / 180) * width}
            cy={height / 2}
            r={3}
            fill="#10b981"
            opacity={point.confidence}
          />
        ))}
      </svg>
    );
  };

  const getSyncStatusColor = (status: AudioTrack['syncStatus']) => {
    switch (status) {
      case 'synced': return 'text-green-400';
      case 'syncing': return 'text-yellow-400';
      case 'needs-sync': return 'text-orange-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusIcon = (status: AudioTrack['syncStatus']) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'needs-sync': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-400">🎵 Audio Sync IA System</h2>
          <Badge variant="outline" className="border-blue-400 text-blue-400">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={analyzeAudioIA}
            disabled={isAnalyzing}
            className="text-purple-400 hover:text-purple-300"
          >
            <Target className="w-4 h-4 mr-1" />
            Analisar IA
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={autoSyncTracks}
            className="text-green-400 hover:text-green-300"
          >
            <Zap className="w-4 h-4 mr-1" />
            Auto Sync
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={optimizeAudioLevels}
            className="text-yellow-400 hover:text-yellow-300"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Otimizar
          </Button>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Button
            variant={isPlaying ? "default" : "secondary"}
            size="sm"
            onClick={handlePlay}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMasterMuted(!isMasterMuted)}
            >
              {isMasterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[isMasterMuted ? 0 : masterVolume]}
              onValueChange={(value) => setMasterVolume(value[0])}
              max={100}
              step={1}
              className="w-24"
            />
            <span className="text-xs w-8">{isMasterMuted ? 0 : masterVolume}%</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono">
            {currentTime.toFixed(1)}s / 180.0s
          </span>
          
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={180}
            step={0.1}
            className="w-64"
          />
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Analisando áudio com IA...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="tracks" className="flex-1">Audio Tracks</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">IA Analysis</TabsTrigger>
            <TabsTrigger value="sync" className="flex-1">Sync Points</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracks" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {audioTracks.map((track) => (
                <Card key={track.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {track.type === 'narration' && <Mic className="w-4 h-4 text-blue-400" />}
                        {track.type === 'music' && <Volume2 className="w-4 h-4 text-green-400" />}
                        {track.type === 'sfx' && <Activity className="w-4 h-4 text-purple-400" />}
                        {track.name}
                      </CardTitle>
                      
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 text-xs ${getSyncStatusColor(track.syncStatus)}`}>
                          {getSyncStatusIcon(track.syncStatus)}
                          {track.syncStatus}
                        </div>
                        
                        <Badge variant="outline" className="text-xs">
                          {track.confidenceScore.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Waveform */}
                    <div className="overflow-x-auto">
                      {renderWaveform(track.waveformData, track.type === 'narration' ? '#3b82f6' : track.type === 'music' ? '#10b981' : '#8b5cf6')}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTrackMute(track.id)}
                      >
                        {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs">Volume:</span>
                        <Slider
                          value={[track.muted ? 0 : track.volume]}
                          onValueChange={(value) => updateTrackVolume(track.id, value[0])}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs w-8">{track.muted ? 0 : track.volume}%</span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {track.duration}s
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Speech Analysis */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-blue-400" />
                    Speech Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Speech:</span>
                      <span className="ml-2 font-medium">{aiAnalysis.speechDetection.totalSpeechTime}s</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Silence Ratio:</span>
                      <span className="ml-2 font-medium">{(aiAnalysis.speechDetection.silenceRatio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300">Speech Segments:</h4>
                    {aiAnalysis.speechDetection.segments.map((segment, index) => (
                      <div key={index} className="bg-gray-700 p-2 rounded text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-blue-400">
                            {segment.start}s - {segment.end}s
                          </span>
                          <span className="text-green-400">
                            {(segment.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-gray-300">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Music Analysis */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-green-400" />
                    Music Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Tempo:</span>
                      <span className="ml-2 font-medium">{aiAnalysis.musicAnalysis.tempo} BPM</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Key:</span>
                      <span className="ml-2 font-medium">{aiAnalysis.musicAnalysis.key}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Energy:</span>
                      <span className="ml-2 font-medium">{(aiAnalysis.musicAnalysis.energy * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Mood:</span>
                      <span className="ml-2 font-medium">{aiAnalysis.musicAnalysis.mood}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    IA Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-300 flex-1">{recommendation}</p>
                        <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                          Apply
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sync" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sync Points</h3>
                <Button
                  size="sm"
                  onClick={detectSpeechPauses}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Detect Pauses
                </Button>
              </div>

              {syncPoints.map((point) => (
                <Card key={point.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="font-medium">{point.description}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {point.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-400">
                          {(point.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Audio Time:</span>
                        <span className="ml-2 font-medium">{point.audioTime}s</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Video Time:</span>
                        <span className="ml-2 font-medium">{point.videoTime}s</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-400">
                        Adjust
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400">
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AudioSyncIASystem;
