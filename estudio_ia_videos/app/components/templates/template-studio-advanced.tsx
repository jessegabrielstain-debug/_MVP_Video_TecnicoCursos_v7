'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Download, 
  Upload, 
  Eye, 
  Settings, 
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Layers,
  Palette,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Copy,
  Trash2,
  Edit,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Info,
  ExternalLink,
  Sparkles,
  Brain,
  Target,
  Gauge
} from 'lucide-react';
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates';
import { Template, NRCategory, TemplateFilter, TemplateSort } from '@/types/templates';
import { toast } from 'sonner';

interface TemplateStudioAdvancedProps {
  onTemplateSelect?: (template: Template) => void;
  onTemplateEdit?: (template: Template) => void;
  className?: string;
}

export const TemplateStudioAdvanced: React.FC<TemplateStudioAdvancedProps> = ({
  onTemplateSelect,
  onTemplateEdit,
  className = '',
}) => {
  const {
    templates,
    filteredTemplates,
    filter,
    sort,
    isLoading,
    setFilter,
    setSort,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite,
    duplicateTemplate,
    exportTemplate,
    importTemplate,
    // Advanced features
    generate3DPreview,
    suggestCategories,
    generateTags,
    validateCompliance,
    optimizeTemplate,
    getRecommendations,
    batchValidate,
    batchOptimize,
    getTemplateAnalytics,
    getUsagePatterns,
    isProcessing,
  } = useAdvancedTemplates();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [complianceResults, setComplianceResults] = useState<Record<string, unknown>>({});
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [recommendations, setRecommendations] = useState<Template[]>([]);

  // Load analytics and compliance data
  useEffect(() => {
    loadTemplateData();
  }, [filteredTemplates]);

  const loadTemplateData = async () => {
    try {
      // Load analytics for visible templates
      const analyticsPromises = filteredTemplates.slice(0, 10).map(async (template) => {
        const analytics = await getTemplateAnalytics(template.id);
        return { [template.id]: analytics };
      });
      
      const analyticsResults = await Promise.all(analyticsPromises);
      const analyticsData = analyticsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setAnalytics(analyticsData);
    } catch (error) {
      logger.error('Failed to load template data', error instanceof Error ? error : new Error(String(error)), { component: 'TemplateStudioAdvanced' });
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setPreviewTemplate(template);
    onTemplateSelect?.(template);
  };

  // Handle compliance validation
  const handleValidateCompliance = async (templateId: string) => {
    try {
      const result = await validateCompliance(templateId);
      setComplianceResults(prev => ({ ...prev, [templateId]: result }));
      
      if (result.isCompliant) {
        toast.success('Template está em conformidade!');
      } else {
        toast.warning(`Template tem ${result.issues.length} problemas de conformidade`);
      }
    } catch (error) {
      toast.error('Erro ao validar conformidade');
    }
  };

  // Handle template optimization
  const handleOptimizeTemplate = async (templateId: string) => {
    try {
      await optimizeTemplate(templateId);
      toast.success('Template otimizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao otimizar template');
    }
  };

  // Handle 3D preview generation
  const handleGenerate3DPreview = async (templateId: string) => {
    try {
      const previewUrl = await generate3DPreview(templateId);
      toast.success('Preview 3D gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar preview 3D');
    }
  };

  // Handle batch operations
  const handleBatchValidation = async () => {
    if (selectedTemplates.length === 0) {
      toast.warning('Selecione templates para validação em lote');
      return;
    }

    try {
      const result = await batchValidate(selectedTemplates);
      toast.success(`Validação concluída: ${result.compliant}/${result.total} templates em conformidade`);
      setSelectedTemplates([]);
    } catch (error) {
      toast.error('Erro na validação em lote');
    }
  };

  const handleBatchOptimization = async () => {
    if (selectedTemplates.length === 0) {
      toast.warning('Selecione templates para otimização em lote');
      return;
    }

    try {
      const result = await batchOptimize(selectedTemplates);
      toast.success(`Otimização concluída: ${result.optimized}/${result.total} templates otimizados`);
      setSelectedTemplates([]);
    } catch (error) {
      toast.error('Erro na otimização em lote');
    }
  };

  // Handle template recommendations
  const handleGetRecommendations = async (templateId: string) => {
    try {
      const recs = await getRecommendations(templateId);
      setRecommendations(recs);
    } catch (error) {
      toast.error('Erro ao obter recomendações');
    }
  };

  // Memoized filtered and sorted templates
  const displayTemplates = useMemo(() => {
    return filteredTemplates;
  }, [filteredTemplates]);

  // Categories for filtering
  const categories: NRCategory[] = [
    'NR-12', 'NR-35', 'NR-33', 'NR-10', 'NR-06', 'NR-23', 'NR-18', 'NR-05', 'NR-07', 'NR-09'
  ];

  const categoryOptions = categories;
  const difficultyOptions: Array<NonNullable<TemplateFilter['difficulty']>[number]> = [
    'beginner',
    'intermediate',
    'advanced',
  ];
  const complianceOptions: NonNullable<TemplateFilter['compliance']>[] = ['compliant', 'non-compliant', 'pending'];
  const sortFieldOptions: TemplateSort['field'][] = ['name', 'createdAt', 'updatedAt', 'downloads', 'rating', 'usage'];

  const isNRCategory = (value: string): value is NRCategory => {
    return categoryOptions.includes(value as NRCategory);
  };

  const isDifficulty = (value: string): value is NonNullable<TemplateFilter['difficulty']>[number] => {
    return (difficultyOptions as readonly string[]).includes(value);
  };

  const isComplianceStatus = (value: string): value is NonNullable<TemplateFilter['compliance']> => {
    return complianceOptions.includes(value as NonNullable<TemplateFilter['compliance']>);
  };

  const isSortField = (value: string): value is TemplateSort['field'] => {
    return sortFieldOptions.includes(value as TemplateSort['field']);
  };

  return (
    <div className={`template-studio-advanced ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Template Studio Avançado</h2>
            <p className="text-gray-600 mt-1">
              Sistema completo de gerenciamento de templates com IA e compliance automático
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros Avançados
            </Button>
            <Button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Categoria NR
                  </label>
                  <Select
                    value={filter.category?.[0] ?? ''}
                    onValueChange={(value) => {
                      if (!value) {
                        setFilter({ category: undefined });
                        return;
                      }
                      if (isNRCategory(value)) {
                        setFilter({ category: [value] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Dificuldade
                  </label>
                  <Select
                    value={filter.difficulty?.[0] ?? ''}
                    onValueChange={(value) => {
                      if (!value) {
                        setFilter({ difficulty: undefined });
                        return;
                      }
                      if (isDifficulty(value)) {
                        setFilter({ difficulty: [value] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as dificuldades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as dificuldades</SelectItem>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status de Compliance
                  </label>
                  <Select
                    value={filter.compliance ?? ''}
                    onValueChange={(value) => {
                      if (!value) {
                        setFilter({ compliance: undefined });
                        return;
                      }
                      if (isComplianceStatus(value)) {
                        setFilter({ compliance: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="compliant">Em conformidade</SelectItem>
                      <SelectItem value="non-compliant">Não conforme</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Ordenação
                  </label>
                  <Select
                    value={sort.field}
                    onValueChange={(value) => {
                      if (isSortField(value)) {
                        setSort({ field: value, direction: sort.direction });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="createdAt">Data de criação</SelectItem>
                      <SelectItem value="updatedAt">Última atualização</SelectItem>
                      <SelectItem value="rating">Avaliação</SelectItem>
                      <SelectItem value="usage">Uso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorites"
                    checked={filter.favorites ?? false}
                    onCheckedChange={(checked) => {
                      setFilter({ favorites: checked === true ? true : undefined });
                    }}
                  />
                  <label htmlFor="favorites" className="text-sm font-medium text-gray-700">
                    Apenas favoritos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has3d"
                    checked={filter.has3DPreview ?? false}
                    onCheckedChange={(checked) => {
                      setFilter({ has3DPreview: checked === true ? true : undefined });
                    }}
                  />
                  <label htmlFor="has3d" className="text-sm font-medium text-gray-700">
                    Com preview 3D
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar templates..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedTemplates.length > 0 && (
              <>
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedTemplates.length} selecionados
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchValidation}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Validar Lote
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchOptimization}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Otimizar Lote
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplates([])}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}

            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
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
        </div>

        {/* Templates Grid/List */}
        <div className={`templates-container ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}`}>
          {displayTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode={viewMode}
              isSelected={selectedTemplates.includes(template.id)}
              analytics={analytics[template.id]}
              complianceResult={complianceResults[template.id]}
              onSelect={() => handleTemplateSelect(template)}
              onToggleSelect={() => {
                setSelectedTemplates(prev =>
                  prev.includes(template.id)
                    ? prev.filter(id => id !== template.id)
                    : [...prev, template.id]
                );
              }}
              onEdit={() => onTemplateEdit?.(template)}
              onValidateCompliance={() => handleValidateCompliance(template.id)}
              onOptimize={() => handleOptimizeTemplate(template.id)}
              onGenerate3D={() => handleGenerate3DPreview(template.id)}
              onGetRecommendations={() => handleGetRecommendations(template.id)}
              onToggleFavorite={() => toggleFavorite(template.id)}
              onDuplicate={() => duplicateTemplate(template.id)}
              onDelete={() => deleteTemplate(template.id)}
              isProcessing={isProcessing}
            />
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-600">Carregando templates...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Layers className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou criar um novo template
            </p>
            <Button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: Template;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  analytics?: any;
  complianceResult?: any;
  onSelect: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
  onValidateCompliance: () => void;
  onOptimize: () => void;
  onGenerate3D: () => void;
  onGetRecommendations: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isProcessing: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  isSelected,
  analytics,
  complianceResult,
  onSelect,
  onToggleSelect,
  onEdit,
  onValidateCompliance,
  onOptimize,
  onGenerate3D,
  onGetRecommendations,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  isProcessing,
}) => {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card className={`template-card-list ${isSelected ? 'ring-2 ring-blue-500' : ''} hover:shadow-md transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
            />
            
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {template.preview ? (
                <img src={template.preview} alt={template.name} className="w-full h-full object-cover" />
              ) : (
                <Layers className="w-8 h-8 text-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <Badge variant="outline">{template.category}</Badge>
                {template.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
              </div>
              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {template.metadata.estimatedDuration}min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {template.metadata.targetAudience.join(', ')}
                </span>
                {analytics && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {analytics.usage.views} visualizações
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {complianceResult && (
                <div className="flex items-center gap-1">
                  {complianceResult.isCompliant ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs font-medium">
                    {complianceResult.score}%
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">{template.rating.toFixed(1)}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showActions && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <Button size="sm" onClick={onSelect} className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Visualizar
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit} className="flex items-center gap-1">
                <Edit className="w-3 h-3" />
                Editar
              </Button>
              <Button size="sm" variant="outline" onClick={onValidateCompliance} className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Validar
              </Button>
              <Button size="sm" variant="outline" onClick={onOptimize} className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Otimizar
              </Button>
              <Button size="sm" variant="outline" onClick={onGenerate3D} className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                3D
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`template-card-grid ${isSelected ? 'ring-2 ring-blue-500' : ''} hover:shadow-lg transition-all group`}>
      <div className="relative">
        <div className="aspect-video rounded-t-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
          {template.preview ? (
            <img src={template.preview} alt={template.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="bg-white/90 border-white"
          />
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {template.category}
          </Badge>
          {template.isFavorite && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
        </div>

        {complianceResult && (
          <div className="absolute bottom-2 left-2">
            <Badge 
              variant={complianceResult.isCompliant ? "default" : "destructive"}
              className="text-xs"
            >
              {complianceResult.isCompliant ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {complianceResult.score}%
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.metadata.estimatedDuration}min
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            {template.rating.toFixed(1)}
          </span>
          {analytics && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {analytics.usage.views}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={onSelect}
            className="flex-1 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            Visualizar
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowActions(!showActions)}
            className="px-2"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>

        {showActions && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-1">
            <Button size="sm" variant="outline" onClick={onEdit} className="text-xs">
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={onValidateCompliance} className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Validar
            </Button>
            <Button size="sm" variant="outline" onClick={onOptimize} className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Otimizar
            </Button>
            <Button size="sm" variant="outline" onClick={onGenerate3D} className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              3D
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateStudioAdvanced;