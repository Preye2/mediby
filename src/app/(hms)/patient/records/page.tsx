"use client";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { toNaira } from "@/lib/money";
import { useEffect, useState } from "react";

type Record = { id: number; date: string; doctor: string; hospital: string; status: string; fee: number; note?: string };

export default function PatientRecords() {
  const { user } = useUser();
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/hms/patient/records")
      .then((r) => r.json())
      .then(setRecords);
  }, [user]);

  return (
    <main className="magic-bg min-h-screen text-slate-800 px-6 pt-32 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-8">My Medical Records</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass p-6 rounded-2xl space-y-2"
            >
              <p className="font-semibold text-slate-900">{r.hospital}</p>
              <p className="text-sm text-slate-600">Dr. {r.doctor}</p>
              <p className="text-sm">📅 {r.date}</p>
              <p className="text-sm font-bold text-emerald-600">{toNaira(r.fee)}</p>
              {r.note && <p className="text-xs text-slate-500 mt-2">{r.note}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}