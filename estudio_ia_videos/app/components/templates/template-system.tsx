'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Star, 
  Heart, 
  Eye, 
  Copy, 
  Trash2, 
  Edit, 
  Play,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Plus,
  Settings
} from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, NRCategory } from '@/types/templates';
import { TemplateCard } from './template-card';
import { TemplatePreview } from './template-preview';
import { TemplateEditor } from './template-editor';
import { TemplateFilters } from './template-filters';
import { TemplateImportExport } from './template-import-export';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface TemplateSystemProps {
  className?: string;
}

export const TemplateSystem: React.FC<TemplateSystemProps> = ({ className }) => {
  const {
    templates,
    filteredTemplates,
    favorites,
    isLoading,
    error,
    filter,
    sort,
    setFilter,
    setSort,
    clearFilters,
    searchTemplates,
    toggleFavorite,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplate,
    importTemplate,
    getTemplateStats,
  } = useTemplates();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  // Derive customTemplates from templates
  const customTemplates = templates.filter(t => t.isCustom);
  const categoryStats = getTemplateStats();

  const handleUseTemplate = async (template: Template) => {
    try {
      setIsCreatingProject(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
            title: "Authentication required",
            description: "Please login to create a project",
            variant: "destructive"
        });
        return;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: `${template.name}`,
          type: 'template-nr',
          user_id: user.id,
          status: 'draft',
          thumbnail_url: template.thumbnail,
          render_settings: JSON.parse(JSON.stringify({
            template_id: template.id,
            template_data: template
          }))
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created",
        description: "Redirecting to editor...",
      });

      router.push(`/editor/timeline/${project.id}`);
      
    } catch (error) {
      logger.error('Failed to create project', error instanceof Error ? error : new Error(String(error)), { component: 'TemplateSystem', action: 'handleUseTemplate' });
      toast({
        title: "Error",
        description: "Failed to create project from template",
        variant: "destructive"
      });
    } finally {
      setIsCreatingProject(false);
    }
  };


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchTemplates(query);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleDuplicate = async (template: Template) => {
    try {
      await duplicateTemplate(template.id);
    } catch (error) {
      logger.error('Failed to duplicate template', error instanceof Error ? error : new Error(String(error)), { component: 'TemplateSystem', templateId: template.id });
    }
  };

  const handleDelete = async (template: Template) => {
    if (window.confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
      } catch (error) {
        logger.error('Failed to delete template', error instanceof Error ? error : new Error(String(error)), { component: 'TemplateSystem', templateId: template.id });
      }
    }
  };

  const handleExport = (template: Template) => {
    setSelectedTemplate(template);
    setImportExportMode('export');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Erro ao carregar templates: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Templates</h2>
          <p className="text-gray-600">Gerencie e organize seus templates de vídeo</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setImportExportMode('import')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar/Exportar
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <TemplateFilters
          filter={filter}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          categoryStats={categoryStats.byCategory}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Grid className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personalizados</p>
                <p className="text-2xl font-bold text-gray-900">{customTemplates.length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtrados</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTemplates.length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos ({templates.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos ({favorites.length})</TabsTrigger>
          <TabsTrigger value="custom">Personalizados ({customTemplates.length})</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TemplateGrid
            templates={filteredTemplates}
            viewMode={viewMode}
            onSelect={handleTemplateSelect}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onExport={handleExport}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <TemplateGrid
            templates={favorites}
            viewMode={viewMode}
            onSelect={handleTemplateSelect}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onExport={handleExport}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <TemplateGrid
            templates={customTemplates}
            viewMode={viewMode}
            onSelect={handleTemplateSelect}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onExport={handleExport}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <TemplateGrid
            templates={templates.slice().sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            ).slice(0, 20)}
            viewMode={viewMode}
            onSelect={handleTemplateSelect}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onExport={handleExport}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onEdit={() => {
            setShowPreview(false);
            setShowEditor(true);
          }}
          onUse={() => handleUseTemplate(selectedTemplate)}
        />
      )}

      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => setShowEditor(false)}
          onSave={async (template) => {
            try {
              if (selectedTemplate) {
                await updateTemplate(selectedTemplate.id, template);
              } else {
                await createTemplate(template as Omit<Template, 'id' | 'createdAt' | 'updatedAt'>);
              }
              setShowEditor(false);
            } catch (error) {
              logger.error('Failed to save template', error instanceof Error ? error : new Error(String(error)), { component: 'TemplateSystem', action: 'saveTemplate' });
            }
          }}
        />
      )}

      {importExportMode && (
        <TemplateImportExport
          mode={importExportMode}
          template={importExportMode === 'export' ? selectedTemplate || undefined : undefined}
          onClose={() => setImportExportMode(null)}
          onImport={async (templates) => {
            for (const template of templates) {
              await createTemplate(template as Omit<Template, 'id' | 'createdAt' | 'updatedAt'>);
            }
            setImportExportMode(null);
          }}
          onExport={(format, data) => {
            logger.debug('Exporting template', { component: 'TemplateSystem', format });
          }}
        />
      )}
    </div>
  );
};

interface TemplateGridProps {
  templates: Template[];
  viewMode: 'grid' | 'list';
  onSelect: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onDelete: (template: Template) => void;
  onExport: (template: Template) => void;
  onToggleFavorite: (id: string) => void;
}

const TemplateGrid: React.FC<TemplateGridProps> = ({
  templates,
  viewMode,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onExport,
  onToggleFavorite,
}) => {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Grid className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
        <p className="text-gray-600">Tente ajustar os filtros ou criar um novo template.</p>
      </div>
    );
  }

  return (
    <div className={
      viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        : 'space-y-4'
    }>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          viewMode={viewMode}
          onSelect={() => onSelect(template)}
          onEdit={() => onEdit(template)}
          onDuplicate={() => onDuplicate(template)}
          onDelete={() => onDelete(template)}
          onExport={() => onExport(template)}
          onFavorite={() => onToggleFavorite(template.id)}
        />
      ))}
    </div>
  );
};