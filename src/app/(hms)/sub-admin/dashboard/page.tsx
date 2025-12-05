// src/app/(hms)/sub-admin/dashboard/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { toNaira } from "@/lib/money";
import { useEffect, useState } from "react";

/* ----------  TYPE – matches API response  ---------- */
type Appointment = {
  id: number;
  patientEmail: string;
  doctor: { fullName: string; specialization: string };
  date: string;
  timeSlot: string;
  fee: number;
  status: string;
  livekitRoomName?: string | null;
};

/* ----------  UI HELPERS  ---------- */
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass rounded-2xl p-6 border border-white/20 ${className}`}>{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">{children}</h2>
);

/* ----------  PAGE  ---------- */
export default function SubAdminDashboard() {
  const { user, isLoaded } = useUser();
  const [pending, setPending] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /* ----------  FETCH  ---------- */
  const fetchPending = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/hms/sub-admin/appointments?status=paid");
      if (!res.ok) throw new Error(res.statusText);
      const data: Appointment[] = await res.json();
      setPending(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    const meta = (user.publicMetadata as any)?.hospitalId;
    if (!meta) return; // guard below will show message
    fetchPending();
  }, [user, isLoaded]);

  /* ----------  ACTIONS  ---------- */
  const act = async (id: number, action: "approve" | "cancel") => {
    try {
      const res = await fetch("/api/hms/sub-admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, action }),
      });
      if (!res.ok) throw new Error(res.statusText);
      fetchPending(); // refresh list
    } catch (e: any) {
      alert(action + " failed: " + e.message);
    }
  };

  /* ----------  GUARD – no hospitalId  ---------- */
  if (isLoaded && !((user?.publicMetadata as any)?.hospitalId)) {
    return (
      <main className="magic-bg min-h-screen flex items-center justify-center">
        <GlassCard>Unauthorized – hospital not assigned</GlassCard>
      </main>
    );
  }

  return (
    <main className="magic-bg min-h-screen text-slate-800 px-6 pt-32 pb-16">
      <style jsx global>{`
        .magic-bg { background: #f8fafc; }
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .btn-gradient {
          @apply inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all;
        }
        .btn-secondary {
          @apply inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-8">Hospital Admin</h1>

        <SectionTitle>Pending Approvals</SectionTitle>

        {loading && <GlassCard className="text-center">Loading…</GlassCard>}
        {err && <GlassCard className="text-center text-red-600">{err}</GlassCard>}
        {!loading && !err && pending.length === 0 && (
          <GlassCard className="text-center">No pending bookings.</GlassCard>
        )}

        {!loading && !err && pending.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pending.map((b) => (
              <motion.div key={b.id} className="glass p-6 rounded-2xl space-y-3">
                <p className="font-semibold text-slate-900">{b.patientEmail}</p>
                <p className="text-sm text-slate-600">
                  Dr. {b.doctor.fullName} · {b.doctor.specialization}
                </p>
                <p className="text-sm">
                  📅 {b.date} · 🕘 {b.timeSlot}
                </p>
                <p className="text-sm font-bold text-emerald-600">{toNaira(b.fee)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(b.id, "approve")}
                    className="btn-gradient !py-2 !px-3 text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(b.id, "cancel")}
                    className="btn-secondary !py-2 !px-3 text-xs"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}