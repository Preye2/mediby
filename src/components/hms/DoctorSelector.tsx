// src/components/hms/DoctorSelector.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toNaira } from "@/lib/money";
import { useRouter } from "next/navigation";

export default function DoctorSelector({ hospitalId }: { hospitalId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios.get(`/api/hms/hospitals/${hospitalId}/doctors`)
      .then((res) => setDocs(res.data))
      .catch(() => setDocs([]));
  }, [hospitalId]);

  if (!docs.length) return <p className="text-gray-500">Loading doctors…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((d) => (
        <div
          key={d.id}
          onClick={() => router.push(`/patient/book/${hospitalId}/${d.id}`)}
          className="border rounded p-4 hover:shadow cursor-pointer"
        >
          <img
            src={d.avatar || "/doctor-placeholder.png"}
            alt={d.fullName}
            className="h-24 w-24 rounded-full mx-auto mb-2 object-cover"
          />
          <h2 className="font-semibold text-center">{d.fullName}</h2>
          <p className="text-sm text-gray-600 text-center">{d.specialization}</p>
          <p className="text-sm text-green-600 text-center mt-1">
            {toNaira(d.fee)} consultation
          </p>
        </div>
      ))}
    </div>
  );
}