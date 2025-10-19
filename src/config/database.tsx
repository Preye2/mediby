import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "@/config/userSchema"; // ✅ import schema

const sql = neon(process.env.DATABASE_URL!);
export const database = drizzle({ client: sql, schema });