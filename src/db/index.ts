// /src/db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 1. Validar que la variable de entorno con la URL de la base de datos exista.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("🔴 DATABASE_URL no está definida en las variables de entorno.");
}

// 2. Crear un cliente de conexión único y reutilizable.
// Para entornos como Vercel/Neon, no es necesario configurar un pool (`max`, `idle_timeout`, etc.).
// La librería `postgres-js` y el pooler de Neon ya gestionan las conexiones de forma muy eficiente.
const client = postgres(connectionString, { prepare: false });

// 3. Exportar la instancia de Drizzle con el esquema.
// El módulo de Node.js se cachea, por lo que `db` será un singleton por defecto.
export const db = drizzle(client, { schema });