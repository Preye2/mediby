// src/app/(hms)/sub-admin/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { toNaira } from '@/lib/money';
import axios from "axios";

type Appointment = {
  id: number;
  patientEmail: string;
  date: string; // 2025-06-20
  timeSlot: string; // "09:00-09:30"
  status: "paid" | "approved";
  doctorName: string;
  fee: number; // kobo
};

export default function SubAdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load ONLY this hospital's paid appointments
  useEffect(() => {
    axios
      .get("/api/hms/appointments/sub-admin")
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    if (action === "reject") {
      alert("Reject not wired yet – ping me if needed!");
      return;
    }
    await axios.post("/api/hms/appointments/approve", { id });
    // instantly update row
    setAppointments((prev) =>
      prev.map((ap) => (ap.id === id ? { ...ap, status: "approved" } : ap))
    );
  };

  if (loading) return <p className="p-6">Loading appointments…</p>;

  return (
    <main className="magic-bg min-h-screen p-6">
      <div className="glass max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">🏢 Sub-Admin Dashboard</h1>

        {appointments.length === 0 ? (
          <p className="text-gray-600">No pending appointments.</p>
        ) : (
          <div className="grid gap-4">
            {appointments.map((ap) => (
              <div key={ap.id} className="glass p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">👤 {ap.patientEmail}</p>
                    <p className="text-sm text-gray-600">
                      📅 {ap.date} · 🕘 {ap.timeSlot}
                    </p>
                    <p className="text-sm">👨‍⚕️ {ap.doctorName}</p>
                    <p className="text-xs text-gray-500">
                      <p className="text-xs text-gray-500">Ref: {toNaira(ap.fee)}</p>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {ap.status === "paid" && (
                      <>
                        <button
                          onClick={() => handleAction(ap.id, "approve")}
                          className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleAction(ap.id, "reject")}
                          className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {ap.status === "approved" && (
                      <span className="text-green-600 font-semibold">Approved</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}