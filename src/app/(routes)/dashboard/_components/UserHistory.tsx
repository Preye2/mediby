"use client";

import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useAxios } from '@/lib/axios';
import MedicalReport from '../_components/MedicalReport';

/* ----------  CENTRAL TYPES  ---------- */
type AiDoctorAgent = {
  id: number;
  name: string;
  specialty: string;
  description: string;
  image: string;
  agentPrompt: string;
  doctorVoiceId: string;
};

type Session = {
  id: number;
  note: string;
  sessionId: string;
  selectedDoctor: AiDoctorAgent;
  report?: {
    sessionId: string;
    agent: string;
    user: string;
    timestamp: string;
    mainComplaint: string;
    symptoms: string[];
    summary: string;
    duration: string;
    severity: string;
    medicationsMentioned: string[];
    recommendations: string[];
  };
  createdOn: string;
  status: string;
};

/* ----------  HISTORY PAGE  ---------- */
export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const axios = useAxios();
  const [history, setHistory] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false); // one-shot guard

  useEffect(() => {
    if (!isSignedIn || fetched) return;
    setFetched(true);

    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/chat-session?sessionId=all');
        setHistory(data ?? []);
      } catch (err) {
        console.error('History fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
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