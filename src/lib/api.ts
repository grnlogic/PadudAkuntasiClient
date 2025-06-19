// Updated data.ts to use API calls instead of localStorage

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

// Keep interfaces for type safety
export interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  valueType: "NOMINAL" | "KUANTITAS";
  division: {
    id: string;
    name: string;
  };
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Request helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    // Handle different response types
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || `HTTP error! status: ${response.status}`);
    }

    // Backend langsung return array/object, bukan wrapped dalam { data: ... }
    return {
      success: true,
      data: data,
      message: data?.message,
    };
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiRequest<{
      user: any;
      token: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async () => {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser: async () => {
    return apiRequest<any>("/auth/me");
  },
};

// Accounts (COA) API - sesuaikan dengan backend endpoint
export const accountsAPI = {
  getAll: async () => {
    console.log("=== API DEBUG: Calling /accounts endpoint ===");
    const result = await apiRequest<any[]>("/accounts");
    console.log("=== API DEBUG: Raw response ===", result);
    return result;
  },

  getByDivision: async (divisionId: string | number) => {
    // Convert string ID ke number jika perlu
    const numericId =
      typeof divisionId === "string" ? parseInt(divisionId) : divisionId;
    return apiRequest<any[]>(`/accounts/by-division/${numericId}`);
  },

  create: async (account: any) => {
    // Transform frontend format ke backend format
    const backendAccount = {
      accountCode: account.accountCode,
      accountName: account.accountName,
      valueType: account.valueType,
      division: {
        id: account.division?.id ? parseInt(account.division.id) : null,
      },
    };

    return apiRequest<any>("/accounts", {
      method: "POST",
      body: JSON.stringify(backendAccount),
    });
  },

  update: async (id: string, updates: any) => {
    const numericId = parseInt(id);
    const backendUpdates = {
      accountCode: updates.accountCode,
      accountName: updates.accountName,
      valueType: updates.valueType,
      ...(updates.division && {
        division: {
          id: parseInt(updates.division.id),
        },
      }),
    };

    return apiRequest<any>(`/accounts/${numericId}`, {
      method: "PUT",
      body: JSON.stringify(backendUpdates),
    });
  },

  delete: async (id: string) => {
    const numericId = parseInt(id);
    return apiRequest(`/accounts/${numericId}`, {
      method: "DELETE",
    });
  },
};

// Users API (untuk yang belum ada endpoint)
export const usersAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/users");
  },

  create: async (user: any) => {
    return apiRequest<any>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

// Divisions API (untuk yang belum ada endpoint)
export const divisionsAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/divisions");
  },

  create: async (division: any) => {
    return apiRequest<any>("/divisions", {
      method: "POST",
      body: JSON.stringify(division),
    });
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/divisions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/divisions/${id}`, {
      method: "DELETE",
    });
  },
};

// Entri Harian API (untuk yang belum ada endpoint)
export const entriesAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/entries");
  },

  getByDate: async (date: string) => {
    return apiRequest<any[]>(`/entries/date/${date}`);
  },

  getByDivision: async (divisionId: string) => {
    return apiRequest<any[]>(`/entries/division/${divisionId}`);
  },

  create: async (entry: any) => {
    return apiRequest<any>("/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  createBatch: async (entries: any[]) => {
    return apiRequest<any[]>("/entries/batch", {
      method: "POST",
      body: JSON.stringify({ entries }),
    });
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/entries/${id}`, {
      method: "DELETE",
    });
  },
};
