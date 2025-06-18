"use client"

// Custom hook for authentication
import { useState, useEffect } from "react"
import { getCurrentUser, fetchCurrentUser, type User } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First try to get user from localStorage
        const localUser = getCurrentUser()
        if (localUser) {
          setUser(localUser)
        }

        // Then fetch fresh data from API
        const apiUser = await fetchCurrentUser()
        if (apiUser) {
          setUser(apiUser)
        } else if (!localUser) {
          // No user found anywhere
          setUser(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication error")
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  return { user, loading, error, setUser }
}
