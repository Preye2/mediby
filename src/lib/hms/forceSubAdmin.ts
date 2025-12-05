import "dotenv/config";
import { clerkClient } from "@clerk/nextjs/server";

async function force() {
  const client = await clerkClient();
  await client.users.updateUserMetadata("user_35hIReumvsCrpe6kAbU4ds6YLIh", {
    publicMetadata: { role: "sub-admin", hospitalId: 1 },
  });
  console.log("✅ Metadata forced");
}
force().catch(console.error);