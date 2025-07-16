"use server"

import { db } from "@/db"
import { sucursales } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export interface SucursalData {
  name: string
  header?: string
  logo?: string
  bottom?: string
}

export async function getSucursales() {
  try {
    const sucursalesList = await db.query.sucursales.findMany({
      orderBy: (sucursales, { asc }) => [asc(sucursales.name)],
    })

    return { success: true, data: sucursalesList }
  } catch (error) {
    console.error("Error fetching sucursales:", error)
    return { success: false, error: "Error al obtener las sucursales" }
  }
}

export async function getSucursalById(id: string) {
  try {
    const sucursal = await db.query.sucursales.findFirst({
      where: (sucursales, { eq }) => eq(sucursales.id, id),
    })

    if (!sucursal) {
      return { success: false, error: "Sucursal no encontrada" }
    }

    return { success: true, data: sucursal }
  } catch (error) {
    console.error("Error fetching sucursal:", error)
    return { success: false, error: "Error al obtener la sucursal" }
  }
}

export async function createSucursal(data: SucursalData, userId: string) {
  try {
    const [sucursal] = await db
      .insert(sucursales)
      .values({
        name: data.name,
        header: data.header || null,
        logo: data.logo || null,
        bottom: data.bottom || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    revalidatePath("/sucursales")
    return { success: true, data: sucursal }
  } catch (error) {
    console.error("Error creating sucursal:", error)
    return { success: false, error: "Error al crear la sucursal" }
  }
}

export async function updateSucursal(id: string, data: SucursalData, userId: string) {
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
    revalidatePath(`/sucursales/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating sucursal:", error)
    return { success: false, error: "Error al actualizar la sucursal" }
  }
}

export async function deleteSucursal(id: string) {
  try {
    await db.delete(sucursales).where(eq(sucursales.id, id))

    revalidatePath("/sucursales")
    return { success: true }
  } catch (error) {
    console.error("Error deleting sucursal:", error)
    return { success: false, error: "Error al eliminar la sucursal" }
  }
}