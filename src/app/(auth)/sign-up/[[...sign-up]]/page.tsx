"use client";

import { useSignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !signUp) return; // ⛔ guard

    // Patch role BEFORE completion
    signUp.update({ unsafeMetadata: { role: "patient" } });
  }, [isLoaded, signUp]);

  useEffect(() => {
    if (!signUp) return; // ⛔ guard
    if (signUp.status === "complete" && signUp.createdSessionId) {
      setActive?.({ session: signUp.createdSessionId }).then(() => {
        router.push("/patient/dashboard");
      });
    }
  }, [signUp, setActive, router]);

  if (!isLoaded || !signUp) return null; // ⛔ guard

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Patient Sign Up</h1>
        <div className="clerk-sign-up-container" />
      </div>
    </div>
  );
}