// src/app/(hms)/doctor/schedule/page.tsx
"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Slot = {
  date: string;
  timeSlot: string;
  patientName: string;
  status: string;
  twilioRoomSid?: string | null;
};

export default function DoctorSchedule() {
  const { user } = useUser();
  const [approved, setApproved] = useState<Slot[]>([]);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/hms/doctor/schedule-approved")
  .then((r) => r.json())
  .then(setApproved);
    fetch("/api/hms/doctor/availability")
      .then((r) => r.json())
      .then((d) => setAvailable(d.available));
  }, [user]);

  return (
    <main className="magic-bg min-h-screen text-slate-800 px-6 pt-32 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-8">
          My Schedule
        </h1>

        <div className="glass p-4 rounded-2xl mb-8 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Accepting appointments</p>
            <p className="text-sm text-slate-500">Patients can book when toggled on</p>
          </div>
          <button
            onClick={async () => {
              setAvailable((a) => !a);
              await fetch("/api/hms/doctor/availability", { method: "POST", body: JSON.stringify({ available: !available }) });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${available ? "bg-blue-600" : "bg-slate-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${available ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approved.map((s, idx) =>(
            <motion.div
              key={`${s.date}-${s.timeSlot}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass p-4 rounded-2xl"
            >
              <p className="font-semibold text-slate-900">{s.patientName}</p>
              <p className="text-sm text-slate-600">
                📅 {s.date} · 🕘 {s.timeSlot}
              </p>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full mt-2 inline-block">
                {s.status}
              </span>

              {/* Join video call */}
              {s.twilioRoomSid && (
                <Link
                  href={`/call/${s.twilioRoomSid}`}
                  className="btn-gradient !py-2 !px-3 text-xs mt-3 inline-block"
                >
                  📹 Join Call
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}