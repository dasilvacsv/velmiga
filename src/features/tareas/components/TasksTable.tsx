"use client"

import React, { useState, useMemo, useCallback, memo } from 'react';
import { TaskWithRelations } from '@/lib/types';
import { 
  Eye, Edit, Trash2, Calendar, User, ExternalLink, 
  MoreHorizontal, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, getPriorityColor, getTaskStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';

interface TasksTableProps {
  tasks: TaskWithRelations[];
  onView: (task: TaskWithRelations) => void;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
  onCaseClick: (caseId: string) => void;
  loading?: boolean;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => Promise<void> | void;
  totalCount?: number;
}

const TaskRow = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: {
    tasks: TaskWithRelations[];
    onView: (task: TaskWithRelations) => void;
    onEdit: (task: TaskWithRelations) => void;
    onDelete: (task: TaskWithRelations) => void;
    onCaseClick: (caseId: string) => void;
    isMobile: boolean;
    isItemLoaded: (index: number) => boolean;
  }
}) => {
  const { tasks, onView, onEdit, onDelete, onCaseClick, isMobile, isItemLoaded } = data;

  if (!isItemLoaded(index)) {
    return (
      <div style={style} className="flex items-center justify-center p-4 border-b border-gray-100">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Cargando tareas...</span>
      </div>
    );
  }

  const task = tasks[index];
  if (!task) return null;

  // Vista Móvil (ya incluye la prioridad, está correcta)
  if (isMobile) {
    return (
      <div style={style}>
        <div 
          className="p-4 hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/30 transition-all duration-300 cursor-pointer border-b border-gray-100"
          onClick={() => onView(task)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                {(task.title || task.description).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {task.title || task.description}
                </h3>
                {task.title && (
                  <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                    {task.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  {formatDate(task.fechaDeAsignacion)}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${getTaskStatusColor(task.status)}`}>
                {task.status === 'ACTIVO' && 'Activo'}
                {task.status === 'EN_REVISION' && 'En Revisión'}
                {task.status === 'APROBADA' && 'Aprobada'}
              </span>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {task.case && (
              <div className="flex items-center text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCaseClick(task.case!.id);
                  }}
                  title={task.case.caseName}
                  className="w-full text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center justify-between gap-1"
                >
                  <span className="truncate">{task.case.caseName}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </button>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-700">
              <User className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {task.assignedTo?.firstName} {task.assignedTo?.lastName}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Calendar className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
              {task.fechaDeVencimiento ? (
                <span className={
                  new Date(task.fechaDeVencimiento) < new Date() && task.status !== 'APROBADA' 
                    ? 'text-red-600 font-bold' 
                    : ''
                }>
                  {formatDate(task.fechaDeVencimiento)}
                </span>
              ) : (
                <span className="text-gray-400">Sin fecha</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
               <Button variant="ghost" size="sm" onClick={() => onView(task)} className="text-blue-600 hover:bg-blue-50 h-7 w-7 p-0" title="Ver detalles">
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="text-green-600 hover:bg-green-50 h-7 w-7 p-0" title="Editar tarea">
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(task)} className="text-red-600 hover:bg-red-50 h-7 w-7 p-0" title="Eliminar tarea">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de Escritorio (CORREGIDA)
  return (
    <div style={style}>
      <div 
        className="grid grid-cols-8 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/30 transition-all duration-300 group cursor-pointer border-b border-gray-100"
        onClick={() => onView(task)}
      >
        <div className="flex items-center space-x-3 col-span-2">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform duration-200">
            {(task.title || task.description).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200 line-clamp-2">
              {task.title || task.description}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(task.fechaDeAsignacion)}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            {task.case ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCaseClick(task.case!.id);
                }}
                title={task.case.caseName}
                className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center justify-between gap-1"
              >
                <span className="truncate">{task.case.caseName}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </button>
            ) : (
              <span className="text-sm text-gray-500">Sin caso</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {task.assignedTo?.firstName} {task.assignedTo?.lastName}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${getTaskStatusColor(task.status)}`}>
            {task.status === 'ACTIVO' && 'Activo'}
            {task.status === 'EN_REVISION' && 'En Revisión'}
            {task.status === 'APROBADA' && 'Aprobada'}
          </span>
        </div>

        {/* --- CELDA DE PRIORIDAD AÑADIDA --- */}
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-900">
          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
          {task.fechaDeVencimiento ? (
            <span className={
              new Date(task.fechaDeVencimiento) < new Date() && task.status !== 'APROBADA' 
                ? 'text-red-600 font-bold' 
                : ''
            }>
              {formatDate(task.fechaDeVencimiento)}
            </span>
          ) : (
            <span className="text-gray-400">Sin fecha</span>
          )}
        </div>

        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onView(task)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 h-7 w-7 p-0" title="Ver detalles">
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="text-green-600 hover:text-green-900 hover:bg-green-50 h-7 w-7 p-0" title="Editar tarea">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task)} className="text-red-600 hover:text-red-900 hover:bg-red-50 h-7 w-7 p-0" title="Eliminar tarea">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

TaskRow.displayName = 'TaskRow';

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  onView,
  onEdit,
  onDelete,
  onCaseClick,
  loading = false,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  totalCount = 0
}) => {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isItemLoaded = useCallback((index: number) => !!tasks[index], [tasks]);

  const itemData = useMemo(() => ({
    tasks,
    onView,
    onEdit,
    onDelete,
    onCaseClick,
    isMobile,
    isItemLoaded
  }), [tasks, onView, onEdit, onDelete, onCaseClick, isMobile, isItemLoaded]);

  const itemCount = hasNextPage ? tasks.length + 1 : tasks.length;
  const itemSize = isMobile ? 220 : 90;

  if (loading && tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-1/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
        <div className="p-16 text-center">
          <div className="text-gray-400 mb-8">
            <div className="text-9xl mb-6">📋</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No hay tareas para mostrar</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              Prueba a ajustar los filtros o crea una nueva tarea para empezar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
      {/* Cabecera de la Tabla de Escritorio (CORREGIDA) */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-100">
          <div className="grid grid-cols-8 gap-4 px-4 py-3">
            <div className="col-span-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tarea</div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Caso</div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Asignado</div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</div>
            {/* --- CABECERA DE PRIORIDAD AÑADIDA --- */}
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prioridad</div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vencimiento</div>
            <div className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</div>
          </div>
        </div>
      )}

      <div style={{ height: '600px' }}>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadNextPage || (() => {})}
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
                  {TaskRow}
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>

      {totalCount > 0 && (
        <div className="bg-green-50 px-4 py-3 border-t border-green-200">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>
              Mostrando {tasks.length} de {totalCount} tareas
            </div>
            {isNextPageLoading && (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando más...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};