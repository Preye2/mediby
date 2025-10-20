// src/app/(routes)/dashboard/history/page.tsx
'use client';

// src/app/(routes)/dashboard/history/page.tsx  (top only)
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAxios } from '@/lib/axios';
import MedicalReport from '@/app/(routes)/dashboard/_components/MedicalReport';
import { type Session } from '@/types/session'; // ← fixed line


export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const axios = useAxios(); // bearer token attached
  const [history, setHistory] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    axios
      .get<Session[]>('/api/chat-session?sessionId=all')
      .then(({ data }) => setHistory(data ?? []))
      .catch((err) => console.error('Error fetching history:', err))
      .finally(() => setLoading(false));
  }, [isSignedIn, router, axios]);

  if (!isSignedIn || loading) {
    return (
      <p className="text-center mt-10 text-gray-500">Loading your consultation history...</p>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-center mt-10 text-gray-500">
        No consultation history available.
      </p>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Your Consultation History</h2>
      <MedicalReport history={history} />
    </div>
  );
}