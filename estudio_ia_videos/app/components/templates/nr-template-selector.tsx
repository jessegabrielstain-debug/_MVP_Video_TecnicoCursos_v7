
'use client';

/**
 * 🧩 NR Template Selector
 * Choose from available NR templates
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Award, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NRTemplate {
  id: string;
  nr: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  thumbnailUrl: string;
  certification?: string;
  slides: Record<string, unknown>[];
}

interface NRTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function NRTemplateSelector({ open, onClose }: NRTemplateSelectorProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<NRTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NRTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates/nr');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: NRTemplate) => {
    setSelectedTemplate(template);
    setProjectName(template.title);
  };

  const handleCreateProject = async () => {
    if (!selectedTemplate) return;

    setCreating(true);
    try {
      const response = await fetch('/api/templates/nr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          projectName: projectName || selectedTemplate.title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();
      toast.success('Projeto criado com sucesso!');
      
      // Redirect to editor
      router.push(`/editor/${data.project.id}`);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto');
    } finally {
      setCreating(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Templates de Normas Regulamentadoras</DialogTitle>
          <DialogDescription>
            Escolha um template certificado para criar seu treinamento de segurança do trabalho
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Templates Grid */}
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="mb-2">{template.nr}</Badge>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(template.duration)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {template.slides?.length || 0} slides
                        </div>
                      </div>
                      {template.certification && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                          <Award className="w-4 h-4" />
                          {template.certification}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Template Details */}
          {selectedTemplate && (
            <Card className="w-96 flex flex-col">
              <CardHeader>
                <Badge className="w-fit mb-2">{selectedTemplate.nr}</Badge>
                <CardTitle>{selectedTemplate.title}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-medium">Nome do Projeto</label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Digite o nome do projeto"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Duração</div>
                      <div className="font-medium">{formatDuration(selectedTemplate.duration)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Slides</div>
                      <div className="font-medium">{selectedTemplate.slides?.length || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Categoria</div>
                      <div className="font-medium">{selectedTemplate.category}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Certificação</div>
                      <div className="font-medium">{selectedTemplate.certification || 'N/A'}</div>
                    </div>
                  </div>

                  {selectedTemplate.certification && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-green-900">Template Certificado</div>
                          <div className="text-sm text-green-700">
                            Este template está em conformidade com as normas do MTE
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900">Sobre os Templates</div>
                        <div className="text-sm text-blue-700">
                          Os templates incluem conteúdo pré-pronto que pode ser personalizado de acordo com suas necessidades
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!projectName || creating}
                    className="flex-1"
                  >
                    {creating ? 'Criando...' : 'Criar Projeto'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
