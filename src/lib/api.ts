// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

// API Response Types
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Request helper function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "API request failed")
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    }
  } catch (error) {
    console.error("API Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiRequest<{
      user: any
      token: string
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  },

  logout: async () => {
    return apiRequest("/auth/logout", {
      method: "POST",
    })
  },

  getCurrentUser: async () => {
    return apiRequest<any>("/auth/me")
  },
}

// Divisions API
export const divisionsAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/divisions")
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/divisions/${id}`)
  },

  create: async (division: any) => {
    return apiRequest<any>("/divisions", {
      method: "POST",
      body: JSON.stringify(division),
    })
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/divisions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/divisions/${id}`, {
      method: "DELETE",
    })
  },
}

// Accounts (COA) API
export const accountsAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/accounts")
  },

  getByDivision: async (divisionId: string) => {
    return apiRequest<any[]>(`/accounts/division/${divisionId}`)
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/accounts/${id}`)
  },

  create: async (account: any) => {
    return apiRequest<any>("/accounts", {
      method: "POST",
      body: JSON.stringify(account),
    })
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/accounts/${id}`, {
      method: "DELETE",
    })
  },

  checkCodeExists: async (accountCode: string) => {
    return apiRequest<{ exists: boolean }>(`/accounts/check-code/${accountCode}`)
  },
}

// Daily Entries API
export const entriesAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/entries")
  },

  getByDate: async (date: string) => {
    return apiRequest<any[]>(`/entries/date/${date}`)
  },

  getByDivision: async (divisionId: string) => {
    return apiRequest<any[]>(`/entries/division/${divisionId}`)
  },

  getByDivisionAndDate: async (divisionId: string, date: string) => {
    return apiRequest<any[]>(`/entries/division/${divisionId}/date/${date}`)
  },

  create: async (entry: any) => {
    return apiRequest<any>("/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    })
  },

  createBatch: async (entries: any[]) => {
    return apiRequest<any[]>("/entries/batch", {
      method: "POST",
      body: JSON.stringify({ entries }),
    })
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/entries/${id}`, {
      method: "DELETE",
    })
  },
}

// Users API
export const usersAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/users")
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/users/${id}`)
  },

  create: async (user: any) => {
    return apiRequest<any>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    })
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: "DELETE",
    })
  },

  checkUsernameExists: async (username: string) => {
    return apiRequest<{ exists: boolean }>(`/users/check-username/${username}`)
  },
}

// Reports API
export const reportsAPI = {
  getDivisionSummary: async (divisionId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)

    return apiRequest<any>(`/reports/division/${divisionId}?${params.toString()}`)
  },

  getSystemSummary: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)

    return apiRequest<any>(`/reports/system?${params.toString()}`)
  },

  exportDivisionData: async (divisionId: string, format: "csv" | "excel" = "csv") => {
    return apiRequest<{ download_url: string }>(`/reports/export/division/${divisionId}?format=${format}`)
  },

  exportSystemData: async (format: "csv" | "excel" = "csv") => {
    return apiRequest<{ download_url: string }>(`/reports/export/system?format=${format}`)
  },
}

// Monitoring API (for Super Admin)
export const monitoringAPI = {
  getSystemStats: async () => {
    return apiRequest<any>("/monitoring/stats")
  },

  getRecentActivities: async (limit = 50) => {
    return apiRequest<any[]>(`/monitoring/activities?limit=${limit}`)
  },

  getDivisionActivities: async (divisionId: string, limit = 50) => {
    return apiRequest<any[]>(`/monitoring/division/${divisionId}/activities?limit=${limit}`)
  },

  getSystemHealth: async () => {
    return apiRequest<any>("/monitoring/health")
  },
}
