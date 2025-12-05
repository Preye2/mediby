"use client";
import { SignUp, useSignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (signUp?.status === "complete" && signUp.createdSessionId) {
      fetch("/api/onboard", { method: "POST" })
        .then((r) => r.json())
        .then(({ destination }) => router.replace(destination))
        .catch(() => router.replace("/patient/dashboard"));
    }
  }, [isLoaded, signUp, router]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Sign Up</h1>
        <SignUp />
      </div>
    </div>
  );
}