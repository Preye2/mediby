// src/lib/hms/seedDoctors.ts
import "dotenv/config";
import { database } from "@/config/database";
import { doctors } from "@/config/userSchema";

const dummyDocs = [
  {
    clerkId: "doc_1_clerk_id",
    hospitalId: 1,
    fullName: "Dr. Preye Godgift",
    specialization: "Cardiology",
    fee: 250,
    bio: "Senior cardiologist with 15 yrs experience.",
    avatar: "/doc1.jpg",
  },
  {
    clerkId: "doc_2_clerk_id",
    hospitalId: 1,
    fullName: "Dr. Victoria Ebi",
    specialization: "Dentistry",
    fee: 200,
    bio: "Loves kids, fluent in Hausa & English.",
    avatar: "/doc2.jpg",
  },
];

async function seedDoctors() {
  console.log("🩺 Starting doctor seed…");
  for (const d of dummyDocs) {
    console.log("➕ Inserting:", d.fullName);
    await database.insert(doctors).values(d);
    console.log("✅ Inserted:", d.fullName);
  }
  console.log("🏁 Doctor seed finished");
}

seedDoctors().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});