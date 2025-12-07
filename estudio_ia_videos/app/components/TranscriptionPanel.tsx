import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Download, 
  Languages, 
  Settings, 
  Play, 
  Pause,
  FileAudio,
  Trash2,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import { useTranscription, UseTranscriptionOptions } from '@/hooks/useTranscription';
import { TranscriptionSegment, TranscriptionWord } from '@/lib/subtitles/transcription-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface TranscriptionPanelProps {
  audioPath?: string;
  onSegmentClick?: (segment: TranscriptionSegment) => void;
  options?: UseTranscriptionOptions;
  className?: string;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  audioPath,
  onSegmentClick,
  options = {},
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [enableKaraoke, setEnableKaraoke] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  
  const {
    isTranscribing,
    progress,
    result,
    error,
    karaokeSubtitles,
    srtSubtitles,
    transcribeAudio,
    translateTranscription,
    exportSubtitles,
    clearTranscription
  } = useTranscription(options);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleTranscribe = useCallback(async () => {
    if (!selectedFile && !audioPath) {
      return;
    }

    const path = audioPath || (selectedFile ? URL.createObjectURL(selectedFile) : '');
    if (path) {
      await transcribeAudio(path);
    }
  }, [selectedFile, audioPath, transcribeAudio]);

  const handleTranslate = useCallback(async () => {
    await translateTranscription(targetLanguage);
  }, [targetLanguage, translateTranscription]);

  const handleExport = useCallback((format: 'srt' | 'ass' | 'vtt') => {
    exportSubtitles(format);
  }, [exportSubtitles]);

  const handleClear = useCallback(() => {
    clearTranscription();
    setSelectedFile(null);
  }, [clearTranscription]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const WordDisplay: React.FC<{ word: TranscriptionWord; isActive: boolean }> = ({ word, isActive }) => (
    <span
      className={`inline-block transition-all duration-300 ${
        isActive 
          ? 'text-green-400 font-bold text-lg transform scale-105' 
          : 'text-gray-300'
      }`}
      style={{
        textShadow: isActive ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none'
      }}
    >
      {word.word}
    </span>
  );

  const SegmentDisplay: React.FC<{ segment: TranscriptionSegment; isActive: boolean }> = ({ segment, isActive }) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    // Simulate karaoke word highlighting
    React.useEffect(() => {
      if (isActive && segment.words.length > 0) {
        let wordIndex = 0;
        const interval = setInterval(() => {
          setCurrentWordIndex(wordIndex);
          wordIndex++;
          if (wordIndex >= segment.words.length) {
            clearInterval(interval);
          }
        }, (segment.endTime - segment.startTime) / segment.words.length * 1000);

        return () => clearInterval(interval);
      }
    }, [isActive, segment]);

    return (
      <div
        className={`p-3 rounded-lg border transition-all cursor-pointer ${
          isActive 
            ? 'bg-green-900/20 border-green-500 shadow-lg' 
            : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
        }`}
        onClick={() => onSegmentClick?.(segment)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
            </span>
          </div>
          <Badge variant={segment.confidence > 0.9 ? 'default' : 'secondary'}>
            {Math.round(segment.confidence * 100)}%
          </Badge>
        </div>
        
        {enableKaraoke && segment.words.length > 0 ? (
          <div className="text-lg leading-relaxed">
            {segment.words.map((word, index) => (
              <WordDisplay
                key={index}
                word={word}
                isActive={isActive && currentWordIndex === index}
              />
            ))}
          </div>
        ) : (
          <p className="text-lg text-white">{segment.text}</p>
        )}
        
        {segment.speaker && (
          <div className="flex items-center gap-2 mt-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">{segment.speaker}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`bg-gray-900 border-gray-700 text-white ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Legendas Automáticas (Karaokê)
            </CardTitle>
            <CardDescription className="text-gray-400">
              Transcrição automática com animação de palavras para PT-BR
            </CardDescription>
          </div>
          
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Selection */}
        {!result && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
              <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">
                {selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : 'Selecione um arquivo de áudio ou vídeo'}
              </p>
              <Input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="audio-file-input"
              />
              <label htmlFor="audio-file-input">
                <Button variant="outline" asChild>
                  <span>Escolher Arquivo</span>
                </Button>
              </label>
            </div>

            <Button
              onClick={handleTranscribe}
              disabled={!selectedFile && !audioPath}
              className="w-full"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Transcrever Áudio
            </Button>
          </div>
        )}

        {/* Progress */}
        {isTranscribing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Transcrevendo...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-400 text-center">
              Processando áudio e gerando legendas com animação
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Prévia</TabsTrigger>
              <TabsTrigger value="segments">Segmentos</TabsTrigger>
              <TabsTrigger value="export">Exportar</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              {/* Karaoke Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Prévia do Karaokê</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-green-400 hover:text-green-300"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="bg-black rounded-lg p-6 min-h-[120px] flex items-center justify-center border border-gray-700">
                  {result.segments.length > 0 && (
                    <SegmentDisplay
                      segment={result.segments[0]}
                      isActive={isPlaying}
                    />
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Confiança</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {Math.round(result.confidence * 100)}%
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Duração</span>
                  </div>
                  <p className="text-xl font-bold text-blue-400">
                    {Math.round(result.duration)}s
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {result.segments.length} Segmentos
                </Label>
                <Badge variant="outline">
                  {result.wordCount} palavras
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {result.segments.map((segment, index) => (
                  <SegmentDisplay
                    key={segment.id}
                    segment={segment}
                    isActive={false}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar Legendas</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('srt')}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    SRT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('ass')}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ASS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('vtt')}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    VTT
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Translation */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Traduzir Legendas</Label>
                <div className="flex gap-2">
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                      <SelectItem value="fr">Francês</SelectItem>
                      <SelectItem value="de">Alemão</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTranslate}
                    disabled={isTranscribing}
                  >
                    <Languages className="w-4 h-4 mr-2" />
                    Traduzir
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};