'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, TrendingUp, Activity, 
  Calendar, FileText, Users, RefreshCw,
  Upload, UserPlus, CheckCircle, Building,
  BarChart3, Zap, Eye, Download, Settings,
  X
} from 'lucide-react';
import { MovementWithRelations, User } from '@/lib/types';
import { 
  getMovements, 
  deleteMovement,
  getMovementStats,
  getUsersForMovements,
  searchMovements,
  getMovementsByType,
  getMovementsByDateRange
} from '@/features/movimientos/actions';
import { Button } from '@/components/ui/button';
import { SearchableSelect, SelectOption } from '@/components/ui/searchable-select';
import { MovementCard } from '@/features/movimientos/components/MovementCard';
import { MovementDetailModal } from '@/features/movimientos/components/MovementDetailModal';
import { useToast } from '@/hooks/use-toast';

export default function MovimientosPage() {
  const [movements, setMovements] = useState<MovementWithRelations[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MovementWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    caseCreated: 0,
    caseUpdated: 0,
    caseClosed: 0,
    taskAssigned: 0,
    documentUploaded: 0,
    clientAdded: 0,
    userAssigned: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<MovementWithRelations | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [movements, searchTerm, typeFilter, timeFilter, userFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [movementsData, usersData, statsData] = await Promise.all([
        getMovements(),
        getUsersForMovements(),
        getMovementStats()
      ]);
      setMovements(movementsData);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(movement =>
        movement.title.toLowerCase().includes(searchLower) ||
        movement.description.toLowerCase().includes(searchLower) ||
        movement.type.toLowerCase().includes(searchLower) ||
        movement.createdByUser?.firstName?.toLowerCase().includes(searchLower) ||
        movement.createdByUser?.lastName?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(movement => movement.type === typeFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(movement => new Date(movement.createdAt) >= startDate);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(movement => movement.createdBy === userFilter);
    }

    setFilteredMovements(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Datos actualizados",
      description: "La información se ha actualizado correctamente",
    });
  };

  const handleViewMovement = (movement: MovementWithRelations) => {
    setSelectedMovement(movement);
    setShowDetailModal(true);
  };

  const handleDeleteMovement = async (movement: MovementWithRelations) => {
    if (window.confirm(`¿Está seguro de eliminar este movimiento?`)) {
      try {
        await deleteMovement(movement.id);
        await loadData();
        toast({
          title: "Movimiento eliminado",
          description: "El movimiento ha sido eliminado correctamente",
        });
      } catch (error) {
        console.error('Error deleting movement:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el movimiento",
          variant: "destructive"
        });
      }
    }
  };

  const handleExportData = () => {
    const csvData = filteredMovements.map(movement => ({
      Fecha: new Date(movement.createdAt).toLocaleDateString('es-ES'),
      Tipo: movement.type,
      Título: movement.title,
      Descripción: movement.description,
      Usuario: movement.createdByUser ? `${movement.createdByUser.firstName} ${movement.createdByUser.lastName}` : 'Sistema',
      Entidad: movement.entityType || '',
      'ID Entidad': movement.entityId || ''
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0] || {}).join(",") + "\n" +
      csvData.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter options
  const typeOptions: SelectOption[] = [
    { value: 'all', label: 'Todos los tipos', emoji: '📋', description: 'Ver todos los movimientos' },
    { value: 'CASE_CREATED', label: 'Casos Creados', emoji: '📄', description: 'Nuevos casos registrados' },
    { value: 'CASE_UPDATED', label: 'Casos Actualizados', emoji: '📝', description: 'Modificaciones en casos' },
    { value: 'CASE_CLOSED', label: 'Casos Cerrados', emoji: '✅', description: 'Casos finalizados' },
    { value: 'TASK_ASSIGNED', label: 'Tareas Asignadas', emoji: '👥', description: 'Asignación de tareas' },
    { value: 'DOCUMENT_UPLOADED', label: 'Documentos Subidos', emoji: '📎', description: 'Carga de documentos' },
    { value: 'CLIENT_ADDED', label: 'Clientes Agregados', emoji: '🏢', description: 'Nuevos clientes' },
    { value: 'USER_ASSIGNED', label: 'Usuarios Asignados', emoji: '👤', description: 'Asignación de usuarios' },
  ];

  const timeOptions: SelectOption[] = [
    { value: 'all', label: 'Todo el tiempo', emoji: '📅', description: 'Sin filtro de fecha' },
    { value: 'today', label: 'Hoy', emoji: '📆', description: 'Solo de hoy' },
    { value: 'week', label: 'Esta semana', emoji: '📊', description: 'Últimos 7 días' },
    { value: 'month', label: 'Este mes', emoji: '📈', description: 'Últimos 30 días' },
  ];

  const userOptions: SelectOption[] = [
    { value: 'all', label: 'Todos los usuarios', emoji: '👥', description: 'Sin filtro de usuario' },
    ...users.map(user => ({
      value: user.id,
      label: `${user.firstName} ${user.lastName}`,
      emoji: '👤',
      description: user.email,
      category: user.role
    }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 animate-in fade-in-0">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="animate-in slide-up" style={{ animationDelay: '100ms' }}>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Registro de Movimientos
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Historial completo de actividades y cambios del sistema
              </p>
            </div>
            <div className="flex items-center space-x-3 animate-in slide-up" style={{ animationDelay: '200ms' }}>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={filteredMovements.length === 0}
                className="hover-lift"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hover-lift"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-4 animate-in slide-up" style={{ animationDelay: '300ms' }}>
            {[
              { label: 'Total', value: stats.total, icon: Activity, color: 'from-blue-500 to-blue-600' },
              { label: 'Casos Creados', value: stats.caseCreated, icon: FileText, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Casos Actualizados', value: stats.caseUpdated, icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
              { label: 'Casos Cerrados', value: stats.caseClosed, icon: CheckCircle, color: 'from-slate-500 to-slate-600' },
              { label: 'Tareas Asignadas', value: stats.taskAssigned, icon: Users, color: 'from-purple-500 to-purple-600' },
              { label: 'Documentos', value: stats.documentUploaded, icon: Upload, color: 'from-orange-500 to-orange-600' },
              { label: 'Clientes', value: stats.clientAdded, icon: Building, color: 'from-pink-500 to-pink-600' },
              { label: 'Usuarios', value: stats.userAssigned, icon: UserPlus, color: 'from-cyan-500 to-cyan-600' },
              { label: 'Hoy', value: stats.today, icon: Calendar, color: 'from-red-500 to-red-600' },
              { label: 'Semana', value: stats.thisWeek, icon: BarChart3, color: 'from-yellow-500 to-yellow-600' },
              { label: 'Mes', value: stats.thisMonth, icon: Zap, color: 'from-indigo-500 to-indigo-600' },
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover-lift group transition-all duration-300"
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 truncate">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in slide-up" style={{ animationDelay: '850ms' }}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar movimientos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <SearchableSelect
                    options={typeOptions}
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                    placeholder="Seleccionar tipo..."
                    searchPlaceholder="Buscar tipos..."
                    clearable
                  />
                </div>

                {/* Time Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <SearchableSelect
                    options={timeOptions}
                    value={timeFilter}
                    onValueChange={setTimeFilter}
                    placeholder="Seleccionar período..."
                    searchPlaceholder="Buscar períodos..."
                  />
                </div>

                {/* User Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario
                  </label>
                  <SearchableSelect
                    options={userOptions}
                    value={userFilter}
                    onValueChange={setUserFilter}
                    placeholder="Seleccionar usuario..."
                    searchPlaceholder="Buscar usuarios..."
                    clearable
                  />
                </div>
              </div>

              {/* Results summary */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{filteredMovements.length}</span> de{' '}
                  <span className="font-semibold">{movements.length}</span> movimientos
                </p>
                {(searchTerm || typeFilter !== 'all' || timeFilter !== 'all' || userFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setTimeFilter('all');
                      setUserFilter('all');
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Movements Grid */}
          <div className="animate-in slide-up" style={{ animationDelay: '950ms' }}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || typeFilter !== 'all' || timeFilter !== 'all' || userFilter !== 'all'
                    ? 'No se encontraron movimientos'
                    : 'No hay movimientos registrados'
                  }
                </h3>
                <p className="text-gray-600">
                  {searchTerm || typeFilter !== 'all' || timeFilter !== 'all' || userFilter !== 'all'
                    ? 'Intenta ajustar los filtros para encontrar los movimientos que buscas.'
                    : 'Los movimientos aparecerán automáticamente cuando se realicen actividades en el sistema.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMovements.map((movement, index) => (
                  <div 
                    key={movement.id}
                    className="animate-in slide-up"
                    style={{ animationDelay: `${1050 + index * 100}ms` }}
                  >
                    <MovementCard
                      movement={movement}
                      onView={handleViewMovement}
                      onDelete={handleDeleteMovement}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Modal */}
          {showDetailModal && selectedMovement && (
            <MovementDetailModal
              movement={selectedMovement}
              onClose={() => setShowDetailModal(false)}
              onDelete={() => {
                setShowDetailModal(false);
                handleDeleteMovement(selectedMovement);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}