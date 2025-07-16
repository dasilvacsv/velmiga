"use server"

import { db } from "@/db"
import { cities } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

// Type for creating a new city
export interface CityFormData {
  name: string
  zoneId: string
}

// Get all cities
export async function getCities() {
  try {
    const citiesList = await db.query.cities.findMany({
      with: {
        zone: true,
      },
      orderBy: (cities, { asc }) => [asc(cities.name)],
    })

    return { success: true, data: citiesList }
  } catch (error) {
    console.error("Error fetching cities:", error)
    return { success: false, error: "Error al obtener las ciudades" }
  }
}

// Get cities by zone
export async function getCitiesByZone(zoneId: string) {
  try {
    const citiesList = await db.query.cities.findMany({
      where: (cities, { eq }) => eq(cities.zoneId, zoneId),
      orderBy: (cities, { asc }) => [asc(cities.name)],
    })

    return { success: true, data: citiesList }
  } catch (error) {
    console.error("Error fetching cities by zone:", error)
    return { success: false, error: "Error al obtener las ciudades de esta zona" }
  }
}

// Get a single city by ID
export async function getCityById(id: string) {
  try {
    const city = await db.query.cities.findFirst({
      where: (cities, { eq }) => eq(cities.id, id),
      with: {
        zone: true,
      }
    })

    if (!city) {
      return { success: false, error: "Ciudad no encontrada" }
    }

    return { success: true, data: city }
  } catch (error) {
    console.error("Error fetching city:", error)
    return { success: false, error: "Error al obtener la ciudad" }
  }
}

// Create a new city
export async function createCity(data: CityFormData, userId: string) {
  try {
    // Check if a city with the same name already exists in the same zone
    const existingCity = await db.query.cities.findFirst({
      where: (cities, { and, eq }) => 
        and(eq(cities.name, data.name), eq(cities.zoneId, data.zoneId)),
    })

    if (existingCity) {
      return { success: false, error: "Ya existe una ciudad con este nombre en esta zona" }
    }

    const [city] = await db
      .insert(cities)
      .values({
        name: data.name,
        zoneId: data.zoneId,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    revalidatePath("/ciudades")
    revalidatePath("/clientes")
    return { success: true, data: city }
  } catch (error) {
    console.error("Error creating city:", error)
    return { success: false, error: "Error al crear la ciudad" }
  }
}

// Update an existing city
export async function updateCity(id: string, data: CityFormData, userId: string) {
  try {
    // Check if a city with the same name already exists in the same zone (excluding current city)
    const existingCity = await db.query.cities.findFirst({
      where: (cities, { and, eq, ne }) => 
        and(eq(cities.name, data.name), eq(cities.zoneId, data.zoneId), ne(cities.id, id)),
    })

    if (existingCity) {
      return { success: false, error: "Ya existe otra ciudad con este nombre en esta zona" }
    }

    const [updated] = await db
      .update(cities)
      .set({
        name: data.name,
        zoneId: data.zoneId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(cities.id, id))
      .returning()

    revalidatePath("/ciudades")
    revalidatePath("/clientes")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating city:", error)
    return { success: false, error: "Error al actualizar la ciudad" }
  }
}

// Delete a city
export async function deleteCity(id: string) {
  try {
    await db.delete(cities).where(eq(cities.id, id))

    revalidatePath("/ciudades")
    revalidatePath("/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting city:", error)
    return { success: false, error: "Error al eliminar la ciudad" }
  }
}