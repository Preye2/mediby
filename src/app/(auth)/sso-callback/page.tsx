"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    fetch("/api/onboard", { method: "POST" })
      .then((r) => r.json())
      .then(({ destination }) => router.replace(destination))
      .catch(() => router.replace("/patient/dashboard"));
  }, [isLoaded, user, router]);

  return null; // blank while redirecting
}