import type { CreateEntriHarianRequest } from "@/types/EntriHarian";
import { create } from "domain";

// Updated data.ts to use API calls instead of localStorage

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
// ✅ Enhanced error handling
// Request helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    // ✅ Log request details for piutang endpoint
    if (endpoint.includes("/piutang")) {
      console.log("🔍 API REQUEST DEBUG:", {
        endpoint,
        method: options.method,
        body: options.body,
        headers: options.headers,
      });
    }

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

    // ✅ Log response for piutang endpoint
    if (endpoint.includes("/piutang")) {
      console.log("🔍 API RESPONSE DEBUG:", {
        status: response.status,
        ok: response.ok,
        data,
      });
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || "An error occurred",
      };
    }

    return {
      success: true,
      data: data,
      message: data?.message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiRequest<{
      user: any;
      token: string;
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async () => {
    return apiRequest("/api/v1/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser: async () => {
    return apiRequest<any>("/api/v1/auth/me");
  },
};

// Accounts (COA) API - sesuaikan dengan backend endpoint
export const accountsAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/api/v1/accounts");
  },

  getByDivision: async (divisionId: string | number) => {
    const numericId =
      typeof divisionId === "string" ? parseInt(divisionId) : divisionId;
    return apiRequest<any[]>(`/api/v1/accounts/by-division/${numericId}`);
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

    return apiRequest<any>("/api/v1/accounts", {
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

    return apiRequest<any>(`/api/v1/accounts/${numericId}`, {
      method: "PUT",
      body: JSON.stringify(backendUpdates),
    });
  },

  delete: async (id: string) => {
    const numericId = parseInt(id);
    return apiRequest(`/api/v1/accounts/${numericId}`, {
      method: "DELETE",
    });
  },
};

// Users API (untuk yang belum ada endpoint)
export const usersAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/api/v1/users");
  },

  create: async (user: any) => {
    return apiRequest<any>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/api/v1/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/v1/users/${id}`, {
      method: "DELETE",
    });
  },
};

//piutang API (untuk yang belum ada endpoint)
export interface CreatePiutangRequest {
  tanggalTransaksi: string; // format: 'YYYY-MM-DD'
  tipeTransaksi: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET";
  kategori: "KARYAWAN" | "TOKO" | "BAHAN_BAKU";
  nominal: number;
  keterangan?: string;
  accountId: number;
}

//Api Piutang
export const piutangAPI = {
  create: async (data: CreatePiutangRequest) => {
    // ✅ Add validation and logging
    console.log("🔍 PIUTANG API - Raw data received:", data);

    // ✅ Validate required fields
    if (!data.tanggalTransaksi) {
      throw new Error("VALIDATION_ERROR: Tanggal transaksi wajib diisi");
    }
    if (!data.tipeTransaksi) {
      throw new Error("VALIDATION_ERROR: Tipe transaksi wajib diisi");
    }
    if (!data.nominal || data.nominal <= 0) {
      throw new Error("VALIDATION_ERROR: Nominal harus lebih dari 0");
    }
    if (!data.accountId || data.accountId <= 0) {
      throw new Error("VALIDATION_ERROR: Account ID wajib diisi");
    }

    // ✅ Format data for backend
    const formattedData = {
      tanggalTransaksi: data.tanggalTransaksi.slice(0, 10), // pastikan hanya YYYY-MM-DD
      tipeTransaksi: data.tipeTransaksi, // pastikan UPPERCASE dan sesuai enum Java
      kategori: data.kategori || "KARYAWAN",
      nominal: Number(data.nominal),
      keterangan: data.keterangan || "",
      accountId: Number(data.accountId),
    };
    console.log("📤 PIUTANG API - Formatted data to send:", formattedData);

    return apiRequest<any>("/api/v1/piutang", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },

  getAll: async () => {
    return apiRequest<any[]>("/api/v1/piutang");
  },
};

// ✅ NEW: Utang API interface and functions
export interface CreateUtangRequest {
  tanggalTransaksi: string; // format: 'YYYY-MM-DD'
  tipeTransaksi: "UTANG_BARU" | "UTANG_DIBAYAR";
  kategori: "BAHAN_BAKU" | "BANK_HM" | "BANK_HENRY";
  nominal: number;
  keterangan?: string;
  accountId: number;
}

//Api Utang
export const utangAPI = {
  create: async (data: CreateUtangRequest) => {
    // ✅ Add validation and logging
    console.log("🔍 UTANG API - Raw data received:", data);

    // ✅ Validate required fields
    if (!data.tanggalTransaksi) {
      throw new Error("VALIDATION_ERROR: Tanggal transaksi wajib diisi");
    }
    if (!data.tipeTransaksi) {
      throw new Error("VALIDATION_ERROR: Tipe transaksi wajib diisi");
    }
    if (!data.nominal || data.nominal <= 0) {
      throw new Error("VALIDATION_ERROR: Nominal harus lebih dari 0");
    }
    if (!data.accountId || data.accountId <= 0) {
      throw new Error("VALIDATION_ERROR: Account ID wajib diisi");
    }

    // ✅ Format data for backend
    const formattedData = {
      tanggalTransaksi: data.tanggalTransaksi.slice(0, 10), // pastikan hanya YYYY-MM-DD
      tipeTransaksi: data.tipeTransaksi, // pastikan UPPERCASE dan sesuai enum Java
      kategori: data.kategori || "BAHAN_BAKU",
      nominal: Number(data.nominal),
      keterangan: data.keterangan || "",
      accountId: Number(data.accountId),
    };
    console.log("📤 UTANG API - Formatted data to send:", formattedData);

    return apiRequest<any>("/api/v1/utang", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },

  getAll: async () => {
    return apiRequest<any[]>("/api/v1/utang");
  },
};

// Divisions API (untuk yang belum ada endpoint)
export const divisionsAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/api/v1/divisions");
  },

  create: async (division: any) => {
    return apiRequest<any>("/api/v1/divisions", {
      method: "POST",
      body: JSON.stringify(division),
    });
  },

  update: async (id: string, updates: any) => {
    return apiRequest<any>(`/api/v1/divisions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/v1/divisions/${id}`, {
      method: "DELETE",
    });
  },
};

// Entri Harian API (untuk yang belum ada endpoint)
export const entriesAPI = {
  getAll: async () => {
    return await apiRequest<any[]>("/api/v1/entri-harian");
  },

  getByDate: async (date: string) => {
    return await apiRequest<any[]>(`/api/v1/entri-harian/date/${date}`);
  },

  getByDivision: async (divisionId: string) => {
    return await apiRequest<any[]>(
      `/api/v1/entri-harian/division/${divisionId}`
    );
  },

  getById: async (id: string) => {
    return await apiRequest<any>(`/api/v1/entri-harian/${id}`);
  },

  create: async (entry: CreateEntriHarianRequest) => {
    return await apiRequest<any>("/api/v1/entri-harian", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  createBatch: async (entries: CreateEntriHarianRequest[]) => {
    return await apiRequest<any[]>("/api/v1/entri-harian/batch", {
      method: "POST",
      body: JSON.stringify(entries),
    });
  },

  update: async (id: string, updates: CreateEntriHarianRequest) => {
    return await apiRequest<any>(`/api/v1/entri-harian/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/api/v1/entri-harian/${id}`, {
      method: "DELETE",
    });
  },
};
