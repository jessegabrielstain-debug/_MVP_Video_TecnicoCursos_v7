
/**
 * 🎬 Avatar Timeline Integration
 * Integração do Avatar 3D com o Timeline do Editor
 * FASE 3: Integração completa com Timeline
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mic, 
  Clock, 
  Plus, 
  Trash2,
  Play,
  Save,
  Edit,
  X
} from 'lucide-react';
import Avatar3DRenderer from '../avatars/Avatar3DRenderer';
import { avatarEngine } from '@/lib/avatar-engine';
import avatarsData from '@/data/avatars.json';

export interface AvatarTimelineClip {
  id: string;
  avatarId: string;
  text: string;
  voiceId: string;
  startTime: number; // ms
  duration: number; // ms
  audioUrl: string;
  emotion?: string;
  emotionIntensity?: number;
  enableGestures?: boolean;
  position: {
    x: number;
    y: number;
    scale: number;
  };
}

const emotions = [
  { id: 'neutral', label: 'Neutro', icon: '😐' },
  { id: 'happy', label: 'Feliz', icon: '😊' },
  { id: 'sad', label: 'Triste', icon: '😔' },
  { id: 'angry', label: 'Bravo', icon: '😠' },
  { id: 'surprised', label: 'Surpreso', icon: '😲' },
  { id: 'fear', label: 'Medo', icon: '😨' }
];

interface AvatarTimelineIntegrationProps {
  onClipAdded?: (clip: AvatarTimelineClip) => void;
  onClipRemoved?: (clipId: string) => void;
  onClipUpdated?: (clip: AvatarTimelineClip) => void;
  existingClips?: AvatarTimelineClip[];
}

export default function AvatarTimelineIntegration({
  onClipAdded,
  onClipRemoved,
  onClipUpdated,
  existingClips = []
}: AvatarTimelineIntegrationProps) {
  const [selectedAvatarId, setSelectedAvatarId] = useState('sarah_executive');
  const [text, setText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('pt-BR-Neural2-A');
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(1.0);
  const [enableGestures, setEnableGestures] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState('');
  const [clips, setClips] = useState<AvatarTimelineClip[]>(existingClips);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  /**
   * Gera áudio TTS e adiciona clip ao timeline
   */
  const handleGenerateClip = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Digite um texto para o avatar falar');
      return;
    }

    setIsGenerating(true);

    try {
      // Chama API para gerar TTS
      const response = await fetch('/api/avatars/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoiceId,
          avatarId: selectedAvatarId
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar áudio');
      }

      const data = await response.json();

      // Cria novo clip
      const newClip: AvatarTimelineClip = {
        id: editingClipId || `avatar_clip_${Date.now()}`,
        avatarId: selectedAvatarId,
        text,
        voiceId: selectedVoiceId,
        startTime,
        duration: data.duration || 5000, // 5s default
        audioUrl: data.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Fallback audio
        emotion: selectedEmotion,
        emotionIntensity,
        enableGestures,
        position: {
          x: 0,
          y: 0,
          scale: 1
        }
      };

      if (editingClipId) {
        // Atualiza clip existente
        setClips(prev => prev.map(c => c.id === editingClipId ? newClip : c));
        onClipUpdated?.(newClip);
        toast.success('Clip atualizado com sucesso!');
        setEditingClipId(null);
      } else {
        // Adiciona novo clip
        setClips(prev => [...prev, newClip]);
        onClipAdded?.(newClip);
        toast.success('Clip de avatar adicionado ao timeline!');
      }

      // Preview
      setPreviewAudioUrl(newClip.audioUrl);
      setText('');
    } catch (error) {
      console.error('Erro ao gerar clip:', error);
      // Fallback para demonstração (Ritmo Continuo)
      const mockClip: AvatarTimelineClip = {
        id: editingClipId || `avatar_clip_${Date.now()}`,
        avatarId: selectedAvatarId,
        text,
        voiceId: selectedVoiceId,
        startTime,
        duration: 5000,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        emotion: selectedEmotion,
        emotionIntensity,
        enableGestures,
        position: { x: 0, y: 0, scale: 1 }
      };
      
      if (editingClipId) {
        setClips(prev => prev.map(c => c.id === editingClipId ? mockClip : c));
        onClipUpdated?.(mockClip);
        toast.success('Clip atualizado (Modo Demo)');
        setEditingClipId(null);
      } else {
        onClipAdded?.(mockClip);
        setClips(prev => [...prev, mockClip]);
        toast.success('Clip adicionado (Modo Demo)');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [text, selectedVoiceId, selectedAvatarId, startTime, selectedEmotion, emotionIntensity, enableGestures, editingClipId, onClipAdded, onClipUpdated]);

  /**
   * Remove clip do timeline
   */
  const handleRemoveClip = useCallback((clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    onClipRemoved?.(clipId);
    toast.success('Clip removido do timeline');
  }, [onClipRemoved]);

  /**
   * Atualiza posição/timing de clip
   */
  const handleUpdateClip = useCallback((clipId: string, updates: Partial<AvatarTimelineClip>) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    ));

    const updatedClip = clips.find(c => c.id === clipId);
    if (updatedClip) {
      onClipUpdated?.({ ...updatedClip, ...updates });
    }
  }, [clips, onClipUpdated]);

  /**
   * Carrega clip para edição
   */
  const handleEditClip = useCallback((clip: AvatarTimelineClip) => {
    setEditingClipId(clip.id);
    setSelectedAvatarId(clip.avatarId);
    setText(clip.text);
    setSelectedVoiceId(clip.voiceId);
    setStartTime(clip.startTime);
    setSelectedEmotion(clip.emotion || 'neutral');
    setEmotionIntensity(clip.emotionIntensity || 1.0);
    setEnableGestures(clip.enableGestures !== undefined ? clip.enableGestures : true);
    
    // Rola para o topo para ver o editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Modo de edição ativado');
  }, []);

  /**
   * Cancela edição
   */
  const handleCancelEdit = useCallback(() => {
    setEditingClipId(null);
    setText('');
    setSelectedEmotion('neutral');
    setEmotionIntensity(1.0);
    setEnableGestures(true);
    toast('Edição cancelada', { icon: '↩️' });
  }, []);

  const selectedAvatar = avatarEngine.getAvatar(selectedAvatarId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Avatar 3D no Timeline
          </h3>
          <p className="text-sm text-gray-600">
            Adicione avatares falantes sincronizados à sua linha do tempo
          </p>
        </div>
        <Badge variant="secondary">
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de configuração */}
        <Card className="p-6 space-y-6">
          <Tabs defaultValue="avatar">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="avatar">
                <User className="w-4 h-4 mr-2" />
                Avatar
              </TabsTrigger>
              <TabsTrigger value="voice">
                <Mic className="w-4 h-4 mr-2" />
                Voz
              </TabsTrigger>
              <TabsTrigger value="emotion">
                <span className="mr-2">🎭</span>
                Emoção
              </TabsTrigger>
              <TabsTrigger value="timing">
                <Clock className="w-4 h-4 mr-2" />
                Timing
              </TabsTrigger>
            </TabsList>

            {/* Tab: Seleção de Avatar */}
            <TabsContent value="avatar" className="space-y-4">
              <div>
                <Label>Selecione o Avatar</Label>
                <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {avatarsData.avatars.map(avatar => (
                      <SelectItem key={avatar.id} value={avatar.id}>
                        {avatar.name} - {avatar.style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAvatar && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">{selectedAvatar.name}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedAvatar.gender}</Badge>
                    <Badge variant="outline">{(selectedAvatar.metadata?.age_range as string) || 'N/A'}</Badge>
                    <Badge variant="secondary">
                      Lip Sync: {(selectedAvatar.metadata?.lipSyncAccuracy as number) || 95}%
                    </Badge>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Configuração de Voz */}
            <TabsContent value="voice" className="space-y-4">
              <div>
                <Label>Voz TTS</Label>
                <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR-Neural2-A">Ana Clara (Feminina)</SelectItem>
                    <SelectItem value="pt-BR-Neural2-B">João Pedro (Masculino)</SelectItem>
                    <SelectItem value="pt-BR-Neural2-C">Camila (Feminina)</SelectItem>
                    <SelectItem value="pt-BR-Wavenet-A">Ricardo (Masculino)</SelectItem>
                    <SelectItem value="pt-BR-Wavenet-B">Mariana (Feminina)</SelectItem>
                    <SelectItem value="pt-BR-Standard-A">Carlos (Masculino)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Texto para Falar</Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite o texto que o avatar irá falar..."
                  rows={6}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {text.length}/500 caracteres • ~{Math.ceil(text.split(' ').length / 2)}s de duração
                </p>
              </div>
            </TabsContent>

            {/* Tab: Emoção */}
            <TabsContent value="emotion" className="space-y-4">
              <div>
                <Label>Expressão Emocional</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Escolha a emoção que será aplicada ao avatar durante a fala.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {emotions.map(emotion => (
                    <button
                      key={emotion.id}
                      onClick={() => setSelectedEmotion(emotion.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                        selectedEmotion === emotion.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl mb-2">{emotion.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{emotion.label}</span>
                    </button>
                  ))}
                </div>

                {selectedEmotion !== 'neutral' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Intensidade da Emoção</Label>
                      <span className="text-gray-500">{Math.round(emotionIntensity * 100)}%</span>
                    </div>
                    <Slider
                      value={[emotionIntensity]}
                      onValueChange={([value]) => setEmotionIntensity(value)}
                      max={1.0}
                      step={0.1}
                      min={0.1}
                    />
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Gestos Automáticos</Label>
                    <p className="text-xs text-gray-500">
                      Permitir que o avatar faça gestos corporais baseados na emoção
                    </p>
                  </div>
                  <Switch
                    checked={enableGestures}
                    onCheckedChange={setEnableGestures}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Timing no Timeline */}
            <TabsContent value="timing" className="space-y-4">
              <div>
                <Label>Tempo de Início (segundos)</Label>
                <Input
                  type="number"
                  value={startTime / 1000}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) * 1000)}
                  min={0}
                  step={0.1}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 O clip será posicionado automaticamente no timeline no tempo especificado.
                  A duração é calculada com base no texto e velocidade da fala.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {editingClipId && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button 
              onClick={handleGenerateClip} 
              className="flex-1"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {editingClipId ? 'Atualizando...' : 'Gerando...'}
                </>
              ) : (
                <>
                  {editingClipId ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Atualizar Clip
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar ao Timeline
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Preview 3D */}
        <Card className="p-6">
          <h4 className="text-sm font-semibold mb-4">Preview 3D</h4>
          <div className="h-[500px] bg-gray-50 rounded-lg overflow-hidden">
            {selectedAvatarId && (
              <Avatar3DRenderer
                avatarId={selectedAvatarId}
                text={text}
                audioUrl={previewAudioUrl}
                emotion={selectedEmotion}
                emotionIntensity={emotionIntensity}
                enableGestures={enableGestures}
                showControls={!!previewAudioUrl}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Lista de clips no timeline */}
      {clips.length > 0 && (
        <Card className="p-6">
          <h4 className="text-sm font-semibold mb-4">Clips no Timeline</h4>
          <div className="space-y-3">
            {clips.map(clip => {
              const avatar = avatarEngine.getAvatar(clip.avatarId);
              const emotionColor = clip.emotion === 'happy' ? 'border-l-4 border-l-green-400' :
                                 clip.emotion === 'sad' ? 'border-l-4 border-l-blue-400' :
                                 clip.emotion === 'angry' ? 'border-l-4 border-l-red-400' :
                                 clip.emotion === 'surprised' ? 'border-l-4 border-l-yellow-400' :
                                 clip.emotion === 'fear' ? 'border-l-4 border-l-purple-400' :
                                 '';
                                 
              return (
                <div
                  key={clip.id}
                  className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition ${emotionColor}`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {avatar?.name || 'Avatar'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {clip.text.substring(0, 50)}...
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {(clip.startTime / 1000).toFixed(1)}s
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {(clip.duration / 1000).toFixed(1)}s
                      </Badge>
                      {clip.emotion && clip.emotion !== 'neutral' && (
                        <Badge variant="secondary" className="text-xs">
                          {emotions.find(e => e.id === clip.emotion)?.icon} {emotions.find(e => e.id === clip.emotion)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewAudioUrl(clip.audioUrl)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClip(clip)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveClip(clip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
