'use server';

import { eq, desc, and, gte, lte, count, ilike, or, inArray, asc } from 'drizzle-orm';
import { db } from '@/db';
import {
  cases,
  tasks,
  clients,
  users,
  templates,
  documents,
  calendarEvents,
  casesToUsers,
  taskComments,
  casePartes,
  movements
} from '@/db/schema';
import type {
  DashboardStats,
  CaseWithRelations,
  TaskWithRelations,
  Template,
  CalendarEvent,
  TemplateVariable,
  ProcessedTemplate,
  Client
} from '@/lib/types';
import { auth } from '@/features/auth';
import { revalidatePath } from 'next/cache';
import { googleCalendarService } from '@/services/googleCalendar';
import { emailNotificationService } from '@/services/emailNotifications';
import { logActivity } from '../movimientos/actions';

// Get current user helper
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autenticado');
  }
  return session.user.id;
}

// Dashboard Actions
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [totalCasesResult, activeCasesResult, pendingTasksResult, upcomingEventsResult] = await Promise.all([
      db.select({ count: count() }).from(cases),
      db.select({ count: count() }).from(cases).where(eq(cases.status, 'ACTIVO')),
      db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'ACTIVO')),
      db.select({ count: count() }).from(calendarEvents).where(gte(calendarEvents.startDate, new Date()))
    ]);

    // Get recent activities (simplified for now)
    const recentTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5);
    const recentEvents = await db.select().from(calendarEvents).orderBy(desc(calendarEvents.createdAt)).limit(5);

    const recentActivities = [
      ...recentTasks.map(task => ({
        id: task.id,
        type: 'task' as const,
        title: `Nueva tarea: ${task.description.slice(0, 50)}...`,
        description: `Vence: ${task.fechaDeVencimiento?.toLocaleDateString() || 'Sin fecha'}`,
        timestamp: task.createdAt || new Date(),
      })),
      ...recentEvents.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description || '',
        timestamp: event.createdAt || new Date(),
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return {
      totalCases: totalCasesResult[0]?.count || 0,
      activeCases: activeCasesResult[0]?.count || 0,
      pendingTasks: pendingTasksResult[0]?.count || 0,
      upcomingEvents: upcomingEventsResult[0]?.count || 0,
      recentActivities
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

// Case Actions
export async function getCases(): Promise<CaseWithRelations[]> {
  try {
    const casesData = await db.select()
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .orderBy(desc(cases.createdAt));

    return casesData.map(({ cases: caseData, clients: clientData }) => ({
      ...caseData,
      client: clientData || undefined
    }));
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw new Error('Failed to fetch cases');
  }
}

export async function getCaseById(caseId: string): Promise<CaseWithRelations | null> {
  try {
    const result = await db.select()
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(eq(cases.id, caseId))
      .limit(1);

    if (!result.length) return null;

    const { cases: caseData, clients: clientData } = result[0];

    // Get tasks for this case
    const tasksData = await db.select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .where(eq(tasks.caseId, caseId));

    // Get case parts
    const partesData = await db.select()
      .from(casePartes)
      .where(eq(casePartes.caseId, caseId));
    
    // Get upcoming calendar events for this case
    const upcomingEvents = await db.select()
      .from(calendarEvents)
      .where(and(
        eq(calendarEvents.caseId, caseId),
        gte(calendarEvents.startDate, new Date())
      ))
      .orderBy(calendarEvents.startDate)
      .limit(10);

    // **FIX: Obtener movimientos del caso directamente**
    const caseMovements = await db.select({
        movement: movements,
        user: users
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(eq(movements.entityId, caseId))
      .orderBy(desc(movements.createdAt));

    // Obtener IDs de tareas y eventos relacionados
    const taskIds = tasksData.map(task => task.tasks.id);
    const eventIds = upcomingEvents.map(event => event.id);

    // **FIX: Obtener movimientos de tareas CON información de la tarea**
    const taskMovements = taskIds.length > 0 
      ? await db.select({
          movement: movements,
          user: users,
          task: tasks // **FIX: Incluir información de la tarea**
        })
        .from(movements)
        .leftJoin(users, eq(movements.createdBy, users.id))
        .leftJoin(tasks, eq(movements.entityId, tasks.id)) // **FIX: Join con tasks**
        .where(and(
          inArray(movements.entityId, taskIds),
          eq(movements.entityType, 'task')
        ))
        .orderBy(desc(movements.createdAt))
      : [];

    // Obtener movimientos de eventos relacionados
    const eventMovements = eventIds.length > 0 
      ? await db.select({
          movement: movements,
          user: users,
          event: calendarEvents // **FIX: Incluir información del evento**
        })
        .from(movements)
        .leftJoin(users, eq(movements.createdBy, users.id))
        .leftJoin(calendarEvents, eq(movements.entityId, calendarEvents.id)) // **FIX: Join con events**
        .where(and(
          inArray(movements.entityId, eventIds),
          eq(movements.entityType, 'event')
        ))
        .orderBy(desc(movements.createdAt))
      : [];

    // **FIX: Combinar movimientos con información completa**
    const allMovements = [
      ...caseMovements.map(m => ({
        ...m.movement,
        createdByUser: m.user,
        relatedTask: null,
        relatedEvent: null
      })),
      ...taskMovements.map(m => ({
        ...m.movement,
        createdByUser: m.user,
        relatedTask: m.task,
        relatedEvent: null
      })),
      ...eventMovements.map(m => ({
        ...m.movement,
        createdByUser: m.user,
        relatedTask: null,
        relatedEvent: m.event
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      ...caseData,
      client: clientData || undefined,
      tasks: tasksData.map(({ tasks: taskData, users: userData }) => ({
        ...taskData,
        assignedTo: userData || undefined,
      })),
      partes: partesData,
      movements: allMovements,
      upcomingEvents
    };
  } catch (error) {
    console.error('Error fetching case:', error);
    throw new Error('Failed to fetch case');
  }
}

// Task Actions
export async function getTasks(): Promise<TaskWithRelations[]> {
  try {
    const tasksData = await db.select()
      .from(tasks)
      .leftJoin(cases, eq(tasks.caseId, cases.id))
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .orderBy(desc(tasks.createdAt));

    // Get comments for each task
    const tasksWithComments = await Promise.all(
      tasksData.map(async ({ tasks: taskData, cases: caseData, users: userData }) => {
        const commentsData = await db.select()
          .from(taskComments)
          .leftJoin(users, eq(taskComments.createdBy, users.id))
          .where(eq(taskComments.taskId, taskData.id))
          .orderBy(desc(taskComments.createdAt));

        return {
          ...taskData,
          case: caseData || undefined,
          assignedTo: userData || undefined,
          comments: commentsData.map(({ task_comments: comment, users: commentUser }) => ({
            ...comment,
            createdByUser: commentUser || undefined
          }))
        };
      })
    );

    return tasksWithComments;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

export async function getTaskById(taskId: string): Promise<TaskWithRelations | null> {
  try {
    const result = await db.select()
      .from(tasks)
      .leftJoin(cases, eq(tasks.caseId, cases.id))
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!result.length) return null;

    const { tasks: taskData, cases: caseData, users: userData } = result[0];

    // Get comments for this task
    const commentsData = await db.select()
      .from(taskComments)
      .leftJoin(users, eq(taskComments.createdBy, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));

    return {
      ...taskData,
      case: caseData || undefined,
      assignedTo: userData || undefined,
      comments: commentsData.map(({ task_comments: comment, users: commentUser }) => ({
        ...comment,
        createdByUser: commentUser || undefined
      }))
    };
  } catch (error) {
    console.error('Error fetching task:', error);
    throw new Error('Failed to fetch task');
  }
}

export async function createTask(taskData: {
  caseId: string;
  assignedToId: string;
  description: string;
  fechaDeVencimiento?: Date | string | null;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
}) {
  try {
    const currentUserId = await getCurrentUser();
    
    let fechaDeVencimiento: Date | null = null;
    if (taskData.fechaDeVencimiento) {
      if (typeof taskData.fechaDeVencimiento === 'string') {
        fechaDeVencimiento = new Date(taskData.fechaDeVencimiento);
      } else {
        fechaDeVencimiento = taskData.fechaDeVencimiento;
      }
    }
    
    const [newTask] = await db.insert(tasks).values({
      ...taskData,
      fechaDeVencimiento: fechaDeVencimiento,
      status: 'ACTIVO',
      createdBy: currentUserId
    }).returning();

    // Registrar en historial CON información completa
    const [assignedUser] = await db.select()
      .from(users)
      .where(eq(users.id, taskData.assignedToId))
      .limit(1);

    const [caseInfo] = await db.select()
      .from(cases)
      .where(eq(cases.id, taskData.caseId))
      .limit(1);

    await logActivity(
      'TASK_CREATED',
      `Nueva tarea creada: "${taskData.description}"`,
      `Tarea asignada a ${assignedUser?.firstName} ${assignedUser?.lastName} para el caso "${caseInfo?.caseName}"`,
      currentUserId,
      {
        entityId: newTask.id,
        entityType: 'task',
        newValue: {
          ...newTask,
          assignedTo: assignedUser,
          case: caseInfo
        }
      }
    );

    revalidatePath('/tareas');
    revalidatePath('/casos');
    return { success: true, task: newTask };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

export async function updateTaskStatus(taskId: string, status: 'ACTIVO' | 'EN_REVISION' | 'APROBADA') {
  try {
    // Validate that taskId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      throw new Error('ID de tarea inválido');
    }

    // **FIX: Obtener información completa de la tarea ANTES de actualizar**
    const [taskWithInfo] = await db.select({
      task: tasks,
      assignedTo: users,
      case: cases
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedToId, users.id))
    .leftJoin(cases, eq(tasks.caseId, cases.id))
    .where(eq(tasks.id, taskId))
    .limit(1);

    if (!taskWithInfo) {
      throw new Error('Tarea no encontrada');
    }

    const oldStatus = taskWithInfo.task.status;
    
    await db.update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    // **FIX: Registrar en historial con información completa de la tarea**
    const currentUserId = await getCurrentUser();
    
    const statusLabels = {
      'ACTIVO': 'Activo',
      'EN_REVISION': 'En Revisión',
      'APROBADA': 'Aprobada'
    };

    // **FIX: Obtener título útil de la tarea**
    const getTaskDisplayTitle = (task: any) => {
      if (task.title && task.title.trim() !== '' && task.title !== 'Tarea sin título') {
        return task.title;
      }
      if (task.description) {
        return task.description.length > 50 
          ? `${task.description.substring(0, 50)}...`
          : task.description;
      }
      return 'Tarea sin título';
    };
    
    const taskTitle = getTaskDisplayTitle(taskWithInfo.task);
    
    await logActivity(
      'TASK_STATUS_CHANGED',
      `Estado de tarea actualizado: "${taskTitle}"`,
      `Cambiada de "${statusLabels[oldStatus]}" a "${statusLabels[status]}" (Asignada a: ${taskWithInfo.assignedTo?.firstName} ${taskWithInfo.assignedTo?.lastName})`,
      currentUserId,
      {
        entityId: taskId,
        entityType: 'task',
        previousValue: {
          status: oldStatus,
          task: taskWithInfo.task,
          assignedTo: taskWithInfo.assignedTo,
          case: taskWithInfo.case
        },
        newValue: {
          status: status,
          task: taskWithInfo.task,
          assignedTo: taskWithInfo.assignedTo,
          case: taskWithInfo.case
        }
      }
    );

    revalidatePath('/tareas');
    revalidatePath('/casos');
    return { success: true };
  } catch (error) {
    console.error('Error updating task status:', error);
    return { success: false, error: 'Failed to update task status' };
  }
}

export async function deleteTask(taskId: string) {
  try {
    // Delete comments first
    await db.delete(taskComments).where(eq(taskComments.taskId, taskId));
    
    // Delete task
    await db.delete(tasks).where(eq(tasks.id, taskId));

    revalidatePath('/tareas');
    revalidatePath('/casos');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

export async function addTaskComment(taskId: string, comment: string) {
  try {
    const currentUserId = await getCurrentUser();
    
    const [newComment] = await db.insert(taskComments).values({
      taskId,
      comment,
      createdBy: currentUserId
    }).returning();

    // **FIX: Registrar comentario con información de la tarea**
    const [taskInfo] = await db.select({
      task: tasks,
      case: cases
    })
    .from(tasks)
    .leftJoin(cases, eq(tasks.caseId, cases.id))
    .where(eq(tasks.id, taskId))
    .limit(1);

    // **FIX: Crear título útil para la tarea**
    const getTaskDisplayTitle = (task: any) => {
      if (task.title && task.title.trim() !== '' && task.title !== 'Tarea sin título') {
        return task.title;
      }
      if (task.description) {
        return task.description.length > 50 
          ? `${task.description.substring(0, 50)}...`
          : task.description;
      }
      return 'Tarea sin título';
    };
    
    const taskTitle = getTaskDisplayTitle(newTask);
    if (taskInfo) {
      const taskTitle = taskInfo.task.title || taskInfo.task.description || 'Tarea sin título';
      await logActivity(
        'TASK_COMMENT_ADDED',
        `Comentario añadido a tarea: "${taskTitle}"`,
        `Se añadió un comentario a la tarea en el caso "${taskInfo.case?.caseName}"`,
        currentUserId,
        {
          entityId: taskId,
          entityType: 'task',
          newValue: {
            comment: newComment,
            task: taskInfo.task,
            case: taskInfo.case
          }
        }
      );
    }

    revalidatePath('/tareas');
    return { success: true, comment: newComment };
  } catch (error) {
    console.error('Error adding task comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

// Calendar Actions
export async function getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
  try {
    let query = db.select().from(calendarEvents);

    if (startDate && endDate) {
      query = db.select().from(calendarEvents).where(
        and(
          gte(calendarEvents.startDate, startDate),
          lte(calendarEvents.startDate, endDate)
        )
      );
    }

    const events = await query.orderBy(calendarEvents.startDate);
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

export async function createCalendarEvent(eventData: {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type: 'AUDIENCIA' | 'CITA_CON_CLIENTE' | 'VENCIMIENTO_LEGAL' | 'REUNION_INTERNA';
  caseId?: string;
  reminderMinutes?: number;
  attendeeEmails?: string[];
}) {
  try {
    const currentUserId = await getCurrentUser();
    
    const [newEvent] = await db.insert(calendarEvents).values({
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      type: eventData.type,
      caseId: eventData.caseId,
      createdBy: currentUserId
    }).returning();

    // **FIX: Registrar evento con información del caso si existe**
    let caseInfo = null;
    if (eventData.caseId) {
      const [caseResult] = await db.select()
        .from(cases)
        .where(eq(cases.id, eventData.caseId))
        .limit(1);
      caseInfo = caseResult;
    }

    await logActivity(
      'EVENT_CREATED',
      `Nueva tarea creada: "${taskTitle}"`,
      `Asignada a ${assignedUser?.firstName} ${assignedUser?.lastName} para el caso "${caseInfo?.caseName}"`,
      currentUserId,
      {
        entityId: newEvent.id,
        entityType: 'event',
        newValue: {
          ...newEvent,
          case: caseInfo
        }
      }
    );

    // Schedule email notification if reminder is set
    if (eventData.reminderMinutes && eventData.attendeeEmails?.length) {
      await scheduleEventReminder(newEvent, eventData.attendeeEmails, eventData.reminderMinutes);
    }

    revalidatePath('/calendario');
    return { success: true, event: newEvent };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: 'Failed to create calendar event' };
  }
}

export async function createGoogleCalendarEvent(eventData: {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  attendeeEmails?: string[];
  reminderMinutes?: number;
}) {
  try {
    const googleEventId = await googleCalendarService.createEvent({
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      attendeeEmails: eventData.attendeeEmails,
      reminderMinutes: eventData.reminderMinutes
    });

    return { success: true, googleEventId };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return { success: false, error: 'Failed to create Google Calendar event' };
  }
}

async function scheduleEventReminder(event: CalendarEvent, recipients: string[], reminderMinutes: number) {
  try {
    const reminderDate = new Date(event.startDate.getTime() - (reminderMinutes * 60 * 1000));
    const now = new Date();

    // If reminder date is in the future, schedule it
    if (reminderDate > now) {
      // In a real application, you would use a job queue like Bull or Agenda
      // For this example, we'll use setTimeout (not recommended for production)
      const timeoutMs = reminderDate.getTime() - now.getTime();
      
      if (timeoutMs <= 2147483647) { // Max timeout value
        setTimeout(async () => {
          try {
            await emailNotificationService.sendEventReminder(event, recipients);
          } catch (error) {
            console.error('Error sending scheduled reminder:', error);
          }
        }, timeoutMs);
      }
    }
  } catch (error) {
    console.error('Error scheduling event reminder:', error);
  }
}

// Template Actions
export async function getTemplates(): Promise<Template[]> {
  try {
    const templatesData = await db.select()
      .from(templates)
      .where(eq(templates.status, 'ACTIVE'))
      .orderBy(desc(templates.createdAt));

    return templatesData;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch templates');
  }
}

export async function createTemplate(templateData: {
  templateName: string;
  description?: string;
  content: string;
}) {
  try {
    const currentUserId = await getCurrentUser();
    
    const [newTemplate] = await db.insert(templates).values({
      ...templateData,
      status: 'ACTIVE',
      createdBy: currentUserId
    }).returning();

    return { success: true, template: newTemplate };
  } catch (error) {
    console.error('Error creating template:', error);
    return { success: false, error: 'Failed to create template' };
  }
}

export async function updateTemplate(templateId: string, templateData: {
  templateName?: string;
  description?: string;
  content?: string;
}) {
  try {
    const [updatedTemplate] = await db.update(templates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(templates.id, templateId))
      .returning();

    return { success: true, template: updatedTemplate };
  } catch (error) {
    console.error('Error updating template:', error);
    return { success: false, error: 'Failed to update template' };
  }
}

// Template Variable Suggestions
export async function getTemplateVariables(): Promise<TemplateVariable[]> {
  return [
    // Client variables
    { name: 'client.name', label: 'Nombre del Cliente', type: 'text', source: 'client', description: 'Nombre completo o razón social del cliente' },
    { name: 'client.email', label: 'Email del Cliente', type: 'text', source: 'client', description: 'Correo electrónico del cliente' },
    { name: 'client.phone', label: 'Teléfono del Cliente', type: 'text', source: 'client', description: 'Número de teléfono del cliente' },
    { name: 'client.dni', label: 'Documento de Identidad', type: 'text', source: 'client', description: 'Cédula, RIF u otro documento de identidad' },
    { name: 'client.address', label: 'Dirección del Cliente', type: 'text', source: 'client', description: 'Dirección completa del cliente' },
    { name: 'client.type', label: 'Tipo de Cliente', type: 'text', source: 'client', description: 'Persona Natural o Empresa' },

    // Case variables
    { name: 'case.name', label: 'Nombre del Caso', type: 'text', source: 'case', description: 'Título descriptivo del caso' },
    { name: 'case.number', label: 'Número de Expediente', type: 'text', source: 'case', description: 'Número oficial del expediente' },
    { name: 'case.description', label: 'Descripción del Caso', type: 'text', source: 'case', description: 'Detalles y resumen del caso' },
    { name: 'case.openingDate', label: 'Fecha de Apertura', type: 'date', source: 'case', description: 'Fecha en que se abrió el caso' },
    { name: 'case.status', label: 'Estado del Caso', type: 'text', source: 'case', description: 'Estado actual del caso' },
    { name: 'case.authorities', label: 'Autoridades Competentes', type: 'text', source: 'case', description: 'Autoridades que conocen del caso' },
    { name: 'case.internalStatus', label: 'Estado Interno', type: 'text', source: 'case', description: 'Estado interno del despacho' },

    // Case parts variables
    { name: 'parteActiva.nombre', label: 'Nombre Parte Activa', type: 'text', source: 'parte', description: 'Nombre completo de la parte activa' },
    { name: 'parteActiva.cedula', label: 'Cédula Parte Activa', type: 'text', source: 'parte', description: 'Cédula de la parte activa' },
    { name: 'parteDemandada.nombre', label: 'Nombre Parte Demandada', type: 'text', source: 'parte', description: 'Nombre completo de la parte demandada' },
    { name: 'parteDemandada.cedula', label: 'Cédula Parte Demandada', type: 'text', source: 'parte', description: 'Cédula de la parte demandada' },

    // User/Lawyer variables
    { name: 'lawyer.firstName', label: 'Nombre del Abogado', type: 'text', source: 'user', description: 'Nombre del abogado responsable' },
    { name: 'lawyer.lastName', label: 'Apellido del Abogado', type: 'text', source: 'user', description: 'Apellido del abogado responsable' },
    { name: 'lawyer.email', label: 'Email del Abogado', type: 'text', source: 'user', description: 'Correo del abogado' },
    { name: 'lawyer.role', label: 'Cargo del Abogado', type: 'text', source: 'user', description: 'Rol del abogado en el despacho' },

    // Date variables
    { name: 'today', label: 'Fecha Actual', type: 'date', source: 'custom', description: 'Fecha de hoy' },
    { name: 'currentYear', label: 'Año Actual', type: 'number', source: 'custom', description: 'Año en curso' },
  ];
}

export async function processTemplate(templateContent: string, data: {
  client?: any;
  case?: any;
  lawyer?: any;
  partes?: any[];
}): Promise<ProcessedTemplate> {
  const variables = await getTemplateVariables();
  let processedContent = templateContent;

  // Replace variables with actual data
  variables.forEach(variable => {
    const placeholder = `{{${variable.name}}}`;
    if (processedContent.includes(placeholder)) {
      let value: string = '';

      switch (variable.source) {
        case 'client':
          const clientKey = variable.name.split('.')[1];
          value = data.client?.[clientKey] || `[${variable.label}]`;
          break;
        case 'case':
          const caseKey = variable.name.split('.')[1];
          value = data.case?.[caseKey] || `[${variable.label}]`;
          break;
        case 'parte':
          if (variable.name.startsWith('parteActiva.')) {
            const parteActiva = data.partes?.find(p => p.type === 'ACTIVA');
            const key = variable.name.split('.')[1];
            if (key === 'nombre') {
              value = parteActiva ? `${parteActiva.firstName} ${parteActiva.lastName}` : `[${variable.label}]`;
            } else {
              value = parteActiva?.[key] || `[${variable.label}]`;
            }
          } else if (variable.name.startsWith('parteDemandada.')) {
            const parteDemandada = data.partes?.find(p => p.type === 'DEMANDADA');
            const key = variable.name.split('.')[1];
            if (key === 'nombre') {
              value = parteDemandada ? `${parteDemandada.firstName} ${parteDemandada.lastName}` : `[${variable.label}]`;
            } else {
              value = parteDemandada?.[key] || `[${variable.label}]`;
            }
          }
          break;
        case 'user':
          const userKey = variable.name.split('.')[1];
          value = data.lawyer?.[userKey] || `[${variable.label}]`;
          break;
        case 'custom':
          if (variable.name === 'today') {
            value = new Date().toLocaleDateString('es-ES');
          } else if (variable.name === 'currentYear') {
            value = new Date().getFullYear().toString();
          }
          break;
      }

      processedContent = processedContent.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), value);
    }
  });

  return {
    content: processedContent,
    variables: variables.filter(v => templateContent.includes(`{{${v.name}}}`))
  };
}

// Users Actions
export async function getUsers() {
  try {
    const usersData = await db.select().from(users).orderBy(users.firstName);
    return usersData;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getUsersForTeam() {
  try {
    const usersData = await db.select().from(users).orderBy(users.firstName);
    return usersData;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function searchClients(params: {
  searchTerm?: string;
  sortBy?: 'name' | 'dni' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<Client[]> {
  const { 
    searchTerm = '', 
    sortBy = 'name', 
    sortOrder = 'asc', 
    limit = 20 // Límite de resultados
  } = params;

  try {
    let query = db.select().from(clients);

    // Aplicar filtro de búsqueda si existe un término
    if (searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      // La búsqueda ahora incluye nombre, email, dni y teléfonos
      query = query.where(
        or(
          ilike(clients.name, searchPattern),
          ilike(clients.email, searchPattern),
          ilike(clients.dni, searchPattern),
          ilike(clients.phone, searchPattern),
          ilike(clients.phone2, searchPattern),
          ilike(clients.landline, searchPattern)
        )
      );
    }

    // Aplicar ordenamiento
    const sortColumn = 
      sortBy === 'dni' ? clients.dni :
      sortBy === 'createdAt' ? clients.createdAt :
      clients.name; // Por defecto ordena por nombre

    const direction = sortOrder === 'desc' ? desc : asc;
    query = query.orderBy(direction(sortColumn));

    // Aplicar límite
    query = query.limit(limit);
    
    const clientsData = await query;
    return clientsData;

  } catch (error) {
    console.error('Error searching clients:', error);
    throw new Error('Failed to search clients');
  }
}

// Clients Actions
export async function getClients() {
  try {
    const clientsData = await db.select().from(clients)
      .where(eq(clients.status, 'ACTIVE'))
      .orderBy(clients.name);
    return clientsData;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}