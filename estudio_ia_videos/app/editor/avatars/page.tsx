'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Video, Mic, User, Play, CheckCircle, AlertCircle, Volume2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AvatarStudioPage() {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM'); // Default Rachel
  const [avatarId, setAvatarId] = useState('matt'); // Default D-ID avatar
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const avatarMap: Record<string, string> = {
    matt: "https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg",
    amy: "https://img.freepik.com/free-photo/portrait-young-woman-with-natural-make-up_23-2149084945.jpg",
    jack: "https://img.freepik.com/free-photo/handsome-confident-smiling-man-with-hands-crossed-chest_176420-18743.jpg"
  };

  const handlePreviewAudio = async () => {
    if (!text) return;
    
    setIsPlayingAudio(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tts/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId })
      });

      if (!response.ok) throw new Error('Falha ao gerar áudio');

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setError('Erro ao reproduzir áudio');
      };
      
      await audio.play();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsPlayingAudio(false);
    }
  };

  const handleGenerate = async () => {
    if (!text) return;

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setStatus('Iniciando processo...');

    try {
      // 1. Call Lip Sync API
      setStatus('Gerando áudio e vídeo (isso pode levar alguns minutos)...');
      const response = await fetch('/api/lip-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
          avatarImageUrl: avatarMap[avatarId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na geração do vídeo');
      }

      const data = await response.json();
      
      if (data.url) {
        setVideoUrl(data.url);
        setStatus('Concluído!');
      } else {
        throw new Error('URL do vídeo não retornada');
      }

    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message || 'Ocorreu um erro inesperado');
      setStatus('Erro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Avatar Studio (Real)</h1>
          <p className="text-slate-600">Geração de vídeo com Avatar Falante usando ElevenLabs e D-ID</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Configuração
              </CardTitle>
              <CardDescription>Personalize seu avatar e mensagem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Avatar (D-ID)</Label>
                <Select value={avatarId} onValueChange={setAvatarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um avatar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matt">Matt (Padrão)</SelectItem>
                    <SelectItem value="amy">Amy</SelectItem>
                    <SelectItem value="jack">Jack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voz (ElevenLabs)</Label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Americana)</SelectItem>
                    <SelectItem value="AZnzlk1XvdvUeBnXmlld">Domi (Americana)</SelectItem>
                    <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella (Americana)</SelectItem>
                    <SelectItem value="ErXwobaYiN019PkySvjV">Antoni (Americano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Texto para Fala</Label>
                <Textarea 
                  placeholder="Digite o texto que o avatar deve falar..." 
                  className="h-32 resize-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <p className="text-xs text-slate-500 text-right">
                  {text.length} caracteres
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={handlePreviewAudio}
                  disabled={isLoading || isPlayingAudio || !text}
                >
                  {isPlayingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ouvindo...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Ouvir Voz
                    </>
                  )}
                </Button>

                <Button 
                  className="flex-[2]" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isLoading || !text}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Gerar Vídeo
                    </>
                  )}
                </Button>
              </div>

              {status && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-slate-100 p-2 rounded">
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {status}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Resultado
              </CardTitle>
              <CardDescription>Visualize o vídeo gerado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center bg-slate-900 rounded-b-lg min-h-[300px] p-0 overflow-hidden relative">
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                />
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-2">
                  <Video className="w-12 h-12 opacity-20" />
                  <p>O vídeo aparecerá aqui</p>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
