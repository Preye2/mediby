"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function HospitalSelector() {
  const [list, setList] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios.get("/api/hms/hospitals").then((res) => setList(res.data));
  }, []);

  if (!list.length) return <p className="text-gray-500">Loading hospitals…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {list.map((h) => (
        <div
          key={h.id}
          onClick={() => router.push(`/patient/book/${h.id}`)}
          className="border rounded p-4 hover:shadow cursor-pointer"
        >
          <img src={h.logo || "/logo.png"} alt="logo" className="h-16 mb-2" />
          <h2 className="font-semibold">{h.name}</h2>
          <p className="text-sm text-gray-600">{h.address}</p>
        </div>
      ))}
    </div>
  );
}