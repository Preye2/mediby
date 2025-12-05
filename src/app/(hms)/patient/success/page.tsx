"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SuccessPage() {
  return (
    <main className="magic-bg flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass max-w-md w-full space-y-4 p-8 text-center"
      >
        <div className="mx-auto w-20">🎉</div>
        <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
        <p className="text-gray-700">
          Your appointment is now waiting for sub-admin approval. You’ll get an email/SMS once confirmed.
        </p>
        <Link href="/patient/dashboard" className="btn-gradient inline-block">
          Go to Dashboard
        </Link>
      </motion.div>
    </main>
  );
}