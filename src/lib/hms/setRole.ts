// src/lib/hms/setRole.ts
import { clerkClient } from "@clerk/nextjs/server";

export async function setRole(userId: string, role: string) {
  const client = await clerkClient();   // ← call it!
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  });
}