"use server"

import { db } from "@/db"
import { zones } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

// Type for creating a new zone
export interface ZoneFormData {
  name: string
}

// Get all zones
export async function getZones() {
  try {
    const zonesList = await db.query.zones.findMany({
      orderBy: (zones, { asc }) => [asc(zones.name)],
    })

    return { success: true, data: zonesList }
  } catch (error) {
    console.error("Error fetching zones:", error)
    return { success: false, error: "Error al obtener las zonas" }
  }
}

// Get a single zone by ID
export async function getZoneById(id: string) {
  try {
    const zone = await db.query.zones.findFirst({
      where: (zones, { eq }) => eq(zones.id, id),
    })

    if (!zone) {
      return { success: false, error: "Zona no encontrada" }
    }

    return { success: true, data: zone }
  } catch (error) {
    console.error("Error fetching zone:", error)
    return { success: false, error: "Error al obtener la zona" }
  }
}

// Create a new zone
export async function createZone(data: ZoneFormData, userId: string) {
  try {
    // Check if a zone with the same name already exists
    const existingZone = await db.query.zones.findFirst({
      where: (zones, { eq }) => eq(zones.name, data.name),
    })

    if (existingZone) {
      return { success: false, error: "Ya existe una zona con este nombre" }
    }

    const [zone] = await db
      .insert(zones)
      .values({
        name: data.name,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    revalidatePath("/zonas")
    revalidatePath("/clientes")
    return { success: true, data: zone }
  } catch (error) {
    console.error("Error creating zone:", error)
    return { success: false, error: "Error al crear la zona" }
  }
}

// Update an existing zone
export async function updateZone(id: string, data: ZoneFormData, userId: string) {
  try {
    // Check if a zone with the same name already exists (excluding current zone)
    const existingZone = await db.query.zones.findFirst({
      where: (zones, { and, eq, ne }) => 
        and(eq(zones.name, data.name), ne(zones.id, id)),
    })

    if (existingZone) {
      return { success: false, error: "Ya existe otra zona con este nombre" }
    }

    const [updated] = await db
      .update(zones)
      .set({
        name: data.name,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(zones.id, id))
      .returning()

    revalidatePath("/zonas")
    revalidatePath("/clientes")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating zone:", error)
    return { success: false, error: "Error al actualizar la zona" }
  }
}

// Delete a zone
export async function deleteZone(id: string) {
  try {
    await db.delete(zones).where(eq(zones.id, id))

    revalidatePath("/zonas")
    revalidatePath("/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting zone:", error)
    return { success: false, error: "Error al eliminar la zona" }
  }
}