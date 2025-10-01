"use client";
import { SignUp, useSignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    // 1. Patch role BEFORE completion
    signUp.update({ unsafeMetadata: { role: "patient" } });

    // 2. If Clerk tries to show org stuff → skip it
    if (signUp.status === "complete" && signUp.createdSessionId) {
      setActive?.({ session: signUp.createdSessionId }).then(() => {
        router.push("/patient/dashboard");
      });
    }
  }, [isLoaded, signUp, setActive, router]);

  // 3. POST-GOOGLE trap – if URL bar ever contains org → instant redirect
  useEffect(() => {
    if (window.location.href.includes("choose-organization") || window.location.href.includes("create-organization")) {
      router.replace("/patient/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Patient Sign Up</h1>
        <SignUp
          routing="path"
          path="/sign-up"
          afterSignUpUrl="/patient/dashboard"
          redirectUrl="/patient/dashboard"
          unsafeMetadata={{ role: "patient" }}
        />
      </div>
    </div>
  );
}