'use server';

import { db } from '@/db';
import { clients, cases, users, casesToUsers, casePartes } from '@/db/schema';
import { Client, NewClient, ClientWithStats, CaseWithRelations } from '@/lib/types';
import { eq, desc, or, ilike, sql, and, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
// Importamos las funciones de logging y sesión para consistencia
import { logActivity } from '@/features/movimientos/actions';
import { getCurrentUserAndSession } from '@/features/casos/actions'; // Reutilizamos esta función de tus actions de casos

// =================================================================
// TIPOS PARA PAGINACIÓN
// =================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string;
  typeFilter?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// =================================================================
// LÓGICA REUTILIZABLE PARA CONSULTAS
// =================================================================

/**
 * Objeto de selección de Drizzle para obtener un cliente junto a sus estadísticas de casos.
 * Evita la repetición de código en múltiples funciones.
 */
const clientWithStatsSelect = {
  client: clients,
  totalCases: sql<number>`count(${cases.id})`.mapWith(Number),
  activeCases: sql<number>`count(${cases.id}) filter (where ${cases.status} in ('ACTIVO', 'EN_ESPERA'))`.mapWith(Number),
};

/**
 * Mapea el resultado de la consulta de Drizzle al tipo de dato ClientWithStats.
 * @param row El objeto de fila devuelto por la consulta.
 * @returns Un objeto formateado como ClientWithStats.
 */
const mapToClientWithStats = (row: { client: Client; totalCases: number; activeCases: number; }): ClientWithStats => ({
  ...row.client,
  _count: {
    cases: row.totalCases,
    activeCases: row.activeCases,
  },
});

/**
 * Construye las condiciones WHERE basándose en los filtros aplicados
 */
const buildWhereConditions = (searchTerm?: string, statusFilter?: string, typeFilter?: string) => {
  const conditions = [];
  
  if (searchTerm) {
    conditions.push(
      or(
        ilike(clients.name, `%${searchTerm}%`),
        ilike(clients.email, `%${searchTerm}%`),
        ilike(clients.dni, `%${searchTerm}%`)
      )
    );
  }
  
  if (statusFilter && statusFilter !== 'all') {
    conditions.push(eq(clients.status, statusFilter as any));
  }
  
  if (typeFilter && typeFilter !== 'all') {
    conditions.push(eq(clients.clientType, typeFilter as any));
  }
  
  return conditions.length > 0 ? and(...conditions) : undefined;
};

// =================================================================
// FUNCIONES DE LECTURA DE DATOS CON PAGINACIÓN
// =================================================================

/**
 * Obtiene todos los clientes con paginación y sus estadísticas de casos.
 * @param params Parámetros de paginación y filtros
 * @returns Una promesa que resuelve a un resultado paginado de ClientWithStats.
 */
export async function getClientsPaginated(params: PaginationParams): Promise<PaginatedResult<ClientWithStats>> {
  try {
    const { page, pageSize, searchTerm, statusFilter, typeFilter } = params;
    const offset = (page - 1) * pageSize;
    
    const whereConditions = buildWhereConditions(searchTerm, statusFilter, typeFilter);
    
    // Obtener el total de registros
    const totalQuery = db
      .select({ count: count() })
      .from(clients);
    
    if (whereConditions) {
      totalQuery.where(whereConditions);
    }
    
    const [{ count: total }] = await totalQuery;
    
    // Obtener los datos paginados
    const dataQuery = db
      .select(clientWithStatsSelect)
      .from(clients)
      .leftJoin(cases, eq(clients.id, cases.clientId))
      .groupBy(clients.id)
      .orderBy(desc(clients.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    if (whereConditions) {
      dataQuery.where(whereConditions);
    }
    
    const result = await dataQuery;
    const data = result.map(mapToClientWithStats);
    
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error('Error al obtener clientes paginados:', error);
    throw new Error('No se pudieron obtener los clientes.');
  }
}

/**
 * Obtiene todos los clientes con sus estadísticas de casos (versión original para compatibilidad).
 * @returns Una promesa que resuelve a un array de ClientWithStats.
 */
export async function getClients(): Promise<ClientWithStats[]> {
  try {
    const result = await db
      .select(clientWithStatsSelect)
      .from(clients)
      .leftJoin(cases, eq(clients.id, cases.clientId))
      .groupBy(clients.id)
      .orderBy(desc(clients.createdAt));

    return result.map(mapToClientWithStats);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw new Error('No se pudieron obtener los clientes.');
  }
}

/**
 * Busca clientes por nombre, email o DNI/RIF con paginación.
 * @param params Parámetros de paginación y búsqueda.
 * @returns Una promesa que resuelve a un resultado paginado de ClientWithStats.
 */
export async function searchClientsPaginated(params: PaginationParams): Promise<PaginatedResult<ClientWithStats>> {
  if (!params.searchTerm) return getClientsPaginated(params);
  return getClientsPaginated(params);
}

/**
 * Busca clientes por nombre, email o DNI/RIF.
 * @param query El término de búsqueda.
 * @returns Una promesa que resuelve a un array de ClientWithStats que coinciden con la búsqueda.
 */
export async function searchClients(query: string): Promise<ClientWithStats[]> {
    if (!query) return getClients();
    try {
        const result = await db
            .select(clientWithStatsSelect)
            .from(clients)
            .leftJoin(cases, eq(clients.id, cases.clientId))
            .where(
                or(
                    ilike(clients.name, `%${query}%`),
                    ilike(clients.email, `%${query}%`),
                    ilike(clients.dni, `%${query}%`)
                )
            )
            .groupBy(clients.id)
            .orderBy(desc(clients.createdAt));

        return result.map(mapToClientWithStats);
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        throw new Error('La búsqueda de clientes falló.');
    }
}

/**
 * Obtiene un cliente específico por su ID con estadísticas.
 * @param id El ID del cliente.
 * @returns Una promesa que resuelve a un objeto ClientWithStats o null si no se encuentra.
 */
export async function getClientById(id: string): Promise<ClientWithStats | null> {
  try {
    const result = await db
      .select(clientWithStatsSelect)
      .from(clients)
      .leftJoin(cases, eq(clients.id, cases.clientId))
      .where(eq(clients.id, id))
      .groupBy(clients.id)
      .limit(1);

    if (result.length === 0) return null;
    return mapToClientWithStats(result[0]);
  } catch (error) {
    console.error(`Error al obtener cliente por ID (${id}):`, error);
    throw new Error('No se pudo obtener el cliente.');
  }
}

/**
 * Obtiene todos los casos asociados a un cliente específico.
 * @param clientId El ID del cliente.
 * @returns Una promesa que resuelve a un array de casos.
 */
export async function getClientCases(clientId: string): Promise<CaseWithRelations[]> {
  try {
    const result = await db
      .select({
        id: cases.id,
        clientId: cases.clientId,
        caseName: cases.caseName,
        description: cases.description,
        caseNumber: cases.caseNumber,
        codigoInterno: cases.codigoInterno,
        status: cases.status,
        estadoOficial: cases.estadoOficial,
        estadoInterno: cases.estadoInterno,
        internalStatus: cases.internalStatus,
        authorities: cases.authorities,
        hyperlinkUrl: cases.hyperlinkUrl,
        openingDate: cases.openingDate,
        closingDate: cases.closingDate,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          clientType: clients.clientType
        }
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(eq(cases.clientId, clientId))
      .orderBy(desc(cases.createdAt));

    const casesWithRelations = await Promise.all(
      result.map(async (caseItem) => {
        const teamMembers = await db
          .select({
            caseTeamMember: casesToUsers,
            user: users,
          })
          .from(casesToUsers)
          .leftJoin(users, eq(casesToUsers.userId, users.id))
          .where(eq(casesToUsers.caseId, caseItem.id));

        return {
          ...caseItem,
          client: caseItem.client || undefined,
          teamMembers: teamMembers.map(tm => ({
            ...tm.caseTeamMember,
            user: tm.user || undefined,
          })),
          // Asegurar valores por defecto
          description: caseItem.description || 'Sin descripción',
          estadoOficial: caseItem.estadoOficial || 'No especificado',
          estadoInterno: caseItem.estadoInterno || 'No especificado',
          internalStatus: caseItem.internalStatus || 'No especificado',
          authorities: caseItem.authorities || 'No especificado',
          codigoInterno: caseItem.codigoInterno || 'N/A',
        };
      })
    );

    return casesWithRelations;
  } catch (error) {
    console.error(`Error al obtener los casos del cliente (${clientId}):`, error);
    throw new Error('No se pudieron obtener los casos del cliente.');
  }
}

/**
 * Obtiene estadísticas agregadas sobre los clientes.
 * @returns Un objeto con el total de clientes, activos, inactivos, etc.
 */
export async function getClientStats() {
  try {
    const stats = await db
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        active: sql<number>`count(*) filter (where status = 'ACTIVE')`.mapWith(Number),
        inactive: sql<number>`count(*) filter (where status = 'INACTIVE')`.mapWith(Number),
        personaNatural: sql<number>`count(*) filter (where client_type = 'PERSONA_NATURAL')`.mapWith(Number),
        empresa: sql<number>`count(*) filter (where client_type = 'EMPRESA')`.mapWith(Number),
      })
      .from(clients);
    return stats[0];
  } catch (error) {
    console.error('Error al obtener estadísticas de clientes:', error);
    throw new Error('No se pudieron obtener las estadísticas de clientes.');
  }
}

// =================================================================
// FUNCIONES DE ESCRITURA DE DATOS (WRITE)
// =================================================================

/**
 * Crea un nuevo cliente en la base de datos y registra la actividad.
 * @param data Los datos del nuevo cliente.
 * @returns Una promesa que resuelve al cliente recién creado.
 */
export async function createClient(data: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
  try {
    const { user } = await getCurrentUserAndSession();
    const result = await db.insert(clients).values(data).returning();
    const newClient = result[0];

    await logActivity(
      'CLIENT_CREATED',
      `Cliente creado: "${newClient.name}"`,
      `El usuario ${user.firstName} ${user.lastName} creó un nuevo cliente.`,
      user.id,
      { entityId: newClient.id, entityType: 'client', newValue: newClient }
    );

    revalidatePath('/clientes');
    return newClient;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw new Error('No se pudo crear el cliente.');
  }
}

/**
 * Actualiza un cliente existente y registra la actividad.
 * @param id El ID del cliente a actualizar.
 * @param data Los datos a actualizar.
 * @returns Una promesa que resuelve al cliente actualizado o null si no se encontró.
 */
export async function updateClient(id: string, data: Partial<NewClient>): Promise<Client | null> {
  try {
    const { user } = await getCurrentUserAndSession();
    const originalClient = await db.query.clients.findFirst({ where: eq(clients.id, id) });
    if (!originalClient) throw new Error("Cliente no encontrado para actualizar.");

    const result = await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    if (result.length === 0) return null;
    const updatedClient = result[0];
    
    await logActivity(
      'CLIENT_UPDATED',
      `Cliente actualizado: "${updatedClient.name}"`,
      `El usuario ${user.firstName} ${user.lastName} actualizó los datos del cliente.`,
      user.id,
      { entityId: updatedClient.id, entityType: 'client', previousValue: originalClient, newValue: updatedClient }
    );

    revalidatePath('/clientes');
    return updatedClient;
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw new Error('No se pudo actualizar el cliente.');
  }
}

/**
 * Elimina un cliente, verificando primero que no tenga casos activos. Registra la actividad.
 * @param id El ID del cliente a eliminar.
 * @returns Una promesa que resuelve a `true` si se eliminó, o lanza un error.
 */
export async function deleteClient(id: string): Promise<boolean> {
  try {
    const { user } = await getCurrentUserAndSession();
    const clientToDelete = await db.query.clients.findFirst({ where: eq(clients.id, id) });
    if (!clientToDelete) throw new Error("Cliente no encontrado para eliminar.");

    // Verifica si el cliente tiene casos activos
    const activeCasesCount = await db.select({ count: sql<number>`count(*)` }).from(cases)
      .where(and(eq(cases.clientId, id), or(eq(cases.status, 'ACTIVO'), eq(cases.status, 'EN_ESPERA'))));

    if (activeCasesCount[0].count > 0) {
      // Lanza un error específico que el frontend puede capturar y mostrar
      throw new Error('No se puede eliminar un cliente con casos activos o en espera.');
    }

    const result = await db.delete(clients).where(eq(clients.id, id)).returning();

    await logActivity(
        'CLIENT_DELETED',
        `Cliente eliminado: "${clientToDelete.name}"`,
        `El usuario ${user.firstName} ${user.lastName} eliminó al cliente (ID: ${id}).`,
        user.id,
        { entityId: id, entityType: 'client', previousValue: clientToDelete }
    );

    revalidatePath('/clientes');
    return result.length > 0;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    // Re-lanza el error para que el componente que llama a la acción pueda manejarlo
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No se pudo eliminar el cliente.');
  }
}