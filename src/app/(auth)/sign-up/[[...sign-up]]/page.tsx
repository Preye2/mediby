"use client";
import { SignUp, useSignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [inserted, setInserted] = useState(false); // prevent double insert

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    // 1. Patch role BEFORE completion
    signUp.update({ unsafeMetadata: { role: "patient" } });

    // 2. After Clerk success → insert into YOUR database
    if (signUp.status === "complete" && signUp.createdSessionId && !inserted) {
      setInserted(true); // lock
      const email = signUp.emailAddress;
      const name = `${signUp.firstName || ""} ${signUp.lastName || ""}`.trim() || "Patient";
      axios.post("/api/after-clerk-signup", { name, email }).catch(console.error);

      setActive?.({ session: signUp.createdSessionId }).then(() => {
        router.push("/patient/dashboard");
      });
    }
  }, [isLoaded, signUp, setActive, router, inserted]);

  // 3. POST-GOOGLE trap – skip org screen
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