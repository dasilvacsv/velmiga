"use server"

import { db } from "@/db"
import { brands } from "@/db/schema"
import { revalidatePath } from "next/cache"

interface CreateBrandInput {
  name: string
  userId: string
}

export async function createBrand(input: CreateBrandInput) {
  try {
    const [brand] = await db
      .insert(brands)
      .values({
        name: input.name,
        createdBy: input.userId,
        updatedBy: input.userId,
      })
      .returning()

    revalidatePath("/marcas")
    revalidatePath("/clientes")

    return { success: true, data: brand }
  } catch (error) {
    console.error("Error creating brand:", error)
    return { success: false, error: "Error al crear la marca" }
  }
}

export async function getBrands() {
  try {
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { asc }) => [asc(brands.name)],
    })

    return { success: true, data: allBrands }
  } catch (error) {
    console.error("Error fetching brands:", error)
    return { success: false, error: "Error al obtener las marcas" }
  }
}
