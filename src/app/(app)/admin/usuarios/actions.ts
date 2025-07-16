"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getUsers() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  const result = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return result;
}

export async function createUser(formData) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  const hashedPassword = await bcrypt.hash(formData.password, 10);

  const result = await db.insert(users).values({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    passwordHash: hashedPassword,
    role: formData.role,
    isActive: formData.isActive
  }).returning();

  revalidatePath("/admin/usuarios");
  return result[0];
}

export async function updateUser(id, formData) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  const updateData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    role: formData.role,
    isActive: formData.isActive,
    updatedAt: new Date()
  };

  // Only update password if provided
  if (formData.password) {
    updateData.passwordHash = await bcrypt.hash(formData.password, 10);
  }

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  revalidatePath("/admin/usuarios");
  return result[0];
}

export async function deleteUser(id) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMINISTRATOR") {
    throw new Error("No autorizado");
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/usuarios");
}