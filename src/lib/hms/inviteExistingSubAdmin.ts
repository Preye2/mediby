import "dotenv/config";
import { database } from "@/config/database";
import { hospitals } from "@/config/userSchema";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

async function inviteSubAdmin() {
  // 1️⃣  Pick existing hospital
  const [hospital] = await database
    .select()
    .from(hospitals)
    .where(eq(hospitals.name, "Diete-koki Memorial Hospital"))
    .limit(1);

  if (!hospital) {
    console.error("❌ Hospital not found");
    process.exit(1);
  }

  console.log("🏥 Found hospital:", hospital.name, "id:", hospital.id);

  // 2️⃣  Invite sub-admin via Clerk
  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: "timpaoman245@gmail.com", // ← change to your real test email
    publicMetadata: { role: "subadmin", hospital_id: hospital.id },
    redirectUrl: `http://localhost:3000/sub-admin/dashboard`,
  });

  console.log("✅ Invite sent for Diete-koki Memorial Hospital (id:", hospital.id, ")");
}

inviteSubAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});