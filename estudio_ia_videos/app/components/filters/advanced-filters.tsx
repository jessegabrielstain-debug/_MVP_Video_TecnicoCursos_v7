
'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Badge } from '../ui/badge'
import { Filter, X, Calendar, Tag, User, Clock, SortAsc, SortDesc } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'date' | 'text' | 'number'
  options?: Array<{ value: string; label: string }>
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

interface AdvancedFiltersProps {
  filters: FilterConfig[]
  onFilterChange: (filters: Record<string, unknown>) => void
  onSortChange?: (sort: SortConfig) => void
  activeFilters?: Record<string, unknown>
  sortOptions?: Array<{ value: string; label: string }>
}

export function AdvancedFilters({
  filters,
  onFilterChange,
  onSortChange,
  activeFilters = {},
  sortOptions = []
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, unknown>>(activeFilters)
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const activeFilterCount = Object.keys(localFilters).filter(key => localFilters[key]).length

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilter = (key: string) => {
    const newFilters = { ...localFilters }
    delete newFilters[key]
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearAll = () => {
    setLocalFilters({})
    onFilterChange({})
  }

  const handleSortChange = () => {
    if (sortField && onSortChange) {
      onSortChange({ field: sortField, direction: sortDirection })
    }
  }

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    setSortDirection(newDirection)
    if (sortField && onSortChange) {
      onSortChange({ field: sortField, direction: newDirection })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Popover de filtros */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filtros</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar tudo
                </Button>
              )}
            </div>

            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium">{filter.label}</label>
                {filter.type === 'select' && filter.options && (
                  <Select
                    value={(localFilters[filter.key] as string) || 'all'}
                    onValueChange={(value) => handleFilterChange(filter.key, value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === 'text' && (
                  <Input
                    value={(localFilters[filter.key] as string) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={`Buscar ${filter.label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Ordenação */}
      {sortOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={(value) => {
            setSortField(value)
            if (onSortChange) {
              onSortChange({ field: value, direction: sortDirection })
            }
          }}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sortField && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortDirection}
              className="h-9 w-9 p-0"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* Tags de filtros ativos */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([key, value]) => {
            if (!value) return null
            const filter = filters.find(f => f.key === key)
            if (!filter) return null

            const label = filter.options?.find(o => o.value === value)?.label || String(value)

            return (
              <Badge key={key} variant="secondary" className="pl-2 pr-1">
                <span className="text-xs">{filter.label}: {label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => handleClearFilter(key)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
