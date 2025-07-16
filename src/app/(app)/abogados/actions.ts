"use server";

import { db } from "@/db";
import { lawyers } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";

export async function getLawyers() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .select()
    .from(lawyers)
    .orderBy(desc(lawyers.createdAt));

  return result;
}

export async function createLawyer(formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db.insert(lawyers).values({
    firstName: formData.firstName,
    lastName: formData.lastName,
    contactInfo: formData.contactInfo || null,
    fiscalInfo: formData.fiscalInfo || null,
    bankInfo: formData.bankInfo || null,
    documentsInfo: formData.documentsInfo || null,
    isActive: formData.isActive
  }).returning();

  revalidatePath("/abogados");
  return result[0];
}

export async function updateLawyer(id, formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .update(lawyers)
    .set({
      firstName: formData.firstName,
      lastName: formData.lastName,
      contactInfo: formData.contactInfo || null,
      fiscalInfo: formData.fiscalInfo || null,
      bankInfo: formData.bankInfo || null,
      documentsInfo: formData.documentsInfo || null,
      isActive: formData.isActive,
      updatedAt: new Date()
    })
    .where(eq(lawyers.id, id))
    .returning();

  revalidatePath("/abogados");
  return result[0];
}

export async function deleteLawyer(id) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  await db.delete(lawyers).where(eq(lawyers.id, id));
  revalidatePath("/abogados");
}