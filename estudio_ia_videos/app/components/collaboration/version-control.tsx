
'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  GitBranch, GitCommit, GitMerge, History, Plus, Download,
  RefreshCw, Tag, Clock, User, FileText, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, Eye, Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface VersionControlProps {
  projectId?: string;
}

interface Version {
  id: string;
  version: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  changes: VersionChange[];
  status: 'active' | 'archived' | 'draft';
  size: string;
  downloads: number;
  branchFrom?: string;
}

interface VersionChange {
  id: string;
  type: 'added' | 'modified' | 'removed';
  category: 'slide' | 'audio' | 'effect' | 'timeline' | 'metadata';
  description: string;
  impact: 'major' | 'minor' | 'patch';
}

interface Branch {
  id: string;
  name: string;
  description: string;
  author: string;
  created: string;
  lastCommit: string;
  status: 'active' | 'merged' | 'abandoned';
  commitsAhead: number;
  commitsBehind: number;
}

const VersionControl: React.FC<VersionControlProps> = ({ 
  projectId = 'proj_123' 
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('v1.2.3');
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [viewMode, setViewMode] = useState<'versions' | 'branches' | 'compare'>('versions');

  useEffect(() => {
    loadVersionHistory();
    loadBranches();
  }, [projectId]);

  const loadVersionHistory = async () => {
    try {
      const mockVersions: Version[] = [
        {
          id: 'v1_2_3',
          version: 'v1.2.3',
          title: 'Integração Voice Cloning',
          description: 'Implementada integração com ElevenLabs para clonagem de voz personalizada. Melhorias na qualidade de áudio e adição de 29 vozes premium.',
          author: {
            name: 'Ana Silva',
            avatar: '/avatars/ana.jpg'
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          changes: [
            {
              id: 'change_1',
              type: 'added',
              category: 'audio',
              description: 'Sistema de clonagem de voz ElevenLabs',
              impact: 'major'
            },
            {
              id: 'change_2',
              type: 'modified',
              category: 'slide',
              description: 'Atualização de slides com nova narração',
              impact: 'minor'
            },
            {
              id: 'change_3',
              type: 'added',
              category: 'effect',
              description: '12 novos efeitos de transição',
              impact: 'minor'
            }
          ],
          status: 'active',
          size: '145 MB',
          downloads: 23
        },
        {
          id: 'v1_2_2',
          version: 'v1.2.2',
          title: 'Melhorias no Timeline',
          description: 'Otimizações no editor de timeline, correções de bugs e melhor sincronização de áudio.',
          author: {
            name: 'Carlos Santos',
            avatar: '/avatars/carlos.jpg'
          },
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          changes: [
            {
              id: 'change_4',
              type: 'modified',
              category: 'timeline',
              description: 'Editor de timeline redesenhado',
              impact: 'major'
            },
            {
              id: 'change_5',
              type: 'modified',
              category: 'audio',
              description: 'Sincronização aprimorada',
              impact: 'minor'
            }
          ],
          status: 'archived',
          size: '138 MB',
          downloads: 45,
          branchFrom: 'main'
        },
        {
          id: 'v1_2_1',
          version: 'v1.2.1',
          title: 'Correções de Bugs',
          description: 'Correções gerais de estabilidade, melhorias na interface e otimizações de performance.',
          author: {
            name: 'Mariana Costa',
            avatar: '/avatars/mariana.jpg'
          },
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          changes: [
            {
              id: 'change_6',
              type: 'modified',
              category: 'metadata',
              description: 'Correções de estabilidade',
              impact: 'patch'
            }
          ],
          status: 'archived',
          size: '132 MB',
          downloads: 67
        },
        {
          id: 'v1_2_0',
          version: 'v1.2.0',
          title: 'NR-12 Compliance Update',
          description: 'Atualização completa para conformidade com as últimas normas NR-12. Novos templates e conteúdo atualizado.',
          author: {
            name: 'João Oliveira',
            avatar: '/avatars/joao.jpg'
          },
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          changes: [
            {
              id: 'change_7',
              type: 'added',
              category: 'slide',
              description: 'Templates NR-12 atualizados',
              impact: 'major'
            },
            {
              id: 'change_8',
              type: 'modified',
              category: 'metadata',
              description: 'Compliance automático implementado',
              impact: 'major'
            }
          ],
          status: 'archived',
          size: '125 MB',
          downloads: 89
        }
      ];

      setVersions(mockVersions);

    } catch (error) {
      logger.error('Erro ao carregar histórico:', error instanceof Error ? error : new Error(String(error)), { component: 'VersionControl' });
    }
  };

  const loadBranches = async () => {
    try {
      const mockBranches: Branch[] = [
        {
          id: 'main',
          name: 'main',
          description: 'Branch principal de produção',
          author: 'Ana Silva',
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastCommit: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          commitsAhead: 0,
          commitsBehind: 0
        },
        {
          id: 'feature_ai_integration',
          name: 'feature/ai-integration',
          description: 'Integração com IA para geração automática de conteúdo',
          author: 'Carlos Santos',
          created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          lastCommit: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          commitsAhead: 12,
          commitsBehind: 3
        },
        {
          id: 'hotfix_audio_sync',
          name: 'hotfix/audio-sync',
          description: 'Correção urgente na sincronização de áudio',
          author: 'Mariana Costa',
          created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          lastCommit: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'merged',
          commitsAhead: 0,
          commitsBehind: 0
        }
      ];

      setBranches(mockBranches);

    } catch (error) {
      logger.error('Erro ao carregar branches:', error instanceof Error ? error : new Error(String(error)), { component: 'VersionControl' });
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionTitle.trim()) {
      toast.error('Título da versão é obrigatório');
      return;
    }

    const newVersion: Version = {
      id: `v_${Date.now()}`,
      version: `v1.2.${versions.length + 1}`,
      title: newVersionTitle,
      description: newVersionDescription,
      author: {
        name: 'Você',
        avatar: '/avatars/user.jpg'
      },
      timestamp: new Date().toISOString(),
      changes: [
        {
          id: `change_${Date.now()}`,
          type: 'modified',
          category: 'slide',
          description: 'Alterações manuais no projeto',
          impact: 'minor'
        }
      ],
      status: 'active',
      size: '150 MB',
      downloads: 0
    };

    setVersions([newVersion, ...versions.map(v => ({ ...v, status: 'archived' as const }))]);
    setCurrentVersion(newVersion.version);
    setNewVersionTitle('');
    setNewVersionDescription('');
    setShowNewVersionDialog(false);
    
    toast.success('Nova versão criada com sucesso');
  };

  const handleRestoreVersion = async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersion(version.version);
      toast.success(`Versão ${version.version} restaurada`);
    }
  };

  const handleDownloadVersion = async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setVersions(versions.map(v => 
        v.id === versionId 
          ? { ...v, downloads: v.downloads + 1 }
          : v
      ));
      toast.success(`Download da versão ${version.version} iniciado`);
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-500" />;
      case 'modified': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'removed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'modified': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'removed': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      default: return '';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'major': return <Badge variant="destructive">Major</Badge>;
      case 'minor': return <Badge variant="secondary">Minor</Badge>;
      case 'patch': return <Badge variant="outline">Patch</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getBranchStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'merged': return <GitMerge className="h-4 w-4 text-blue-500" />;
      case 'abandoned': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 transition-all duration-300">
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              📚 Version Control
            </h1>
            <p className="text-muted-foreground">
              Controle de versões Git-like para projetos de vídeo • Versão atual: {currentVersion}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border p-1">
              <Button 
                variant={viewMode === 'versions' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('versions')}
              >
                <History className="h-4 w-4 mr-2" />
                Versões
              </Button>
              <Button 
                variant={viewMode === 'branches' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('branches')}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Branches
              </Button>
              <Button 
                variant={viewMode === 'compare' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('compare')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Comparar
              </Button>
            </div>
            
            <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Nova Versão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Versão</DialogTitle>
                  <DialogDescription>
                    Crie um checkpoint do estado atual do projeto
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título da Versão</label>
                    <Input
                      placeholder="Ex: Correções de bugs e melhorias"
                      value={newVersionTitle}
                      onChange={(e) => setNewVersionTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição (Opcional)</label>
                    <Textarea
                      placeholder="Descreva as principais alterações desta versão..."
                      value={newVersionDescription}
                      onChange={(e) => setNewVersionDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateVersion} className="flex-1">
                      <GitCommit className="h-4 w-4 mr-2" />
                      Criar Versão
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Versions View */}
        {viewMode === 'versions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Versões ({versions.length})
              </CardTitle>
              <CardDescription>
                Timeline completo de alterações no projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div key={version.id} className="flex gap-4">
                      
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          version.status === 'active' 
                            ? 'bg-green-500 border-green-500' 
                            : 'bg-gray-300 border-gray-300'
                        }`} />
                        {index < versions.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                        )}
                      </div>

                      {/* Version Card */}
                      <Card className={`flex-1 ${version.status === 'active' ? 'border-green-200' : ''}`}>
                        <CardContent className="p-4">
                          
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg">{version.version}</h3>
                                <Badge variant={version.status === 'active' ? 'default' : 'secondary'}>
                                  {version.status === 'active' ? 'Ativa' : version.status === 'draft' ? 'Rascunho' : 'Arquivada'}
                                </Badge>
                                {version.status === 'active' && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Atual
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{version.title}</h4>
                              <p className="text-sm text-muted-foreground">{version.description}</p>
                            </div>
                          </div>

                          {/* Author & Timestamp */}
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={version.author.avatar} />
                              <AvatarFallback>{version.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{version.author.name}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(version.timestamp).toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{version.size}</span>
                          </div>

                          {/* Changes */}
                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium">Alterações:</p>
                            <div className="grid gap-2">
                              {version.changes.map(change => (
                                <div key={change.id} className={`flex items-center gap-3 p-2 rounded border ${getChangeTypeColor(change.type)}`}>
                                  {getChangeTypeIcon(change.type)}
                                  <span className="text-sm flex-1">{change.description}</span>
                                  {getImpactBadge(change.impact)}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Download className="h-4 w-4" />
                              <span>{version.downloads} downloads</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDownloadVersion(version.id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              
                              {version.status !== 'active' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleRestoreVersion(version.id)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Restaurar
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedVersion(version)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detalhes
                              </Button>
                            </div>
                          </div>

                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Branches View */}
        {viewMode === 'branches' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branches ({branches.length})
              </CardTitle>
              <CardDescription>
                Gerenciamento de branches para desenvolvimento paralelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branches.map(branch => (
                  <Card key={branch.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getBranchStatusIcon(branch.status)}
                        <div>
                          <h3 className="font-semibold">{branch.name}</h3>
                          <p className="text-sm text-muted-foreground">{branch.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{branch.author}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>Criado {new Date(branch.created).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {branch.status === 'active' && (
                          <div className="flex items-center gap-2 text-sm">
                            {branch.commitsAhead > 0 && (
                              <Badge variant="outline" className="text-green-600">
                                +{branch.commitsAhead} à frente
                              </Badge>
                            )}
                            {branch.commitsBehind > 0 && (
                              <Badge variant="outline" className="text-red-600">
                                -{branch.commitsBehind} atrás
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {branch.status === 'active' && (
                            <>
                              <Button variant="outline" size="sm">
                                <GitMerge className="h-4 w-4 mr-2" />
                                Merge
                              </Button>
                              <Button variant="outline" size="sm">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Switch
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compare View */}
        {viewMode === 'compare' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Comparação de Versões
              </CardTitle>
              <CardDescription>
                Compare diferentes versões do projeto lado a lado
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Comparação de Versões</h3>
              <p className="text-muted-foreground mb-4">
                Funcionalidade em desenvolvimento. Em breve você poderá comparar versões lado a lado.
              </p>
              <Button variant="outline">
                Solicitar Feature
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default VersionControl;
