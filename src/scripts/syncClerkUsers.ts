// src/scripts/syncClerkUsers.ts
import "dotenv/config";
import { createClerkClient } from "@clerk/nextjs/server";
import { database } from "@/config/database";
import { users } from "@/config/userSchema";

async function sync() {
  console.log("🔌 Connected to:", process.env.DATABASE_URL?.split("@")?.[1]?.split("/")?.[0]);
  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
    apiUrl: "https://api.clerk.com",
  });

  const clerkUsers = await clerk.users.getUserList({ limit: 100 });
  for (const u of clerkUsers.data) {
    await database
      .insert(users)
      .values({
        clerkId: u.id,
        email: u.primaryEmailAddress?.emailAddress ?? "",
        name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username || "Unknown",
      })
      .onConflictDoNothing();
  }
  console.log("✅ Synced", clerkUsers.data.length, "users");
}

sync().catch((e) => {
  console.error(e);
  process.exit(1);
});