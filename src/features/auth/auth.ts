// features/auth/auth.ts

"use server";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { signIn } from "@/features/auth";
import { AuthCredentials } from "@/lib/types";
import { db } from "@/db";
import { users, VILMEGA_ROLE_ENUM } from "@/db/schema"; // Importa también el ENUM

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return { success: false, error: "Credenciales inválidas." };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ocurrió un error inesperado." };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { fullName, email, password } = params;

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }

    const hashedPassword = await hash(password, 10);

    const parts = fullName.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    // **CORRECCIONES CLAVE**:
    // 1. Usar 'passwordHash' para coincidir con el schema.
    // 2. Asignar un 'role' por defecto, ya que es un campo `notNull`.
    await db.insert(users).values({
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
      role: "LAWYER", // Rol por defecto para nuevos registros
    });

    await signInWithCredentials({ email, password });

    return { success: true };
  } catch (error) {
    console.error("Error en signUp:", error);
    return { success: false, error: "No se pudo completar el registro." };
  }
};