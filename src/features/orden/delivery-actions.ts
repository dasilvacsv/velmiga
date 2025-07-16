"use server"

import { db } from "@/db"

export async function getDeliveryNoteById(id: string) {
  try {
    const note = await db.query.deliveryNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, id),
      with: {
        serviceOrder: true,
      },
    })

    if (!note) {
      return { success: false, error: "Nota de entrega no encontrada" }
    }

    return { success: true, data: note }
  } catch (error) {
    console.error("Error fetching delivery note:", error)
    return { success: false, error: "Error al obtener la nota de entrega" }
  }
}

export async function getDeliveryNotesByServiceOrderId(serviceOrderId: string) {
  try {
    const notes = await db.query.deliveryNotes.findMany({
      where: (notes, { eq }) => eq(notes.serviceOrderId, serviceOrderId),
      orderBy: (notes, { desc }) => [desc(notes.createdAt)],
    })

    return { success: true, data: notes }
  } catch (error) {
    console.error("Error fetching delivery notes:", error)
    return { success: false, error: "Error al obtener las notas de entrega" }
  }
}
