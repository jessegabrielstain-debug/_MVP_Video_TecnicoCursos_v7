// TODO: Fixar getAllAvatars -> getAvatar e tipos

/**
 * 🎭 Avatar Integration Component - Hiper-Realista
 * Integração com pipeline 3D hiper-realista e plataformas externas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Link,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Code,
  Gamepad2,
  Crown,
  Zap,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { avatar3DPipeline } from '@/lib/avatar-3d-pipeline';

interface AvatarIntegrationProps {
  onAvatarImported: (avatar: any) => void;
}

export default function AvatarIntegration({ onAvatarImported }: AvatarIntegrationProps) {
  const [readyPlayerMeUrl, setReadyPlayerMeUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedHyperAvatar, setSelectedHyperAvatar] = useState<string | null>(null);
  const [hyperAvatars, setHyperAvatars] = useState<any[]>([]);
  const [connectedServices, setConnectedServices] = useState({
    hyperRealisticPipeline: true, // Pipeline interno sempre ativo
    readyPlayerMe: false,
    vroid: false,
    mixamo: false,
    customUpload: true
  });

  useEffect(() => {
    // Carregar avatares hiper-realistas disponíveis
    const loadHyperAvatars = () => {
      const avatars = avatar3DPipeline.getAllAvatars();
      setHyperAvatars(avatars);
    };
    
    loadHyperAvatars();
  }, []);

  const handleReadyPlayerMeImport = async () => {
    if (!readyPlayerMeUrl.trim()) {
      toast.error('Insira uma URL válida do Ready Player Me');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simular processo de importação
      const stages = [
        { name: 'Validando URL', duration: 500 },
        { name: 'Baixando Modelo 3D', duration: 1500 },
        { name: 'Processando Texturas', duration: 1000 },
        { name: 'Configurando Animações', duration: 800 },
        { name: 'Otimizando para Web', duration: 700 }
      ];

      let totalProgress = 0;
      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        totalProgress += 20;
        setImportProgress(totalProgress);
        toast.success(`${stage.name} concluído`);
      }

      // Chamar API de importação
      const response = await fetch('/api/v4/avatars/ready-player-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load_avatar',
          avatarUrl: readyPlayerMeUrl
        }),
      });

      const data = await response.json();

      if (data.success) {
        onAvatarImported(data.avatar);
        toast.success('Avatar importado com sucesso!');
        setReadyPlayerMeUrl('');
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao importar avatar');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['.glb', '.gltf', '.fbx', '.obj'];
    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Formato não suportado. Use GLB, GLTF, FBX ou OBJ');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v4/avatars/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onAvatarImported(data.avatar);
        toast.success('Avatar personalizado carregado!');
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setIsImporting(false);
    }
  };

  const connectService = async (service: string) => {
    toast.success(`Conectando com ${service}...`);
    
    // Simular conexão
    setTimeout(() => {
      setConnectedServices(prev => ({ ...prev, [service]: true }));
      toast.success(`${service} conectado com sucesso!`);
    }, 1000);
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Link className="h-5 w-5 text-blue-600" />
          <span>Integrações de Avatares</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hyperreal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hyperreal" onClick={() => toast.success('🎭 Pipeline Hiper-Realista selecionado')}>
              <Sparkles className="h-4 w-4 mr-1" />
              Hiper-Realista
            </TabsTrigger>
            <TabsTrigger value="ready-player-me" onClick={() => toast.success('🎮 Ready Player Me selecionado')}>Ready Player Me</TabsTrigger>
            <TabsTrigger value="upload" onClick={() => toast.success('📤 Upload customizado selecionado')}>Upload Customizado</TabsTrigger>
            <TabsTrigger value="services" onClick={() => toast.success('🔗 Outros serviços selecionados')}>Outros Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="hyperreal" className="space-y-4">
            <div className="space-y-4">
              {/* Pipeline Status */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Pipeline 3D Hiper-Realista</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">ATIVO</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Unreal Engine 5 • Ray Tracing • 8K Textures • ML Lip Sync
                </p>
              </div>

              {/* Avatar Selection */}
              <div className="space-y-3">
                <h4 className="font-medium">Avatares Hiper-Realistas Disponíveis</h4>
                <div className="grid grid-cols-2 gap-3">
                  {hyperAvatars.slice(0, 4).map((avatar) => (
                    <Card 
                      key={avatar.id}
                      className={`cursor-pointer transition-all ${
                        selectedHyperAvatar === avatar.id ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedHyperAvatar(avatar.id);
                        toast.success(`🎭 ${avatar.name} selecionado`);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{avatar.name}</p>
                            <p className="text-xs text-gray-500">{avatar.category}</p>
                            <Badge className="bg-red-500 text-white text-xs mt-1">
                              {avatar.quality.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Import Button */}
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  if (selectedHyperAvatar) {
                    const avatar = hyperAvatars.find(a => a.id === selectedHyperAvatar);
                    if (avatar) {
                      onAvatarImported({
                        ...avatar,
                        source: 'hyperreal-pipeline',
                        imported: true,
                        timestamp: new Date().toISOString()
                      });
                      toast.success(`🎬 ${avatar.name} importado com sucesso!`);
                    }
                  } else {
                    toast.error('Selecione um avatar hiper-realista primeiro');
                  }
                }}
                disabled={!selectedHyperAvatar}
              >
                <Crown className="h-4 w-4 mr-2" />
                Importar Avatar Hiper-Realista
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ready-player-me" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Ready Player Me</span>
                <Badge className={connectedServices.readyPlayerMe ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {connectedServices.readyPlayerMe ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Avatar</label>
                <Input
                  value={readyPlayerMeUrl}
                  onChange={(e) => setReadyPlayerMeUrl(e.target.value)}
                  placeholder="https://api.readyplayer.me/v1/avatars/[avatar-id].glb"
                  className="font-mono text-sm"
                />
                <div className="text-xs text-gray-500">
                  Cole a URL do seu avatar criado no Ready Player Me
                </div>
              </div>

              {isImporting && importProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importando Avatar...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleReadyPlayerMeImport}
                  disabled={!readyPlayerMeUrl.trim() || isImporting}
                  className="flex-1 flex items-center space-x-2"
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Importar Avatar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://readyplayer.me', '_blank')}
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Criar Avatar</span>
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="font-medium">Recursos Ready Player Me:</div>
                  <div>✅ Mais de 1000 opções de personalização</div>
                  <div>✅ Qualidade fotorrealista</div>
                  <div>✅ Compatibilidade total com lip sync</div>
                  <div>✅ Animações profissionais incluídas</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <h3 className="font-medium">Upload de Avatar Personalizado</h3>
                  <p className="text-sm text-gray-600">
                    Faça upload do seu próprio modelo 3D (GLB, GLTF, FBX, OBJ)
                  </p>
                  <input
                    type="file"
                    accept=".glb,.gltf,.fbx,.obj"
                    onChange={handleCustomUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button asChild className="cursor-pointer">
                      <span>Selecionar Arquivo</span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Formatos Suportados:</div>
                <div className="flex flex-wrap gap-2">
                  {['.GLB', '.GLTF', '.FBX', '.OBJ'].map(format => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-800 space-y-1">
                  <div className="font-medium">Requisitos do Modelo:</div>
                  <div>• Máximo 10MB de tamanho</div>
                  <div>• Malha otimizada (max 50k polígonos)</div>
                  <div>• Rigging compatível com Mixamo</div>
                  <div>• Texturas em formato JPG/PNG</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="space-y-4">
              {/* VRoid Studio */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Code className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">VRoid Studio</div>
                    <div className="text-sm text-gray-600">Avatares estilo anime</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={connectedServices.vroid ? "default" : "outline"}
                  onClick={() => connectService('vroid')}
                  disabled={connectedServices.vroid}
                >
                  {connectedServices.vroid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Mixamo */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Adobe Mixamo</div>
                    <div className="text-sm text-gray-600">Animações profissionais</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={connectedServices.mixamo ? "default" : "outline"}
                  onClick={() => connectService('mixamo')}
                  disabled={connectedServices.mixamo}
                >
                  {connectedServices.mixamo ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Status das Integrações */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Status das Integrações</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span>Pipeline Hiper-Realista:</span>
                    <Badge className={connectedServices.hyperRealisticPipeline ? "bg-purple-100 text-purple-800" : "bg-red-100 text-red-800"}>
                      {connectedServices.hyperRealisticPipeline ? 'UE5 Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Ready Player Me:</span>
                    <Badge className={connectedServices.readyPlayerMe ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {connectedServices.readyPlayerMe ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>VRoid Studio:</span>
                    <Badge className={connectedServices.vroid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {connectedServices.vroid ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Adobe Mixamo:</span>
                    <Badge className={connectedServices.mixamo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {connectedServices.mixamo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Upload Customizado:</span>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
