"use client"

// Custom hook for API calls with loading states
import { useState, useCallback } from "react"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (apiCall: () => Promise<any>) => {
    setState({ data: null, loading: true, error: null })

    try {
      const response = await apiCall()

      if (response.success) {
        setState({ data: response.data, loading: false, error: null })
        return response.data
      } else {
        setState({ data: null, loading: false, error: response.error || "API call failed" })
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }, [])

  return { ...state, execute }
}
