"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const timeSlots = [
  "09:00-09:30",
  "09:30-10:00",
  "10:00-10:30",
  "10:30-11:00",
  "11:00-11:30",
  "11:30-12:00",
  "12:00-12:30",
  "12:30-13:00",
  "13:00-13:30",
  "13:30-14:00",
  "14:00-14:30",
  "14:30-15:00",
  "15:00-15:30",
  "15:30-16:00",
  "16:00-16:30",
];

export default function DateTimePicker({ hospitalId, doctorId }: { hospitalId: string; doctorId: string }) {
  console.log("📦 DateTimePicker props:", { hospitalId, doctorId }); // ← ADD {
  const [selectedDate, setSelectedDate] = useState("");
  const [busy, setBusy] = useState<string[]>([]); // booked slots
  const router = useRouter();

  // Fetch already-booked slots for this date
  useEffect(() => {
    if (!selectedDate) return;
    axios
      .get(`/api/hms/hospitals/${hospitalId}/doctors/${doctorId}/slots`, {
        params: { date: selectedDate },
      })
      .then((res) => setBusy(res.data))
      .catch(() => setBusy([]));
  }, [selectedDate, hospitalId, doctorId]);

  const handleSlot = (slot: string) => {
    if (busy.includes(slot)) return; // blocked
  const targetURL = `/patient/book/${hospitalId}/${doctorId}/confirm?date=${selectedDate}&slot=${slot}`;
console.log("🔗 Built URL:", targetURL);
router.push(targetURL);
  };
  console.log("📦 DateTimePicker props:", { hospitalId, doctorId });

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return (
    <div className="space-y-6">
      {/* ---- Date Picker ---- */}
      <div>
        <label className="block mb-2 font-medium">Select Date</label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-xs"
        />
      </div>

      {/* ---- Time Slots ---- */}
      {selectedDate && (
        <div>
          <label className="block mb-2 font-medium">Available Time Slots</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {timeSlots.map((slot) => {
              const isBusy = busy.includes(slot);
              return (
                <button
                  key={slot}
                  onClick={() => handleSlot(slot)}
                  disabled={isBusy}
                  className={`border rounded px-3 py-2 text-sm transition ${
                    isBusy
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "hover:bg-purple-100 hover:border-purple-500"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}