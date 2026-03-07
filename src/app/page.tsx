"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Langsung clear localStorage tanpa menunggu API call,
    // agar redirect ke login tidak tertahan oleh network timeout
    setCurrentUser(null);
    setIsLoading(false);
    router.replace("/auth/login");
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sistema Akuntansi</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Logging out...</p>
        </div>
      </div>
    );
  }

  return null;
}
