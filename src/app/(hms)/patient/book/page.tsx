// src/app/(hms)/patient/book/page.tsx
import HospitalSelector from "@/components/hms/HospitalSelector";

export default function BookPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Book Appointment</h1>
      <HospitalSelector />
    </div>
  );
}