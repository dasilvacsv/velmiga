"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

  return result;
}

export async function createClient(formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db.insert(clients).values({
    companyName: formData.companyName,
    businessName: formData.businessName || null,
    email: formData.email || null,
    phone: formData.phone || null,
    address: formData.address || null,
    paymentMethod: formData.paymentMethod || null,
    feeSchedule: formData.feeSchedule || null,
    vehicleDatabaseRef: formData.vehicleDatabaseRef || null,
    billingCutoffDate: formData.billingCutoffDate ? new Date(formData.billingCutoffDate) : null,
    isActive: formData.isActive
  }).returning();

  revalidatePath("/clientes");
  return result[0];
}

export async function updateClient(id, formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const result = await db
    .update(clients)
    .set({
      companyName: formData.companyName,
      businessName: formData.businessName || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      paymentMethod: formData.paymentMethod || null,
      feeSchedule: formData.feeSchedule || null,
      vehicleDatabaseRef: formData.vehicleDatabaseRef || null,
      billingCutoffDate: formData.billingCutoffDate ? new Date(formData.billingCutoffDate) : null,
      isActive: formData.isActive,
      updatedAt: new Date()
    })
    .where(eq(clients.id, id))
    .returning();

  revalidatePath("/clientes");
  return result[0];
}

export async function deleteClient(id) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clientes");
}