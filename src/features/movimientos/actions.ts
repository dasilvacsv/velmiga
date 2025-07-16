'use server';

import { db } from '@/db';
import { movements, users } from '@/db/schema';
import { Movement, NewMovement, User, MovementWithRelations } from '@/lib/types';
import { eq, desc, and, or, ilike, sql, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// =================================================================
// FUNCIONES DE LECTURA DE MOVIMIENTOS
// =================================================================

export async function getMovements(): Promise<MovementWithRelations[]> {
  try {
    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .orderBy(desc(movements.createdAt));

    return result.map(row => ({
      ...row.movement,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error fetching movements:', error);
    throw new Error('Failed to fetch movements');
  }
}

export async function getRecentMovements(limit: number = 10): Promise<MovementWithRelations[]> {
  try {
    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .orderBy(desc(movements.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.movement,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error fetching recent movements:', error);
    throw new Error('Failed to fetch recent movements');
  }
}

export async function getUnreadMovements(userId: string): Promise<MovementWithRelations[]> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(
        and(
          gte(movements.createdAt, oneDayAgo),
          sql`${movements.createdBy} != ${userId}`
        )
      )
      .orderBy(desc(movements.createdAt))
      .limit(10);

    return result.map(row => ({
      ...row.movement,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error fetching unread movements:', error);
    return [];
  }
}

export async function getMovementById(id: string): Promise<MovementWithRelations | null> {
  try {
    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(eq(movements.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const movementData = result[0];
    
    return {
      ...movementData.movement,
      createdByUser: movementData.createdByUser || undefined,
    };
  } catch (error) {
    console.error('Error fetching movement by ID:', error);
    throw new Error('Failed to fetch movement');
  }
}

export async function searchMovements(query: string): Promise<MovementWithRelations[]> {
  try {
    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(
        or(
          ilike(movements.title, `%${query}%`),
          ilike(movements.description, `%${query}%`),
          ilike(movements.type, `%${query}%`)
        )
      )
      .orderBy(desc(movements.createdAt));

    return result.map(row => ({
      ...row.movement,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error searching movements:', error);
    throw new Error('Failed to search movements');
  }
}

export async function getMovementsByType(type: string): Promise<MovementWithRelations[]> {
  try {
    if (type === 'all') {
      return getMovements();
    }

    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(eq(movements.type, type as Movement['type']))
      .orderBy(desc(movements.createdAt));

    return result.map(row => ({
      ...row.movement,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error fetching movements by type:', error);
    throw new Error('Failed to fetch movements by type');
  }
}

export async function getMovementsByDateRange(startDate: Date, endDate: Date): Promise<MovementWithRelations[]> {
  try {
    const result = await db
      .select({
        movement: movements,
        createdByUser: users,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(
        and(
          gte(movements.createdAt, startDate),
          sql`${movements.createdAt} <= ${endDate}`
        )
      )
      .orderBy(desc(movements.createdAt));

    return result.map(row => ({
      ...row.movement,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error fetching movements by date range:', error);
    throw new Error('Failed to fetch movements by date range');
  }
}


// =================================================================
// FUNCIONES DE ESCRITURA Y LOGGING (CON LA CORRECCIÓN)
// =================================================================

export async function createMovement(data: Omit<NewMovement, 'id' | 'createdAt'>): Promise<Movement> {
  try {
    const result = await db
      .insert(movements)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    revalidatePath('/movimientos');
    revalidatePath('/'); // Revalidate home page for notifications
    return result[0];
  } catch (error) {
    console.error('Error creating movement:', error);
    throw new Error('Failed to create movement');
  }
}

/**
 * Registra una actividad en el sistema de forma centralizada.
 * ESTA ES LA FUNCIÓN CORREGIDA Y CLAVE.
 * @param type - El tipo de movimiento (ej. 'CASE_CREATED').
 * @param title - Un título corto para el movimiento.
 * @param description - Una descripción detallada de lo que ocurrió.
 * @param createdBy - El ID del usuario que realizó la acción.
 * @param options - Un objeto con datos adicionales como IDs de entidad y valores de cambio.
 */


export async function logActivity(
  type: Movement['type'],
  title: string,
  description: string,
  userId: string,
  metadata?: {
    entityId?: string;
    entityType?: string;
    previousValue?: any;
    newValue?: any;
  }
) {
  try {
    // Convertir valores a JSON si son objetos
    const previousValue = metadata?.previousValue 
      ? typeof metadata.previousValue === 'object'
        ? JSON.stringify(metadata.previousValue)
        : metadata.previousValue
      : null;
    
    const newValue = metadata?.newValue 
      ? typeof metadata.newValue === 'object'
        ? JSON.stringify(metadata.newValue)
        : metadata.newValue
      : null;

    await db.insert(movements).values({
      type,
      title,
      description,
      createdBy: userId,
      entityId: metadata?.entityId || null,
      entityType: metadata?.entityType || null,
      previousValue,
      newValue,
    });
    
    revalidatePath('/movimientos');
    revalidatePath('/casos');
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}


export async function deleteMovement(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(movements)
      .where(eq(movements.id, id))
      .returning();

    revalidatePath('/movimientos');
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting movement:', error);
    throw new Error('Failed to delete movement');
  }
}

// =================================================================
// FUNCIONES AUXILIARES Y DE ESTADÍSTICAS
// =================================================================

export async function getMovementStats() {
  try {
    const stats = await db
      .select({
        // Se añade .mapWith(Number) para asegurar que el tipo de dato sea numérico
        total: sql<number>`count(*)`.mapWith(Number),
        caseCreated: sql<number>`count(*) filter (where type = 'CASE_CREATED')`.mapWith(Number),
        caseUpdated: sql<number>`count(*) filter (where type = 'CASE_UPDATED')`.mapWith(Number),
        caseClosed: sql<number>`count(*) filter (where type = 'CASE_CLOSED')`.mapWith(Number),
        taskAssigned: sql<number>`count(*) filter (where type = 'TASK_ASSIGNED')`.mapWith(Number),
        documentUploaded: sql<number>`count(*) filter (where type = 'DOCUMENT_UPLOADED')`.mapWith(Number),
        clientAdded: sql<number>`count(*) filter (where type = 'CLIENT_ADDED')`.mapWith(Number),
        userAssigned: sql<number>`count(*) filter (where type = 'USER_ASSIGNED')`.mapWith(Number),
        today: sql<number>`count(*) filter (where created_at >= current_date)`.mapWith(Number),
        thisWeek: sql<number>`count(*) filter (where created_at >= date_trunc('week', current_date))`.mapWith(Number),
        thisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', current_date))`.mapWith(Number),
      })
      .from(movements);

    return stats[0];
  } catch (error) {
    console.error('Error fetching movement stats:', error);
    throw new Error('Failed to fetch movement statistics');
  }
}

export async function getUsersForMovements(): Promise<User[]> {
  try {
    const result = await db
      .select()
      .from(users)
      .orderBy(users.firstName, users.lastName);

    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function markMovementsAsRead(userId: string): Promise<void> {
  try {
    // En una implementación real, aquí tendrías una tabla de unión para registrar qué usuario ha leído qué movimiento.
    // Por ahora, una revalidación puede ser suficiente para refrescar el estado de las notificaciones.
    revalidatePath('/');
  } catch (error) {
    console.error('Error marking movements as read:', error);
    // No se lanza el error para no afectar la experiencia del usuario.
  }
}