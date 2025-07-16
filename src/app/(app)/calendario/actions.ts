"use server";

import { db } from "@/db";
import { expedienteReminders, expedientes, clients } from "@/db/schema";
import { eq, desc, gte, lte } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";

export async function getReminders() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .select({
      id: expedienteReminders.id,
      expedienteId: expedienteReminders.expedienteId,
      reminderDate: expedienteReminders.reminderDate,
      description: expedienteReminders.description,
      isDismissed: expedienteReminders.isDismissed,
      expedienteNumber: expedientes.expedienteNumber,
      clientName: clients.companyName
    })
    .from(expedienteReminders)
    .leftJoin(expedientes, eq(expedienteReminders.expedienteId, expedientes.id))
    .leftJoin(clients, eq(expedientes.clientId, clients.id))
    .orderBy(expedienteReminders.reminderDate);

  return result;
}

type CreateReminderFormData = {
  expedienteId: string;
  reminderDate: string; // ISO string (e.g., "2024-06-07")
  description: string;
};

export async function createReminder(formData: CreateReminderFormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db.insert(expedienteReminders).values({
    expedienteId: formData.expedienteId,
    reminderDate: formData.reminderDate, // keep as string
    description: formData.description,
    createdByUserId: session.user.id
  }).returning();

  revalidatePath("/calendario");
  return result[0];
}

export async function updateReminder(id, formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .update(expedienteReminders)
    .set({
      expedienteId: formData.expedienteId,
      reminderDate: new Date(formData.reminderDate),
      description: formData.description
    })
    .where(eq(expedienteReminders.id, id))
    .returning();

  revalidatePath("/calendario");
  return result[0];
}

export async function deleteReminder(id) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  await db.delete(expedienteReminders).where(eq(expedienteReminders.id, id));
  revalidatePath("/calendario");
}

export async function getExpedientes() {
  const result = await db
    .select({
      id: expedientes.id,
      expedienteNumber: expedientes.expedienteNumber,
      clientName: clients.companyName
    })
    .from(expedientes)
    .leftJoin(clients, eq(expedientes.clientId, clients.id))
    .orderBy(desc(expedientes.createdAt));

  return result;
}

export async function dismissReminder(id) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .update(expedienteReminders)
    .set({
      isDismissed: true,
      dismissedAt: new Date()
    })
    .where(eq(expedienteReminders.id, id))
    .returning();

  revalidatePath("/calendario");
  return result[0];
}