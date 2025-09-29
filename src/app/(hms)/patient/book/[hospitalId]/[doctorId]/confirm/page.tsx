"use client";

"use client";

import { useParams, useSearchParams } from "next/navigation"; // ← BOTH here
import PaystackPop from "@paystack/inline-js";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ConfirmPaymentPage() {
  const router = useRouter();
  const { user } = useUser();
  const params = useParams(); // ← NEW

  // READ FROM PATH
  const hospitalId = params.hospitalId as string;
  const doctorId = params.doctorId as string;

  // READ FROM QUERY
  const searchParams = useSearchParams();
  const date = searchParams.get("date")!;
  const slot = searchParams.get("slot")!;

  const [fee, setFee] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Spy log
  useEffect(() => {
    console.log("🔍 Path params:", { hospitalId, doctorId });
    console.log("🔍 Query params:", { date, slot });
  }, [hospitalId, doctorId, date, slot]);

  // Fetch doctor’s fee
  useEffect(() => {
    axios
      .get(`/api/hms/doctors/${doctorId}`)
      .then((res) => {
        setFee(res.data.fee);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch doctor fee:", err.response?.data || err.message);
        setLoading(false);
      });
  }, [doctorId]);

  const handlePay = () => {
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) {
    alert("Please log in first!");
    return;
  }

  // Load script if not present
  if (!(window as any).PaystackPop) {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => startPay();
    script.onerror = () => alert("Paystack failed to load.");
    document.head.appendChild(script);
  } else {
    startPay();
  }

  function startPay() {
    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY!,
      email,
      amount: fee,
      currency: "NGN",
      ref: `${Date.now()}`,
      onClose: () => alert("Payment cancelled."),
      callback: (response: { reference: string }) => {
        axios
          .post("/api/hms/appointment/pay", {
            hospitalId,
            doctorId,
            date,
            timeSlot: slot,
            paystackRef: response.reference,
            patientEmail: email,
          })
          .then(() => router.push("/patient/success?ref=" + response.reference))
          .catch(() => alert("Server error after payment."));
      },
    });
    handler.openIframe();
  }
};

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
        <p className="text-3xl font-bold text-green-600">₦{Math.round(fee / 100)}</p>

        <button
  onClick={handlePay}
  className="btn-gradient w-full"
  onMouseEnter={() => {
    // Pre-load Paystack script on hover (optional)
    if (!(window as any).PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }}
>
  🚀 Pay with Paystack
</button>

        <p className="text-xs text-gray-500">Secure payment powered by Paystack</p>
      </div>
    </main>
  );
}