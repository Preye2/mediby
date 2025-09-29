"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Appointment = {
  id: number;
  date: string;
  timeSlot: string;
  status: "pending" | "paid" | "approved" | "completed" | "cancelled";
  doctorName: string;
  specialization: string;
  hospitalName: string;
  fee: number;
  paystackRef?: string;
};

export default function PatientDashboard() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load patient appointments (filter by email)
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    fetch("/api/hms/patient/appointments")
      .then((r) => r.json())
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [user]);

  const today = new Date().toISOString().split("T")[0];

  const upcoming = appointments.filter((a) => a.date >= today && a.status === "approved");
  const past     = appointments.filter((a) => a.date < today || a.status === "completed");

  return (
    <main className="magic-bg min-h-screen text-gray-800">
      {/* ===== HEADER ===== */}
      <header className="glass border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="font-bold text-xl text-purple-700">MediBY</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Language robot ear (floats open) */}
            <Link href="/patient/book" className="btn-primary !py-2 !px-4">
              🧑‍⚕️ Book Hospital
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* ===== WELCOME HERO ===== */}
      <section className="px-6 pt-32 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
              Welcome back, {user?.firstName ?? "Patient"} 👋
            </h1>
            <p className="text-lg text-gray-700">Your health journey continues — book, pay, translate, video-call.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/patient/book" className="btn-gradient">Book Hospital</Link>
              <Link href="/patient/records" className="btn-secondary">Medical Records</Link>
            </div>
          </div>

          {/* PLACEHOLDER for your beautiful image */}
          <div className="relative w-full h-80 rounded-2xl overflow-hidden glass">
            <Image
              src="/medi5.jpg" // 
              alt="happy patient"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ===== UPCOMING APPROVED APPOINTMENTS ===== */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Upcoming Visits</h2>
          {loading ? (
            <p>Loading appointments…</p>
          ) : upcoming.length === 0 ? (
            <div className="glass p-6 rounded-2xl text-center">
              <p className="text-gray-600 mb-4">No upcoming visits.</p>
              <Link href="/patient/book" className="btn-primary">Book one now</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((ap) => (
                <motion.div
                  key={ap.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="glass p-6 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{ap.hospitalName}</p>
                      <p className="text-sm text-gray-600">Dr. {ap.doctorName} · {ap.specialization}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Approved</span>
                  </div>
                  <p className="text-sm">📅 {ap.date} · 🕘 {ap.timeSlot}</p>
                  <div className="flex gap-2">
                    <Link href={`/patient/appointments/${ap.id}`} className="btn-secondary !py-2 !px-3 text-xs">
                      Details
                    </Link>
                    {/* JOIN CALL button – we wire next */}
                    <Link href={`/patient/call/${ap.id}`} className="btn-gradient !py-2 !px-3 text-xs">
                      📹 Join Call
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== PAST HISTORY ===== */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Past Visits</h2>
          {past.length === 0 ? (
            <p className="text-gray-600">No past visits yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((ap) => (
                <div key={ap.id} className="glass p-4 rounded-2xl opacity-80">
                  <p className="font-semibold">{ap.hospitalName}</p>
                  <p className="text-sm text-gray-600">Dr. {ap.doctorName}</p>
                  <p className="text-xs">📅 {ap.date}</p>
                  <p className="text-xs">💰 ₦{ap.fee / 100}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== QUICK ACTIONS FLOATER ===== */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <Link href="/patient/book" className="btn-gradient !rounded-full !p-3 shadow-lg" title="Book Hospital">
          🧑‍⚕️
        </Link>
        <Link href="/patient/records" className="btn-secondary !rounded-full !p-3 shadow-lg" title="Records">
          📁
        </Link>
        {/* Language robot ear (opens bottom-left) */}
        <button
          onClick={() => alert("Language switcher coming soon!")}
          className="btn-primary !rounded-full !p-3 shadow-lg"
          title="Switch Language"
        >
          🌍
        </button>
      </div>
    </main>
  );
}