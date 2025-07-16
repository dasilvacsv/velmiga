// Optimized actions for export functionality
'use server';

import { db } from '@/db';
import { cases, clients, users, casesToUsers, casePartes, movements, tasks, taskComments, calendarEvents, caseInternalStatusHistory } from '@/db/schema';
import { Case, NewCase, Client, User, CaseWithRelations, CaseParte } from '@/lib/types';
import { eq, desc, and, or, ilike, sql, gte, asc, count, max, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth';
import { logActivity } from '@/features/movimientos/actions';
import { getEcuadorDate } from '@/lib/utils'; // CAMBIO: Importar función para zona horaria Ecuador

/**
 * Obtiene la sesión y los detalles del usuario autenticado desde la base de datos.
 * Lanza un error si el usuario no está autenticado o no existe.
 */
export async function getCurrentUserAndSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autenticado. Se requiere iniciar sesión para realizar esta acción.');
  }

  const userDetails = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!userDetails) {
    throw new Error('El usuario de la sesión no existe en la base de datos.');
  }

  return { session, user: userDetails };
}

// =================================================================
// FUNCIONES DE ESTADO INTERNO
// =================================================================

export async function addInternalStatusToHistory(
  caseId: string, 
  status: string, 
  statusDate?: Date, 
  notes?: string
) {
  try {
    const { user } = await getCurrentUserAndSession();
    
    // CAMBIO: Usar hora de Ecuador si no se proporciona fecha específica
    const effectiveDate = statusDate || getEcuadorDate();
    const isManualDate = Boolean(statusDate);

    const [newHistoryEntry] = await db
      .insert(caseInternalStatusHistory)
      .values({
        caseId,
        status,
        statusDate: effectiveDate,
        notes: notes || null,
        isManualDate,
        createdBy: user.id,
      })
      .returning();

    await logActivity(
      'CASE_INTERNAL_STATUS_CHANGED',
      `Estado interno actualizado: "${status}"`,
      `Se cambió el estado interno a "${status}"${notes ? ` con notas: ${notes}` : ''}`,
      user.id,
      {
        entityId: caseId,
        entityType: 'case',
        newValue: newHistoryEntry
      }
    );

    revalidatePath('/casos');
    revalidatePath(`/casos/${caseId}`);
    return newHistoryEntry;
  } catch (error) {
    console.error('Error adding internal status to history:', error);
    throw new Error('Failed to add internal status to history');
  }
}

export async function getCaseInternalStatusHistory(caseId: string) {
  try {
    const history = await db
      .select({
        history: caseInternalStatusHistory,
        user: users
      })
      .from(caseInternalStatusHistory)
      .leftJoin(users, eq(caseInternalStatusHistory.createdBy, users.id))
      .where(eq(caseInternalStatusHistory.caseId, caseId))
      .orderBy(desc(caseInternalStatusHistory.statusDate));

    return history.map(h => ({
      ...h.history,
      createdByUser: h.user
    }));
  } catch (error) {
    console.error('Error fetching case internal status history:', error);
    throw new Error('Failed to fetch internal status history');
  }
}

export async function updateInternalStatusHistoryEntry(
  historyId: string,
  updates: {
    status?: string;
    statusDate?: Date;
    notes?: string;
  }
) {
  try {
    const { user } = await getCurrentUserAndSession();

    // CAMBIO: Si se proporciona nueva fecha, usar getEcuadorDate para asegurar zona horaria correcta
    const processedUpdates = {
      ...updates,
      statusDate: updates.statusDate ? getEcuadorDate(updates.statusDate) : undefined,
      isManualDate: Boolean(updates.statusDate),
    };

    const [updatedEntry] = await db
      .update(caseInternalStatusHistory)
      .set(processedUpdates)
      .where(eq(caseInternalStatusHistory.id, historyId))
      .returning();

    if (updatedEntry) {
      revalidatePath('/casos');
      revalidatePath(`/casos/${updatedEntry.caseId}`);
    }

    return updatedEntry;
  } catch (error) {
    console.error('Error updating internal status history entry:', error);
    throw new Error('Failed to update internal status history entry');
  }
}

export async function deleteInternalStatusHistoryEntry(historyId: string) {
  try {
    const { user } = await getCurrentUserAndSession();

    const [deletedEntry] = await db
      .delete(caseInternalStatusHistory)
      .where(eq(caseInternalStatusHistory.id, historyId))
      .returning();

    if (deletedEntry) {
      revalidatePath('/casos');
      revalidatePath(`/casos/${deletedEntry.caseId}`);
    }

    return deletedEntry;
  } catch (error) {
    console.error('Error deleting internal status history entry:', error);
    throw new Error('Failed to delete internal status history entry');
  }
}

// =================================================================
// FUNCIONES DE LECTURA DE DATOS CON LAZY LOADING
// =================================================================

interface GetCasesOptions {
  limit?: number;
  offset?: number;
  search?: string;
  statusFilter?: string[];
  clientFilter?: string[];
  parteDemandadaFilter?: string[]; // **FIX: Nuevo filtro por parte demandada**
  sortBy?: 'createdAt' | 'caseName' | 'openingDate';
  sortOrder?: 'asc' | 'desc';
}

export async function getCasesCount(options: GetCasesOptions = {}): Promise<number> {
  try {
    const { search, statusFilter, clientFilter, parteDemandadaFilter } = options;
    
    let query = db
      .select({ count: count() })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id));

    // Apply filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(cases.caseName, `%${search}%`),
          ilike(cases.caseNumber, `%${search}%`),
          ilike(cases.codigoInterno, `%${search}%`),
          ilike(clients.name, `%${search}%`)
        )
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(
        or(...statusFilter.map(status => eq(cases.status, status as any)))
      );
    }

    if (clientFilter && clientFilter.length > 0) {
      whereConditions.push(
        or(...clientFilter.map(clientId => eq(cases.clientId, clientId)))
      );
    }

    // **FIX: Filtro por parte demandada en el conteo**
    if (parteDemandadaFilter && parteDemandadaFilter.length > 0) {
      // Necesitamos hacer join con casePartes para este filtro
      query = db
        .select({ count: count() })
        .from(cases)
        .leftJoin(clients, eq(cases.clientId, clients.id))
        .leftJoin(casePartes, eq(cases.id, casePartes.caseId));

      whereConditions.push(
        and(
          eq(casePartes.type, 'DEMANDADA'),
          or(...parteDemandadaFilter.map(parteName => {
            // Buscar por nombre completo concatenado
            return sql`CONCAT(${casePartes.firstName}, ' ', ${casePartes.lastName}) = ${parteName}`;
          }))
        )
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const result = await query;
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching cases count:', error);
    throw new Error('Failed to fetch cases count');
  }
}

export async function getCasesPaginated(options: GetCasesOptions = {}): Promise<CaseWithRelations[]> {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      search, 
      statusFilter, 
      clientFilter,
      parteDemandadaFilter, // **FIX: Nuevo parámetro**
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    let query = db
      .select({
        case: cases,
        client: clients,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id));

    // Apply filters
    const whereConditions = [];
    
    if (search) {
      // **FIX: Agregar búsqueda en partes procesales**
      whereConditions.push(
        or(
          ilike(cases.caseName, `%${search}%`),
          ilike(cases.caseNumber, `%${search}%`),
          ilike(cases.codigoInterno, `%${search}%`),
          ilike(clients.name, `%${search}%`),
          // Búsqueda en partes procesales
          sql`EXISTS (
            SELECT 1 FROM case_partes cp 
            WHERE cp.case_id = ${cases.id} 
            AND (
              CONCAT(cp.first_name, ' ', cp.last_name) ILIKE ${`%${search}%`}
              OR cp.first_name ILIKE ${`%${search}%`}
              OR cp.last_name ILIKE ${`%${search}%`}
              OR cp.cedula ILIKE ${`%${search}%`}
            )
          )`
        )
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(
        or(...statusFilter.map(status => eq(cases.status, status as any)))
      );
    }

    if (clientFilter && clientFilter.length > 0) {
      whereConditions.push(
        or(...clientFilter.map(clientId => eq(cases.clientId, clientId)))
      );
    }

    // **FIX: Aplicar filtro de parte demandada si existe**
    if (parteDemandadaFilter && parteDemandadaFilter.length > 0) {
      // Si hay filtro de parte demandada, necesitamos hacer join con casePartes
      query = db
        .select({
          case: cases,
          client: clients,
        })
        .from(cases)
        .leftJoin(clients, eq(cases.clientId, clients.id))
        .leftJoin(casePartes, eq(cases.id, casePartes.caseId));

      whereConditions.push(
        and(
          eq(casePartes.type, 'DEMANDADA'),
          or(...parteDemandadaFilter.map(parteName => {
            return sql`CONCAT(${casePartes.firstName}, ' ', ${casePartes.lastName}) = ${parteName}`;
          }))
        )
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'caseName' ? cases.caseName 
                     : sortBy === 'openingDate' ? cases.openingDate 
                     : cases.createdAt;
    
    query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const result = await query;

    // Load related data only for the paginated results
    const casesWithRelations = await Promise.all(
      result.map(async (row) => {
        // Get team members (optimized query)
        const teamMembers = await db
          .select({
            caseTeamMember: casesToUsers,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              role: users.role
            },
          })
          .from(casesToUsers)
          .leftJoin(users, eq(casesToUsers.userId, users.id))
          .where(eq(casesToUsers.caseId, row.case.id));

        // Get case parts (limit to avoid loading too much data)
        const partes = await db
          .select()
          .from(casePartes)
          .where(eq(casePartes.caseId, row.case.id))
          .limit(10); // Limit partes for performance

        // Get tasks count instead of all tasks for performance
        const tasksCount = await db
          .select({ count: count() })
          .from(tasks)
          .where(eq(tasks.caseId, row.case.id));

        // Get pending tasks only (for performance)
        const pendingTasks = await db
          .select({
            task: tasks,
            assignedTo: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email
            },
          })
          .from(tasks)
          .leftJoin(users, eq(tasks.assignedToId, users.id))
          .where(and(
            eq(tasks.caseId, row.case.id),
            or(
              eq(tasks.status, 'ACTIVO'),
              eq(tasks.status, 'EN_REVISION')
            )
          ))
          .limit(5); // Limit for performance

        // Get recent movements only (for performance)
        const recentMovements = await db
          .select({
            movement: movements,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName
            }
          })
          .from(movements)
          .leftJoin(users, eq(movements.createdBy, users.id))
          .where(eq(movements.entityId, row.case.id))
          .orderBy(desc(movements.createdAt))
          .limit(5); // Limit for performance

        // CAMBIO: Get upcoming events con fecha de Ecuador
        const currentEcuadorDate = getEcuadorDate();
        const upcomingEvents = await db
          .select()
          .from(calendarEvents)
          .where(and(
            eq(calendarEvents.caseId, row.case.id),
            gte(calendarEvents.startDate, currentEcuadorDate)
          ))
          .orderBy(calendarEvents.startDate)
          .limit(3); // Limit for performance

        return {
          ...row.case,
          client: row.client || undefined,
          teamMembers: teamMembers.map(tm => ({
            ...tm.caseTeamMember,
            user: tm.user || undefined,
          })),
          partes: partes,
          tasks: pendingTasks.map(t => ({
            ...t.task,
            assignedTo: t.assignedTo || undefined,
            comments: [], // Empty for performance, load on demand
            case: row.case
          })),
          tasksCount: tasksCount[0]?.count || 0,
          movements: recentMovements.map(m => ({
            ...m.movement,
            createdByUser: m.user
          })),
          upcomingEvents: upcomingEvents,
          internalStatusHistory: [] // Empty for performance, load on demand
        };
      })
    );

    return casesWithRelations;
  } catch (error) {
    console.error('Error fetching paginated cases:', error);
    throw new Error('Failed to fetch paginated cases');
  }
}

// =================================================================
// OPTIMIZED EXPORT FUNCTIONS
// =================================================================

interface GetCasesForExportOptions {
  search?: string;
  statusFilter?: string[];
  clientFilter?: string[];
  parteDemandadaFilter?: string[]; // **FIX: Incluir en opciones de exportación**
  sortBy?: 'createdAt' | 'caseName' | 'openingDate';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Optimized function to get cases for export with minimal database queries
 * Only fetches the data actually needed for the Excel export
 */
export async function getCasesForExport(options: GetCasesForExportOptions = {}): Promise<CaseWithRelations[]> {
  try {
    const { search, statusFilter, clientFilter, parteDemandadaFilter, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(cases.caseName, `%${search}%`),
          ilike(cases.caseNumber, `%${search}%`),
          ilike(cases.codigoInterno, `%${search}%`),
          ilike(clients.name, `%${search}%`),
          // **FIX: Incluir búsqueda en partes procesales en exportación**
          sql`EXISTS (
            SELECT 1 FROM case_partes cp 
            WHERE cp.case_id = ${cases.id} 
            AND (
              CONCAT(cp.first_name, ' ', cp.last_name) ILIKE ${`%${search}%`}
              OR cp.first_name ILIKE ${`%${search}%`}
              OR cp.last_name ILIKE ${`%${search}%`}
              OR cp.cedula ILIKE ${`%${search}%`}
            )
          )`
        )
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(
        or(...statusFilter.map(status => eq(cases.status, status as any)))
      );
    }

    if (clientFilter && clientFilter.length > 0) {
      whereConditions.push(
        or(...clientFilter.map(clientId => eq(cases.clientId, clientId)))
      );
    }

    // **FIX: Incluir filtro de parte demandada en exportación**
    if (parteDemandadaFilter && parteDemandadaFilter.length > 0) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM case_partes cp 
          WHERE cp.case_id = ${cases.id} 
          AND cp.type = 'DEMANDADA' 
          AND CONCAT(cp.first_name, ' ', cp.last_name) IN (${parteDemandadaFilter.join(',')})
        )`
      );
    }

    // Main query with all the data we need in one go
    const mainQuery = db
      .select({
        // Case data
        case: cases,
        client: clients,
        // Latest internal status (subquery)
        latestInternalStatus: sql<string>`(
          SELECT status 
          FROM case_internal_status_history 
          WHERE case_id = ${cases.id} 
          ORDER BY status_date DESC 
          LIMIT 1
        )`,
        latestInternalStatusDate: sql<Date>`(
          SELECT status_date 
          FROM case_internal_status_history 
          WHERE case_id = ${cases.id} 
          ORDER BY status_date DESC 
          LIMIT 1
        )`,
        // Task counts
        totalTasks: sql<number>`(
          SELECT COUNT(*) 
          FROM tasks 
          WHERE case_id = ${cases.id}
        )`.mapWith(Number),
        activeTasks: sql<number>`(
          SELECT COUNT(*) 
          FROM tasks 
          WHERE case_id = ${cases.id} AND status = 'ACTIVO'
        )`.mapWith(Number),
        // Team members (concatenated)
        teamMembersString: sql<string>`(
          SELECT STRING_AGG(
            CONCAT(users.first_name, ' ', users.last_name, ' (', cases_to_users.role_in_case, ')'), 
            ', '
          )
          FROM cases_to_users 
          LEFT JOIN users ON cases_to_users.user_id = users.id
          WHERE cases_to_users.case_id = ${cases.id}
        )`,
        // Partes data (concatenated)
        parteActivaString: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name)
          FROM case_partes 
          WHERE case_id = ${cases.id} AND type = 'ACTIVA'
          LIMIT 1
        )`,
        parteDemandadaString: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name)
          FROM case_partes 
          WHERE case_id = ${cases.id} AND type = 'DEMANDADA'
          LIMIT 1
        )`,
        // Tasks summary (concatenated) - FIXED: Removed window function
        tasksString: sql<string>`(
  SELECT STRING_AGG(
    CONCAT(COALESCE(description, title, 'Tarea sin título')),
    '; '
    ORDER BY created_at ASC
  )
  FROM tasks 
  WHERE case_id = ${cases.id}
)`
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id));

    // Apply where conditions
    if (whereConditions.length > 0) {
      mainQuery.where(and(...whereConditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'caseName' ? cases.caseName 
                     : sortBy === 'openingDate' ? cases.openingDate 
                     : cases.createdAt;
    
    if (sortOrder === 'asc') {
      mainQuery.orderBy(sortColumn);
    } else {
      mainQuery.orderBy(desc(sortColumn));
    }

    console.log('Executing optimized export query...');
    const startTime = Date.now();
    
    const results = await mainQuery;
    
    const queryTime = Date.now() - startTime;
    console.log(`Export query completed in ${queryTime}ms for ${results.length} cases`);

    // Transform the results to match CaseWithRelations interface
    const transformedResults: CaseWithRelations[] = results.map(row => ({
      ...row.case,
      client: row.client || undefined,
      // Include the optimized data for export
      latestInternalStatus: row.latestInternalStatus || row.case.estadoInterno || '',
      latestInternalStatusDate: row.latestInternalStatusDate,
      totalTasksCount: row.totalTasks || 0,
      activeTasksCount: row.activeTasks || 0,
      teamMembersString: row.teamMembersString || '',
      parteActivaString: row.parteActivaString || '',
      parteDemandadaString: row.parteDemandadaString || '',
      tasksString: row.tasksString || '',
      // Empty arrays for unused properties in export
      teamMembers: [],
      partes: [],
      tasks: [],
      movements: [],
      upcomingEvents: [],
      internalStatusHistory: []
    }));

    return transformedResults;

  } catch (error) {
    console.error('Error in getCasesForExport:', error);
    throw new Error('Failed to fetch cases for export');
  }
}

/**
 * Get count of cases that match the export filters
 */
export async function getCasesForExportCount(options: GetCasesForExportOptions = {}): Promise<number> {
  try {
    const { search, statusFilter, clientFilter, parteDemandadaFilter } = options;
    
    let query = db
      .select({ count: count() })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id));

    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(cases.caseName, `%${search}%`),
          ilike(cases.caseNumber, `%${search}%`),
          ilike(cases.codigoInterno, `%${search}%`),
          ilike(clients.name, `%${search}%`),
          // **FIX: Incluir búsqueda en partes procesales**
          sql`EXISTS (
            SELECT 1 FROM case_partes cp 
            WHERE cp.case_id = ${cases.id} 
            AND (
              CONCAT(cp.first_name, ' ', cp.last_name) ILIKE ${`%${search}%`}
              OR cp.first_name ILIKE ${`%${search}%`}
              OR cp.last_name ILIKE ${`%${search}%`}
              OR cp.cedula ILIKE ${`%${search}%`}
            )
          )`
        )
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(
        or(...statusFilter.map(status => eq(cases.status, status as any)))
      );
    }

    if (clientFilter && clientFilter.length > 0) {
      whereConditions.push(
        or(...clientFilter.map(clientId => eq(cases.clientId, clientId)))
      );
    }

    // **FIX: Incluir filtro de parte demandada en conteo de exportación**
    if (parteDemandadaFilter && parteDemandadaFilter.length > 0) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM case_partes cp 
          WHERE cp.case_id = ${cases.id} 
          AND cp.type = 'DEMANDADA' 
          AND CONCAT(cp.first_name, ' ', cp.last_name) IN (${parteDemandadaFilter.join(',')})
        )`
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const result = await query;
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching export count:', error);
    throw new Error('Failed to fetch export count');
  }
}

export async function getCases(): Promise<CaseWithRelations[]> {
  // Default to first page for backward compatibility
  return getCasesPaginated({ limit: 50, offset: 0 });
}

export async function getCaseById(id: string): Promise<CaseWithRelations | null> {
    try {
        const result = await db
            .select({
                case: cases,
                client: clients,
            })
            .from(cases)
            .leftJoin(clients, eq(cases.clientId, clients.id))
            .where(eq(cases.id, id))
            .limit(1);

        if (result.length === 0) return null;

        const caseData = result[0];

        // Get team members
        const teamMembers = await db
            .select({
                caseTeamMember: casesToUsers,
                user: users,
            })
            .from(casesToUsers)
            .leftJoin(users, eq(casesToUsers.userId, users.id))
            .where(eq(casesToUsers.caseId, id));

        // Get case parts
        const partes = await db
            .select()
            .from(casePartes)
            .where(eq(casePartes.caseId, id));

        // Get tasks and their assigned users
        const caseTasksRaw = await db
            .select({
                task: tasks,
                assignedTo: users,
            })
            .from(tasks)
            .leftJoin(users, eq(tasks.assignedToId, users.id))
            .where(eq(tasks.caseId, id));

        // For each task, fetch its comments and the user who created them
        const caseTasksWithComments = await Promise.all(
            caseTasksRaw.map(async (taskRow) => {
                const comments = await db
                    .select({
                        comment: taskComments,
                        createdByUser: users,
                    })
                    .from(taskComments)
                    .leftJoin(users, eq(taskComments.createdBy, users.id))
                    .where(eq(taskComments.taskId, taskRow.task.id))
                    .orderBy(desc(taskComments.createdAt));

                return {
                    ...taskRow.task,
                    assignedTo: taskRow.assignedTo || undefined,
                    comments: comments.map(c => ({
                        ...c.comment,
                        createdByUser: c.createdByUser || undefined
                    })),
                    case: caseData.case
                };
            })
        );

        // **FIX: Obtener movimientos del caso Y de tareas/eventos relacionados**
        // Obtener IDs de tareas y eventos relacionados al caso
        const taskIds = caseTasksRaw.map(task => task.task.id);
        const caseEvents = await db
            .select({ id: calendarEvents.id })
            .from(calendarEvents)
            .where(eq(calendarEvents.caseId, id));
        const eventIds = caseEvents.map(event => event.id);

        // Obtener todos los movimientos relacionados (caso, tareas y eventos)
        const allEntityIds = [id, ...taskIds, ...eventIds];
        
        const movementHistory = await db
            .select({
                movement: movements,
                user: users
            })
            .from(movements)
            .leftJoin(users, eq(movements.createdBy, users.id))
            .where(inArray(movements.entityId, allEntityIds))
            .orderBy(desc(movements.createdAt))
            .limit(50); // Aumentamos el límite para incluir más movimientos

        // CAMBIO: Get upcoming calendar events for this case usando fecha Ecuador
        const currentEcuadorDate = getEcuadorDate();
        const upcomingEvents = await db
            .select()
            .from(calendarEvents)
            .where(and(
                eq(calendarEvents.caseId, id),
                gte(calendarEvents.startDate, currentEcuadorDate)
            ))
            .orderBy(calendarEvents.startDate)
            .limit(10);

        // Get internal status history
        const internalStatusHistory = await db
            .select({
                history: caseInternalStatusHistory,
                user: users
            })
            .from(caseInternalStatusHistory)
            .leftJoin(users, eq(caseInternalStatusHistory.createdBy, users.id))
            .where(eq(caseInternalStatusHistory.caseId, id))
            .orderBy(desc(caseInternalStatusHistory.statusDate));

        return {
            ...caseData.case,
            client: caseData.client || undefined,
            teamMembers: teamMembers.map(tm => ({
                ...tm.caseTeamMember,
                user: tm.user || undefined,
            })),
            partes: partes,
            tasks: caseTasksWithComments,
            movements: movementHistory.map(m => ({
                ...m.movement,
                createdByUser: m.user
            })),
            upcomingEvents: upcomingEvents,
            internalStatusHistory: internalStatusHistory.map(h => ({
                ...h.history,
                createdByUser: h.user
            }))
        };
    } catch (error) {
        console.error('Error fetching case by ID:', error);
        throw new Error('Failed to fetch case');
    }
}

// =================================================================
// PARTES MANAGEMENT
// =================================================================

export async function addCaseParte(caseId: string, parteData: Omit<CaseParte, 'id' | 'caseId' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  try {
    const { user } = await getCurrentUserAndSession();

    const [newParte] = await db
      .insert(casePartes)
      .values({
        ...parteData,
        caseId,
        createdBy: user.id,
      })
      .returning();

    await logActivity(
      'CASE_UPDATED',
      `Parte añadida al caso`,
      `Se añadió a ${parteData.firstName} ${parteData.lastName} como parte ${parteData.type} al caso.`,
      user.id,
      {
        entityId: caseId,
        entityType: 'case',
        newValue: newParte
      }
    );

    revalidatePath('/casos');
    revalidatePath(`/casos/${caseId}`);
    return newParte;
  } catch (error) {
    console.error('Error adding case part:', error);
    throw new Error('Failed to add case part');
  }
}

export async function updateCaseParte(parteId: string, parteData: Partial<Omit<CaseParte, 'id' | 'caseId' | 'createdAt' | 'createdBy'>>) {
  try {
    const { user } = await getCurrentUserAndSession();

    // CAMBIO: Usar fecha de Ecuador para updatedAt
    const [updatedParte] = await db
      .update(casePartes)
      .set({
        ...parteData,
        updatedAt: getEcuadorDate(),
      })
      .where(eq(casePartes.id, parteId))
      .returning();

    if (updatedParte) {
      await logActivity(
        'CASE_UPDATED',
        `Parte actualizada en el caso`,
        `Se actualizó la información de ${updatedParte.firstName} ${updatedParte.lastName}.`,
        user.id,
        {
          entityId: updatedParte.caseId,
          entityType: 'case',
          newValue: updatedParte
        }
      );

      revalidatePath('/casos');
      revalidatePath(`/casos/${updatedParte.caseId}`);
    }

    return updatedParte;
  } catch (error) {
    console.error('Error updating case part:', error);
    throw new Error('Failed to update case part');
  }
}

export async function deleteCaseParte(parteId: string) {
  try {
    const { user } = await getCurrentUserAndSession();

    const [deletedParte] = await db
      .delete(casePartes)
      .where(eq(casePartes.id, parteId))
      .returning();

    if (deletedParte) {
      await logActivity(
        'CASE_UPDATED',
        `Parte eliminada del caso`,
        `Se eliminó a ${deletedParte.firstName} ${deletedParte.lastName} del caso.`,
        user.id,
        {
          entityId: deletedParte.caseId,
          entityType: 'case',
          previousValue: deletedParte
        }
      );

      revalidatePath('/casos');
      revalidatePath(`/casos/${deletedParte.caseId}`);
    }

    return deletedParte;
  } catch (error) {
    console.error('Error deleting case part:', error);
    throw new Error('Failed to delete case part');
  }
}

// =================================================================
// FUNCIONES DE ESCRITURA DE DATOS (CON LOGGING)
// =================================================================

export async function createCase(data: Omit<NewCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<Case> {
  try {
    const { user } = await getCurrentUserAndSession();

    // CAMBIO: Usar fecha de Ecuador para timestamps
    const ecuadorDate = getEcuadorDate();
    
    const result = await db
      .insert(cases)
      .values({
        ...data,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: ecuadorDate,
        updatedAt: ecuadorDate,
      })
      .returning();
    
    const newCase = result[0];

    // Crear el primer registro en el historial de estado interno
    if (data.estadoInterno) {
      await addInternalStatusToHistory(newCase.id, data.estadoInterno);
    }

    const client = await db.query.clients.findFirst({ where: eq(clients.id, newCase.clientId) });
    await logActivity(
      'CASE_CREATED',
      `Caso creado: "${newCase.caseName}"`,
      `El usuario ${user.firstName} ${user.lastName} creó un nuevo caso para el cliente ${client?.name || 'N/A'}.`,
      user.id,
      {
        entityId: newCase.id,
        entityType: 'case',
        newValue: newCase
      }
    );

    revalidatePath('/casos');
    return newCase;
  } catch (error) {
    console.error('Error creating case:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
        throw error;
    }
    throw new Error('Failed to create case');
  }
}

export async function updateCase(id: string, data: Partial<Omit<NewCase, 'id'>>): Promise<Case | null> {
  try {
    const { user } = await getCurrentUserAndSession();

    const originalCase = await db.query.cases.findFirst({ where: eq(cases.id, id) });
    if (!originalCase) throw new Error("Caso no encontrado para actualizar.");

    // CAMBIO: Usar fecha de Ecuador para updatedAt
    const result = await db
      .update(cases)
      .set({
        ...data,
        updatedBy: user.id,
        updatedAt: getEcuadorDate(),
      })
      .where(eq(cases.id, id))
      .returning();

    if (result.length === 0) return null;
    const updatedCase = result[0];

    // Registrar cambios específicos en el historial
    if (data.status && originalCase.status !== updatedCase.status) {
      await logActivity(
        'CASE_STATUS_CHANGED',
        `Cambio de estado del caso: "${updatedCase.caseName}"`,
        `Estado cambiado de "${originalCase.status}" a "${data.status}"`,
        user.id,
        {
          entityId: updatedCase.id,
          entityType: 'case',
          previousValue: originalCase.status,
          newValue: data.status
        }
      );
    }
    
    if (data.estadoOficial && originalCase.estadoOficial !== updatedCase.estadoOficial) {
      await logActivity(
        'CASE_OFFICIAL_STATUS_CHANGED',
        `Cambio de estado oficial: "${updatedCase.caseName}"`,
        `Estado oficial cambiado de "${originalCase.estadoOficial}" a "${data.estadoOficial}"`,
        user.id,
        {
          entityId: updatedCase.id,
          entityType: 'case',
          previousValue: originalCase.estadoOficial,
          newValue: data.estadoOficial
        }
      );
    }
    
    if (data.estadoInterno && originalCase.estadoInterno !== updatedCase.estadoInterno) {
      // Agregar al historial de estado interno
      await addInternalStatusToHistory(updatedCase.id, data.estadoInterno);
      
      await logActivity(
        'CASE_INTERNAL_STATUS_CHANGED',
        `Cambio de estado interno: "${updatedCase.caseName}"`,
        `Estado interno cambiado de "${originalCase.estadoInterno}" a "${data.estadoInterno}"`,
        user.id,
        {
          entityId: updatedCase.id,
          entityType: 'case',
          previousValue: originalCase.estadoInterno,
          newValue: data.estadoInterno
        }
      );
    }

    // Mantener el registro general de actualización solo si no hubo cambios específicos
    if (!data.status && !data.estadoOficial && !data.estadoInterno) {
      await logActivity(
        'CASE_UPDATED',
        `Caso actualizado: "${updatedCase.caseName}"`,
        `El usuario ${user.firstName} ${user.lastName} actualizó los detalles del caso.`,
        user.id,
        {
          entityId: updatedCase.id,
          entityType: 'case',
          previousValue: originalCase,
          newValue: updatedCase
        }
      );
    }

    revalidatePath('/casos');
    revalidatePath(`/casos/${id}`);
    return updatedCase;
  } catch (error) {
    console.error('Error updating case:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
        throw error;
    }
    throw new Error('Failed to update case');
  }
}

export async function deleteCase(id: string): Promise<boolean> {
  try {
    const { user } = await getCurrentUserAndSession();

    const caseToDelete = await db.query.cases.findFirst({ where: eq(cases.id, id) });
    if (!caseToDelete) throw new Error("Caso no encontrado para eliminar.");

    await db.delete(casesToUsers).where(eq(casesToUsers.caseId, id));
    await db.delete(casePartes).where(eq(casePartes.caseId, id));
    await db.delete(caseInternalStatusHistory).where(eq(caseInternalStatusHistory.caseId, id));
    const result = await db.delete(cases).where(eq(cases.id, id)).returning();

    if (result.length > 0) {
      await logActivity(
        'CASE_CLOSED',
        `Caso eliminado: "${caseToDelete.caseName}"`,
        `El usuario ${user.firstName} ${user.lastName} eliminó el caso (ID: ${id}).`,
        user.id,
        {
          entityId: id,
          entityType: 'case',
          previousValue: caseToDelete
        }
      );
    }

    revalidatePath('/casos');
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting case:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
        throw error;
    }
    throw new Error('Failed to delete case');
  }
}

export async function assignTeamMember(caseId: string, userId: string, roleInCase: string): Promise<boolean> {
  try {
    const { user: currentUser } = await getCurrentUserAndSession();

    const existing = await db.select().from(casesToUsers).where(and(eq(casesToUsers.caseId, caseId), eq(casesToUsers.userId, userId))).limit(1);
    if (existing.length > 0) throw new Error('User is already assigned to this case');

    await db.insert(casesToUsers).values({ caseId, userId, roleInCase });

    const assignedUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const targetCase = await db.query.cases.findFirst({ where: eq(cases.id, caseId) });

    await logActivity(
      'USER_ASSIGNED',
      `Usuario asignado al caso: "${targetCase?.caseName || 'N/A'}"`,
      `El usuario ${currentUser.firstName} ${currentUser.lastName} asignó a ${assignedUser?.firstName || ''} ${assignedUser?.lastName || 'N/A'} al caso con el rol de "${roleInCase}".`,
      currentUser.id,
      {
        entityId: caseId,
        entityType: 'case',
        newValue: { assignedUserId: userId, role: roleInCase }
      }
    );

    revalidatePath(`/casos/${caseId}`);
    revalidatePath('/casos');
    return true;
  } catch (error) {
    console.error('Error assigning team member:', error);
    throw error;
  }
}

export async function removeTeamMember(caseId: string, userId: string): Promise<boolean> {
  try {
    const { user: currentUser } = await getCurrentUserAndSession();

    const userToRemove = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const targetCase = await db.query.cases.findFirst({ where: eq(cases.id, caseId) });

    const result = await db
      .delete(casesToUsers)
      .where(and(eq(casesToUsers.caseId, caseId), eq(casesToUsers.userId, userId)))
      .returning();

    if (result.length > 0) {
        await logActivity(
          'CASE_UPDATED',
          `Miembro eliminado del caso: "${targetCase?.caseName || 'N/A'}"`,
          `El usuario ${currentUser.firstName} ${currentUser.lastName} eliminó a ${userToRemove?.firstName || ''} ${userToRemove?.lastName || 'N/A'} del equipo del caso.`,
          currentUser.id,
          {
            entityId: caseId,
            entityType: 'case',
            previousValue: { removedUserId: userId }
          }
        );
    }
    revalidatePath(`/casos/${caseId}`);
    revalidatePath('/casos');
    return result.length > 0;
  } catch (error) {
    console.error('Error removing team member:', error);
    throw new Error('Failed to remove team member');
  }
}

// =================================================================
// FUNCIONES AUXILIARES DE LECTURA
// =================================================================

export async function getClientsForCases(): Promise<Client[]> {
  try {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.status, 'ACTIVE'))
      .orderBy(clients.name);
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}

export async function getUsersForTeam(): Promise<User[]> {
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

export async function searchCases(query: string): Promise<CaseWithRelations[]> {
  try {
    return getCasesPaginated({
      search: query,
      limit: 50,
      offset: 0
    });
  } catch (error) {
    console.error('Error searching cases:', error);
    throw new Error('Failed to search cases');
  }
}

export async function getCaseStats() {
  try {
    const stats = await db
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        active: sql<number>`count(*) filter (where status = 'ACTIVO')`.mapWith(Number),
        pending: sql<number>`count(*) filter (where status = 'EN_ESPERA')`.mapWith(Number),
        closed: sql<number>`count(*) filter (where status = 'CERRADO')`.mapWith(Number),
        archived: sql<number>`count(*) filter (where status = 'ARCHIVADO')`.mapWith(Number),
      })
      .from(cases);
    return stats[0];
  } catch (error) {
    console.error('Error fetching case stats:', error);
    throw new Error('Failed to fetch case statistics');
  }
}