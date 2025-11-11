// src/app/(routes)/dashboard/_components/MedicalReport.tsx
'use client';

import type { HistoryT } from '@/types/history';

type Props = {
  history: HistoryT[];
};

export default function MedicalReport({ history }: Props) {
  if (!history.length)
    return <p className="text-gray-500">No consultation history available.</p>;

  return (
    <div className="space-y-4">
      {history.map((h) => (
        <div
          key={h.sessionId}
          className="border rounded-lg p-4 shadow-sm bg-white"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              {new Date(h.createdAt).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-blue-600">
              {h.sessionId}
            </span>
          </div>

          {h.report ? (
            <>
              <h3 className="font-semibold text-gray-800">
                {h.report.mainComplaint}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{h.report.summary}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                  Severity: {h.report.severity}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  Duration: {h.report.duration}
                </span>
              </div>

              {h.report.recommendations.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700">Recommendations</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {h.report.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {h.report.medicationsMentioned.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700">Medications mentioned</p>
                  <p className="text-sm text-gray-600">
                    {h.report.medicationsMentioned.join(', ')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No medical report available for this session.</p>
          )}
        </div>
      ))}
    </div>
  );
}