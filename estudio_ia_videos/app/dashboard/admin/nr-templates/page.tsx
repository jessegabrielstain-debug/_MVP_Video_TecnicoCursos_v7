'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react';
import type { NRTemplate } from '@/lib/services/nr-templates-service';

export default function NRTemplatesAdminPage() {
  const [templates, setTemplates] = useState<NRTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<NRTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NRTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<NRTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Carrega templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filtra templates por busca
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = templates.filter(
        t => 
          t.nr_number.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const response = await fetch('/api/nr-templates');
      if (!response.ok) throw new Error('Falha ao carregar templates');
      const data = await response.json();
      setTemplates(data);
      setFilteredTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      alert('Erro ao carregar templates. Verifique o console.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(formData: FormData) {
    try {
      const template = {
        nr_number: formData.get('nr_number') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        slide_count: parseInt(formData.get('slide_count') as string),
        duration_seconds: parseInt(formData.get('duration_seconds') as string),
        template_config: JSON.parse(formData.get('template_config') as string || '{}'),
      };

      const response = await fetch('/api/nr-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) throw new Error('Falha ao criar template');
      
      setIsCreateDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      alert('Erro ao criar template. Verifique o console.');
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingTemplate) return;

    try {
      const updates = {
        id: editingTemplate.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        slide_count: parseInt(formData.get('slide_count') as string),
        duration_seconds: parseInt(formData.get('duration_seconds') as string),
        template_config: JSON.parse(formData.get('template_config') as string || '{}'),
      };

      const response = await fetch('/api/nr-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Falha ao atualizar template');
      
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      alert('Erro ao atualizar template. Verifique o console.');
    }
  }

  async function handleDelete() {
    if (!deletingTemplate) return;

    try {
      const response = await fetch(`/api/nr-templates?id=${deletingTemplate.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Falha ao deletar template');
      
      setDeletingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      alert('Erro ao deletar template. Verifique o console.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Templates de NRs</h1>
          <p className="text-gray-600 mt-1">Gerenciar templates de Normas Regulamentadoras</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo template de NR
              </DialogDescription>
            </DialogHeader>
            <TemplateForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por NR, título ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline">{template.nr_number}</Badge>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingTemplate(template)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{template.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description || 'Sem descrição'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{template.slide_count} slides</span>
                <span>{Math.floor(template.duration_seconds / 60)}min</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Nenhum template encontrado</p>
        </div>
      )}

      {/* Dialog de Edição */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
              <DialogDescription>
                Atualize os dados do template {editingTemplate.nr_number}
              </DialogDescription>
            </DialogHeader>
            <TemplateForm 
              template={editingTemplate} 
              onSubmit={handleUpdate} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      {deletingTemplate && (
        <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar o template <strong>{deletingTemplate.nr_number}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Componente de formulário reutilizável
function TemplateForm({ 
  template, 
  onSubmit 
}: { 
  template?: NRTemplate; 
  onSubmit: (formData: FormData) => void;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!template && (
        <div>
          <Label htmlFor="nr_number">Número da NR *</Label>
          <Input 
            id="nr_number" 
            name="nr_number" 
            placeholder="NR-01" 
            required 
          />
        </div>
      )}

      <div>
        <Label htmlFor="title">Título *</Label>
        <Input 
          id="title" 
          name="title" 
          defaultValue={template?.title}
          placeholder="Nome da Norma Regulamentadora" 
          required 
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={template?.description || ''}
          placeholder="Descrição detalhada da NR..." 
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slide_count">Slides *</Label>
          <Input 
            id="slide_count" 
            name="slide_count" 
            type="number" 
            defaultValue={template?.slide_count || 5}
            min="1"
            required 
          />
        </div>
        <div>
          <Label htmlFor="duration_seconds">Duração (segundos) *</Label>
          <Input 
            id="duration_seconds" 
            name="duration_seconds" 
            type="number" 
            defaultValue={template?.duration_seconds || 300}
            min="1"
            required 
          />
        </div>
      </div>

      <div>
        <Label htmlFor="template_config">Configuração (JSON)</Label>
        <Textarea 
          id="template_config" 
          name="template_config" 
          defaultValue={JSON.stringify(template?.template_config || {}, null, 2)}
          placeholder='{"themeColor": "#1e3a8a", "avatarEnabled": true}'
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {template ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
