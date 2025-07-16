"use server"

import { db } from "@/db"
import { applianceTypes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { UpdateApplianceTypeInput } from "./types"

interface CreateApplianceTypeInput {
  name: string
  userId: string
}

export async function createApplianceType(input: CreateApplianceTypeInput) {
  try {
    const [type] = await db
      .insert(applianceTypes)
      .values({
        name: input.name,
        createdBy: input.userId,
        updatedBy: input.userId,
      })
      .returning()

    revalidatePath("/tipos-electrodomesticos")
    revalidatePath("/clientes")

    return { success: true, data: type }
  } catch (error) {
    console.error("Error creating appliance type:", error)
    return { success: false, error: "Error al crear el tipo de electrodoméstico" }
  }
}

export async function getApplianceTypes() {
  try {
    const allTypes = await db.query.applianceTypes.findMany({
      orderBy: (types, { asc }) => [asc(types.name)],
    })

    return { success: true, data: allTypes }
  } catch (error) {
    console.error("Error fetching appliance types:", error)
    return { success: false, error: "Error al obtener los tipos de electrodomésticos" }
  }
}

export async function updateApplianceType(input: UpdateApplianceTypeInput) {
  try {
    const [updatedApplianceType] = await db
      .update(applianceTypes)
      .set(input)
      .where(eq(applianceTypes.id, input.id))
      .returning()

    revalidatePath("/appliance-types")
    revalidatePath("/orden")
    return { success: true, data: updatedApplianceType }
  } catch (error) {
    console.error("Error updating appliance type:", error)
    return { success: false, error: "Failed to update appliance type" }
  }
}

export async function deleteApplianceType(id: string) {
  try {
    await db.delete(applianceTypes).where(eq(applianceTypes.id, id))

    revalidatePath("/appliance-types")
    revalidatePath("/orden")
    return { success: true }
  } catch (error) {
    console.error("Error deleting appliance type:", error)
    return { success: false, error: "Failed to delete appliance type" }
  }
} 