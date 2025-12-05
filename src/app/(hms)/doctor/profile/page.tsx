"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link"; // ← new line

type Profile = { fullName: string; specialisation: string; fee: number; bio: string; avatar?: string };

export default function DoctorProfile() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/hms/doctor/profile")
      .then((r) => r.json())
      .then(setProfile);
  }, [user]);

  if (!profile) return <p className="p-8">Loading…</p>;

  return (
    <main className="magic-bg min-h-screen text-slate-800 px-6 pt-32 pb-16">
      <div className="max-w-3xl mx-auto glass p-8 rounded-2xl">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">
          My Profile
        </h1>

        <div className="flex items-center gap-6 mb-6">
          <img src={profile.avatar || "/avatar.png"} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
          <div>
            <p className="text-2xl font-semibold text-slate-900">{profile.fullName}</p>
            <p className="text-slate-600">{profile.specialisation}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Consultation fee</p>
            <p className="text-xl font-bold text-emerald-600">{profile.fee}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Bio</p>
            <p className="text-slate-700">{profile.bio}</p>
          </div>
        </div>

        <Link href="/doctor/profile/edit" className="btn-gradient mt-6 inline-block">
          Edit Profile
        </Link>
      </div>
    </main>
  );
}