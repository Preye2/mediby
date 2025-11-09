// src/config/database.tsx
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "@/config/userSchema";

const sql = neon(process.env.DATABASE_URL!);
export const database = drizzle({ client: sql, schema });

export { sql };               // drizzle-orm helper
export const db = database;   // shorter alias used in docs