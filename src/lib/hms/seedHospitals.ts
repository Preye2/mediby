import "dotenv/config";
import { database } from "@/config/database";
import { hospitals } from "@/config/userSchema";

const dummy = [
  {
    name: "Diete-koki Memorial Hospital",
    logo: "/medi1.jpg",
    address: "12 Afenfa Rd, Bayelsa",
    contactPhone: "08153609048",
    contactEmail: "armyday86@gmail.com",
  },
  {
    name: "Glory Land Hospital",
    logo: "/medi2.jpg",
    address: "Tombia, Bayelsa",
    contactPhone: "08052032379",
    contactEmail: "ikolowai2@gmail.com",
  },
  {
    name: "Federal Medical Center",
    logo: "/medi3.jpg",
    address: "Ovum,Yenagoa, Bayelsa",
    contactPhone: "09026068443",
    contactEmail: "talentedmadman@gmail.com",
  },
  {
    name: "Family Care Hospital",
    logo: "/medi4.jpg",
    address: "Amarata, Bayelsa",
    contactPhone: "08023888347",
    contactEmail: "trygivehelp@gmail.com",
  },
];

export async function seedHospitals() {
  console.log("🚀 Starting seed…");
  for (const h of dummy) {
    console.log("➕ Inserting:", h.name);
    await database.insert(hospitals).values(h);
    console.log("✅ Inserted:", h.name);
  }
  console.log("🏁 Seed finished");
}

seedHospitals().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});