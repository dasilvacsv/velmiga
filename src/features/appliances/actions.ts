"use server"

import { db } from "@/db"
import { clientAppliances } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ApplianceFormData } from "./appliance-dialog-form"

// Adjust ApplianceFormData to match clientAppliances fields

export async function getAppliances() {
  try {
    const appliancesList = await db.query.clientAppliances.findMany({
      with: {
        brand: true,
        applianceType: true,
        client: true,
      },
      orderBy: (clientAppliances, { asc }) => [asc(clientAppliances.name)],
    })

    return { success: true, data: appliancesList }
  } catch (error) {
    console.error("Error fetching appliances:", error)
    return { success: false, error: "Error al obtener los electrodomésticos" }
  }
}

export async function getApplianceById(id: string) {
  try {
    const appliance = await db.query.clientAppliances.findFirst({
      where: (clientAppliances, { eq }) => eq(clientAppliances.id, id),
      with: {
        brand: true,
        applianceType: true,
        client: true,
      },
    })

    if (!appliance) {
      return { success: false, error: "Electrodoméstico no encontrado" }
    }

    return { success: true, data: appliance }
  } catch (error) {
    console.error("Error fetching appliance:", error)
    return { success: false, error: "Error al obtener el electrodoméstico" }
  }
}

export async function createAppliance(data: ApplianceFormData, userId: string) {
  try {
    const [appliance] = await db
      .insert(clientAppliances)
      .values({
        name: data.name,
        notes: data.notes || null,
        brandId: data.brandId,
        applianceTypeId: data.applianceTypeId,
        clientId: data.clientId, // Make sure you provide clientId in your form
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    revalidatePath("/electrodomesticos")
    return { success: true, data: appliance }
  } catch (error) {
    console.error("Error creating appliance:", error)
    return { success: false, error: "Error al crear el electrodoméstico" }
  }
}

export async function updateAppliance(id: string, data: ApplianceFormData, userId: string) {
  try {
    const [updated] = await db
      .update(clientAppliances)
      .set({
        name: data.name,
        notes: data.notes || null,
        brandId: data.brandId,
        applianceTypeId: data.applianceTypeId,
        clientId: data.clientId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(clientAppliances.id, id))
      .returning()

    revalidatePath("/electrodomesticos")
    revalidatePath(`/electrodomesticos/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating appliance:", error)
    return { success: false, error: "Error al actualizar el electrodoméstico" }
  }
}

export async function deleteAppliance(id: string) {
  try {
    await db.delete(clientAppliances).where(eq(clientAppliances.id, id))

    revalidatePath("/electrodomesticos")
    return { success: true }
  } catch (error) {
    console.error("Error deleting appliance:", error)
    return { success: false, error: "Error al eliminar el electrodoméstico" }
  }
}
