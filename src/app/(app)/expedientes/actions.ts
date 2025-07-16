"use server";

import { db } from "@/db";
import { expedientes, clients, lawyers, users } from "@/db/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";

export async function getExpedientes() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .select({
      id: expedientes.id,
      expedienteNumber: expedientes.expedienteNumber,
      status: expedientes.status,
      clientName: clients.companyName,
      lawyerName: lawyers.firstName,
      description: expedientes.description,
      createdAt: expedientes.createdAt,
      location: expedientes.location,
      municipality: expedientes.municipality,
      state: expedientes.state
    })
    .from(expedientes)
    .leftJoin(clients, eq(expedientes.clientId, clients.id))
    .leftJoin(lawyers, eq(expedientes.lawyerId, lawyers.id))
    .orderBy(desc(expedientes.createdAt));

  return result;
}

export async function createExpediente(formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  // Generate consecutive expediente number
  const currentYear = new Date().getFullYear();
  const lastExpediente = await db
    .select({ expedienteNumber: expedientes.expedienteNumber })
    .from(expedientes)
    .where(ilike(expedientes.expedienteNumber, `%/${currentYear}`))
    .orderBy(desc(expedientes.expedienteNumber))
    .limit(1);

  let nextNumber = 1;
  if (lastExpediente.length > 0) {
    const lastNumber = parseInt(lastExpediente[0].expedienteNumber.split('/')[0]);
    nextNumber = lastNumber + 1;
  }

  const expedienteNumber = `${String(nextNumber).padStart(4, '0')}/${currentYear}`;

  const result = await db.insert(expedientes).values({
    expedienteNumber,
    clientId: formData.clientId,
    lawyerId: formData.lawyerId || null,
    coordinatorId: session.user.id,
    classificationType: formData.classificationType || null,
    gestionType: formData.gestionType || null,
    driverName: formData.driverName || null,
    driverStatus: formData.driverStatus || null,
    vehicleStatus: formData.vehicleStatus || null,
    adjusterName: formData.adjusterName || null,
    description: formData.description || null,
    location: formData.location || null,
    municipality: formData.municipality || null,
    state: formData.state || null,
    status: "EN_ATENCION"
  }).returning();

  revalidatePath("/expedientes");
  return result[0];
}

export async function updateExpediente(id, formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .update(expedientes)
    .set({
      clientId: formData.clientId,
      lawyerId: formData.lawyerId || null,
      classificationType: formData.classificationType || null,
      gestionType: formData.gestionType || null,
      driverName: formData.driverName || null,
      driverStatus: formData.driverStatus || null,
      vehicleStatus: formData.vehicleStatus || null,
      adjusterName: formData.adjusterName || null,
      description: formData.description || null,
      location: formData.location || null,
      municipality: formData.municipality || null,
      state: formData.state || null,
      updatedAt: new Date()
    })
    .where(eq(expedientes.id, id))
    .returning();

  revalidatePath("/expedientes");
  return result[0];
}

export async function deleteExpediente(id) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  await db.delete(expedientes).where(eq(expedientes.id, id));
  revalidatePath("/expedientes");
}

export async function getClients() {
  const result = await db
    .select({
      id: clients.id,
      companyName: clients.companyName,
      email: clients.email
    })
    .from(clients)
    .where(eq(clients.isActive, true))
    .orderBy(clients.companyName);

  return result;
}

export async function getLawyers() {
  const result = await db
    .select({
      id: lawyers.id,
      firstName: lawyers.firstName,
      lastName: lawyers.lastName
    })
    .from(lawyers)
    .where(eq(lawyers.isActive, true))
    .orderBy(lawyers.firstName);

  return result;
}