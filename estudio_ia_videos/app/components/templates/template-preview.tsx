'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Edit,
  Download,
  Heart,
  Star,
  Clock,
  User,
  Calendar,
  Eye,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Template } from '@/types/templates';
import { Slider } from '@/components/ui/slider';

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onEdit: () => void;
  onUse: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onEdit,
  onUse,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'NR-12': 'bg-red-100 text-red-800',
      'NR-33': 'bg-blue-100 text-blue-800',
      'NR-35': 'bg-green-100 text-green-800',
      'NR-10': 'bg-yellow-100 text-yellow-800',
      'NR-06': 'bg-purple-100 text-purple-800',
      'CUSTOM': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'non-compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (time: number[]) => {
    setCurrentTime(time[0]);
  };

  const handleVolumeChange = (vol: number[]) => {
    setVolume(vol[0]);
    setIsMuted(vol[0] === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span>{template.name}</span>
              <Badge className={getCategoryColor(template.category)}>
                {template.category}
              </Badge>
              {template.isCustom && (
                <Badge variant="outline">Personalizado</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button onClick={onUse} className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Usar Template
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <img
                      src={template.preview || template.thumbnail || '/api/placeholder/800/450'}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <Button
                        size="lg"
                        onClick={handlePlayPause}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="space-y-2">
                      {/* Progress Bar */}
                      <Slider
                        value={[currentTime]}
                        onValueChange={handleTimeChange}
                        max={template.content.settings.duration}
                        step={1}
                        className="w-full"
                      />

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white hover:bg-opacity-20">
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handlePlayPause} className="text-white hover:bg-white hover:bg-opacity-20">
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white hover:bg-opacity-20">
                            <SkipForward className="w-4 h-4" />
                          </Button>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white hover:bg-opacity-20">
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <Slider
                              value={[isMuted ? 0 : volume]}
                              onValueChange={handleVolumeChange}
                              max={100}
                              step={1}
                              className="w-20"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-white text-sm">
                          <span>{formatDuration(currentTime)} / {formatDuration(template.content.settings.duration)}</span>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white hover:bg-opacity-20">
                            <Maximize className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slides Timeline */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Slides ({template.content.slides.length})</h3>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {template.content.slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`flex-shrink-0 w-32 h-20 rounded-lg border-2 cursor-pointer transition-all ${
                        currentSlide === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          Slide {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="settings">Config</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {template.author}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(template.updatedAt)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatDuration(template.content.settings.duration)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Download className="w-4 h-4 mr-2" />
                        {template.downloads}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 fill-current text-yellow-400" />
                        <span className="text-sm font-medium">{template.rating.toFixed(1)}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Heart className="w-4 h-4 mr-1" />
                        Favoritar
                      </Button>
                    </div>

                    {template.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      {getComplianceIcon(template.metadata.compliance.status)}
                      <span className="font-medium">
                        {template.metadata.compliance.status === 'compliant' ? 'Conforme' :
                         template.metadata.compliance.status === 'warning' ? 'Atenção' : 'Não Conforme'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Categorias NR</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.metadata.compliance.nrCategories.map((category, index) => (
                          <Badge key={index} className={getCategoryColor(category)}>
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Requisitos</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {template.metadata.compliance.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Última Auditoria</h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(template.metadata.compliance.lastAudit)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Resolução</h4>
                      <p className="text-sm text-gray-600">
                        {template.content.settings.resolution.width} x {template.content.settings.resolution.height}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Taxa de Quadros</h4>
                      <p className="text-sm text-gray-600">
                        {template.content.settings.frameRate} fps
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Qualidade de Renderização</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {template.content.settings.renderSettings.quality}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Formato</h4>
                      <p className="text-sm text-gray-600 uppercase">
                        {template.content.settings.renderSettings.format}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Tempo de Renderização:</span>
                          <span>{template.metadata.performance.renderTime}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tamanho do Arquivo:</span>
                          <span>{(template.metadata.performance.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Complexidade:</span>
                          <span className="capitalize">{template.metadata.performance.complexity}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};