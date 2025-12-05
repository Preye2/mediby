// src/lib/hms/updateSubAdmin.ts
import "dotenv/config";
import { clerkClient } from "@clerk/nextjs/server";

async function updateSubAdmin() {
  const client = await clerkClient();

  // 1.  find the user by email you already have
  const userList = await client.users.getUserList({ emailAddress: ["normalyf245@gmail.com"] });
  const user = userList.data[0];
  if (!user) throw new Error("User not found");

  // 2.  add the metadata (role + hospital)
  await client.users.updateUser(user.id, {
    publicMetadata: { role: "sub-admin", hospitalId: 1 },
  });

  console.log("✅ Existing user now has sub-admin role for hospital 1");
}

updateSubAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});