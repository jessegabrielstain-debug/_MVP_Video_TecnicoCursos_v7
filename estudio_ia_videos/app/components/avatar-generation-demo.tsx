
'use client';

/**
 * Avatar Generation Demo Component
 * Demonstração do novo sistema REAL de geração de avatares
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, Download } from 'lucide-react';
import { useAvatarGeneration } from '@/hooks/use-avatar-generation';
import { useAvatarsList } from '@/hooks/use-avatars-list';

export function AvatarGenerationDemo() {
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [scriptText, setScriptText] = useState(
    'Olá! Bem-vindo ao treinamento de segurança do trabalho. Hoje vamos aprender sobre as normas regulamentadoras.'
  );
  const [voiceProvider, setVoiceProvider] = useState<'azure' | 'elevenlabs' | 'openai'>('azure');

  const { avatars, loading: loadingAvatars, mode } = useAvatarsList();
  const { generateAvatar, job, isGenerating, error, reset } = useAvatarGeneration();

  const handleGenerate = async () => {
    if (!selectedAvatar || !scriptText) {
      return;
    }

    await generateAvatar({
      avatarId: selectedAvatar,
      scriptText,
      voiceProvider,
    });
  };

  const getStatusBadge = () => {
    if (!job) return null;

    const statusConfig = {
      pending: { label: 'Aguardando', color: 'bg-yellow-500' },
      processing: { label: 'Processando', color: 'bg-blue-500' },
      completed: { label: 'Concluído', color: 'bg-green-500' },
      failed: { label: 'Falhou', color: 'bg-red-500' },
    };

    const config = statusConfig[job.status];

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Geração de Avatar 3D REAL</h1>
        <p className="text-muted-foreground mt-2">
          Sistema 100% funcional usando D-ID API
        </p>
        <Badge variant="outline" className="mt-2">
          Modo: {mode === 'production' ? '✅ Produção (API Real)' : '⚠️ Demo (Mock)'}
        </Badge>
      </div>

      {/* Avatar Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Escolha o Avatar</CardTitle>
          <CardDescription>
            Selecione um avatar da biblioteca D-ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAvatars ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando avatares...</span>
            </div>
          ) : (
            <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um avatar" />
              </SelectTrigger>
              <SelectContent>
                {avatars.map((avatar) => (
                  <SelectItem key={avatar.id} value={avatar.id}>
                    {avatar.name} - {avatar.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Avatar Preview */}
          {selectedAvatar && (
            <div className="mt-4">
              <img
                src={avatars.find(a => a.id === selectedAvatar)?.preview_url}
                alt="Avatar Preview"
                className="w-32 h-32 rounded-lg object-cover border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Input */}
      <Card>
        <CardHeader>
          <CardTitle>2. Escreva o Script</CardTitle>
          <CardDescription>
            Digite o texto que o avatar irá falar (máx. 10.000 caracteres)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="Digite o script aqui..."
            rows={6}
            maxLength={10000}
          />
          <div className="text-sm text-muted-foreground mt-2">
            {scriptText.length} / 10.000 caracteres
          </div>
        </CardContent>
      </Card>

      {/* Voice Provider */}
      <Card>
        <CardHeader>
          <CardTitle>3. Provider de Voz</CardTitle>
          <CardDescription>
            Escolha o provedor de síntese de voz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={voiceProvider} onValueChange={(v) => setVoiceProvider(v as 'azure' | 'elevenlabs' | 'openai')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="azure">Azure TTS (Recomendado)</SelectItem>
              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Card>
        <CardHeader>
          <CardTitle>4. Gerar Vídeo</CardTitle>
          <CardDescription>
            Clique para iniciar a geração do vídeo com avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerate}
            disabled={!selectedAvatar || !scriptText || isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Gerar Avatar
              </>
            )}
          </Button>

          {/* Status */}
          {job && (
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {getStatusBadge()}
              </div>

              {/* Progress */}
              {job.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso:</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} />
                </div>
              )}

              {/* Completed */}
              {job.status === 'completed' && job.outputUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Vídeo gerado com sucesso!</span>
                  </div>

                  {/* Video Player */}
                  <video
                    src={job.outputUrl}
                    controls
                    className="w-full rounded-lg border"
                  />

                  {/* Download Button */}
                  <Button
                    onClick={() => window.open(job.outputUrl, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Vídeo
                  </Button>

                  {/* Reset */}
                  <Button
                    onClick={reset}
                    variant="secondary"
                    className="w-full"
                  >
                    Gerar Outro Avatar
                  </Button>
                </div>
              )}

              {/* Error */}
              {job.status === 'failed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Erro ao gerar vídeo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.error}</p>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="w-full"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error (não relacionado a job) */}
          {error && !job && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">ℹ️ Informações Importantes</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Tempo de geração: 2-3 minutos</li>
            <li>• Qualidade: Vídeo 4K com lip-sync profissional</li>
            <li>• Limite: 10.000 caracteres por script</li>
            <li>• Armazenamento: Vídeos salvos automaticamente no S3</li>
            {mode === 'demo' && (
              <li className="text-yellow-600 font-medium">
                ⚠️ Modo Demo: Configure DID_API_KEY no .env para usar API real
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default AvatarGenerationDemo;
