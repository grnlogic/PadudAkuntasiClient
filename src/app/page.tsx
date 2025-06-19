"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Auto logout untuk development
        await logout();

        setIsLoading(false);
        router.replace("/auth/login");
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoading(false);
        router.replace("/auth/login");
      }
    };

    checkAuth();
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
