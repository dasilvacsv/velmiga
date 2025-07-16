"use server";

import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  const result = await db
    .select()
    .from(systemSettings)
    .orderBy(systemSettings.settingKey);

  return result;
}

export async function createSystemSetting(formData) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  const result = await db.insert(systemSettings).values({
    settingKey: formData.settingKey,
    settingValue: formData.settingValue,
    description: formData.description || null
  }).returning();

  revalidatePath("/admin/configuracion");
  return result[0];
}

export async function updateSystemSetting(id, formData) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  const result = await db
    .update(systemSettings)
    .set({
      settingKey: formData.settingKey,
      settingValue: formData.settingValue,
      description: formData.description || null,
      updatedAt: new Date()
    })
    .where(eq(systemSettings.id, id))
    .returning();

  revalidatePath("/admin/configuracion");
  return result[0];
}

export async function deleteSystemSetting(id) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  await db.delete(systemSettings).where(eq(systemSettings.id, id));
  revalidatePath("/admin/configuracion");
}