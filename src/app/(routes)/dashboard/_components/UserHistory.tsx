// src/app/(routes)/dashboard/_components/UserHistory.tsx
"use client";

import { useAuth, SignInButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useAxios } from '@/lib/axios';
import MedicalReport from './MedicalReport';
import { type Session, type AiDoctorAgent } from '@/types/session'; // ← single source

export default function UserHistory() {
  const { isSignedIn } = useAuth();
  const axios = useAxios();
  const [history, setHistory] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!isSignedIn || fetched) return;
    setFetched(true);

    axios
      .get<Session[]>('/api/chat-session?sessionId=all')
      .then(({ data }) => setHistory(data ?? []))
      .catch((err) => console.error('History fetch error', err))
      .finally(() => setLoading(false));
  }, [isSignedIn, axios, fetched]);

  if (!isSignedIn) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please sign in to view your history.</p>
          <SignInButton mode="modal">
            <button className="btn-primary">Sign In</button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading your consultation history...</p>;
  }

  if (!history || history.length === 0) {
    return <p className="text-center mt-10 text-gray-500">No consultation history available.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Your Consultation History</h2>
      <MedicalReport history={history} />
    </div>
  );
}