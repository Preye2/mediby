// src/app/(routes)/dashboard/_components/MedicalReport.tsx
'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, DownloadCloud, RefreshCw } from 'lucide-react';
import { useAxios } from '@/lib/axios';

/* ----------  types (exactly what the webhook stores)  ---------- */
type ReportT = {
  mainComplaint?: string;
  symptoms?: string[];
  duration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  medicationsMentioned?: string[];
  recommendations?: string[];
  summary?: string;
  pdfUrl?: string;
};

type HistoryT = {
  id: string;
  sessionId: string;
  note?: string;
  createdOn: string;
  selectedDoctor: { name: string; specialty: string; image: string };
  report?: ReportT;
  needsSummary: number; // 0 = ready, 1 = still summarising
};

type Props = { history: HistoryT[] };

export default function MedicalReport({ history }: Props) {
  const axios = useAxios();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const itemsPerPage = 5;

  /* ----------  filter  ---------- */
  const filtered = history.filter(
    (h) =>
      h.selectedDoctor.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.note?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ----------  download PDF (already created by webhook)  ---------- */
  const downloadPdf = async (row: HistoryT) => {
    if (!row.report?.pdfUrl) return;
    window.open(row.report.pdfUrl, '_blank');
  };

  /* ----------  poll until summary ready  ---------- */
  const refresh = async (sessionId: string) => {
  setLoadingId(sessionId);
  try {
    await axios.post('/api/medical-report', { sessionId });
    // *** do NOT reload ***  just re-fetch the row
    const { data } = await axios.get(`/api/chat-session?sessionId=${sessionId}`);
    const updated = history.map((h) => (h.sessionId === sessionId ? data : h));
    // parent prop is read-only, so lift this up via callback or mutate SWR
    // quick hack: replace local slice
    const idx = history.findIndex((h) => h.sessionId === sessionId);
    if (idx !== -1) history[idx] = data;
    setLoadingId(null);
  } catch {
    setLoadingId(null);
  }
};

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-100 to-blue-200 bg-clip-text text-transparent"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Medical Report History
      </motion.h2>

      <motion.div
        className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search doctor or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 w-full md:w-1/2"
          />
        </div>

        {/* table */}
        <div className="overflow-x-auto rounded-xl">
          <Table className="min-w-full text-white">
            <TableCaption className="text-gray-400">
              A list of your recent medical reports.
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-gray-700">
                <TableHead className="text-white">AI Assistant</TableHead>
                <TableHead className="text-white">Complaint</TableHead>
                <TableHead className="text-white">Severity</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((row) => (
                <motion.tr
                  key={row.sessionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-700 transition-all"
                >
                  <TableCell className="font-medium">{row.selectedDoctor.name}</TableCell>
                  <TableCell>{row.report?.mainComplaint || row.note || '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        row.report?.severity === 'severe'
                          ? 'bg-red-600'
                          : row.report?.severity === 'moderate'
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                    >
                      {row.report?.severity || 'pending'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(row.createdOn).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {row.needsSummary === 1 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => refresh(row.sessionId)}
                        disabled={loadingId === row.sessionId}
                      >
                        {loadingId === row.sessionId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadPdf(row)}
                        disabled={!row.report?.pdfUrl}
                      >
                        <DownloadCloud className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* pagination */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-white">Page {currentPage} of {totalPages}</p>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}