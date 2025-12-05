// src/app/(hms)/doctor/dashboard/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";
import { toNaira } from "@/lib/money";
import { useEffect, useState } from "react";

type Appointment = {
  id: number;
  date: string;
  timeSlot: string;
  status: "pending" | "paid" | "approved" | "completed" | "cancelled";
  patientName: string;
  hospitalName: string;
  fee: number;
  twilioRoomSid?: string | null; 
  note?: string; // filled after consult
};

export default function DoctorDashboard() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true); // doctor availability toggle

  // ---------- today ----------
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
  if (!user?.primaryEmailAddress?.emailAddress) return;
  fetch("/api/hms/doctor/schedule-approved")
    .then((r) => r.json())
    .then((data) => {
      console.log("📊 dashboard raw", data);
      console.log("📹 first twilioRoomSid", data[0]?.twilioRoomSid);
      setAppointments(data);
    })
    .catch((e) => console.error("❌ dashboard fetch", e))
    .finally(() => setLoading(false));
}, [user]);

  const approved = appointments.filter((a) => a.status === "approved");
const completedToday = appointments.filter((a) => a.date === today && a.status === "completed");
  const earnings = completedToday.reduce((sum, c) => sum + c.fee, 0);

  // ---------- glass card ----------
  const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`glass rounded-2xl p-6 border border-white/20 ${className}`}>{children}</div>
  );

  // ---------- section title ----------
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">
      {children}
    </h2>
  );

  // ---------- header ----------
  const Header = () => (
    <header className="glass border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900">MediBY</span>
            <span className="text-xs text-gray-500 block">Doctor Portal</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/doctor/availability" className="btn-secondary !py-2 !px-4">
            📅 Set Availability
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );

  // ---------- availability toggle ----------
  const AvailabilityToggle = () => (
    <GlassCard className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">Accepting appointments</p>
          <p className="text-sm text-slate-500">Patients can book slots when toggled on</p>
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
    </GlassCard>
  );

  // ---------- hero stats ----------
  const HeroStats = () => (
    <section className="px-6 pt-32 pb-16">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <GlassCard>
          <p className="text-sm text-slate-500">Today Visits</p>
          <p className="text-4xl font-bold text-slate-800">{approved.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">Completed Today</p>
          <p className="text-4xl font-bold text-slate-800">{completedToday.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">Earnings (today)</p>
          <p className="text-4xl font-bold text-emerald-600">{toNaira(earnings)}</p>
        </GlassCard>
      </div>
    </section>
  );

  // ---------- today consultations ----------
  const TodayConsultations = () => (
    <section className="px-6 pb-16">
      <div className="max-w-5xl mx-auto">
        <SectionTitle>Approved Consultations</SectionTitle>

        {loading && (
          <div className="grid place-items-center h-40">
            <span className="loading loading-spinner loading-lg text-blue-600" />
          </div>
        )}

        {!loading && approved.length === 0 && (
  <GlassCard className="text-center">
    <p className="text-slate-600">No approved consultations.</p>
  </GlassCard>
)}

       {!loading && approved.length > 0 && (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {approved.map((ap) => (
              <motion.div
                key={ap.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl space-y-3 hover:shadow-blue-500/10 hover:-translate-y-1 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg text-slate-900">{ap.patientName}</p>
                    <p className="text-sm text-slate-600">{ap.hospitalName}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Approved</span>
                </div>

                <p className="text-sm">
                  📅 {ap.date} · 🕘 {ap.timeSlot}
                </p>
                <p className="text-sm font-semibold text-emerald-600">{toNaira(ap.fee)}</p>

                <div className="flex gap-2">
                  

                  {ap.twilioRoomSid && (
  <Link href={`/call/${ap.twilioRoomSid}`} className="btn-gradient !py-2 !px-3 text-xs">
    📹 Join Call
  </Link>
)}

                   {/* ✅ Complete consult */}
  <button
    onClick={async () => {
      const note = prompt("Add consult note (optional):");
      const res = await fetch(`/api/hms/doctor/appointments/${ap.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note ?? "" }),
      });
      if (res.ok) {
        // optimistic UI – move card to “completed” section
        setAppointments((prev) =>
          prev.map((p) => (p.id === ap.id ? { ...p, status: "completed" } : p))
        );
      }
    }}
    className="btn-primary !py-2 !px-3 text-xs"
  >
    ✅ Complete
  </button>

                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // ---------- completed this week ----------
  const CompletedWeek = () => {
    const week = appointments.filter((a) => a.status === "completed");
    return (
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Completed This Week</SectionTitle>
          {week.length === 0 && (
            <GlassCard className="text-center">
              <p className="text-slate-600">No completed consultations yet.</p>
            </GlassCard>
          )}
          {week.length > 0 && (
            <div className="space-y-4">
              {week.map((ap) => (
                <GlassCard key={ap.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{ap.patientName}</p>
                    <p className="text-sm text-slate-500">
                      {ap.date} · {ap.timeSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Fee</p>
                    <p className="font-bold text-emerald-600">{toNaira(ap.fee)}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  // ---------- floating actions ----------
  const FloatActions = () => (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <Link href="/doctor/schedule" className="btn-secondary !rounded-full !p-3 shadow-lg" title="My Schedule">
        📅
      </Link>
      <Link href="/doctor/records" className="btn-secondary !rounded-full !p-3 shadow-lg" title="Records">
        📁
      </Link>
      <Link href="/doctor/profile" className="btn-secondary !rounded-full !p-3 shadow-lg" title="Profile">
        👤
      </Link>
    </div>
  );

  return (
    <main className="magic-bg min-h-screen text-slate-800">
      <style jsx global>{`
        .magic-bg {
          background: #f8fafc; /* slate-50 */
        }
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

      <Header />
      <AvailabilityToggle />
      <HeroStats />
      <TodayConsultations />
      <CompletedWeek />
      <FloatActions />
    </main>
  );
}