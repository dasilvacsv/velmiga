'use server';

import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { db } from '@/db';
import { calendarEvents, users } from '@/db/schema';
import type { CalendarEvent } from '@/lib/types';
import { auth } from '@/features/auth';
import { revalidatePath } from 'next/cache';
import { n8nCalendarService } from '@/services/n8nCalendarService';
import { logActivity } from '@/features/movimientos/actions'; // **FIX: Agregar import**

// Get current user helper
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autenticado');
  }
  return session.user.id;
}

/**
 * Verificar rol del usuario
 */
export async function getUserRole(userId: string): Promise<string> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('Usuario no encontrado');
    }
    return user[0].role || 'ABOGADO';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'ABOGADO';
  }
}

/**
 * Obtener todos los emails de usuarios del sistema
 */
export async function getUserEmails(): Promise<Array<{ name: string; email: string }>> {
  try {
    const allUsers = await db.select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email
    }).from(users);
    
    return allUsers.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email
    }));
  } catch (error) {
    console.error('Error getting user emails:', error);
    return [];
  }
}

/**
 * Verificar permisos de sincronización
 * Solo SOCIO y ADMIN pueden sincronizar con Google Calendar
 */
export async function checkSyncPermissions(userId: string): Promise<boolean> {
  try {
    const role = await getUserRole(userId);
    return role === 'SOCIO' || role === 'ADMIN';
  } catch (error) {
    console.error('Error checking sync permissions:', error);
    return false;
  }
}

/**
 * Obtener eventos del calendario
 */
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

/**
 * Crear evento con sincronización mejorada
 * **FIX: Agregar registro de actividad para eventos**
 */
export async function createCalendarEventWithSync(eventData: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  type: string;
  caseId?: string;
  reminderMinutes?: number;
  attendeeEmails?: string[];
  syncWithGoogle?: boolean;
  emailNotification?: boolean;
  userId: string;
}) {
  try {
    const currentUserId = await getCurrentUser();
    const canSync = await checkSyncPermissions(currentUserId);
    
    // Crear evento local (esto no cambia, está perfecto)
    const [newEvent] = await db.insert(calendarEvents).values({
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      type: eventData.type as any,
      caseId: eventData.caseId,
      emailNotification: eventData.emailNotification || true,
      createdBy: currentUserId
    }).returning();

    // **FIX: Registrar actividad en el historial de movimientos**
    const caseInfo = eventData.caseId ? await db.query.cases.findFirst({
      where: (cases, { eq }) => eq(cases.id, eventData.caseId!)
    }) : null;

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, currentUserId)
    });

    await logActivity(
      'EVENT_CREATED',
      `Evento creado: "${newEvent.title}"`,
      `${user?.firstName || 'Usuario'} creó un evento tipo "${eventData.type}" para ${eventData.startDate.toLocaleDateString('es-ES')}${caseInfo ? ` en el caso "${caseInfo.caseName}"` : ''}`,
      currentUserId,
      {
        entityId: eventData.caseId || newEvent.id,
        entityType: eventData.caseId ? 'case' : 'event',
        newValue: {
          eventId: newEvent.id,
          title: newEvent.title,
          type: newEvent.type,
          startDate: newEvent.startDate,
          caseId: eventData.caseId
        }
      }
    );

    let syncResult: any = { success: true, googleEventId: null };
    let syncStatus: 'local' | 'synced' | 'partial' = 'local';

    // --- INICIO DEL CÓDIGO FINAL Y DIRECTO ---
    if (eventData.syncWithGoogle && canSync) {
      
      // Función para formatear fechas a ISO sin milisegundos
      const toCleanISOString = (date: Date) => date.toISOString().split('.')[0] + 'Z';

      // Preparamos el payload perfecto para n8n
      const n8nPayload = {
        summary: eventData.title, // 1. Usamos 'summary'
        description: eventData.description || '',
        location: eventData.location || '',
        // 2. Usamos el formato de fecha más limpio posible
        startDate: toCleanISOString(eventData.startDate),
        endDate: eventData.endDate ? toCleanISOString(eventData.endDate) : undefined,
        // 3. Enviamos los invitados como un array de strings
        attendees: eventData.attendeeEmails || [],
        reminderMinutes: eventData.reminderMinutes || 1440,
      };

      // Llamamos al servicio con este payload perfecto
      syncResult = await n8nCalendarService.createGoogleCalendarEvent(n8nPayload);

      if (syncResult.success && syncResult.googleEventId) {
        await db.update(calendarEvents)
          .set({ googleEventId: syncResult.googleEventId })
          .where(eq(calendarEvents.id, newEvent.id));
        
        syncStatus = 'synced';
      } else {
        syncStatus = 'partial';
        console.warn('Failed to sync with Google Calendar:', syncResult.error);
      }
    }
    // --- FIN DEL CÓDIGO FINAL Y DIRECTO ---

    revalidatePath('/calendario');
    revalidatePath('/casos');
    if (eventData.caseId) {
      revalidatePath(`/casos/${eventData.caseId}`);
    }
    
    return { 
      success: true, 
      event: newEvent,
      syncStatus,
      syncError: syncResult.success ? null : syncResult.error
    };
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { 
      success: false, 
      error: 'Failed to create calendar event',
      syncStatus: 'failed' as const
    };
  }
}

/**
 * Actualizar evento con sincronización
 */
export async function updateCalendarEventWithSync(
  eventId: string,
  eventData: Partial<{
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    type: string;
    reminderMinutes: number;
    attendeeEmails: string[];
  }>
) {
  try {
    const currentUserId = await getCurrentUser();
    const canSync = await checkSyncPermissions(currentUserId);

    // Obtener evento actual
    const existingEvent = await db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId))
      .limit(1);

    if (!existingEvent.length) {
      throw new Error('Evento no encontrado');
    }

    const event = existingEvent[0];

    // Actualizar evento local
    const [updatedEvent] = await db.update(calendarEvents)
      .set({
        ...eventData,
        updatedAt: new Date()
      })
      .where(eq(calendarEvents.id, eventId))
      .returning();

    let syncResult = { success: true };
    let syncStatus: 'updated' | 'synced' | 'partial' = 'updated';

    // Sincronizar con Google Calendar si es necesario
    if (event.googleEventId && canSync) {
      const syncData: any = {};
      
      if (eventData.title) syncData.title = eventData.title;
      if (eventData.description) syncData.description = eventData.description;
      if (eventData.startDate) syncData.startDate = eventData.startDate.toISOString();
      if (eventData.endDate) syncData.endDate = eventData.endDate.toISOString();
      if (eventData.attendeeEmails) syncData.attendeeEmails = eventData.attendeeEmails;
      if (eventData.reminderMinutes) syncData.reminderMinutes = eventData.reminderMinutes;

      syncResult = await n8nCalendarService.updateGoogleCalendarEvent(
        event.googleEventId,
        {
          ...syncData,
          eventType: eventData.type,
          userId: currentUserId
        }
      );

      syncStatus = syncResult.success ? 'synced' : 'partial';
    }

    revalidatePath('/calendario');
    
    return { 
      success: true, 
      event: updatedEvent,
      syncStatus,
      syncError: syncResult.success ? null : (syncResult as any).error
    };
    
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { 
      success: false, 
      error: 'Failed to update calendar event'
    };
  }
}

/**
 * Eliminar evento con sincronización
 */
export async function deleteCalendarEventWithSync(eventId: string) {
  try {
    const currentUserId = await getCurrentUser();
    const canSync = await checkSyncPermissions(currentUserId);

    // Obtener evento antes de eliminarlo
    const existingEvent = await db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId))
      .limit(1);

    if (!existingEvent.length) {
      throw new Error('Evento no encontrado');
    }

    const event = existingEvent[0];
    let syncResult = { success: true };

    // Eliminar de Google Calendar si existe
    if (event.googleEventId && canSync) {
      syncResult = await n8nCalendarService.deleteGoogleCalendarEvent(event.googleEventId);
    }

    // Eliminar evento local
    await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));

    revalidatePath('/calendario');
    
    return { 
      success: true,
      syncStatus: syncResult.success ? 'synced' : 'partial',
      syncError: syncResult.success ? null : (syncResult as any).error
    };
    
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { 
      success: false, 
      error: 'Failed to delete calendar event'
    };
  }
}

/**
 * Sincronizar eventos desde Google Calendar
 */
export async function syncEventsFromGoogle() {
  try {
    const currentUserId = await getCurrentUser();
    const canSync = await checkSyncPermissions(currentUserId);

    if (!canSync) {
      throw new Error('No tiene permisos para sincronizar eventos');
    }

    const syncResult = await n8nCalendarService.syncEventsFromGoogle(currentUserId);
    
    if (!syncResult.success) {
      throw new Error(syncResult.error || 'Error al sincronizar eventos');
    }

    // Aquí procesarías los eventos recibidos desde Google Calendar
    // y los insertarías/actualizarías en tu base de datos local
    const googleEvents = syncResult.data?.events || [];
    
    for (const googleEvent of googleEvents) {
      // Verificar si el evento ya existe
      const existingEvent = await db.select()
        .from(calendarEvents)
        .where(eq(calendarEvents.googleEventId, googleEvent.id))
        .limit(1);

      if (!existingEvent.length) {
        // Crear nuevo evento
        await db.insert(calendarEvents).values({
          title: googleEvent.title,
          description: googleEvent.description,
          startDate: new Date(googleEvent.startDate),
          endDate: googleEvent.endDate ? new Date(googleEvent.endDate) : null,
          type: googleEvent.type || 'REUNION_INTERNA',
          googleEventId: googleEvent.id,
          emailNotification: true,
          createdBy: currentUserId
        });
      }
    }

    revalidatePath('/calendario');
    
    return { 
      success: true,
      syncedEvents: googleEvents.length
    };
    
  } catch (error) {
    console.error('Error syncing events from Google:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync events from Google'
    };
  }
}

/**
 * Obtener estadísticas del calendario
 */
export async function getCalendarStats() {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [todayEvents, weekEvents, totalEvents] = await Promise.all([
      db.select({ count: count() })
        .from(calendarEvents)
        .where(and(
          gte(calendarEvents.startDate, new Date(today.getFullYear(), today.getMonth(), today.getDate())),
          lte(calendarEvents.startDate, new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59))
        )),
      
      db.select({ count: count() })
        .from(calendarEvents)
        .where(and(
          gte(calendarEvents.startDate, startOfWeek),
          lte(calendarEvents.startDate, endOfWeek)
        )),
      
      db.select({ count: count() }).from(calendarEvents)
    ]);

    return {
      today: todayEvents[0]?.count || 0,
      thisWeek: weekEvents[0]?.count || 0,
      total: totalEvents[0]?.count || 0
    };
    
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    return {
      today: 0,
      thisWeek: 0,
      total: 0
    };
  }
}