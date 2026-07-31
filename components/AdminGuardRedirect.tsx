"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard?error=unauthorized");
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
