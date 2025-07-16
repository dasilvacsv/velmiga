'use server';

import { db } from '@/db';
import { users, movements, cases, tasks, clients, templates, casesToUsers } from '@/db/schema';
import { eq, desc, count, sql, and, gte, lte, max } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { auth } from '@/features/auth';
import { revalidatePath } from 'next/cache';

// Tipos para el módulo de administración
export interface UserWithStats {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  casesCount: number;
  tasksCount: number;
  lastActivity?: Date;
}

export interface SystemStats {
  totalUsers: number;
  totalCases: number;
  totalTasks: number;
  totalClients: number;
  totalTemplates: number;
  activeCases: number;
  pendingTasks: number;
  recentActivity: number;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  createdAt: Date;
  createdBy: string;
  userName: string;
}

// Obtener estadísticas del sistema
export async function getSystemStats(): Promise<SystemStats> {
  try {
    const [
      totalUsersResult,
      totalCasesResult,
      totalTasksResult,
      totalClientsResult,
      totalTemplatesResult,
      activeCasesResult,
      pendingTasksResult,
      recentActivityResult
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(cases),
      db.select({ count: count() }).from(tasks),
      db.select({ count: count() }).from(clients),
      db.select({ count: count() }).from(templates),
      db.select({ count: count() }).from(cases).where(eq(cases.status, 'ACTIVO')),
      db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'ACTIVO')),
      db.select({ count: count() }).from(movements).where(
        gte(movements.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    ]);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalCases: totalCasesResult[0]?.count || 0,
      totalTasks: totalTasksResult[0]?.count || 0,
      totalClients: totalClientsResult[0]?.count || 0,
      totalTemplates: totalTemplatesResult[0]?.count || 0,
      activeCases: activeCasesResult[0]?.count || 0,
      pendingTasks: pendingTasksResult[0]?.count || 0,
      recentActivity: recentActivityResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw new Error('Error al obtener estadísticas del sistema');
  }
}

// Obtener todos los usuarios con estadísticas
export async function getUsersWithStats(): Promise<UserWithStats[]> {
  try {
    // Subquery para casos asignados (incluyendo asignación automática por tareas)
    const casesSubquery = db
      .select({
        userId: casesToUsers.userId,
        casesCount: count(casesToUsers.caseId).as('casesCount')
      })
      .from(casesToUsers)
      .groupBy(casesToUsers.userId)
      .as('casesSubquery');

    // Subquery para casos asignados a través de tareas
    const casesThroughTasksSubquery = db
      .select({
        assignedToId: tasks.assignedToId,
        casesFromTasks: sql<number>`count(distinct ${tasks.caseId})`.as('casesFromTasks')
      })
      .from(tasks)
      .where(sql`${tasks.assignedToId} is not null`)
      .groupBy(tasks.assignedToId)
      .as('casesThroughTasksSubquery');

    // Subquery para tareas asignadas
    const tasksSubquery = db
      .select({
        assignedToId: tasks.assignedToId,
        tasksCount: count(tasks.id).as('tasksCount')
      })
      .from(tasks)
      .where(sql`${tasks.assignedToId} is not null`)
      .groupBy(tasks.assignedToId)
      .as('tasksSubquery');

    // Subquery para última actividad
    const activitySubquery = db
      .select({
        createdBy: movements.createdBy,
        lastActivity: max(movements.createdAt).as('lastActivity')
      })
      .from(movements)
      .groupBy(movements.createdBy)
      .as('activitySubquery');

    const usersWithStats = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        directCasesCount: sql<number>`coalesce(${casesSubquery.casesCount}, 0)`,
        casesFromTasks: sql<number>`coalesce(${casesThroughTasksSubquery.casesFromTasks}, 0)`,
        tasksCount: sql<number>`coalesce(${tasksSubquery.tasksCount}, 0)`,
        lastActivity: activitySubquery.lastActivity
      })
      .from(users)
      .leftJoin(casesSubquery, eq(users.id, casesSubquery.userId))
      .leftJoin(casesThroughTasksSubquery, eq(users.id, casesThroughTasksSubquery.assignedToId))
      .leftJoin(tasksSubquery, eq(users.id, tasksSubquery.assignedToId))
      .leftJoin(activitySubquery, eq(users.id, activitySubquery.createdBy))
      .orderBy(desc(users.createdAt));

    return usersWithStats.map(user => ({
      ...user,
      // Combinar casos directos y casos a través de tareas (sin duplicar)
      casesCount: Math.max(Number(user.directCasesCount), Number(user.casesFromTasks)),
      tasksCount: Number(user.tasksCount),
      lastActivity: user.lastActivity || undefined
    }));
  } catch (error) {
    console.error('Error getting users with stats:', error);
    throw new Error('Error al obtener usuarios');
  }
}

// Función auxiliar para asegurar asignación automática de casos
async function ensureCaseAssignment(userId: string, caseId: string, roleInCase: string = 'Asignado por tarea') {
  try {
    // Verificar si ya está asignado
    const existingAssignment = await db
      .select()
      .from(casesToUsers)
      .where(and(eq(casesToUsers.userId, userId), eq(casesToUsers.caseId, caseId)))
      .limit(1);

    // Si no está asignado, asignarlo automáticamente
    if (existingAssignment.length === 0) {
      await db.insert(casesToUsers).values({
        userId,
        caseId,
        roleInCase
      });

      // Registrar el movimiento
      await db.insert(movements).values({
        title: 'Usuario asignado automáticamente al caso',
        description: `Usuario asignado automáticamente al caso por tener tareas asignadas`,
        type: 'USER_ASSIGNED',
        entityId: caseId,
        entityType: 'case',
        createdBy: userId,
      });
    }
  } catch (error) {
    console.error('Error ensuring case assignment:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

// Crear nuevo usuario
export async function createUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'SOCIO' | 'ABOGADO' | 'ASISTENTE' | 'ADMIN';
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar si el email ya existe
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
    if (existingUser.length > 0) {
      return { success: false, error: 'El email ya está en uso' };
    }

    // Hashear la contraseña
    const hashedPassword = await hash(userData.password, 12);

    // Crear el usuario
    const newUser = await db.insert(users).values({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    }).returning();

    // Registrar la actividad
    await db.insert(movements).values({
      title: 'Usuario creado',
      description: `Se creó el usuario ${userData.firstName} ${userData.lastName} con rol ${userData.role}`,
      type: 'USER_ASSIGNED',
      entityId: newUser[0].id,
      entityType: 'user',
      createdBy: session.user.id,
    });

    revalidatePath('/admin/usuarios');
    return { success: true, user: newUser[0] };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Error al crear usuario' };
  }
}

// Actualizar usuario
export async function updateUser(userId: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
  role: 'SOCIO' | 'ABOGADO' | 'ASISTENTE' | 'ADMIN';
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await db.select().from(users).where(
      and(eq(users.email, userData.email), sql`${users.id} != ${userId}`)
    ).limit(1);
    
    if (existingUser.length > 0) {
      return { success: false, error: 'El email ya está en uso por otro usuario' };
    }

    // Obtener datos anteriores para el log
    const previousUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (previousUser.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Actualizar el usuario
    const updatedUser = await db.update(users)
      .set({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Registrar la actividad
    await db.insert(movements).values({
      title: 'Usuario actualizado',
      description: `Se actualizó el usuario ${userData.firstName} ${userData.lastName}`,
      type: 'USER_ASSIGNED',
      entityId: userId,
      entityType: 'user',
      previousValue: JSON.stringify(previousUser[0]),
      newValue: JSON.stringify(updatedUser[0]),
      createdBy: session.user.id,
    });

    revalidatePath('/admin/usuarios');
    return { success: true, user: updatedUser[0] };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Error al actualizar usuario' };
  }
}

// Eliminar usuario
export async function deleteUser(userId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' };
    }

    // No permitir eliminar el propio usuario
    if (session.user.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propio usuario' };
    }

    // Obtener datos del usuario antes de eliminar
    const userToDelete = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userToDelete.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Eliminar el usuario
    await db.delete(users).where(eq(users.id, userId));

    // Registrar la actividad
    await db.insert(movements).values({
      title: 'Usuario eliminado',
      description: `Se eliminó el usuario ${userToDelete[0].firstName} ${userToDelete[0].lastName}`,
      type: 'USER_ASSIGNED',
      entityId: userId,
      entityType: 'user',
      createdBy: session.user.id,
    });

    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Error al eliminar usuario' };
  }
}

// Obtener log de actividades
export async function getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  try {
    const activities = await db
      .select({
        id: movements.id,
        title: movements.title,
        description: movements.description,
        type: movements.type,
        entityId: movements.entityId,
        entityType: movements.entityType,
        createdAt: movements.createdAt,
        createdBy: movements.createdBy,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .orderBy(desc(movements.createdAt))
      .limit(limit);

    return activities;
  } catch (error) {
    console.error('Error getting activity log:', error);
    throw new Error('Error al obtener log de actividades');
  }
}

// Obtener reportes del sistema
export async function getSystemReports(dateFrom?: Date, dateTo?: Date) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new Error('No autorizado');
    }

    const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás
    const toDate = dateTo || new Date();

    // Casos por estado
    const casesByStatus = await db
      .select({
        status: cases.status,
        count: count(),
      })
      .from(cases)
      .where(and(gte(cases.createdAt, fromDate), lte(cases.createdAt, toDate)))
      .groupBy(cases.status);

    // Tareas por estado
    const tasksByStatus = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(and(gte(tasks.createdAt, fromDate), lte(tasks.createdAt, toDate)))
      .groupBy(tasks.status);

    // Usuarios más activos
    const mostActiveUsers = await db
      .select({
        userId: movements.createdBy,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        activityCount: count(),
      })
      .from(movements)
      .leftJoin(users, eq(movements.createdBy, users.id))
      .where(and(gte(movements.createdAt, fromDate), lte(movements.createdAt, toDate)))
      .groupBy(movements.createdBy, users.firstName, users.lastName)
      .orderBy(desc(count()))
      .limit(10);

    // Actividad por tipo
    const activityByType = await db
      .select({
        type: movements.type,
        count: count(),
      })
      .from(movements)
      .where(and(gte(movements.createdAt, fromDate), lte(movements.createdAt, toDate)))
      .groupBy(movements.type)
      .orderBy(desc(count()));

    return {
      casesByStatus: casesByStatus.map(item => ({
        status: item.status,
        count: Number(item.count),
      })),
      tasksByStatus: tasksByStatus.map(item => ({
        status: item.status,
        count: Number(item.count),
      })),
      mostActiveUsers: mostActiveUsers.map(item => ({
        userId: item.userId,
        userName: item.userName,
        activityCount: Number(item.activityCount),
      })),
      activityByType: activityByType.map(item => ({
        type: item.type,
        count: Number(item.count),
      })),
    };
  } catch (error) {
    console.error('Error getting system reports:', error);
    throw new Error('Error al obtener reportes del sistema');
  }
}

// Cambiar contraseña de usuario
export async function changeUserPassword(userId: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' };
    }

    const hashedPassword = await hash(newPassword, 12);

    await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Registrar la actividad
    await db.insert(movements).values({
      title: 'Contraseña cambiada',
      description: `Se cambió la contraseña del usuario`,
      type: 'USER_ASSIGNED',
      entityId: userId,
      entityType: 'user',
      createdBy: session.user.id,
    });

    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'Error al cambiar contraseña' };
  }
}

// Obtener tareas de un usuario con asignación automática de casos
export async function getUserTasks(userId: string): Promise<{
  id: string;
  title: string;
  description: string;
  status: string;
  caseId: string;
  caseName: string;
}[]> {
  try {
    const userTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        caseId: tasks.caseId,
        caseName: cases.caseName,
      })
      .from(tasks)
      .leftJoin(cases, eq(tasks.caseId, cases.id))
      .where(eq(tasks.assignedToId, userId))
      .orderBy(desc(tasks.fechaDeVencimiento));

    // Asegurar que el usuario esté asignado a todos los casos de sus tareas
    for (const task of userTasks) {
      if (task.caseId) {
        await ensureCaseAssignment(userId, task.caseId, 'Asignado por tarea');
      }
    }

    return userTasks;
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw new Error('Error al obtener tareas del usuario');
  }
}

// Obtener movimientos de un usuario
export async function getUserMovements(userId: string): Promise<{
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}[]> {
  try {
    const movementsData = await db
      .select({
        id: movements.id,
        title: movements.title,
        description: movements.description,
        createdAt: movements.createdAt,
      })
      .from(movements)
      .where(eq(movements.createdBy, userId))
      .orderBy(desc(movements.createdAt))
      .limit(50);

    return movementsData;
  } catch (error) {
    console.error('Error getting user movements:', error);
    throw new Error('Error al obtener movimientos del usuario');
  }
}

// Obtener casos de un usuario con sus tareas (incluyendo casos por asignación automática)
export async function getUserCasesWithTasks(userId: string): Promise<{
  id: string;
  caseName: string;
  status: string;
  tasks: {
    id: string;
    title: string;
    status: string;
  }[];
}[]> {
  try {
    // Obtener casos directamente asignados
    const directCases = await db
      .select({
        id: cases.id,
        caseName: cases.caseName,
        status: cases.status,
      })
      .from(cases)
      .innerJoin(casesToUsers, eq(cases.id, casesToUsers.caseId))
      .where(eq(casesToUsers.userId, userId));

    // Obtener casos a través de tareas asignadas
    const casesFromTasks = await db
      .select({
        id: cases.id,
        caseName: cases.caseName,
        status: cases.status,
      })
      .from(cases)
      .innerJoin(tasks, eq(cases.id, tasks.caseId))
      .where(eq(tasks.assignedToId, userId))
      .groupBy(cases.id, cases.caseName, cases.status);

    // Combinar y eliminar duplicados
    const allCasesMap = new Map();
    [...directCases, ...casesFromTasks].forEach(c => {
      allCasesMap.set(c.id, c);
    });
    const uniqueCases = Array.from(allCasesMap.values());

    // Para cada caso, obtener las tareas del usuario
    const casesWithTasks = await Promise.all(
      uniqueCases.map(async (c) => {
        const userTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
          })
          .from(tasks)
          .where(and(
            eq(tasks.caseId, c.id),
            eq(tasks.assignedToId, userId)
          ));

        // Asegurar asignación automática
        if (userTasks.length > 0) {
          await ensureCaseAssignment(userId, c.id, 'Asignado por tarea');
        }

        return {
          ...c,
          tasks: userTasks,
        };
      })
    );

    return casesWithTasks;
  } catch (error) {
    console.error('Error getting user cases with tasks:', error);
    throw new Error('Error al obtener casos del usuario');
  }
}

// Función auxiliar para asignar tarea y asegurar asignación de caso
export async function assignTaskToUser(taskId: string, userId: string, assignedBy: string) {
  try {
    // Obtener información de la tarea
    const task = await db
      .select({
        id: tasks.id,
        caseId: tasks.caseId,
        title: tasks.title
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (task.length === 0) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    // Asignar la tarea
    await db.update(tasks)
      .set({
        assignedToId: userId,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    // Asegurar que el usuario esté asignado al caso
    if (task[0].caseId) {
      await ensureCaseAssignment(userId, task[0].caseId, 'Asignado por tarea');
    }

    // Registrar el movimiento
    await db.insert(movements).values({
      title: 'Tarea asignada',
      description: `Se asignó la tarea "${task[0].title}" al usuario`,
      type: 'TASK_ASSIGNED',
      entityId: taskId,
      entityType: 'task',
      createdBy: assignedBy,
    });

    return { success: true };
  } catch (error) {
    console.error('Error assigning task:', error);
    return { success: false, error: 'Error al asignar tarea' };
  }
}