"use client";
import { SignIn, useSignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !signIn) return;

    // If Clerk tries to show org stuff → instant redirect
    if (signIn.status === "complete" && signIn.createdSessionId) {
      setActive?.({ session: signIn.createdSessionId }).then(() => {
        router.push("/patient/dashboard");
      });
    }
  }, [isLoaded, signIn, setActive, router]);

  // POST-SIGN-IN trap – if URL ever contains org → instant redirect
  useEffect(() => {
    if (window.location.href.includes("choose-organization") || window.location.href.includes("create-organization")) {
      router.replace("/patient/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Patient Sign In</h1>
        <SignIn
          routing="path"
          path="/sign-in"
          afterSignInUrl="/patient/dashboard"
          redirectUrl="/patient/dashboard"
        />
      </div>
    </div>
  );
}