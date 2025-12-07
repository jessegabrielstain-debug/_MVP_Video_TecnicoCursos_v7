import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Music,
  Magnet,
  Zap,
  Minimize2,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import { useMagneticTimeline, UseMagneticTimelineReturn } from '@/hooks/useMagneticTimeline';
import { TimelineState } from '@/types/timeline';

interface MagneticTimelinePanelProps {
  initialState: TimelineState;
  onStateChange?: (state: TimelineState) => void;
  className?: string;
}

export const MagneticTimelinePanel: React.FC<MagneticTimelinePanelProps> = ({
  initialState,
  onStateChange,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showBeatGrid, setShowBeatGrid] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const {
    state,
    config,
    isProcessing,
    beats,
    isBeatDetectionActive,
    moveClip,
    deleteClip,
    updateConfig,
    toggleAutoRipple,
    toggleGapClosing,
    toggleSnapToBeat,
    detectBeats,
    addMagneticZone,
    removeMagneticZone,
    getSnapPoints,
    getGaps
  }: UseMagneticTimelineReturn = useMagneticTimeline({
    initialState,
    onRippleCompleted: (affectedClips) => {
      console.log('Ripple completed, affected clips:', affectedClips);
    }
  });

  // Update parent when state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  }, []);

  const handleDetectBeats = useCallback(async () => {
    if (audioFile) {
      const fileUrl = URL.createObjectURL(audioFile);
      await detectBeats(fileUrl);
      setShowBeatGrid(true);
    }
  }, [audioFile, detectBeats]);

  const formatTime = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  }, []);

  const snapPoints = getSnapPoints();
  const gaps = getGaps();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Magnet className="h-5 w-5" />
              Timeline Magnética Inteligente
            </CardTitle>
            <CardDescription>
              Edição inteligente com auto-ripple, fechamento de gaps e snapping magnético
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {isProcessing ? 'Processando...' : 'Pronto'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Playback Controls */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 1000))}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(currentTime + 1000)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(state.duration)}
          </div>
        </div>

        {/* Magnetic Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Configurações Magnéticas</h3>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Auto Ripple */}
            <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Auto Ripple
                </Label>
                <p className="text-xs text-muted-foreground">
                  Move clips automaticamente
                </p>
              </div>
              <Switch
                checked={config.autoRipple}
                onCheckedChange={toggleAutoRipple}
              />
            </div>

            {/* Gap Closing */}
            <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4" />
                  Fechar Gaps
                </Label>
                <p className="text-xs text-muted-foreground">
                  Remove espaços vazios
                </p>
              </div>
              <Switch
                checked={config.gapClosing}
                onCheckedChange={toggleGapClosing}
              />
            </div>

            {/* Snap to Beat */}
            <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Snap para Batida
                </Label>
                <p className="text-xs text-muted-foreground">
                  Alinha com música
                </p>
              </div>
              <Switch
                checked={config.snapToBeat}
                onCheckedChange={toggleSnapToBeat}
              />
            </div>
          </div>

          {/* Sensitivity Controls */}
          <div className="space-y-4">
            <div>
              <Label className="flex items-center justify-between">
                <span>Limiar de Snap</span>
                <span className="text-xs text-muted-foreground">{config.snapThreshold}ms</span>
              </Label>
              <Slider
                value={[config.snapThreshold]}
                onValueChange={(value) => updateConfig({ snapThreshold: value[0] })}
                min={10}
                max={200}
                step={10}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="flex items-center justify-between">
                <span>Delay Ripple</span>
                <span className="text-xs text-muted-foreground">{config.rippleDelay}ms</span>
              </Label>
              <Slider
                value={[config.rippleDelay]}
                onValueChange={(value) => updateConfig({ rippleDelay: value[0] })}
                min={0}
                max={500}
                step={50}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Beat Detection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Detecção de Batidas</h3>
            <Music className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload">
              <Button variant="outline" as="span">
                Escolher Áudio
              </Button>
            </label>
            
            {audioFile && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Arquivo:</span>
                <span className="font-medium">{audioFile.name}</span>
              </div>
            )}
            
            <Button
              onClick={handleDetectBeats}
              disabled={!audioFile || isBeatDetectionActive}
              variant="default"
            >
              {isBeatDetectionActive ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Detectando...
                </>
              ) : (
                'Detectar Batidas'
              )}
            </Button>
          </div>

          {beats.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Batidas Detectadas</span>
                <Badge variant="secondary">{beats.length} batidas</Badge>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {beats.slice(0, 20).map((beat, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      beat.intensity === 'high' ? 'bg-red-500' :
                      beat.intensity === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    title={`${formatTime(beat.time)} - ${beat.intensity} (${Math.round(beat.confidence * 100)}%)`}
                  />
                ))}
                {beats.length > 20 && (
                  <span className="text-xs text-muted-foreground">+{beats.length - 20}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Timeline Statistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Estatísticas da Timeline</h3>
            <Badge variant="outline" className="text-xs">
              {state.tracks.length} trilhas
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background border rounded-lg">
              <div className="text-2xl font-bold">{state.clips.length}</div>
              <div className="text-xs text-muted-foreground">Total Clips</div>
            </div>
            
            <div className="p-3 bg-background border rounded-lg">
              <div className="text-2xl font-bold">{gaps.length}</div>
              <div className="text-xs text-muted-foreground">Gaps Detectados</div>
            </div>
          </div>

          {gaps.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">Gaps na Timeline</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateConfig({ gapClosing: true })}
                  className="text-yellow-700 hover:text-yellow-800"
                >
                  Fechar Todos
                </Button>
              </div>
              <div className="space-y-1">
                {gaps.slice(0, 3).map((gap, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-yellow-700">
                      {formatTime(gap.start)} - {formatTime(gap.end)}
                    </span>
                    <span className="text-yellow-600">
                      {formatTime(gap.duration)}
                    </span>
                  </div>
                ))}
                {gaps.length > 3 && (
                  <div className="text-xs text-yellow-600">
                    +{gaps.length - 3} gaps adicionais
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Snap Points Visualization */}
        {snapPoints.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Pontos de Snap Magnético</h3>
              <Badge variant="outline" className="text-xs">
                {snapPoints.length} pontos
              </Badge>
            </div>
            
            <div className="h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs text-muted-foreground">
                  Visualização da Timeline
                </div>
              </div>
              
              {snapPoints.slice(0, 50).map((point, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                  style={{
                    left: `${(point / state.duration) * 100}%`,
                    opacity: 0.7
                  }}
                  title={formatTime(point)}
                />
              ))}
              
              {beats.slice(0, 30).map((beat, index) => (
                <div
                  key={`beat-${index}`}
                  className="absolute top-0 bottom-0 w-1 bg-red-500 rounded-full"
                  style={{
                    left: `${(beat.time / state.duration) * 100}%`,
                    opacity: beat.confidence
                  }}
                  title={`Batida: ${formatTime(beat.time)} (${Math.round(beat.confidence * 100)}%)`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};