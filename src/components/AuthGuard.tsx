"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Shield, AlertCircle } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function AuthGuard({ children, allowedRoles = [] }: AuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = getCurrentUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        setError("Anda tidak memiliki akses ke halaman ini")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
        return
      }

      setAuthorized(true)
    } catch (error) {
      console.error("Auth check failed:", error)
      setError("Terjadi kesalahan saat verifikasi akses")
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <p className="text-gray-600">Memverifikasi akses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}