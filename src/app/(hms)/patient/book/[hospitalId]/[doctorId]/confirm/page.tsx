// src/app/(hms)/patient/book/[hospitalId]/[doctorId]/confirm/page.tsx
"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import PaystackPop from "@paystack/inline-js";
import { useState, useEffect } from "react";
import { toNaira } from "@/lib/money";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

export default function ConfirmPaymentPage() {
  const router = useRouter();
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();

  // ----- PATH params -----
  const hospitalId = params.hospitalId as string;
  const doctorId = params.doctorId as string;

  // ----- QUERY params -----
  const date = searchParams.get("date")!;
  const slot = searchParams.get("slot")!;

  const [fee, setFee] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  /* ---------- load doctor fee ---------- */
  useEffect(() => {
    axios
      .get(`/api/hms/doctor/${doctorId}`)
      .then((res) => {
        setFee(res.data.fee);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch doctor fee:", err);
        setLoading(false);
      });
  }, [doctorId]);

  /* ---------- pay button ---------- */
  const handlePay = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return alert("Please log in first!");

    try {
      /* 1. CREATE appointment row & get Paystack reference */
      const { paystackRef } = await axios
        .post("/api/hms/appointment/create", {
          patientEmail: email,
          hospitalId,
          doctorId,
          date,
          timeSlot: slot,
        })
        .then((r) => r.data);

      /* 2. Load Paystack script if not present */
      if (!(window as any).PaystackPop) {
        const script = document.createElement("script")
         script.src = "https://js.paystack.co/v1/inline.js";
        script.onload = () => startPaystack(paystackRef);
        script.onerror = () => alert("Paystack failed to load.");
        document.head.appendChild(script);
      } else {
        startPaystack(paystackRef);
      }

      /* 3. Open Paystack popup */
      function startPaystack(ref: string) {
  const handler = (window as any).PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_KEY!,
    email,
    amount: fee * 100,                       // ← 1. kobo
    currency: "NGN",
    ref,
    metadata: {                              // ← 2. strings
      hospitalId: String(hospitalId),
      doctorId:  String(doctorId),
    },
    onClose: () => alert("Payment cancelled."),
    callback: (response: { reference: string }) => {
      router.push(`/patient/success?ref=${response.reference}`);
    },
  });
  handler.openIframe();
}
    } catch (e: any) {
      console.error("❌ Payment start failed:", e);
      alert("Could not start payment.");
    }
  };

  /* ---------- render ---------- */
  if (loading)
    return (
      <div className="magic-bg min-h-screen flex items-center justify-center">
        <p className="emoji-spin">⚙️</p> Loading fee...
      </div>
    );

  return (
    <main className="magic-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass max-w-md w-full space-y-6 p-8 text-center">
        <h2 className="text-2xl font-bold">💳 Almost There!</h2>

        <p className="text-gray-700">Date: {date}</p>
        <p className="text-gray-700">Slot: {slot}</p>
        <p className="text-3xl font-bold text-green-600">{toNaira(fee)}</p>

        <button onClick={handlePay} className="btn-gradient w-full">
          🚀 Pay with Paystack
        </button>

        <p className="text-xs text-gray-500">Secure payment powered by Paystack</p>
      </div>
    </main>
  );
}