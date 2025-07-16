"use server"

import { db } from "@/db"
import { brands } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { CreateBrandInput, UpdateBrandInput } from "./types"

export async function createBrand(input: CreateBrandInput) {
  try {
    const [brand] = await db.insert(brands).values(input).returning()

    revalidatePath("/marcas")
    revalidatePath("/orden")
    return { success: true, data: brand }
  } catch (error) {
    console.error("Error creating brand:", error)
    return { success: false, error: "Failed to create brand" }
  }
}

export async function getBrands() {
  try {
    const brandsList = await db.select().from(brands)

    return { success: true, data: brandsList }
  } catch (error) {
    console.error("Error fetching brands:", error)
    return { success: false, error: "Failed to fetch brands" }
  }
}

export async function updateBrand(input: UpdateBrandInput) {
  try {
    const [updatedBrand] = await db
      .update(brands)
      .set(input)
      .where(eq(brands.id, input.id))
      .returning()

    revalidatePath("/marcas")
    revalidatePath("/orden")
    return { success: true, data: updatedBrand }
  } catch (error) {
    console.error("Error updating brand:", error)
    return { success: false, error: "Failed to update brand" }
  }
}

export async function deleteBrand(id: string) {
  try {
    await db.delete(brands).where(eq(brands.id, id))

    revalidatePath("/marcas")
    revalidatePath("/orden")
    return { success: true }
  } catch (error) {
    console.error("Error deleting brand:", error)
    return { success: false, error: "Failed to delete brand" }
  }
} 