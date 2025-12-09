
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  Volume2,
  Wand2,
  Settings,
  Heart,
  Zap,
  Globe,
  Star,
  Copy,
  Save,
  RotateCcw
} from 'lucide-react';

// Dados das vozes premium
const elevenLabsVoices = [
  { 
    id: 'rachel', 
    name: 'Rachel', 
    language: 'pt-BR', 
    gender: 'Feminina', 
    age: 'Adulta',
    accent: 'Brasileira',
    description: 'Voz profissional e confiável, ideal para treinamentos corporativos',
    category: 'Professional',
    rating: 4.9,
    samples: 3421,
    premium: true
  },
  { 
    id: 'daniel', 
    name: 'Daniel', 
    language: 'pt-BR', 
    gender: 'Masculina', 
    age: 'Adulta',
    accent: 'Brasileira',
    description: 'Tom masculino e autoritativo, perfeito para instruções de segurança',
    category: 'Authority',
    rating: 4.8,
    samples: 2987,
    premium: true
  },
  { 
    id: 'maria', 
    name: 'Maria', 
    language: 'pt-BR', 
    gender: 'Feminina', 
    age: 'Jovem',
    accent: 'Brasileira',
    description: 'Voz jovem e envolvente, ótima para conteúdo educacional',
    category: 'Educational',
    rating: 4.7,
    samples: 4126,
    premium: false
  },
  { 
    id: 'carlos', 
    name: 'Carlos', 
    language: 'pt-BR', 
    gender: 'Masculina', 
    age: 'Madura',
    accent: 'Brasileira',
    description: 'Experiência e credibilidade, ideal para supervisores e gestores',
    category: 'Executive',
    rating: 4.9,
    samples: 1876,
    premium: true
  }
];

const emotionControls = [
  { key: 'happiness', label: 'Alegria', emoji: '😊', range: [0, 100] },
  { key: 'sadness', label: 'Seriedade', emoji: '😐', range: [0, 100] },
  { key: 'anger', label: 'Urgência', emoji: '⚠️', range: [0, 100] },
  { key: 'fear', label: 'Cautela', emoji: '😨', range: [0, 100] },
  { key: 'surprise', label: 'Entusiasmo', emoji: '😲', range: [0, 100] },
  { key: 'disgust', label: 'Desaprovação', emoji: '😤', range: [0, 100] }
];

const ProfessionalVoiceCloningStudio: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<string>('rachel');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloningProgress, setCloningProgress] = useState(0);
  const [textToSpeak, setTextToSpeak] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Controles avançados
  const [pitch, setPitch] = useState([50]);
  const [speed, setSpeed] = useState([50]);
  const [volume, setVolume] = useState([80]);
  const [stability, setStability] = useState([75]);
  const [clarity, setClarity] = useState([70]);
  
  // Controles de emoção
  const [emotions, setEmotions] = useState<{ [key: string]: number }>({
    happiness: 20,
    sadness: 60,
    anger: 10,
    fear: 15,
    surprise: 25,
    disgust: 5
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Função para simular clonagem de voz
  const simulateVoiceCloning = async () => {
    setCloningProgress(0);
    const interval = setInterval(() => {
      setCloningProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  // Função para gerar áudio
  const generateAudio = async () => {
    if (!textToSpeak.trim()) return;
    
    try {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Simula URL do áudio gerado
            setAudioUrl('/api/placeholder-audio.mp3');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } catch (error) {
      logger.error('Erro ao gerar áudio', error instanceof Error ? error : new Error(String(error)), { component: 'ProfessionalVoiceCloningStudio' });
    }
  };

  // Controle de gravação
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            const audioBlob = new Blob([event.data], { type: 'audio/wav' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        
        // Timer de gravação
        const timer = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        setTimeout(() => {
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timer);
          }
        }, 30000); // Máximo 30 segundos
        
      } catch (error) {
        logger.error('Erro ao acessar microfone', error instanceof Error ? error : new Error(String(error)), { component: 'ProfessionalVoiceCloningStudio' });
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Função para reproduzir áudio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const selectedVoiceData = elevenLabsVoices.find(v => v.id === selectedVoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎙️ Voice Cloning Studio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tecnologia avançada de clonagem de voz com ElevenLabs. 
            Crie vozes personalizadas para seus treinamentos de segurança do trabalho.
          </p>
          <div className="flex justify-center space-x-4 mt-6">
            <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
              29 Vozes Premium
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
              8 Idiomas
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
              Controle Emocional
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Painel Principal */}
          <div className="xl:col-span-2">
            <Tabs defaultValue="voices" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="voices">Vozes</TabsTrigger>
                <TabsTrigger value="clone">Clonar</TabsTrigger>
                <TabsTrigger value="generate">Gerar</TabsTrigger>
                <TabsTrigger value="controls">Controles</TabsTrigger>
              </TabsList>

              {/* Tab Vozes */}
              <TabsContent value="voices" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Volume2 className="h-5 w-5 mr-2" />
                      Biblioteca de Vozes ElevenLabs
                    </CardTitle>
                    <CardDescription>
                      Selecione entre 29 vozes premium otimizadas para treinamentos profissionais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {elevenLabsVoices.map((voice) => (
                        <div
                          key={voice.id}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedVoice === voice.id
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedVoice(voice.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{voice.name}</h3>
                              <p className="text-sm text-gray-600">
                                {voice.gender} • {voice.age} • {voice.accent}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {voice.premium && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                                  Premium
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {voice.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">{voice.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">{voice.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {voice.samples.toLocaleString()} samples
                              </span>
                            </div>
                            <Button size="sm" variant="outline">
                              <Play className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Clonagem */}
              <TabsContent value="clone" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Wand2 className="h-5 w-5 mr-2" />
                      Clonagem de Voz Personalizada
                    </CardTitle>
                    <CardDescription>
                      Crie uma voz única para sua empresa com apenas 5 minutos de áudio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Área de Upload */}
                      <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center bg-purple-50/30">
                        <Upload className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Upload Arquivo de Áudio</h3>
                        <p className="text-gray-600 mb-4">
                          Faça upload de um arquivo de áudio de alta qualidade (WAV, MP3)
                          <br />
                          Recomendamos 5-10 minutos de fala limpa para melhores resultados
                        </p>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Arquivo
                        </Button>
                      </div>

                      {/* Gravação de Voz */}
                      <div className="border rounded-xl p-6 bg-white">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Mic className="h-5 w-5 mr-2" />
                          Gravar Voz Diretamente
                        </h3>
                        
                        <div className="flex items-center justify-center space-x-4 mb-6">
                          <Button
                            size="lg"
                            className={`w-16 h-16 rounded-full ${
                              isRecording 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                            onClick={toggleRecording}
                          >
                            {isRecording ? (
                              <Square className="h-6 w-6" />
                            ) : (
                              <Mic className="h-6 w-6" />
                            )}
                          </Button>
                          
                          {isRecording && (
                            <div className="text-center">
                              <div className="text-2xl font-mono font-bold text-red-600">
                                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                              </div>
                              <p className="text-sm text-gray-600">Gravando...</p>
                            </div>
                          )}
                        </div>

                        {audioUrl && (
                          <div className="flex items-center justify-center space-x-4">
                            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                            <Button variant="outline" onClick={togglePlayback}>
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Progress da Clonagem */}
                      {cloningProgress > 0 && (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center mb-4">
                              <h3 className="font-semibold">Processando Clonagem de Voz</h3>
                              <p className="text-sm text-gray-600">IA analisando padrões vocais...</p>
                            </div>
                            <Progress value={cloningProgress} className="h-3" />
                            <p className="text-center text-sm text-gray-600 mt-2">
                              {Math.round(cloningProgress)}% concluído
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        onClick={simulateVoiceCloning}
                        disabled={cloningProgress > 0 && cloningProgress < 100}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Iniciar Clonagem de Voz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Gerar */}
              <TabsContent value="generate" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Gerador de Áudio
                    </CardTitle>
                    <CardDescription>
                      Converta texto em áudio com a voz selecionada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Voz Selecionada */}
                      {selectedVoiceData && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Voz Selecionada:</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{selectedVoiceData.name}</span>
                              <span className="text-gray-600 ml-2">
                                ({selectedVoiceData.gender} • {selectedVoiceData.accent})
                              </span>
                            </div>
                            <Button size="sm" variant="outline">
                              <Settings className="h-3 w-3 mr-1" />
                              Trocar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Texto para Converter */}
                      <div>
                        <Label htmlFor="text-input" className="text-base font-medium mb-2 block">
                          Texto para Conversão
                        </Label>
                        <Textarea
                          id="text-input"
                          placeholder="Digite o texto que deseja converter em áudio. Exemplo:
                          
                          'Bem-vindos ao treinamento de segurança NR-12. Hoje vamos abordar os procedimentos essenciais para operação segura de máquinas e equipamentos. Lembre-se: a segurança é responsabilidade de todos.'"
                          className="min-h-[150px] resize-none"
                          value={textToSpeak}
                          onChange={(e) => setTextToSpeak(e.target.value)}
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          {textToSpeak.length} caracteres • ~{Math.ceil(textToSpeak.length / 200)} minutos de áudio
                        </p>
                      </div>

                      {/* Progress da Geração */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center mb-4">
                              <h3 className="font-semibold">Gerando Áudio</h3>
                              <p className="text-sm text-gray-600">Processando com ElevenLabs...</p>
                            </div>
                            <Progress value={uploadProgress} className="h-3" />
                            <p className="text-center text-sm text-gray-600 mt-2">
                              {uploadProgress}% concluído
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Player de Áudio Gerado */}
                      {audioUrl && uploadProgress === 100 && (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center mb-4">
                              <h3 className="font-semibold text-green-600">✅ Áudio Gerado com Sucesso!</h3>
                              <p className="text-sm text-gray-600">Clique para reproduzir</p>
                            </div>
                            <div className="flex items-center justify-center space-x-4">
                              <Button
                                size="lg"
                                className="w-16 h-16 rounded-full"
                                onClick={togglePlayback}
                              >
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                              </Button>
                              <div className="flex space-x-2">
                                <Button variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button variant="outline">
                                  <Save className="h-4 w-4 mr-2" />
                                  Salvar
                                </Button>
                                <Button variant="outline">
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copiar Link
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={generateAudio}
                        disabled={!textToSpeak.trim() || (uploadProgress > 0 && uploadProgress < 100)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Gerar Áudio com IA
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Controles */}
              <TabsContent value="controls" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Controles Básicos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Controles Básicos</CardTitle>
                      <CardDescription>
                        Ajustes fundamentais de voz
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Tom/Pitch ({pitch[0]}%)
                        </Label>
                        <Slider
                          value={pitch}
                          onValueChange={setPitch}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Velocidade ({speed[0]}%)
                        </Label>
                        <Slider
                          value={speed}
                          onValueChange={setSpeed}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Volume ({volume[0]}%)
                        </Label>
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Estabilidade ({stability[0]}%)
                        </Label>
                        <Slider
                          value={stability}
                          onValueChange={setStability}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Clareza ({clarity[0]}%)
                        </Label>
                        <Slider
                          value={clarity}
                          onValueChange={setClarity}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <Button variant="outline" className="w-full">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar Padrão
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Controles Emocionais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Controles Emocionais</CardTitle>
                      <CardDescription>
                        Ajuste fino de expressividade
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {emotionControls.map((emotion) => (
                        <div key={emotion.key}>
                          <Label className="text-sm font-medium mb-2 block flex items-center">
                            <span className="mr-2">{emotion.emoji}</span>
                            {emotion.label} ({emotions[emotion.key]}%)
                          </Label>
                          <Slider
                            value={[emotions[emotion.key]]}
                            onValueChange={([value]) => 
                              setEmotions(prev => ({ ...prev, [emotion.key]: value }))
                            }
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}

                      <div className="pt-4">
                        <Button variant="outline" className="w-full mb-2">
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Preset
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Heart className="h-4 w-4 mr-2" />
                          Carregar Preset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Painel Lateral */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Áudios Gerados</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tempo Total</span>
                    <span className="font-semibold">34h 12m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vozes Clonadas</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Qualidade Média</span>
                    <span className="font-semibold">97.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Idiomas Suportados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Idiomas Suportados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    'Português (Brasil)',
                    'English (US)',
                    'Español (ES)',
                    'Français (FR)',
                    'Deutsch (DE)',
                    'Italiano (IT)',
                    'Nederlands (NL)',
                    '日本語 (JP)'
                  ].map((lang, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{lang}</span>
                      <Badge variant="outline" className="text-xs">
                        {index === 0 ? 'Principal' : 'Beta'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Zap className="h-4 w-4 mr-2" />
                Teste Premium
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Baixar Todas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalVoiceCloningStudio;
