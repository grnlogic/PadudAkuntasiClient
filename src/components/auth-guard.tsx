"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"

// Update interface untuk role baru
interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "SUPER_ADMIN" | "ADMIN_DIVISI"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()

    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    // Normalize role: handle legacy lowercase format dari DB lama
    const normalizedRole =
      currentUser.role === "division_admin"
        ? "ADMIN_DIVISI"
        : currentUser.role === "super_admin"
        ? "SUPER_ADMIN"
        : currentUser.role

    // Update logic redirect
    if (requiredRole && normalizedRole !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (normalizedRole === "SUPER_ADMIN") {
        router.push("/super-admin/dashboard")
      } else {
        router.push("/division-admin/journal")
      }
      return
    }

    // Set user dengan role yang sudah dinormalize
    setUser({ ...currentUser, role: normalizedRole as User["role"] })
    setLoading(false)
  }, [router, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
