"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hanya jalan sekali saat component mount
    const checkAuth = async () => {
      try {
        // Delay sedikit untuk memastikan localStorage ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const user = getCurrentUser()
        
        if (!user) {
          router.replace("/auth/login")
        } else if (user.role === "SUPER_ADMIN") {
          router.replace("/super-admin/dashboard")
        } else {
          router.replace("/division-admin/journal")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.replace("/auth/login")
      }
    }

    checkAuth()
  }, []) // ⭐ Empty dependency array - hanya jalan sekali

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Sistema Akuntansi</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Loading...</p>
      </div>
    </div>
  )
}
