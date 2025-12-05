// src/app/(hms)/admin/dashboard/page.tsx
"use client";
import { useUser } from "@clerk/nextjs";

export default function AdminDashboard() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <main className="magic-bg min-h-screen text-slate-800 px-6 pt-32 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-8">
          Super Admin
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* replace GlassCard with a simple div */}
          <div className="bg-white/60 backdrop-blur rounded-2xl p-6 text-center shadow">
            <p className="text-2xl font-bold">42</p>
            <p className="text-sm text-slate-500">Hospitals</p>
          </div>

          <div className="bg-white/60 backdrop-blur rounded-2xl p-6 text-center shadow">
            <p className="text-2xl font-bold">312</p>
            <p className="text-sm text-slate-500">Doctors</p>
          </div>

          <div className="bg-white/60 backdrop-blur rounded-2xl p-6 text-center shadow">
            <p className="text-2xl font-bold">1.2 k</p>
            <p className="text-sm text-slate-500">Patients</p>
          </div>
        </div>
      </div>
    </main>
  );
}