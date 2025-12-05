// src/app/(hms)/patient/appointments/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AppointmentDetailPage() {
  const params = useParams();
  const [id, setId] = useState("");
  const { user } = useUser();
  const [apt, setApt] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { id: raw } = await params;
      const str = Array.isArray(raw) ? raw[0] : raw;
      if (str) setId(str);
    })();
  }, [params]);

  useEffect(() => {
    if (!user || !id) return;
    fetch(`/api/hms/patient/appointments/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(setApt)
      .catch((e) => console.error(e));
  }, [user, id]);

  if (!apt) return <div className="p-6 text-white">Loading…</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Appointment Details</h1>
      <div className="glass p-4 rounded-xl space-y-2">
        <p><strong>Hospital:</strong> {apt.hospitalName}</p>
        <p><strong>Doctor:</strong> Dr. {apt.doctorName} · {apt.specialization}</p>
        <p><strong>Date:</strong> {apt.date} · {apt.timeSlot}</p>
        <p><strong>Status:</strong> {apt.status}</p>
        <p><strong>Fee:</strong> ₦{apt.fee}</p>
        {apt.status === "approved" && (
          <a
            href={`/call/${apt.twilioRoomSid}`}
    className="btn-gradient inline-block mt-4"
          >
            Join Call
          </a>
        )}
      </div>
    </main>
  );
}