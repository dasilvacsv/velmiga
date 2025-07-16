// features/auth/index.ts

import NextAuth, { type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Buscamos al usuario por su email
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email.toString()))
            .limit(1);

          const user = result[0];

          if (!user) {
            return null; // Usuario no encontrado
          }

          // **CORRECCIÓN CLAVE**: Usar 'passwordHash' del schema en lugar de 'password'
          const isPasswordValid = await compare(
            credentials.password.toString(),
            user.passwordHash,
          );

          if (!isPasswordValid) {
            return null; // Contraseña incorrecta
          }

          const fullName = `${user.firstName} ${user.lastName}`.trim();

          // Devolvemos el objeto de usuario para la sesión
          return {
            id: user.id.toString(),
            email: user.email,
            name: fullName,
            role: user.role, // El rol viene directamente de la base de datos
          } as User;
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // El token JWT se enriquece con el id y el rol del usuario
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // La sesión se enriquece con los datos del token
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  trustHost: true,
});