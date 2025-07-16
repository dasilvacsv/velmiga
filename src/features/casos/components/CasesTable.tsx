"use client"

import React, { useState, useMemo, useCallback, memo } from 'react';
import { CaseWithRelations } from '@/lib/types';
import {
  Eye, Edit, Trash2, Users, Calendar, Building,
  User as UserIcon, MoreHorizontal, CheckCircle, XCircle, Pause, Archive,
  FileText, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateEcuador } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CasesTableProps {
  cases: CaseWithRelations[];
  onView: (case_: CaseWithRelations) => void; // Aún necesario para el clic de la fila
  onEdit: (case_: CaseWithRelations) => void;
  onDelete: (case_: CaseWithRelations) => void;
  onManageTeam: (case_: CaseWithRelations) => void;
  loading?: boolean;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => Promise<void>;
  totalCount?: number;
}

const statusConfig = {
  ACTIVO: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Activo',
    gradient: 'from-emerald-500 to-green-500'
  },
  EN_ESPERA: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Pause className="w-3 h-3" />,
    label: 'En Espera',
    gradient: 'from-amber-500 to-yellow-500'
  },
  CERRADO: {
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: <XCircle className="w-3 h-3" />,
    label: 'Cerrado',
    gradient: 'from-slate-500 to-gray-500'
  },
  ARCHIVADO: {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <Archive className="w-3 h-3" />,
    label: 'Archivado',
    gradient: 'from-red-500 to-rose-500'
  }
};

// Componente de Fila optimizado
const CaseRow = memo(({
  index,
  style,
  data
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    cases: CaseWithRelations[];
    onView: (case_: CaseWithRelations) => void;
    onEdit: (case_: CaseWithRelations) => void;
    onDelete: (case_: CaseWithRelations) => void;
    onManageTeam: (case_: CaseWithRelations) => void;
    router: any;
    isMobile: boolean;
    isItemLoaded: (index: number) => boolean;
  }
}) => {
  const { cases, onEdit, onDelete, onManageTeam, router, isMobile, isItemLoaded } = data;

  if (!isItemLoaded(index)) {
    return (
      <div style={style} className="flex items-center justify-center p-4 border-b border-gray-100">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Cargando...</span>
      </div>
    );
  }

  const case_ = cases[index];
  if (!case_) return null;

  const status = statusConfig[case_.status];

  const handleCaseClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, [role="menuitem"]')) {
      e.stopPropagation();
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      window.open(`/casos/${case_.id}`, '_blank');
    } else {
      router.push(`/casos/${case_.id}`);
    }
  }, [case_.id, router]);

  if (isMobile) {
    // Vista móvil sin la acción "Ver detalles"
    return (
      <div style={style}>
        <div
          className="p-4 hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer border-b border-gray-100"
          onClick={handleCaseClick}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className={`w-12 h-12 bg-gradient-to-br ${status.gradient} text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm`}>
                {case_.caseName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 truncate flex items-center gap-2">
                  {case_.caseName}
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </h3>
                {case_.caseNumber && (
                  <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-100 px-2 py-1 rounded inline-block">
                    {case_.caseNumber}
                  </p>
                )}
              </div>
            </div>
            <span className={cn(
              'inline-flex items-center px-2 py-1 text-xs font-bold rounded-lg border flex-shrink-0',
              status.color
            )}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-700">
              {case_.client?.clientType === 'EMPRESA' ? (
                <Building className="h-4 w-4 mr-2 text-blue-500" />
              ) : (
                <UserIcon className="h-4 w-4 mr-2 text-indigo-500" />
              )}
              <span className="truncate">
                {case_.client?.name || 'Cliente no encontrado'}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
              <span>Apertura: {formatDateEcuador(case_.openingDate)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* "Ver detalles" eliminado de aquí */}
                <DropdownMenuItem onClick={() => onManageTeam(case_)}>
                  <Users className="h-4 w-4 mr-2" />
                  Gestionar equipo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(case_)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar caso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(case_)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar caso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // Fila de escritorio con la acción de ver eliminada
  return (
    <div style={style}>
      <div
        className="grid grid-cols-6 gap-6 p-4 items-center hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 group cursor-pointer border-b border-gray-100"
        onClick={handleCaseClick}
      >
        {/* Caso Legal (col-span-2) */}
        <div className="col-span-2 flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${status.gradient} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow`}>
            {case_.caseName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors flex items-center gap-2">
              {case_.caseName}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
            </div>
            {case_.caseNumber && (
              <div className="text-xs text-gray-500 font-mono mt-1 bg-gradient-to-r from-gray-100 to-gray-50 px-2 py-1 rounded-md inline-block">
                {case_.caseNumber}
              </div>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            {case_.client?.clientType === 'EMPRESA' ? (
              <Building className="h-5 w-5 text-white" />
            ) : (
              <UserIcon className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {case_.client?.name || 'Cliente no encontrado'}
            </div>
            {case_.client?.clientType && (
              <div className="text-xs text-gray-500">
                {case_.client.clientType === 'PERSONA_NATURAL' ? 'Persona Natural' : 'Empresa'}
              </div>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center">
          <span className={cn(
            'inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg border shadow-sm',
            status.color
          )}>
            {status.icon}
            <span className="ml-1.5">{status.label}</span>
          </span>
        </div>

        {/* Fecha */}
        <div className="flex items-center text-sm text-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium">{formatDateEcuador(case_.openingDate)}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center">
             {/* El botón de ver con el icono del ojo ha sido eliminado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8 p-0 rounded-lg transition-colors"
                  title="Más acciones"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onManageTeam(case_)}>
                  <Users className="h-4 w-4 mr-2 text-purple-600" />
                  Gestionar equipo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(case_)}>
                  <Edit className="h-4 w-4 mr-2 text-amber-600" />
                  Editar caso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(case_)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar caso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
});

CaseRow.displayName = 'CaseRow';

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  onView,
  onEdit,
  onDelete,
  onManageTeam,
  loading = false,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  totalCount = 0
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isItemLoaded = useCallback((index: number) => {
    return !!cases[index];
  }, [cases]);

  const itemData = useMemo(() => ({
    cases,
    onView,
    onEdit,
    onDelete,
    onManageTeam,
    router,
    isMobile,
    isItemLoaded
  }), [cases, onView, onEdit, onDelete, onManageTeam, router, isMobile, isItemLoaded]);

  const itemCount = hasNextPage ? cases.length + 1 : cases.length;
  const itemSize = isMobile ? 200 : 88;

  if (loading && cases.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (cases.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No hay casos registrados</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Comienza creando tu primer caso legal para gestionar expedientes y colaborar con tu equipo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Encabezado */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-6 px-4 py-4">
            <div className="col-span-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <FileText className="h-4 w-4 mr-2 text-blue-500" />
              Caso Legal
            </div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-indigo-500" />
              Cliente
            </div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
              Estado
            </div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
              Fecha
            </div>
            <div className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider pr-2">
              Acciones
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de la lista virtual */}
      <div style={{ height: '600px' }}>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadNextPage || (() => Promise.resolve())}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  itemSize={itemSize}
                  itemData={itemData}
                  onItemsRendered={onItemsRendered}
                  overscanCount={5}
                >
                  {CaseRow}
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>

      {/* Pie de página */}
      {totalCount > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Mostrando {cases.length} de {totalCount} casos</span>
            </div>
            {isNextPageLoading && (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                <span className="text-blue-600">Cargando más casos...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};