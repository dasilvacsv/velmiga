'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Download, RefreshCw
} from 'lucide-react';
import { TaskWithRelations, User as UserType, CaseWithRelations, TaskExportData } from '@/lib/types';
import { 
  getTasksPaginated,
  getTasksCount,
  updateTask as updateTaskAction, // **FIX: Importar función de actualización**
  getTaskById // **FIX: Importar función para obtener tarea por ID**
} from '@/features/tareas/actions';
import { 
  updateTask,
  createTask,
  deleteTask,
  addTaskComment,
  updateTaskStatus
} from '@/features/tareas/actions';
import { Button } from '@/components/ui/button';
import { generateExcelFilename } from '@/lib/utils';
import { TaskForm } from './TaskForm';
import { TaskDetailModal } from './TaskDetailModal';
import { TasksFacetedFilters } from './TasksFacetedFilters';
import { TasksTable } from './TasksTable';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface FilterOptions {
  search: string;
  statusFilter: string[];
  priorityFilter: string[];
  assigneeFilter: string[];
  caseFilter: string[];
  sortBy: 'createdAt' | 'priority';
  sortOrder: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 20;

export const TasksClientPage: React.FC<{
  initialTasks: TaskWithRelations[];
  users: UserType[];
  cases: CaseWithRelations[];
  stats: any;
}> = ({
  initialTasks: initialData,
  users,
  cases,
}) => {
  // State management
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialData);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | undefined>();
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | undefined>();

  // Pagination and infinite scroll state
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    statusFilter: [],
    priorityFilter: [],
    assigneeFilter: [],
    caseFilter: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const { toast } = useToast();
  const router = useRouter();

  const loadTasks = useCallback(async (currentFilters: FilterOptions, offset: number, append: boolean = false) => {
    if (append) {
      setIsNextPageLoading(true);
    } else {
      setInitialLoading(true);
    }

    try {
      const [tasksData, count] = await Promise.all([
        getTasksPaginated({
          limit: ITEMS_PER_PAGE,
          offset,
          search: currentFilters.search || undefined,
          statusFilter: currentFilters.statusFilter.length > 0 ? currentFilters.statusFilter : undefined,
          priorityFilter: currentFilters.priorityFilter.length > 0 ? currentFilters.priorityFilter : undefined,
          assigneeFilter: currentFilters.assigneeFilter.length > 0 ? currentFilters.assigneeFilter : undefined,
          caseFilter: currentFilters.caseFilter.length > 0 ? currentFilters.caseFilter : undefined,
          sortBy: currentFilters.sortBy,
          sortOrder: currentFilters.sortOrder
        }),
        getTasksCount({
          search: currentFilters.search || undefined,
          statusFilter: currentFilters.statusFilter.length > 0 ? currentFilters.statusFilter : undefined,
          priorityFilter: currentFilters.priorityFilter.length > 0 ? currentFilters.priorityFilter : undefined,
          assigneeFilter: currentFilters.assigneeFilter.length > 0 ? currentFilters.assigneeFilter : undefined,
          caseFilter: currentFilters.caseFilter.length > 0 ? currentFilters.caseFilter : undefined,
        })
      ]);

      setTasks(prev => append ? [...prev, ...tasksData] : tasksData);
      setTotalCount(count);
      setHasNextPage((offset + tasksData.length) < count);

    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({ title: "Error", description: "No se pudieron cargar las tareas", variant: "destructive" });
    } finally {
      setIsNextPageLoading(false);
      setInitialLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTasks(filters, 0, false);
  }, [filters, loadTasks]);

  const loadNextPage = useCallback(async () => {
    if (isNextPageLoading || !hasNextPage) return;
    await loadTasks(filters, tasks.length, true);
  }, [isNextPageLoading, hasNextPage, filters, tasks.length, loadTasks]);

  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const tableKey = useMemo(() => JSON.stringify(filters), [filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks(filters, 0, false);
    setRefreshing(false);
    toast({
      title: "Datos actualizados",
      description: "La información se ha actualizado correctamente",
      variant: "default"
    });
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setShowForm(true);
  };

  // **FIX: Implementar edición de tareas correctamente**
  const handleEditTask = async (task: TaskWithRelations) => {
    try {
      // Obtener la tarea más actualizada de la base de datos
      const latestTask = await getTaskById(task.id);
      if (latestTask) {
        setEditingTask(latestTask);
        setShowForm(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar la tarea para editar",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading task for editing:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la tarea para editar",
        variant: "destructive"
      });
    }
  };

  const handleViewTask = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDeleteTask = async (task: TaskWithRelations) => {
    if (window.confirm(`¿Está seguro de eliminar la tarea "${task.description.slice(0, 50)}..."?`)) {
      try {
        await deleteTask(task.id);
        await loadTasks(filters, 0, false);
        toast({
          title: "Tarea eliminada",
          description: "La tarea ha sido eliminada correctamente",
          variant: "default"
        });
      } catch (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la tarea",
          variant: "destructive"
        });
      }
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'ACTIVO' | 'EN_REVISION' | 'APROBADA') => {
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      
      if (result.success) {
        // Actualizar tarea en la lista local
        setTasks(prevTasks => prevTasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus } : t
        ));

        // Actualizar tarea seleccionada si coincide
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, status: newStatus } : prev);
        }
        
        toast({
          title: "Estado actualizado",
          description: "El estado de la tarea ha sido actualizado",
          variant: "default"
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  // **FIX: Implementar envío de formulario correctamente para crear y editar**
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingTask) {
        // Editar tarea existente
        const result = await updateTaskAction(editingTask.id, {
          title: data.title,
          description: data.description,
          fechaDeVencimiento: data.dueDate ? new Date(data.dueDate) : null,
          priority: data.priority,
          assignedToId: data.assignedToId
        });

        if (result.success) {
          toast({
            title: "Tarea actualizada",
            description: "Los cambios han sido guardados correctamente",
            variant: "default"
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // Crear nueva tarea
        const result = await createTask({
          caseId: data.caseId,
          assignedToId: data.assignedToId,
          title: data.title,
          description: data.description,
          fechaDeVencimiento: data.dueDate ? new Date(data.dueDate) : null,
          priority: data.priority
        });

        if (result.success) {
          toast({
            title: "Tarea creada",
            description: "La nueva tarea ha sido registrada en el sistema",
            variant: "default"
          });
        } else {
          throw new Error(result.error);
        }
      }
      
      setShowForm(false);
      setEditingTask(undefined);
      await loadTasks(filters, 0, false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async (taskId: string, comment: string) => {
    try {
      const result = await addTaskComment(taskId, comment);
      
      if (result.success) {
        // Actualizar la tarea seleccionada con el nuevo comentario
        if (selectedTask && selectedTask.id === taskId) {
          const updatedTask = await getTaskById(taskId);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
        }
        
        toast({
          title: "Comentario añadido",
          description: "El comentario ha sido registrado",
          variant: "default"
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error", 
        description: "No se pudo añadir el comentario",
        variant: "destructive"
      });
    }
  };

  // FIX: Load ALL tasks for export (obtener todas las tareas con filtros aplicados)
  const loadAllTasksForExport = async (): Promise<TaskWithRelations[]> => {
    try {
      // Obtener el total de tareas que coinciden con los filtros
      const totalCount = await getTasksCount({
        search: filters.search || undefined,
        statusFilter: filters.statusFilter.length > 0 ? filters.statusFilter : undefined,
        priorityFilter: filters.priorityFilter.length > 0 ? filters.priorityFilter : undefined,
        assigneeFilter: filters.assigneeFilter.length > 0 ? filters.assigneeFilter : undefined,
        caseFilter: filters.caseFilter.length > 0 ? filters.caseFilter : undefined,
      });

      // Obtener TODAS las tareas que coinciden con los filtros
      const allFilteredTasks = await getTasksPaginated({
        limit: totalCount, // Usar el total como límite para obtener todas
        offset: 0,
        search: filters.search || undefined,
        statusFilter: filters.statusFilter.length > 0 ? filters.statusFilter : undefined,
        priorityFilter: filters.priorityFilter.length > 0 ? filters.priorityFilter : undefined,
        assigneeFilter: filters.assigneeFilter.length > 0 ? filters.assigneeFilter : undefined,
        caseFilter: filters.caseFilter.length > 0 ? filters.caseFilter : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      return allFilteredTasks;
    } catch (error) {
      console.error('Error loading all tasks for export:', error);
      throw new Error('Failed to load all tasks for export');
    }
  };

  // FIX: Export function now gets ALL filtered tasks
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      toast({
        title: "Preparando exportación",
        description: "Obteniendo todas las tareas que coinciden con los filtros...",
        variant: "default"
      });

      // FIX: Obtener TODAS las tareas que coinciden con los filtros actuales
      const allFilteredTasks = await loadAllTasksForExport();
      
      const exportData: TaskExportData[] = allFilteredTasks.map(task => {
        const parteActiva = task.case?.partes?.find(p => p.type === 'ACTIVA');
        const parteDemandada = task.case?.partes?.find(p => p.type === 'DEMANDADA');
        
        return {
          id: task.id,
          caso: task.case?.caseName || '',
          codigo: task.case?.caseNumber || '',
          parteActiva: parteActiva ? `${parteActiva.firstName} ${parteActiva.lastName}` : '',
          parteDemandada: parteDemandada ? `${parteDemandada.firstName} ${parteDemandada.lastName}` : '',
          estadoOficial: task.case?.estadoOficial || task.case?.status || '',
          estadoInterno: task.case?.estadoInterno || task.case?.internalStatus || '',
          tarea: task.description,
          asignadoA: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '',
          prioridad: task.priority,
          fechaAsignacion: task.fechaDeAsignacion ? new Date(task.fechaDeAsignacion).toLocaleDateString('es-ES') : '',
          fechaVencimiento: task.fechaDeVencimiento ? new Date(task.fechaDeVencimiento).toLocaleDateString('es-ES') : '',
          estado: task.status
        };
      });

      const worksheet = [
        [
          'ID', 'Caso', 'Código', 'Parte Activa', 'Parte Demandada', 
          'Estado Oficial', 'Estado Interno', 'Tarea', 'Asignado A',
          'Prioridad', 'Fecha Asignación', 'Fecha Vencimiento', 'Estado'
        ],
        ...exportData.map(row => [
          row.id, row.caso, row.codigo, row.parteActiva, row.parteDemandada,
          row.estadoOficial, row.estadoInterno, row.tarea, row.asignadoA,
          row.prioridad, row.fechaAsignacion, row.fechaVencimiento, row.estado
        ])
      ];

      const workbook = {
        SheetNames: ['Tareas'],
        Sheets: {
          'Tareas': {
            '!ref': `A1:M${worksheet.length}`,
            ...worksheet.reduce((acc, row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                const cellAddress = String.fromCharCode(65 + colIndex) + (rowIndex + 1);
                acc[cellAddress] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
              });
              return acc;
            }, {} as any)
          }
        }
      };

      const XLSX = await import('xlsx');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateExcelFilename('Tareas_Filtradas');
      link.click();
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Tareas exportadas",
        description: `Se exportaron ${exportData.length} tareas al archivo Excel (todas las que coinciden con los filtros)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error exporting tasks:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCaseClick = (caseId: string) => {
    router.push(`/casos/${caseId}`);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-green-100 p-4 animate-in slide-up mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <TasksFacetedFilters 
            tasks={[]} 
            users={users}
            cases={cases}
            onFilteredTasksChange={() => {}} 
            onFiltersChange={handleFiltersChange}
            filters={filters}
          />
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={exporting || totalCount === 0}
              className="hover-lift border-green-200 hover:border-green-300 hover:bg-green-50"
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || initialLoading}
              className="hover-lift border-green-200 hover:border-green-300 hover:bg-green-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing || initialLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={handleCreateTask}
              size="sm"
              className="px-4 py-2 text-sm font-semibold hover-lift shadow-md bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </div>
      </div>

      <div>
        <TasksTable
          key={tableKey}
          tasks={tasks}
          onView={handleViewTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onCaseClick={handleCaseClick}
          loading={initialLoading}
          hasNextPage={hasNextPage}
          isNextPageLoading={isNextPageLoading}
          loadNextPage={loadNextPage}
          totalCount={totalCount}
        />
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          cases={cases}
          users={users}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(undefined);
          }}
        />
      )}

      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditTask(selectedTask);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            handleDeleteTask(selectedTask);
          }}
          onStatusChange={handleStatusChange}
          onAddComment={handleAddComment}
        />
      )}
    </>
  );
};