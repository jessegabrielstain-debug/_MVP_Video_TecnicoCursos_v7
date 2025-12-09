/**
 * 🗣️ Estúdio IA de Vídeos - Sprint 5
 * Studio de Clonagem de Voz
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { logger } from '@/lib/logger';
import {
  Upload,
  Mic,
  Play,
  Pause,
  Square,
  Download,
  Settings,
  Volume2,
  Zap,
  Heart,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

interface VoiceCloningStudioProps {
  onVoiceCreated?: (voiceId: string) => void;
}

const trainingStatuses = ['pending', 'training', 'ready', 'failed'] as const;
type TrainingStatus = typeof trainingStatuses[number];

const isTrainingStatus = (value: string): value is TrainingStatus =>
  trainingStatuses.some((status) => status === value);

const statusConfig: Record<TrainingStatus, { variant: BadgeProps['variant']; icon: string; text: string }> = {
  pending: { variant: 'secondary', icon: '⏳', text: 'Aguardando' },
  training: { variant: 'default', icon: '🧠', text: 'Treinando' },
  ready: { variant: 'default', icon: '✅', text: 'Pronto' },
  failed: { variant: 'destructive', icon: '❌', text: 'Falhou' }
};

interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  gender: string;
  language: string;
  training: {
    trainingStatus: TrainingStatus;
    similarity: number;
    quality: number;
    samplesProvided: number;
    samplesRequired: number;
  };
  characteristics: {
    emotion: string;
    clarity: number;
    naturalness: number;
  };
}

export default function VoiceCloningStudio({ onVoiceCreated }: VoiceCloningStudioProps) {
  const [currentTab, setCurrentTab] = useState('create');
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [testText, setTestText] = useState('Olá! Esta é uma demonstração da minha voz clonada usando inteligência artificial avançada.');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Configurações de voz
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: [1.0],
    speed: [1.0],
    emotion: 'neutral'
  });

  useEffect(() => {
    loadVoiceProfiles();
  }, []);

  const loadVoiceProfiles = async () => {
    try {
      const response = await fetch('/api/voice-cloning/profiles');
      const data = await response.json();
      setVoiceProfiles(data);
    } catch (error) {
      logger.error('Erro ao carregar perfis', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio' });
      // Mock data para demonstração
      setVoiceProfiles([
        {
          id: 'voice-1',
          name: 'Instrutor João',
          description: 'Voz autoritativa para treinamentos de segurança',
          gender: 'male',
          language: 'pt-BR',
          training: { trainingStatus: 'ready', similarity: 0.89, quality: 0.92, samplesProvided: 12, samplesRequired: 20 },
          characteristics: { emotion: 'authoritative', clarity: 0.95, naturalness: 0.88 }
        },
        {
          id: 'voice-2',
          name: 'Professora Maria',
          description: 'Voz amigável e clara para explicações',
          gender: 'female',
          language: 'pt-BR',
          training: { trainingStatus: 'training', similarity: 0.75, quality: 0.80, samplesProvided: 8, samplesRequired: 20 },
          characteristics: { emotion: 'friendly', clarity: 0.90, naturalness: 0.85 }
        }
      ]);
    }
  };

  const handleCreateNewProfile = async () => {
    const profileData = {
      name: 'Nova Voz',
      description: 'Perfil de voz personalizado',
      language: 'pt-BR',
      gender: 'neutral' as const
    };

    try {
      const response = await fetch('/api/voice-cloning/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        const newProfile = await response.json();
        setVoiceProfiles([newProfile, ...voiceProfiles]);
        setSelectedProfile(newProfile);
        setCurrentTab('train');
      }
    } catch (error) {
      logger.error('Erro ao criar perfil', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio' });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProfile) return;

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('voiceProfileId', selectedProfile.id);
    formData.append('transcription', 'Texto da transcrição...');

    try {
      const response = await fetch('/api/voice-cloning/samples', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        logger.info('Amostra enviada com sucesso', { component: 'VoiceCloningStudio', profileId: selectedProfile.id });
        loadVoiceProfiles(); // Recarrega para atualizar progresso
      }
    } catch (error) {
      logger.error('Erro ao enviar amostra', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio' });
    }
  };

  const handleGenerateVoice = async () => {
    if (!selectedProfile || !testText) return;

    setGenerationProgress(0);
    
    try {
      const response = await fetch('/api/voice-cloning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceProfileId: selectedProfile.id,
          text: testText,
          settings: {
            pitch: voiceSettings.pitch[0],
            speed: voiceSettings.speed[0],
            emotion: voiceSettings.emotion
          }
        })
      });

      if (response.ok) {
        const job = await response.json();
        
        // Simula progresso
        const progressInterval = setInterval(() => {
          setGenerationProgress(prev => {
            const newProgress = prev + Math.random() * 15;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return newProgress;
          });
        }, 300);
        
        setTimeout(() => {
          clearInterval(progressInterval);
          setGenerationProgress(100);
        }, 3000);
      }
    } catch (error) {
      logger.error('Erro ao gerar voz', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio', profileId: selectedProfile?.id });
    }
  };

  const getTrainingStatusBadge = (status: string) => {
    const config = isTrainingStatus(status) ? statusConfig[status] : statusConfig.pending;
    return (
      <Badge variant={config.variant}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗣️ Voice Cloning Studio
          </h1>
          <p className="text-gray-600 text-lg">
            Clone e personalize vozes com IA avançada para seus treinamentos
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">🆕 Criar</TabsTrigger>
            <TabsTrigger value="train">🎓 Treinar</TabsTrigger>
            <TabsTrigger value="generate">🎵 Gerar</TabsTrigger>
            <TabsTrigger value="library">📚 Biblioteca</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🆕 Criar Novo Perfil de Voz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome da Voz</label>
                      <Input placeholder="Ex: Instrutor Carlos" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição</label>
                      <Textarea 
                        placeholder="Descreva as características desta voz..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Gênero</label>
                        <select className="w-full px-3 py-2 border rounded-md">
                          <option value="male">👨 Masculino</option>
                          <option value="female">👩 Feminino</option>
                          <option value="neutral">⚪ Neutro</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Faixa Etária</label>
                        <select className="w-full px-3 py-2 border rounded-md">
                          <option value="young">👶 Jovem (18-30)</option>
                          <option value="adult">👨‍💼 Adulto (30-50)</option>
                          <option value="mature">👨‍🦳 Maduro (50+)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Estilo de Voz</label>
                      <select className="w-full px-3 py-2 border rounded-md">
                        <option value="neutral">😐 Neutro</option>
                        <option value="energetic">⚡ Energético</option>
                        <option value="calm">😌 Calmo</option>
                        <option value="authoritative">👑 Autoritativo</option>
                        <option value="friendly">😊 Amigável</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tags</label>
                      <Input placeholder="segurança, treinamento, corporativo" />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="public" />
                      <label htmlFor="public" className="text-sm">
                        Tornar público na biblioteca
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button onClick={handleCreateNewProfile} className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Criar Perfil de Voz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="train" className="space-y-6">
            {selectedProfile ? (
              <>
                {/* Training Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>🎓 Treinamento: {selectedProfile.name}</span>
                      {getTrainingStatusBadge(selectedProfile.training.trainingStatus)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedProfile.training.samplesProvided}/{selectedProfile.training.samplesRequired}
                        </div>
                        <p className="text-sm text-gray-600">Amostras Fornecidas</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(selectedProfile.training.similarity * 100).toFixed(0)}%
                        </div>
                        <p className="text-sm text-gray-600">Similaridade</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {(selectedProfile.training.quality * 100).toFixed(0)}%
                        </div>
                        <p className="text-sm text-gray-600">Qualidade</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Progresso do Treinamento</label>
                      <Progress 
                        value={(selectedProfile.training.samplesProvided / selectedProfile.training.samplesRequired) * 100} 
                        className="h-3"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Samples */}
                <Card>
                  <CardHeader>
                    <CardTitle>📤 Adicionar Amostras de Áudio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Upload de Arquivo de Áudio</h3>
                      <p className="text-gray-600 mb-4">
                        Formatos aceitos: MP3, WAV, M4A (máx. 10MB por arquivo)
                      </p>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivo
                      </Button>
                    </div>

                    <div className="text-center">
                      <div className="text-gray-400 mb-4">ou</div>
                      
                      <div className="space-y-4">
                        <Button 
                          onClick={() => setIsRecording(!isRecording)}
                          variant={isRecording ? "destructive" : "default"}
                          size="lg"
                        >
                          {isRecording ? (
                            <>
                              <Square className="h-5 w-5 mr-2" />
                              Parar Gravação
                            </>
                          ) : (
                            <>
                              <Mic className="h-5 w-5 mr-2" />
                              Gravar Agora
                            </>
                          )}
                        </Button>
                        
                        {isRecording && (
                          <div className="flex items-center justify-center space-x-2 text-red-600">
                            <div className="animate-pulse h-3 w-3 bg-red-600 rounded-full"></div>
                            <span className="text-sm font-medium">Gravando...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Training Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas para Melhor Qualidade</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Grave em ambiente silencioso sem eco</li>
                        <li>• Use frases variadas com diferentes entonações</li>
                        <li>• Mantenha qualidade de áudio consistente</li>
                        <li>• Cada amostra deve ter 10-30 segundos</li>
                        <li>• Fale de forma natural e expressiva</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhum Perfil Selecionado
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Crie um novo perfil ou selecione um existente para começar o treinamento
                    </p>
                    <Button onClick={handleCreateNewProfile}>
                      Criar Primeiro Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {selectedProfile?.training.trainingStatus === 'ready' ? (
              <>
                {/* Voice Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle>🎵 Geração de Voz - {selectedProfile.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto para Síntese</label>
                      <Textarea
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        placeholder="Digite o texto que deseja converter em áudio..."
                        rows={4}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Duração estimada: ~{Math.ceil(testText.split(' ').length / 2.5)} segundos
                      </p>
                    </div>

                    {/* Voice Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Tom da Voz</label>
                          <Slider
                            value={voiceSettings.pitch}
                            onValueChange={(value) => setVoiceSettings({...voiceSettings, pitch: value})}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Grave</span>
                            <span>{voiceSettings.pitch[0].toFixed(1)}x</span>
                            <span>Agudo</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Velocidade</label>
                          <Slider
                            value={voiceSettings.speed}
                            onValueChange={(value) => setVoiceSettings({...voiceSettings, speed: value})}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Lento</span>
                            <span>{voiceSettings.speed[0].toFixed(1)}x</span>
                            <span>Rápido</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Emoção</label>
                          <select 
                            value={voiceSettings.emotion}
                            onChange={(e) => setVoiceSettings({...voiceSettings, emotion: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="neutral">😐 Neutro</option>
                            <option value="energetic">⚡ Energético</option>
                            <option value="calm">😌 Calmo</option>
                            <option value="authoritative">👑 Autoritativo</option>
                            <option value="friendly">😊 Amigável</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Características</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Clareza: {(selectedProfile.characteristics.clarity * 100).toFixed(0)}%</div>
                            <div>Naturalidade: {(selectedProfile.characteristics.naturalness * 100).toFixed(0)}%</div>
                            <div>Similaridade: {(selectedProfile.training.similarity * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Generation Progress */}
                    {generationProgress > 0 && generationProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Gerando áudio...</span>
                          <span className="text-sm text-gray-600">{generationProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={generationProgress} className="h-2" />
                      </div>
                    )}

                    {/* Audio Player */}
                    {generationProgress === 100 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-green-800">✅ Áudio Gerado com Sucesso!</h4>
                          <Badge variant="default">Alta Qualidade</Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Button
                            onClick={() => setIsPlaying(!isPlaying)}
                            variant="outline"
                            size="sm"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full w-1/3"></div>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerateVoice}
                      disabled={!testText.trim() || generationProgress > 0}
                      className="w-full"
                      size="lg"
                    >
                      {generationProgress > 0 ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          Gerando... {generationProgress.toFixed(0)}%
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 mr-2" />
                          Gerar Áudio com IA
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Voz Não Está Pronta
                    </h3>
                    <p className="text-gray-500">
                      Complete o treinamento do perfil antes de gerar áudios
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            {/* Voice Library */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voiceProfiles.map((voice) => (
                <Card 
                  key={voice.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedProfile?.id === voice.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedProfile(voice)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>{voice.gender === 'male' ? '👨' : voice.gender === 'female' ? '👩' : '⚪'}</span>
                        <span>{voice.name}</span>
                      </span>
                      {getTrainingStatusBadge(voice.training.trainingStatus)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{voice.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Emoção:</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {voice.characteristics.emotion}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Idioma:</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {voice.language}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Clareza:</span>
                        <span>{(voice.characteristics.clarity * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={voice.characteristics.clarity * 100} className="h-1" />
                      
                      <div className="flex justify-between text-xs">
                        <span>Naturalidade:</span>
                        <span>{(voice.characteristics.naturalness * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={voice.characteristics.naturalness * 100} className="h-1" />
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Play className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Ajustar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Voice Card */}
              <Card 
                className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={handleCreateNewProfile}
              >
                <CardContent className="flex items-center justify-center h-full py-12">
                  <div className="text-center">
                    <div className="text-4xl mb-3">➕</div>
                    <h3 className="font-semibold text-gray-700 mb-1">Nova Voz</h3>
                    <p className="text-sm text-gray-500">Criar perfil personalizado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
