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

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 409 && data?.error === "CONSTRAINT_VIOLATION") {
        throw new Error(data.message || "Constraint violation error");
      }

      throw new Error(
        data?.message || `HTTP error! status: ${response.status}`
      );
    }

    return {
      success: true,
      data: data,
      message: data?.message,
    };
  } catch (error) {
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
    return apiRequest<any[]>("/accounts");
  },

  getByDivision: async (divisionId: string | number) => {
    const numericId =
      typeof divisionId === "string" ? parseInt(divisionId) : divisionId;
    return apiRequest<any[]>(`/accounts/by-division/${numericId}`);
  },

  create: async (account: any) => {
    const backendAccount = {
      accountCode: account.accountCode?.trim() || null,
      accountName: account.accountName?.trim() || null,
      valueType: account.valueType || null,
      division: {
        id: account.division?.id ? parseInt(account.division.id) : null,
        name: account.division?.name || null,
      },
    };

    // Validation
    if (!backendAccount.accountCode) {
      throw new Error("Account code is required");
    }
    if (!backendAccount.accountName) {
      throw new Error("Account name is required");
    }
    if (!backendAccount.valueType) {
      throw new Error("Value type is required");
    }
    if (!backendAccount.division.id) {
      throw new Error("Division is required");
    }

    return apiRequest<any>("/accounts", {
      method: "POST",
      body: JSON.stringify(backendAccount),
    });
  },

  update: async (id: string, updates: any) => {
    const numericId = parseInt(id);
    const backendUpdates = {
      accountCode: updates.accountCode?.trim(),
      accountName: updates.accountName?.trim(),
      valueType: updates.valueType,
      ...(updates.division && {
        division: {
          id: parseInt(updates.division.id),
          name: updates.division.name,
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
    // Temporary fallback - return empty array jika endpoint belum ada
    try {
      return await apiRequest<any[]>("/entries");
    } catch (error) {
      console.warn("Entries endpoint not available, using fallback");
      return { success: true, data: [] };
    }
  },

  getByDate: async (date: string) => {
    // Temporary fallback - return empty array jika endpoint belum ada
    try {
      return await apiRequest<any[]>(`/entries/date/${date}`);
    } catch (error) {
      console.warn(`Entries by date endpoint not available for ${date}, using fallback`);
      return { success: true, data: [] };
    }
  },

  getByDivision: async (divisionId: string) => {
    // Temporary fallback
    try {
      return await apiRequest<any[]>(`/entries/division/${divisionId}`);
    } catch (error) {
      console.warn("Entries by division endpoint not available, using fallback");
      return { success: true, data: [] };
    }
  },

  create: async (entry: any) => {
    // Temporary fallback
    try {
      return await apiRequest<any>("/entries", {
        method: "POST",
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn("Create entry endpoint not available, using fallback");
      // Return mock success untuk development
      return { 
        success: true, 
        data: { 
          id: Date.now().toString(), 
          ...entry, 
          createdAt: new Date().toISOString() 
        } 
      };
    }
  },

  createBatch: async (entries: any[]) => {
    // Temporary fallback
    try {
      return await apiRequest<any[]>("/entries/batch", {
        method: "POST",
        body: JSON.stringify(entries),
      });
    } catch (error) {
      console.warn("Batch create entries endpoint not available, using fallback");
      // Return mock success untuk development
      return { 
        success: true, 
        data: entries.map((entry, index) => ({
          id: (Date.now() + index).toString(),
          ...entry,
          createdAt: new Date().toISOString()
        }))
      };
    }
  },

  update: async (id: string, updates: any) => {
    try {
      return await apiRequest<any>(`/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.warn("Update entry endpoint not available, using fallback");
      return { success: true, data: { id, ...updates } };
    }
  },

  delete: async (id: string) => {
    try {
      return await apiRequest(`/entries/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.warn("Delete entry endpoint not available, using fallback");
      return { success: true };
    }
  },
};
