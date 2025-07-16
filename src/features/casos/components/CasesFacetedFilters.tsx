'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, X, Calendar, User, Building, Hash, ArrowUpDown, Users } from 'lucide-react';
import { CaseWithRelations, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getClientsForCases } from '@/features/casos/actions';

interface FilterOptions {
  search: string;
  statusFilter: string[];
  clientFilter: string[];
  parteDemandadaFilter: string[]; // **NUEVO: Filtro por parte demandada**
  sortBy: 'createdAt' | 'caseName' | 'openingDate';
  sortOrder: 'asc' | 'desc';
}

interface CasesFacetedFiltersProps {
  cases: CaseWithRelations[];
  onFilteredCasesChange: (filteredCases: CaseWithRelations[]) => void;
  onFiltersChange?: (filters: Partial<FilterOptions>) => void;
  filters?: FilterOptions;
}

export const CasesFacetedFilters: React.FC<CasesFacetedFiltersProps> = ({
  cases,
  onFilteredCasesChange,
  onFiltersChange,
  filters: externalFilters
}) => {
  // Internal state for when not using external filters
  const [internalFilters, setInternalFilters] = useState<FilterOptions>({
    search: '',
    statusFilter: [],
    clientFilter: [],
    parteDemandadaFilter: [], // **NUEVO: Inicializar filtro de parte demandada**
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Use external filters if provided, otherwise use internal
  const filters = externalFilters || internalFilters;
  const setFilters = onFiltersChange || setInternalFilters;

  // Search term with debouncing
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [clients, setClients] = useState<Client[]>([]);

  // **NUEVO: Extraer partes demandadas únicas de todos los casos**
  const parteDemandadaOptions = useMemo(() => {
    const partesSet = new Set<string>();
    
    cases.forEach(case_ => {
      if (case_.partes) {
        case_.partes
          .filter(parte => parte.type === 'DEMANDADA')
          .forEach(parte => {
            const nombreCompleto = `${parte.firstName} ${parte.lastName}`.trim();
            if (nombreCompleto) {
              partesSet.add(nombreCompleto);
            }
          });
      }
    });

    return Array.from(partesSet).sort();
  }, [cases]);

  // Load clients for filter
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClientsForCases();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    loadClients();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleFilterChange({ search: searchTerm });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.search]);

  // Filter cases when using internal state
  useEffect(() => {
    if (!onFiltersChange) {
      let filtered = cases;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(case_ => 
          case_.caseName.toLowerCase().includes(searchLower) ||
          case_.client?.name.toLowerCase().includes(searchLower) ||
          case_.caseNumber?.toLowerCase().includes(searchLower) ||
          case_.description?.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (filters.statusFilter.length > 0) {
        filtered = filtered.filter(case_ => filters.statusFilter.includes(case_.status));
      }

      // Client filter
      if (filters.clientFilter.length > 0) {
        filtered = filtered.filter(case_ => case_.client && filters.clientFilter.includes(case_.client.id));
      }

      // **NUEVO: Filtro por parte demandada**
      if (filters.parteDemandadaFilter.length > 0) {
        filtered = filtered.filter(case_ => {
          if (!case_.partes) return false;
          
          const partesDemandasNames = case_.partes
            .filter(parte => parte.type === 'DEMANDADA')
            .map(parte => `${parte.firstName} ${parte.lastName}`.trim());
          
          return partesDemandasNames.some(nombre => 
            filters.parteDemandadaFilter.includes(nombre)
          );
        });
      }

      // Sort
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'caseName':
            aValue = a.caseName.toLowerCase();
            bValue = b.caseName.toLowerCase();
            break;
          case 'openingDate':
            aValue = new Date(a.openingDate);
            bValue = new Date(b.openingDate);
            break;
          default:
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      onFilteredCasesChange(filtered);
    }
  }, [cases, filters, onFilteredCasesChange, onFiltersChange]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  }, [filters, setFilters]);

  const clearAllFilters = () => {
    setSearchTerm('');
    handleFilterChange({
      search: '',
      statusFilter: [],
      clientFilter: [],
      parteDemandadaFilter: [], // **NUEVO: Limpiar filtro de parte demandada**
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) + 
    filters.statusFilter.length + 
    filters.clientFilter.length +
    (Array.isArray(filters.parteDemandadaFilter) ? filters.parteDemandadaFilter.length : 0) + // **NUEVO: Incluir en conteo**
    (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc' ? 1 : 0);

  const statusLabels = {
    'ACTIVO': 'Activo',
    'EN_ESPERA': 'En Espera',
    'CERRADO': 'Cerrado',
    'ARCHIVADO': 'Archivado'
  };

  const sortLabels = {
    'createdAt': 'Fecha de Creación',
    'caseName': 'Nombre del Caso',
    'openingDate': 'Fecha de Apertura'
  };

  const handleStatusToggle = (status: string) => {
    const newStatusFilter = filters.statusFilter.includes(status) 
      ? filters.statusFilter.filter(s => s !== status)
      : [...filters.statusFilter, status];
    handleFilterChange({ statusFilter: newStatusFilter });
  };

  const handleClientToggle = (clientId: string) => {
    const newClientFilter = filters.clientFilter.includes(clientId) 
      ? filters.clientFilter.filter(c => c !== clientId)
      : [...filters.clientFilter, clientId];
    handleFilterChange({ clientFilter: newClientFilter });
  };

  // **NUEVO: Función para manejar toggle de parte demandada**
  const handleParteDemandadaToggle = (parteName: string) => {
    const newParteDemandadaFilter = filters.parteDemandadaFilter.includes(parteName) 
      ? filters.parteDemandadaFilter.filter(p => p !== parteName)
      : [...filters.parteDemandadaFilter, parteName];
    handleFilterChange({ parteDemandadaFilter: newParteDemandadaFilter });
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy'], sortOrder: FilterOptions['sortOrder']) => {
    handleFilterChange({ sortBy, sortOrder });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {/* Search */}
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar casos, clientes o números..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-sm"
        />
      </div>

      {/* Status Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <Hash className="mr-2 h-3 w-3" />
            Estado
            {filters.statusFilter.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                {filters.statusFilter.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-3">
            <div className="space-y-2">
              {Object.entries(statusLabels).map(([status, label]) => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters.statusFilter.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 h-3 w-3"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Client Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <User className="mr-2 h-3 w-3" />
            Cliente
            {filters.clientFilter.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                {filters.clientFilter.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-3 max-h-[250px] overflow-y-auto">
            <div className="space-y-2">
              {clients.map((client) => (
                <label key={client.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters.clientFilter.includes(client.id)}
                    onChange={() => handleClientToggle(client.id)}
                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 h-3 w-3"
                  />
                  <span className="text-sm truncate">{client.name}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* **NUEVO: Filtro por Parte Demandada** */}
      {parteDemandadaOptions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-dashed h-8">
              <Users className="mr-2 h-3 w-3" />
              Parte Demandada
              {filters.parteDemandadaFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                  {filters.parteDemandadaFilter.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <div className="p-3 max-h-[250px] overflow-y-auto">
              <div className="space-y-2">
                {parteDemandadaOptions.map((parteName) => (
                  <label key={parteName} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.parteDemandadaFilter.includes(parteName)}
                      onChange={() => handleParteDemandadaToggle(parteName)}
                      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 h-3 w-3"
                    />
                    <span className="text-sm truncate">{parteName}</span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Sort Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <ArrowUpDown className="mr-2 h-3 w-3" />
            Ordenar
            {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <div className="p-3">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ordenar por:</label>
                <div className="space-y-2">
                  {Object.entries(sortLabels).map(([sortBy, label]) => (
                    <label key={sortBy} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="sortBy"
                        value={sortBy}
                        checked={filters.sortBy === sortBy}
                        onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'], filters.sortOrder)}
                        className="border-gray-300 text-slate-600 focus:ring-slate-500 h-3 w-3"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Dirección:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={filters.sortOrder === 'desc'}
                      onChange={() => handleSortChange(filters.sortBy, 'desc')}
                      className="border-gray-300 text-slate-600 focus:ring-slate-500 h-3 w-3"
                    />
                    <span className="text-sm">Descendente</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={filters.sortOrder === 'asc'}
                      onChange={() => handleSortChange(filters.sortBy, 'asc')}
                      className="border-gray-300 text-slate-600 focus:ring-slate-500 h-3 w-3"
                    />
                    <span className="text-sm">Ascendente</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 px-2 lg:px-3 text-xs"
        >
          Limpiar
          <X className="ml-1 h-3 w-3" />
        </Button>
      )}

      {/* Active Filters Count */}
      {activeFiltersCount > 0 && (
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};