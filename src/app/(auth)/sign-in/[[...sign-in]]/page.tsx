"use client";
import { SignIn, useSignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (signIn?.status === "complete" && signIn.createdSessionId) {
      fetch("/api/onboard", { method: "POST" })
        .then((r) => r.json())
        .then(({ destination }) => router.replace(destination))
        .catch(() => router.replace("/patient/dashboard"));
    }
  }, [isLoaded, signIn, router]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Sign In</h1>
        <SignIn />
      </div>
    </div>
  );
}