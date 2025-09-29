
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import AddNewSessionDialog from './AddNewSessionDialog';
import axios from 'axios';
import { SessionParams } from '../medical-voice/[sessionId]/page';
import { motion } from 'framer-motion';

type UserHistoryProps = {
  onHistoryLoaded?: (history: SessionParams[]) => void;
};

export default function UserHistory({ onHistoryLoaded }: UserHistoryProps) {
  const [history, setHistory] = useState<SessionParams[]>([]);

  useEffect(() => {
    handleHistoryList();
  }, []);

  const handleHistoryList = async () => {
    const result = await axios.get('/api/chat-session?sessionId=all');
    setHistory(result.data);
    if (onHistoryLoaded) onHistoryLoaded(result.data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-xl mx-auto px-6 py-10 flex flex-col items-center justify-center text-center bg-gradient-to-b from-gray-900/40 to-gray-900/80 rounded-2xl shadow-md"
    >
      <Image
        src="/assistant-doctors.png"
        width={180}
        height={180}
        alt="No History"
        className="mb-6 opacity-90"
      />

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-semibold text-white mb-2"
      >
        No Consultation History
      </motion.h2>

      <p className="text-gray-400 mb-6">
        You haven&apos;t consulted with any doctor yet.
      </p>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AddNewSessionDialog />
      </motion.div>

      <p className="text-gray-500 text-sm mt-6">
        You can also{' '}
        <a
          href="/contact"
          className="text-blue-500 hover:underline transition duration-200"
        >
          contact support
        </a>{' '}
        if you have any questions.
      </p>
    </motion.div>
  );
}
