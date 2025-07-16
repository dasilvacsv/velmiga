'use server';

import { db } from '@/db';
import { tasks, users, cases, taskComments, casePartes } from '@/db/schema';
import { Task, NewTask, TaskWithRelations, TaskComment, TaskExportData } from '@/lib/types';
import { eq, desc, and, or, ilike, sql, count, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/features/movimientos/actions';
import { getCurrentUserAndSession } from '@/features/casos/actions';
import { generateExcelFilename } from '@/lib/utils';

// =================================================================
// INTERFACES PARA PAGINACIÓN
// =================================================================

interface GetTasksOptions {
  limit?: number;
  offset?: number;
  search?: string;
  statusFilter?: string[];
  priorityFilter?: string[];
  assigneeFilter?: string[];
  caseFilter?: string[];
  dueDateFilter?: string;
  sortBy?: 'createdAt' | 'fechaDeVencimiento' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// =================================================================
// TAREAS - FUNCIONES DE LECTURA CON LAZY LOADING
// =================================================================

export async function getTasksCount(options: GetTasksOptions = {}): Promise<number> {
  try {
    const { search, statusFilter, priorityFilter, assigneeFilter, caseFilter, dueDateFilter } = options;
    
    // Apply filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(tasks.description, `%${search}%`),
          ilike(tasks.title, `%${search}%`),
          ilike(cases.caseName, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(
        or(...statusFilter.map(status => eq(tasks.status, status as any)))
      );
    }

    if (priorityFilter && priorityFilter.length > 0) {
      whereConditions.push(
        or(...priorityFilter.map(priority => eq(tasks.priority, priority as any)))
      );
    }

    if (assigneeFilter && assigneeFilter.length > 0) {
      whereConditions.push(
        or(...assigneeFilter.map(assigneeId => eq(tasks.assignedToId, assigneeId)))
      );
    }

    if (caseFilter && caseFilter.length > 0) {
      whereConditions.push(
        or(...caseFilter.map(caseId => eq(tasks.caseId, caseId)))
      );
    }

    // Due date filter
    if (dueDateFilter && dueDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      // Convert dates to ISO strings for SQL compatibility
      const todayStr = today.toISOString().slice(0, 10);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const nextWeekStr = nextWeek.toISOString().slice(0, 10);

      switch (dueDateFilter) {
        case 'overdue':
          whereConditions.push(
            and(
              sql`${tasks.fechaDeVencimiento} < ${todayStr}`,
              sql`${tasks.status} != 'APROBADA'`
            )
          );
          break;
        case 'today':
          whereConditions.push(
            and(
              sql`DATE(${tasks.fechaDeVencimiento}) = DATE(${todayStr})`,
            )
          );
          break;
        case 'tomorrow':
          whereConditions.push(
            and(
              sql`DATE(${tasks.fechaDeVencimiento}) = DATE(${tomorrowStr})`,
            )
          );
          break;
        case 'week':
          whereConditions.push(
            and(
              sql`${tasks.fechaDeVencimiento} >= ${todayStr}`,
              sql`${tasks.fechaDeVencimiento} <= ${nextWeekStr}`
            )
          );
          break;
        case 'no-date':
          whereConditions.push(sql`${tasks.fechaDeVencimiento} IS NULL`);
          break;
      }
    }

    let query = db
      .select({ count: count() })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .leftJoin(cases, eq(tasks.caseId, cases.id));

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const result = await query;

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching tasks count:', error);
    throw new Error('Failed to fetch tasks count');
  }
}

export async function getTasksPaginated(options: GetTasksOptions = {}): Promise<TaskWithRelations[]> {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      search, 
      statusFilter, 
      priorityFilter,
      assigneeFilter,
      caseFilter,
      dueDateFilter,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    let query = db
      .select({
        task: tasks,
        assignedTo: users,
        case: cases,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .leftJoin(cases, eq(tasks.caseId, cases.id));

    // Apply filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(tasks.description, `%${search}%`),
          ilike(tasks.title, `%${search}%`),
          ilike(cases.caseName, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(
        or(...statusFilter.map(status => eq(tasks.status, status as any)))
      );
    }

    if (priorityFilter && priorityFilter.length > 0) {
      whereConditions.push(
        or(...priorityFilter.map(priority => eq(tasks.priority, priority as any)))
      );
    }

    if (assigneeFilter && assigneeFilter.length > 0) {
      whereConditions.push(
        or(...assigneeFilter.map(assigneeId => eq(tasks.assignedToId, assigneeId)))
      );
    }

    if (caseFilter && caseFilter.length > 0) {
      whereConditions.push(
        or(...caseFilter.map(caseId => eq(tasks.caseId, caseId)))
      );
    }

    // Due date filter
    if (dueDateFilter && dueDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      switch (dueDateFilter) {
        case 'overdue':
          whereConditions.push(
            and(
              sql`${tasks.fechaDeVencimiento} < ${today}`,
              sql`${tasks.status} != 'APROBADA'`
            )
          );
          break;
        case 'today':
          whereConditions.push(
            and(
              sql`DATE(${tasks.fechaDeVencimiento}) = DATE(${today})`,
            )
          );
          break;
        case 'tomorrow':
          whereConditions.push(
            and(
              sql`DATE(${tasks.fechaDeVencimiento}) = DATE(${tomorrow})`,
            )
          );
          break;
        case 'week':
          whereConditions.push(
            and(
              sql`${tasks.fechaDeVencimiento} >= ${today}`,
              sql`${tasks.fechaDeVencimiento} <= ${nextWeek}`
            )
          );
          break;
        case 'no-date':
          whereConditions.push(sql`${tasks.fechaDeVencimiento} IS NULL`);
          break;
      }
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'fechaDeVencimiento' ? tasks.fechaDeVencimiento 
                     : sortBy === 'priority' ? tasks.priority 
                     : tasks.createdAt;
    
    query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const result = await query;

    // Load comments only for the paginated results (optimized)
    const tasksWithComments = await Promise.all(
      result.map(async (row) => {
        // Get only recent comments for performance
        const comments = await db
          .select({
            comment: taskComments,
            createdByUser: users,
          })
          .from(taskComments)
          .leftJoin(users, eq(taskComments.createdBy, users.id))
          .where(eq(taskComments.taskId, row.task.id))
          .orderBy(desc(taskComments.createdAt))
          .limit(5); // Limit comments for performance

        return {
          ...row.task,
          assignedTo: row.assignedTo || undefined,
          case: row.case || undefined,
          comments: comments.map(c => ({
            ...c.comment,
            createdByUser: c.createdByUser
          }))
        };
      })
    );

    return tasksWithComments;
  } catch (error) {
    console.error('Error fetching paginated tasks:', error);
    throw new Error('Failed to fetch paginated tasks');
  }
}

/**
 * Obtiene todas las tareas con sus relaciones (backward compatibility)
 */
export async function getTasks(): Promise<TaskWithRelations[]> {
  // Default to first page for backward compatibility
  return getTasksPaginated({ limit: 50, offset: 0 });
}

/**
 * Obtiene una tarea por ID con todas sus relaciones
 */
export async function getTaskById(taskId: string): Promise<TaskWithRelations | null> {
    try {
        const result = await db
            .select({
                task: tasks,
                assignedTo: users,
                case: cases,
            })
            .from(tasks)
            .leftJoin(users, eq(tasks.assignedToId, users.id))
            .leftJoin(cases, eq(tasks.caseId, cases.id))
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (result.length === 0) return null;

        const taskData = result[0];

        // Get comments
        const comments = await db
            .select({
                comment: taskComments,
                createdByUser: users,
            })
            .from(taskComments)
            .leftJoin(users, eq(taskComments.createdBy, users.id))
            .where(eq(taskComments.taskId, taskId))
            .orderBy(desc(taskComments.createdAt));

        return {
            ...taskData.task,
            assignedTo: taskData.assignedTo || undefined,
            case: taskData.case || undefined,
            comments: comments.map(c => ({
                ...c.comment,
                createdByUser: c.createdByUser
            }))
        };
    } catch (error) {
        console.error('Error fetching task by ID:', error);
        throw new Error('Failed to fetch task');
    }
}

/**
 * Obtiene estadísticas de tareas
 */
export async function getTaskStats() {
    try {
        const stats = await db
            .select({
                total: sql<number>`count(*)`.mapWith(Number),
                activo: sql<number>`count(*) filter (where status = 'ACTIVO')`.mapWith(Number),
                enRevision: sql<number>`count(*) filter (where status = 'EN_REVISION')`.mapWith(Number),
                aprobada: sql<number>`count(*) filter (where status = 'APROBADA')`.mapWith(Number),
                alta: sql<number>`count(*) filter (where priority = 'ALTA')`.mapWith(Number),
                media: sql<number>`count(*) filter (where priority = 'MEDIA')`.mapWith(Number),
                baja: sql<number>`count(*) filter (where priority = 'BAJA')`.mapWith(Number),
                overdue: sql<number>`count(*) filter (where fecha_de_vencimiento < now() and status != 'APROBADA')`.mapWith(Number),
            })
            .from(tasks);
        return stats[0];
    } catch (error) {
        console.error('Error fetching task stats:', error);
        throw new Error('Failed to fetch task statistics');
    }
}

// =================================================================
// TAREAS - ACCIONES DE ESCRITURA CON LOGGING
// =================================================================

/**
 * Crea una nueva tarea y registra la actividad para notificaciones.
 * **FIX: Corregido mapeo de fechas**
 */
export async function createTask(data: {
    caseId: string;
    assignedToId: string;
    title?: string;
    description: string;
    fechaDeVencimiento?: Date | string | null; // **FIX: Usar el nombre correcto del campo**
    priority: 'ALTA' | 'MEDIA' | 'BAJA';
}) {
    try {
        const { user } = await getCurrentUserAndSession();

        // **FIX: Manejar fechaDeVencimiento correctamente**
        let fechaDeVencimiento: Date | null = null;
        if (data.fechaDeVencimiento) {
            if (typeof data.fechaDeVencimiento === 'string') {
                fechaDeVencimiento = new Date(data.fechaDeVencimiento);
            } else {
                fechaDeVencimiento = data.fechaDeVencimiento;
            }
        }

        const [newTask] = await db.insert(tasks).values({
            caseId: data.caseId,
            assignedToId: data.assignedToId,
            title: data.title || data.description.slice(0, 100),
            description: data.description,
            fechaDeVencimiento: fechaDeVencimiento, // **FIX: Campo correcto**
            priority: data.priority,
            createdBy: user.id,
            status: 'ACTIVO',
            fechaDeAsignacion: new Date(), // Asegurar que se establezca la fecha de asignación
        }).returning();

        const targetCase = await db.query.cases.findFirst({ where: eq(cases.id, newTask.caseId) });
        const assignedUser = await db.query.users.findFirst({ where: eq(users.id, newTask.assignedToId) });

        await logActivity(
            'TASK_CREATED',
            `Nueva Tarea: ${newTask.title || newTask.description.slice(0, 50)}`,
            `${user.firstName} asignó una nueva tarea a ${assignedUser?.firstName || 'N/A'} ${assignedUser?.lastName || ''} para el caso "${targetCase?.caseName || 'N/A'}".`,
            user.id,
            {
                entityId: newTask.id,
                entityType: 'task',
                newValue: { ...newTask, caseName: targetCase?.caseName }
            }
        );

        revalidatePath('/tareas');
        revalidatePath(`/casos/${data.caseId}`);
        return { success: true, task: newTask };
    } catch (error) {
        console.error('Error creating task:', error);
        return { success: false, error: 'Failed to create task' };
    }
}

/**
 * Actualiza el estado de una tarea y registra la actividad.
 */
export async function updateTaskStatus(taskId: string, status: 'ACTIVO' | 'EN_REVISION' | 'APROBADA') {
    try {
        const { user } = await getCurrentUserAndSession();
        const originalTask = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
        if (!originalTask) throw new Error("Tarea no encontrada.");

        const [updatedTask] = await db.update(tasks)
            .set({ status, updatedAt: new Date() })
            .where(eq(tasks.id, taskId))
            .returning();

        await logActivity(
            'TASK_STATUS_UPDATED',
            `Tarea Actualizada: ${originalTask.title || originalTask.description.slice(0, 50)}`,
            `${user.firstName} cambió el estado de la tarea a "${status}".`,
            user.id,
            {
                entityId: taskId,
                entityType: 'task',
                previousValue: originalTask,
                newValue: updatedTask,
            }
        );

        revalidatePath('/tareas');
        revalidatePath(`/casos/${originalTask.caseId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating task status:', error);
        return { success: false, error: 'Failed to update task status' };
    }
}

/**
 * Actualiza una tarea completa
 * **FIX: Corregido mapeo de fechas**
 */
export async function updateTask(taskId: string, data: Partial<{
    title: string;
    description: string;
    fechaDeVencimiento: Date | string | null; // **FIX: Usar el nombre correcto del campo**
    priority: 'ALTA' | 'MEDIA' | 'BAJA';
    status: 'ACTIVO' | 'EN_REVISION' | 'APROBADA';
    assignedToId: string;
}>) {
    try {
        const { user } = await getCurrentUserAndSession();
        const originalTask = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
        if (!originalTask) throw new Error("Tarea no encontrada.");

        // **FIX: Manejar fechaDeVencimiento correctamente**
        const updateData: any = {
            ...data,
            updatedAt: new Date(),
        };

        // **FIX: Procesar fechaDeVencimiento si existe**
        if (data.fechaDeVencimiento !== undefined) {
            if (data.fechaDeVencimiento === null) {
                updateData.fechaDeVencimiento = null;
            } else if (typeof data.fechaDeVencimiento === 'string') {
                updateData.fechaDeVencimiento = new Date(data.fechaDeVencimiento);
            } else {
                updateData.fechaDeVencimiento = data.fechaDeVencimiento;
            }
        }

        const [updatedTask] = await db.update(tasks)
            .set(updateData)
            .where(eq(tasks.id, taskId))
            .returning();

        await logActivity(
            'TASK_STATUS_UPDATED',
            `Tarea Modificada: ${updatedTask.title || updatedTask.description.slice(0, 50)}`,
            `${user.firstName} modificó los detalles de la tarea.`,
            user.id,
            {
                entityId: taskId,
                entityType: 'task',
                previousValue: originalTask,
                newValue: updatedTask,
            }
        );

        revalidatePath('/tareas');
        revalidatePath(`/casos/${originalTask.caseId}`);
        return { success: true, task: updatedTask };
    } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: 'Failed to update task' };
    }
}

/**
 * Elimina una tarea
 */
export async function deleteTask(taskId: string) {
    try {
        const { user } = await getCurrentUserAndSession();
        const taskToDelete = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
        if (!taskToDelete) throw new Error("Tarea no encontrada.");

        // Delete comments first
        await db.delete(taskComments).where(eq(taskComments.taskId, taskId));
        
        // Delete task
        await db.delete(tasks).where(eq(tasks.id, taskId));

        await logActivity(
            'CASE_UPDATED',
            `Tarea Eliminada: ${taskToDelete.title || taskToDelete.description.slice(0, 50)}`,
            `${user.firstName} eliminó una tarea del sistema.`,
            user.id,
            {
                entityId: taskToDelete.caseId,
                entityType: 'case',
                previousValue: taskToDelete
            }
        );

        revalidatePath('/tareas');
        revalidatePath(`/casos/${taskToDelete.caseId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        return { success: false, error: 'Failed to delete task' };
    }
}

/**
 * Añade un comentario a una tarea y registra la actividad.
 */
export async function addTaskComment(taskId: string, comment: string) {
    try {
        const { user } = await getCurrentUserAndSession();

        const [newComment] = await db.insert(taskComments).values({
            taskId,
            comment,
            createdBy: user.id
        }).returning();
        
        const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });

        await logActivity(
            'TASK_COMMENT_ADDED',
            `Nuevo comentario en tarea: ${task?.title || task?.description.slice(0, 50) || 'N/A'}`,
            `${user.firstName} comentó: "${comment.substring(0, 50)}..."`,
            user.id,
            {
                entityId: taskId,
                entityType: 'task',
                newValue: newComment
            }
        );

        revalidatePath(`/tareas`);
        revalidatePath(`/casos/${task?.caseId}`);
        return { success: true, comment: newComment };
    } catch (error) {
        console.error('Error adding task comment:', error);
        return { success: false, error: 'Failed to add comment' };
    }
}

/**
 * Obtiene todos los usuarios para asignación de tareas
 */
export async function getUsers() {
    try {
        return await db
            .select()
            .from(users)
            .orderBy(users.firstName, users.lastName);
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
    }
}

// =================================================================
// FUNCIONES DE EXPORTACIÓN
// =================================================================

/**
 * Exporta las tareas filtradas a Excel
 */
export async function exportTasksToExcel(taskIds?: string[]): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
        const { user } = await getCurrentUserAndSession();

        // Get tasks with relations
        let tasksQuery = db
            .select({
                task: tasks,
                case: cases,
                assignedTo: users,
            })
            .from(tasks)
            .leftJoin(cases, eq(tasks.caseId, cases.id))
            .leftJoin(users, eq(tasks.assignedToId, users.id));

        if (taskIds && taskIds.length > 0) {
            tasksQuery = tasksQuery.where(sql`${tasks.id} = ANY(${taskIds})`);
        }

        const tasksData = await tasksQuery.orderBy(desc(tasks.createdAt));

        // Get case parts for each task
        const exportData: TaskExportData[] = await Promise.all(
            tasksData.map(async ({ task, case: caseData, assignedTo }) => {
                let parteActiva = '';
                let parteDemandada = '';

                if (caseData) {
                    const partes = await db
                        .select()
                        .from(casePartes)
                        .where(eq(casePartes.caseId, caseData.id));

                    const parteActivaData = partes.find(p => p.type === 'ACTIVA');
                    const parteDemandadaData = partes.find(p => p.type === 'DEMANDADA');

                    parteActiva = parteActivaData ? `${parteActivaData.firstName} ${parteActivaData.lastName}` : '';
                    parteDemandada = parteDemandadaData ? `${parteDemandadaData.firstName} ${parteDemandadaData.lastName}` : '';
                }

                return {
                    id: task.id,
                    caso: caseData?.caseName || '',
                    codigo: caseData?.caseNumber || '',
                    parteActiva,
                    parteDemandada,
                    estadoOficial: caseData?.estadoOficial || caseData?.status || '',
                    estadoInterno: caseData?.estadoInterno || caseData?.internalStatus || '',
                    tarea: task.description,
                    asignadoA: assignedTo ? `${assignedTo.firstName} ${assignedTo.lastName}` : '',
                    prioridad: task.priority,
                    fechaAsignacion: task.fechaDeAsignacion ? new Date(task.fechaDeAsignacion).toLocaleDateString('es-ES') : '',
                    fechaVencimiento: task.fechaDeVencimiento ? new Date(task.fechaDeVencimiento).toLocaleDateString('es-ES') : '',
                    estado: task.status
                };
            })
        );

        // Log the export activity
        await logActivity(
            'DOCUMENT_UPLOADED',
            `Exportación de tareas a Excel`,
            `${user.firstName} exportó ${exportData.length} tareas a un archivo Excel.`,
            user.id,
            {
                entityType: 'task',
                newValue: { exportedCount: exportData.length }
            }
        );

        const filename = generateExcelFilename('Tareas');
        
        return { 
            success: true, 
            filename,
            // En una implementación real, aquí generarías el archivo Excel
            // Por ahora retornamos el nombre del archivo que se generaría
        };
    } catch (error) {
        console.error('Error exporting tasks to Excel:', error);
        return { success: false, error: 'Failed to export tasks to Excel' };
    }
}