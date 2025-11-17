'use client';

import React, { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, TemplateFilter, TemplateSort, NRCategory } from '@/types/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Star, 
  StarOff, 
  Copy, 
  Trash2, 
  Edit, 
  Eye, 
  MoreVertical,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Plus,
  BookOpen,
  Award,
  Clock,
  Users,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  onCreateNew?: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onCreateNew,
}) => {
  const {
    templates,
    filteredTemplates,
    favorites,
    isLoading,
    error,
    filter,
    sort,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleFavorite,
    setFilter,
    setSort,
    clearFilters,
    exportTemplate,
    exportTemplates,
    importTemplate,
    getCategories,
    getTags,
    getTemplatesByCategory,
    searchTemplates,
    getTemplateStats,
  } = useTemplates();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const stats = getTemplateStats();
  const categories = getCategories();
  const tags = getTags();

  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };

  const handleCategoryFilter = (category: NRCategory | 'all') => {
    if (category === 'all') {
      setFilter({ category: undefined });
    } else {
      setFilter({ category: [category] });
    }
  };

  const handleDifficultyFilter = (difficulty: string) => {
    if (difficulty === 'all') {
      setFilter({ difficulty: undefined });
    } else {
      setFilter({ difficulty: [difficulty as 'beginner' | 'intermediate' | 'advanced'] });
    }
  };

  const handleSort = (field: TemplateSort['field']) => {
    const newDirection: TemplateSort['direction'] =
      sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ field, direction: newDirection });
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
      toast.success('Template atualizado com sucesso');
    } catch (err) {
      toast.error('Erro ao atualizar template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTemplate(id);
      toast.success('Template duplicado com sucesso');
    } catch (err) {
      toast.error('Erro ao duplicar template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast.success('Template excluído com sucesso');
    } catch (err) {
      toast.error('Erro ao excluir template');
    }
  };

  const handleExport = async (id: string) => {
    try {
      const blob = await exportTemplate(id, { format: 'json', includeAssets: true, compression: false, metadata: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template exportado com sucesso');
    } catch (err) {
      toast.error('Erro ao exportar template');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importTemplate(file);
      toast.success('Template importado com sucesso');
    } catch (err) {
      toast.error('Erro ao importar template');
    }
  };

  const handleSelectTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      setPreviewTemplate(template);
    }
  };

  const toggleTemplateSelection = (id: string) => {
    setSelectedTemplates(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <div className="relative">
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-full h-48 object-cover rounded-t-lg"
          onClick={() => handleSelectTemplate(template)}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(template.id);
            }}
          >
            {template.isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(template.id)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </DropdownMenuItem>
              {template.isCustom && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge 
          variant={template.metadata.difficulty === 'beginner' ? 'secondary' : 
                  template.metadata.difficulty === 'intermediate' ? 'default' : 'destructive'}
          className="absolute bottom-2 left-2"
        >
          {template.metadata.difficulty === 'beginner' ? 'Básico' :
           template.metadata.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {template.description}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {template.metadata.estimatedDuration}min
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {template.downloads}
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {template.rating.toFixed(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{template.category}</Badge>
          <div className="flex gap-1">
            {template.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TemplateListItem: React.FC<{ template: Template }> = ({ template }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-16 h-16 object-cover rounded"
            onClick={() => handleSelectTemplate(template)}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-1">
                  {template.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{template.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {template.metadata.estimatedDuration}min
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {template.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {template.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleFavorite(template.id)}
                >
                  {template.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(template.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                    {template.isCustom && (
                      <DropdownMenuItem 
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Templates</h1>
          <p className="text-muted-foreground">
            {stats.total} templates disponíveis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo
          </Button>
          <label htmlFor="import-template">
            <Button variant="outline" className="gap-2" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Importar
              </span>
            </Button>
          </label>
          <input
            id="import-template"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.favorites}</p>
                <p className="text-sm text-muted-foreground">Favoritos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.custom}</p>
                <p className="text-sm text-muted-foreground">Personalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categorias NR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              className="pl-10"
              value={filter.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter.category?.[0] || 'all'} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter.difficulty?.[0] || 'all'} onValueChange={handleDifficultyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="beginner">Básico</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 10).map(tag => (
                    <Badge
                      key={tag}
                      variant={filter.tags?.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentTags = filter.tags || [];
                        const newTags = currentTags.includes(tag)
                          ? currentTags.filter(t => t !== tag)
                          : [...currentTags, tag];
                        setFilter({ tags: newTags.length > 0 ? newTags : undefined });
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Favoritos</label>
                <div className="flex gap-2">
                  <Button
                    variant={filter.isFavorite === true ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter({ isFavorite: filter.isFavorite === true ? undefined : true })}
                  >
                    Apenas Favoritos
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <div className="flex gap-2">
                  <Button
                    variant={filter.isCustom === true ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter({ isCustom: filter.isCustom === true ? undefined : true })}
                  >
                    Personalizados
                  </Button>
                  <Button
                    variant={filter.isCustom === false ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter({ isCustom: filter.isCustom === false ? undefined : false })}
                  >
                    Sistema
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('name')}
            className="gap-1"
          >
            Nome
            {sort.field === 'name' && (
              sort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('rating')}
            className="gap-1"
          >
            Avaliação
            {sort.field === 'rating' && (
              sort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('downloads')}
            className="gap-1"
          >
            Downloads
            {sort.field === 'downloads' && (
              sort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Templates Grid/List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos ({favorites.length})</TabsTrigger>
          {categories.slice(0, 3).map(category => (
            <TabsTrigger key={category} value={category}>
              {category} ({getTemplatesByCategory(category).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map(template => (
                <TemplateListItem key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map(template => (
                <TemplateListItem key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        {categories.slice(0, 3).map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getTemplatesByCategory(category).map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getTemplatesByCategory(category).map(template => (
                  <TemplateListItem key={template.id} template={template} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou criar um novo template.
          </p>
          <Button onClick={clearFilters} variant="outline">
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {previewTemplate.name}
                  <Badge variant="outline">{previewTemplate.category}</Badge>
                </DialogTitle>
                <DialogDescription>
                  {previewTemplate.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <img
                  src={previewTemplate.preview}
                  alt={previewTemplate.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Dificuldade:</span>
                        <Badge variant={
                          previewTemplate.metadata.difficulty === 'beginner' ? 'secondary' :
                          previewTemplate.metadata.difficulty === 'intermediate' ? 'default' : 'destructive'
                        }>
                          {previewTemplate.metadata.difficulty === 'beginner' ? 'Básico' :
                           previewTemplate.metadata.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Duração:</span>
                        <span>{previewTemplate.metadata.estimatedDuration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avaliação:</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {previewTemplate.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads:</span>
                        <span>{previewTemplate.downloads}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Objetivos de Aprendizagem</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {previewTemplate.metadata.learningObjectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Público-alvo</h4>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.metadata.targetAudience.map(audience => (
                      <Badge key={audience} variant="outline" className="text-xs">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleFavorite(previewTemplate.id)}
                    className="gap-2"
                  >
                    {previewTemplate.isFavorite ? (
                      <>
                        <StarOff className="h-4 w-4" />
                        Remover dos Favoritos
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4" />
                        Adicionar aos Favoritos
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (onSelectTemplate) {
                        onSelectTemplate(previewTemplate);
                        setPreviewTemplate(null);
                      }
                    }}
                  >
                    Usar Template
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};