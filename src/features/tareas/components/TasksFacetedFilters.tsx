'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, User, Building, Hash, Clock, ArrowUpDown } from 'lucide-react';
import { TaskWithRelations, User as UserType, CaseWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface FilterOptions {
  search: string;
  statusFilter: string[];
  priorityFilter: string[];
  assigneeFilter: string[];
  caseFilter: string[];
  sortBy: 'createdAt' | 'priority';
  sortOrder: 'asc' | 'desc';
}

interface TasksFacetedFiltersProps {
  tasks: TaskWithRelations[];
  users: UserType[];
  cases: CaseWithRelations[];
  onFilteredTasksChange: (filteredTasks: TaskWithRelations[]) => void;
  onFiltersChange?: (filters: Partial<FilterOptions>) => void;
  filters?: FilterOptions;
}

export const TasksFacetedFilters: React.FC<TasksFacetedFiltersProps> = ({
  tasks,
  users,
  cases,
  onFilteredTasksChange,
  onFiltersChange,
  filters: externalFilters
}) => {
  // Internal state for when not using external filters
  const [internalFilters, setInternalFilters] = useState<FilterOptions>({
    search: '',
    statusFilter: [],
    priorityFilter: [],
    assigneeFilter: [],
    caseFilter: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Use external filters if provided, otherwise use internal
  const filters = externalFilters || internalFilters;
  const setFilters = onFiltersChange || setInternalFilters;

  // Search term with debouncing
  const [searchTerm, setSearchTerm] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleFilterChange({ search: searchTerm });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.search]);

  // Filter tasks when using internal state
  useEffect(() => {
    if (!onFiltersChange) {
      let filtered = tasks;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(task => 
          task.description.toLowerCase().includes(searchLower) ||
          task.case?.caseName.toLowerCase().includes(searchLower) ||
          task.assignedTo?.firstName.toLowerCase().includes(searchLower) ||
          task.assignedTo?.lastName.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (filters.statusFilter.length > 0) {
        filtered = filtered.filter(task => filters.statusFilter.includes(task.status));
      }

      // Priority filter
      if (filters.priorityFilter.length > 0) {
        filtered = filtered.filter(task => filters.priorityFilter.includes(task.priority));
      }

      // Assignee filter
      if (filters.assigneeFilter.length > 0) {
        filtered = filtered.filter(task => task.assignedToId && filters.assigneeFilter.includes(task.assignedToId));
      }

      // Case filter
      if (filters.caseFilter.length > 0) {
        filtered = filtered.filter(task => task.caseId && filters.caseFilter.includes(task.caseId));
      }

      // Sort
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'priority':
            const priorityOrder = { 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
            aValue = priorityOrder[a.priority];
            bValue = priorityOrder[b.priority];
            break;
          default: // 'createdAt'
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      onFilteredTasksChange(filtered);
    }
  }, [tasks, filters, onFilteredTasksChange, onFiltersChange]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  }, [filters, setFilters]);

  const clearAllFilters = () => {
    setSearchTerm('');
    handleFilterChange({
      search: '',
      statusFilter: [],
      priorityFilter: [],
      assigneeFilter: [],
      caseFilter: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) + 
    filters.statusFilter.length + 
    filters.priorityFilter.length +
    filters.assigneeFilter.length +
    filters.caseFilter.length +
    (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc' ? 1 : 0);

  const statusLabels = {
    'ACTIVO': 'Activo',
    'EN_REVISION': 'En Revisión',
    'APROBADA': 'Aprobada'
  };

  const priorityLabels = {
    'ALTA': 'Alta',
    'MEDIA': 'Media',
    'BAJA': 'Baja'
  };

  const sortLabels = {
    'createdAt': 'Fecha de Creación',
    'priority': 'Prioridad'
  };

  const handleStatusToggle = (status: string) => {
    const newStatusFilter = filters.statusFilter.includes(status) 
      ? filters.statusFilter.filter(s => s !== status)
      : [...filters.statusFilter, status];
    handleFilterChange({ statusFilter: newStatusFilter });
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriorityFilter = filters.priorityFilter.includes(priority) 
      ? filters.priorityFilter.filter(p => p !== priority)
      : [...filters.priorityFilter, priority];
    handleFilterChange({ priorityFilter: newPriorityFilter });
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    const newAssigneeFilter = filters.assigneeFilter.includes(assigneeId) 
      ? filters.assigneeFilter.filter(a => a !== assigneeId)
      : [...filters.assigneeFilter, assigneeId];
    handleFilterChange({ assigneeFilter: newAssigneeFilter });
  };

  const handleCaseToggle = (caseId: string) => {
    const newCaseFilter = filters.caseFilter.includes(caseId) 
      ? filters.caseFilter.filter(c => c !== caseId)
      : [...filters.caseFilter, caseId];
    handleFilterChange({ caseFilter: newCaseFilter });
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy'], sortOrder: FilterOptions['sortOrder']) => {
    handleFilterChange({ sortBy, sortOrder });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      {/* Search */}
      <div className="relative flex-1 min-w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar tareas por descripción, caso o persona asignada..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm"
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
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Priority Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <Clock className="mr-2 h-3 w-3" />
            Prioridad
            {filters.priorityFilter.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                {filters.priorityFilter.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-3">
            <div className="space-y-2">
              {Object.entries(priorityLabels).map(([priority, label]) => (
                <label key={priority} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters.priorityFilter.includes(priority)}
                    onChange={() => handlePriorityToggle(priority)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Assignee Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <User className="mr-2 h-3 w-3" />
            Asignado
            {filters.assigneeFilter.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                {filters.assigneeFilter.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-3 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {users.map((user) => (
                <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters.assigneeFilter.includes(user.id)}
                    onChange={() => handleAssigneeToggle(user.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                  />
                  <span className="text-sm truncate">{user.firstName} {user.lastName}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Case Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <Building className="mr-2 h-3 w-3" />
            Caso
            {filters.caseFilter.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                {filters.caseFilter.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {cases.map((case_) => (
                <label key={case_.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters.caseFilter.includes(case_.id)}
                    onChange={() => handleCaseToggle(case_.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                  />
                  <span className="text-sm truncate">{case_.caseName}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

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
                        className="border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
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
                      className="border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
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
                      className="border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3"
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