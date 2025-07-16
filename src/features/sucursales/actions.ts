"use server"

import { db } from "@/db"
import { clients, sucursales } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getClientsBySucursal(sucursalId: string) {
  try {
    const clientsList = await db.query.clients.findMany({
      where: eq(clients.sucursalId, sucursalId),
      orderBy: (clients, { asc }) => [asc(clients.name)],
    })

    return { success: true, data: clientsList }
  } catch (error) {
    console.error("Error fetching clients by sucursal:", error)
    return { success: false, error: "Error al obtener los clientes por sucursal" }
  }
}

export async function getSucursalesWithClientCount() {
  try {
    const result = await db
      .select({
        sucursalId: sucursales.id,
        clientCount: count(clients.id)
      })
      .from(sucursales)
      .leftJoin(clients, eq(clients.sucursalId, sucursales.id))
      .groupBy(sucursales.id)
    
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching sucursales with client count:", error)
    return { success: false, error: "Error al obtener las sucursales con conteo de clientes" }
  }
}

export async function updateSucursalWithRevalidation(id: string, data: any, userId: string) {
  try {
    const [updated] = await db
      .update(sucursales)
      .set({
        name: data.name,
        header: data.header || null,
        logo: data.logo || null,
        bottom: data.bottom || null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(sucursales.id, id))
      .returning()

    revalidatePath("/sucursales")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating sucursal:", error)
    return { success: false, error: "Error al actualizar la sucursal" }
  }
}

export async function deleteSucursalWithRevalidation(id: string) {
  try {
    await db.delete(sucursales).where(eq(sucursales.id, id))
    
    revalidatePath("/sucursales")
    return { success: true }
  } catch (error) {
    console.error("Error deleting sucursal:", error)
    return { success: false, error: "Error al eliminar la sucursal" }
  }
}