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
  perusahaan_id?: number; // ✅ NEW: Company ID from backend
  perusahaanId?: number; // Alternative naming
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  maintenance?: boolean; // Add maintenance flag
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

    // ✅ ADD: Log request details


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
      // ✅ Enhanced error logging
      console.error("❌ [API ERROR]", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorData: data,
        errorMessage: data?.message || data?.error || "Unknown error",
      });

      // Check for maintenance mode (503 status)
      if (response.status === 503 && data?.maintenance) {
        return {
          success: false,
          error: data?.message || "Sistem sedang dalam mode maintenance",
          maintenance: true,
        };
      }

      return {
        success: false,
        error:
          data?.message ||
          data?.error ||
          `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // ✅ FIX: Unwrap backend response yang sudah punya struktur {success, data}
    // Backend mengembalikan: {success: true, message: "...", data: {token, user}}
    // Kita unwrap agar frontend bisa akses langsung response.data.token
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return {
        success: data.success,
        data: data.data,  // Unwrap: ambil data.data, bukan data
        message: data.message,
      };
    }

    // Fallback untuk response yang tidak punya nested structure
    return {
      success: true,
      data: data,
      message: data?.message,
    };
  } catch (error) {
    console.error("💥 [API EXCEPTION]", {
      endpoint,
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });

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
    return apiRequest<any[]>(`/api/v1/accounts/division/${numericId}`);
  },

  create: async (account: any) => {
    const backendAccount = {
      division_id: account.division?.id ? parseInt(account.division.id) : null,
      account_code: account.accountCode?.trim() || null,
      account_name: account.accountName?.trim() || null,
    };

    // Validation
    if (!backendAccount.account_code) {
      throw new Error("Account code is required");
    }
    if (!backendAccount.account_name) {
      throw new Error("Account name is required");
    }
    if (!backendAccount.division_id) {
      throw new Error("Division is required");
    }

    return apiRequest<any>("/api/v1/accounts", {
      method: "POST",
      body: JSON.stringify(backendAccount),
    });
  },

  update: async (id: string, updates: any) => {
    const numericId = parseInt(id);

    console.log("🔍 [UPDATE ACCOUNT DEBUG] Input:", {
      id,
      numericId,
      updates,
    });

    // Build payload with proper validation
    const backendUpdates: any = {};

    // Only include non-empty fields
    if (updates.accountCode?.trim()) {
      backendUpdates.account_code = updates.accountCode.trim();
    }

    if (updates.accountName?.trim()) {
      backendUpdates.account_name = updates.accountName.trim();
    }

    // Handle division field properly
    if (updates.division?.id) {
      const divisionId =
        typeof updates.division.id === "string"
          ? parseInt(updates.division.id)
          : updates.division.id;

      if (divisionId && divisionId > 0) {
        backendUpdates.division_id = divisionId;
      }
    }

    console.log("🚀 [UPDATE ACCOUNT] Final payload:", {
      url: `/api/v1/accounts/${numericId}`,
      payload: backendUpdates,
    });

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

// Users API
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
  tipeTransaksi:
  | "PIUTANG_BARU"
  | "PIUTANG_TERTAGIH"
  | "PIUTANG_MACET"
  | "SALDO_AKHIR_PIUTANG";
  nominal: number;
  keterangan?: string;
  accountId: number;
}

//Api Piutang
export const piutangAPI = {
  create: async (data: CreatePiutangRequest) => {
    const response = await apiRequest<any>("/api/v1/piutang", {
      method: "POST",
      body: JSON.stringify({
        account_id: Number(data.accountId),
        tanggal_transaksi: data.tanggalTransaksi,
        tipe_transaksi: data.tipeTransaksi,
        nominal: Number(data.nominal),
        keterangan: data.keterangan || "",
      }),
    });
    return response;
  },

  getAll: async () => {
    return apiRequest<any[]>("/api/v1/piutang?limit=10000");
  },

  delete: async (id: number) => {
    return apiRequest(`/api/v1/piutang/${id}`, {
      method: "DELETE",
    });
  },
};

// ✅ NEW: LaporanPenjualanSales API interface and functions
export interface CreateLaporanPenjualanSalesRequest {
  tanggalLaporan: string; // format: 'YYYY-MM-DD'
  salespersonId: number;
  targetPenjualan?: number;
  realisasiPenjualan?: number;
  returPenjualan?: number;
  keteranganKendala?: string;
}

export interface LaporanPenjualanSales {
  id: number;
  tanggalLaporan: string;
  salesperson: {
    id: number;
    username: string;
    division?: {
      id: number;
      name: string;
    };
  };
  targetPenjualan?: number;
  realisasiPenjualan?: number;
  returPenjualan?: number;
  keteranganKendala?: string;
  createdBy: {
    id: number;
    username: string;
  };
  createdAt: string;
}

//Api LaporanPenjualanSales
export const laporanPenjualanSalesAPI = {
  create: async (data: CreateLaporanPenjualanSalesRequest) => {
    // Validate required fields
    if (!data.tanggalLaporan) {
      throw new Error("VALIDATION_ERROR: Tanggal laporan wajib diisi");
    }
    if (!data.salespersonId || data.salespersonId <= 0) {
      throw new Error("VALIDATION_ERROR: Salesperson ID wajib diisi");
    }

    // Format data for backend
    const formattedData = {
      tanggal_laporan: data.tanggalLaporan.slice(0, 10),
      salesperson_id: Number(data.salespersonId),
      target_penjualan: data.targetPenjualan ? Number(data.targetPenjualan) : null,
      realisasi_penjualan: data.realisasiPenjualan ? Number(data.realisasiPenjualan) : null,
      retur_penjualan: data.returPenjualan ? Number(data.returPenjualan) : null,
      keterangan_kendala: data.keteranganKendala || null,
    };

    return apiRequest<LaporanPenjualanSales>("/api/v1/laporan-penjualan", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },

  getAll: async () => {
    // Get sales reports (different from product reports)
    // For now, return empty array since this is separate from product reports
    return Promise.resolve([]);
  },

  getById: async (id: number) => {
    return apiRequest<LaporanPenjualanSales>(`/api/v1/laporan-penjualan/${id}`);
  },

  get: async (endpoint: string) => {
    return apiRequest<any>(`/api/v1/laporan-penjualan${endpoint}`);
  },

  getSummary: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest<any>(`/api/v1/laporan-penjualan/summary${query}`);
  },

  delete: async (id: number) => {
    return apiRequest(`/api/v1/laporan-penjualan/${id}`, {
      method: "DELETE",
    });
  },
};
// ✅ NEW: Utang API interface and functions
export interface CreateUtangRequest {
  tanggalTransaksi: string; // format: 'YYYY-MM-DD'
  tipeTransaksi: "UTANG_BARU" | "UTANG_DIBAYAR" | "SALDO_AKHIR_UTANG";
  nominal: number;
  keterangan?: string;
  accountId: number;
}

//Api Utang
export const utangAPI = {
  create: async (data: CreateUtangRequest) => {
    const response = await apiRequest<any>("/api/v1/utang", {
      method: "POST",
      body: JSON.stringify({
        account_id: Number(data.accountId),
        tanggal_transaksi: data.tanggalTransaksi,
        tipe_transaksi: data.tipeTransaksi,
        nominal: Number(data.nominal),
        keterangan: data.keterangan || "",
      }),
    });
    return response;
  },

  getAll: async () => {
    return apiRequest<any[]>("/api/v1/utang?limit=10000");
  },

  delete: async (id: number) => {
    return apiRequest(`/api/v1/utang/${id}`, {
      method: "DELETE",
    });
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

// Entri Harian API
export const entriesAPI = {
  getAll: async (params?: any) => {
    // Always add limit=10000 to get all data
    const mergedParams = { limit: 10000, ...params };
    const query = `?${new URLSearchParams(mergedParams)}`;
    return await apiRequest<any[]>(`/api/v1/entri-harian${query}`);
  },

  getSummary: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return await apiRequest<any>(`/api/v1/entri-harian/summary${query}`);
  },

  getById: async (id: string) => {
    return await apiRequest<any>(`/api/v1/entri-harian/${id}`);
  },

  create: async (entry: CreateEntriHarianRequest) => {
    // Convert frontend field names to backend format
    const backendEntry: any = {
      account_id: entry.accountId,
      tanggal_laporan: entry.tanggal,
    };

    // Add transaction_type if present
    if (entry.transactionType) {
      backendEntry.transaction_type = entry.transactionType;
    }

    // Add nominal if nilai is present
    if (entry.nilai !== undefined) {
      backendEntry.nominal = entry.nilai;
    }

    // Add keterangan if description is present
    if (entry.description) {
      backendEntry.keterangan = entry.description;
    }

    return await apiRequest<any>("/api/v1/entri-harian", {
      method: "POST",
      body: JSON.stringify(backendEntry),
    });
  },

  createBatch: async (entries: CreateEntriHarianRequest[]) => {
    // Convert each entry
    const backendEntries = entries.map(entry => {
      const backendEntry: any = {
        account_id: entry.accountId,
        // Support both tanggal and tanggal_laporan
        tanggal_laporan: entry.tanggal_laporan || entry.tanggal,
      };

      if (entry.transactionType) {
        backendEntry.transaction_type = entry.transactionType;
      }
      if (entry.nilai !== undefined) {
        backendEntry.nilai = entry.nilai;
      }
      if (entry.description) {
        backendEntry.description = entry.description;
      }
      if (entry.saldoAkhir !== undefined) {
        backendEntry.saldo_akhir = entry.saldoAkhir;
      }
      // HRD fields
      if (entry.attendance_status) {
        backendEntry.attendance_status = entry.attendance_status;
      }
      if (entry.absent_count !== undefined) {
        backendEntry.absent_count = entry.absent_count;
      }
      if (entry.shift) {
        backendEntry.shift = entry.shift;
      }
      if (entry.keterangan_kendala) {
        backendEntry.keterangan_kendala = entry.keterangan_kendala;
      }

      return backendEntry;
    });

    return await apiRequest<any[]>("/api/v1/entri-harian/batch", {
      method: "POST",
      body: JSON.stringify(backendEntries),
    });
  },

  update: async (id: string, updates: CreateEntriHarianRequest) => {
    // Convert frontend field names to backend format
    const backendUpdates: any = {
      account_id: updates.accountId,
      tanggal_laporan: updates.tanggal,
    };

    if (updates.transactionType) {
      backendUpdates.transaction_type = updates.transactionType;
    }
    if (updates.nilai !== undefined) {
      backendUpdates.nominal = updates.nilai;
    }
    if (updates.description) {
      backendUpdates.keterangan = updates.description;
    }

    return await apiRequest<any>(`/api/v1/entri-harian/${id}`, {
      method: "PUT",
      body: JSON.stringify(backendUpdates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/api/v1/entri-harian/${id}`, {
      method: "DELETE",
    });
  },
};

export interface Salesperson {
  id: number;
  nama: string;
  status: string;
  division?: { id: number; name: string };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

// GET all salespeople
export async function getSalespeople(): Promise<Salesperson[]> {
  const token = getToken();
  if (!token) throw new Error("User belum login atau token tidak ditemukan");

  console.log("🔍 GET SALESPEOPLE - Requesting data...");

  const res = await fetch(`${BASE_URL}/api/v1/salespeople`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("📥 GET SALESPEOPLE - Response:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ GET SALESPEOPLE - Error:", errorText);
    throw new Error("Gagal mengambil data salesperson");
  }

  const data = await res.json();
  console.log("✅ GET SALESPEOPLE - Success:", data);
  return data;
}

// CREATE salesperson
export async function createSalesperson(
  nama: string,
  perusahaanId?: number,
  divisionId?: number
): Promise<Salesperson> {
  const token = getToken();
  if (!token) throw new Error("User belum login atau token tidak ditemukan");

  const requestBody = {
    nama,
    division_id: divisionId || 2, // Default ke DIVISI PEMASARAN & PENJUALAN (ID: 2)
    status: "AKTIF",
  };

  console.log("🚀 CREATE SALESPERSON - Payload:", {
    endpoint: `${BASE_URL}/api/v1/salespeople`,
    requestBody,
  });

  const res = await fetch(`${BASE_URL}/api/v1/salespeople`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  // ✅ ADD: Log response dari backend
  console.log("📥 CREATE SALESPERSON - Response:", {
    status: res.status,
    ok: res.ok,
  });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      console.error("❌ CREATE SALESPERSON - Error:", errorData);
      const errorMessage = errorData.message || errorData.error || "Unknown error";
      throw new Error("Gagal menambah salesperson: " + errorMessage);
    } catch (parseError) {
      const errorText = await res.text();
      console.error("❌ CREATE SALESPERSON - Raw Error:", errorText);
      throw new Error("Gagal menambah salesperson: " + errorText);
    }
  }

  const responseData = await res.json();
  console.log("✅ CREATE SALESPERSON - Success:", responseData);
  return responseData;
}

// DELETE salesperson
export async function deleteSalesperson(id: number): Promise<boolean> {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${BASE_URL}/api/v1/salespeople/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.text();
    console.error("❌ DELETE SALESPERSON ERROR:", errorData);
    throw new Error(
      `Failed to delete salesperson: ${res.status} ${res.statusText}`
    );
  }

  return true;
}

// ✅ NEW: LaporanProduksi API interface and functions
export interface CreateLaporanProduksiRequest {
  tanggalLaporan: string; // format: 'YYYY-MM-DD'
  accountId: number;
  hasilProduksi?: number;
  barangGagal?: number;
  stockBarangJadi?: number;
  hpBarangJadi?: number;
  keteranganKendala?: string;
}

export interface LaporanProduksiHarian {
  id: number;
  tanggalLaporan: string;
  account: {
    id: number;
    division: {
      id: number;
      name: string;
    };
    accountCode: string;
    accountName: string;
    valueType: string;
  };
  hasilProduksi?: number;
  barangGagal?: number;
  stockBarangJadi?: number;
  hpBarangJadi?: number;
  keteranganKendala?: string;
  createdBy: {
    id: number;
    username: string;
    role: string;
    division: {
      id: number;
      name: string;
    };
  };
  createdAt: string;
}

//Api LaporanProduksi
export const laporanProduksiAPI = {
  create: async (data: CreateLaporanProduksiRequest) => {
    // Validate required fields
    if (!data.tanggalLaporan) {
      throw new Error("VALIDATION_ERROR: Tanggal laporan wajib diisi");
    }
    if (!data.accountId || data.accountId <= 0) {
      throw new Error("VALIDATION_ERROR: Account ID wajib diisi");
    }

    // Format data for backend
    const formattedData = {
      tanggal_laporan: data.tanggalLaporan.slice(0, 10),
      account_id: Number(data.accountId),
      hasil_produksi: data.hasilProduksi ? Number(data.hasilProduksi) : null,
      barang_gagal: data.barangGagal ? Number(data.barangGagal) : null,
      stock_barang_jadi: data.stockBarangJadi ? Number(data.stockBarangJadi) : null,
      hp_barang_jadi: data.hpBarangJadi ? Number(data.hpBarangJadi) : null,
      keterangan_kendala: data.keteranganKendala || null,
    };

    return apiRequest<LaporanProduksiHarian>("/api/v1/laporan-produksi", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },

  getAll: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest<LaporanProduksiHarian[]>(`/api/v1/laporan-produksi${query}`);
  },

  getById: async (id: number) => {
    return apiRequest<LaporanProduksiHarian>(`/api/v1/laporan-produksi/${id}`);
  },

  getSummary: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest<any>(`/api/v1/laporan-produksi/summary${query}`);
  },

  delete: async (id: number) => {
    return apiRequest(`/api/v1/laporan-produksi/${id}`, {
      method: "DELETE",
    });
  },
};

// ✅ NEW: LaporanGudang API interface and functions
export interface CreateLaporanGudangRequest {
  tanggalLaporan: string; // format: 'YYYY-MM-DD'
  accountId: number;
  stokAwal?: number; // Field name that form sends (was 'barangMasuk')
  pemakaian?: number;
  stokAkhir?: number;
  kondisiGudang?: string; // Field name that form sends (was 'keterangan')
}

export interface LaporanGudangHarian {
  id: number;
  tanggalLaporan: string;
  account: {
    id: number;
    division: {
      id: number;
      name: string;
    };
    accountCode: string;
    accountName: string;
    valueType: string;
  };
  barangMasuk?: number;
  pemakaian?: number;
  stokAkhir?: number;
  keterangan?: string;
  createdBy: {
    id: number;
    username: string;
    role: string;
    division: {
      id: number;
      name: string;
    };
  };
  createdAt: string;
}

//Api LaporanGudang
export const laporanGudangAPI = {
  create: async (data: CreateLaporanGudangRequest) => {
    // Validate required fields
    if (!data.tanggalLaporan) {
      throw new Error("VALIDATION_ERROR: Tanggal laporan wajib diisi");
    }
    if (!data.accountId || data.accountId <= 0) {
      throw new Error("VALIDATION_ERROR: Account ID wajib diisi");
    }

    // Format data for backend
    const formattedData = {
      tanggal_laporan: data.tanggalLaporan.slice(0, 10),
      account_id: Number(data.accountId),
      barang_masuk: data.stokAwal ? Number(data.stokAwal) : null,
      pemakaian: data.pemakaian ? Number(data.pemakaian) : null,
      stok_akhir: data.stokAkhir ? Number(data.stokAkhir) : null,
      keterangan: data.kondisiGudang || null,
    };

    return apiRequest<LaporanGudangHarian>("/api/v1/laporan-gudang", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },

  getAll: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest<LaporanGudangHarian[]>(`/api/v1/laporan-gudang${query}`);
  },

  getById: async (id: number) => {
    return apiRequest<LaporanGudangHarian>(`/api/v1/laporan-gudang/${id}`);
  },

  delete: async (id: number) => {
    return apiRequest(`/api/v1/laporan-gudang/${id}`, {
      method: "DELETE",
    });
  },
};

// ✅ NEW: Notification interface
export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
}

// ✅ NEW: Notification API
export const notificationAPI = {
  getAll: async () => {
    const response = await apiRequest<Notification[]>("/api/v1/notifications");
    if (response.success && response.data) {
      const mappedNotifications = response.data.map((notif: any) => ({
        id: notif.id,
        message: notif.message,
        isRead: notif.isRead || notif.read || false, // Handle both field names
        linkUrl: notif.linkUrl,
        createdAt: notif.createdAt || notif.created_at, // Handle both field names
        user: notif.user,
      }));

      return { success: true, data: mappedNotifications };
    }
    return response;
  },

  markAsRead: async (id: number) => {
    return apiRequest(`/api/v1/notifications/${id}/read`, {
      method: "PUT",
    });
  },

  send: async (message: string, linkUrl?: string) => {
    // ✅ Validate required fields
    if (!message || message.trim() === "") {
      throw new Error("VALIDATION_ERROR: Message is required");
    }

    const formattedData = {
      message: message.trim(),
      linkUrl: linkUrl?.trim() || null,
    };

    return apiRequest<any>("/api/v1/notifications/send", {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
  },
};

// ================== SALESPERSON BY DIVISION ==================
// Salespeople API
export const salespersonAPI = {
  getByDivision: async (divisionId: number) => {
    // Backend returns all salespeople, we filter by division_id on frontend
    const response = await apiRequest<any[]>("/api/v1/salespeople");
    if (response.success && response.data) {
      // Filter by division_id
      const filteredData = response.data.filter((sp: any) => sp.division_id === divisionId);
      return { success: true, data: filteredData };
    }
    return { success: false, data: [] };
  },
};

// ================== LAPORAN PENJUALAN PRODUK ==================
// TODO: Backend belum implement endpoint laporan-penjualan-produk
export interface LaporanPenjualanProduk {
  id: number;
  tanggalLaporan: string;
  namaSalesperson: string;
  salespersonId: number;
  namaAccount: string;
  productAccountId: number;
  targetKuantitas: number;
  realisasiKuantitas: number;
  keteranganKendala?: string;
  createdByUsername: string;
  createdAt: string;
}

export const laporanPenjualanProdukAPI = {
  create: async (data: any) =>
    apiRequest<LaporanPenjualanProduk>("/api/v1/laporan-penjualan", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: async (id: number, data: any) =>
    apiRequest<LaporanPenjualanProduk>(`/api/v1/laporan-penjualan/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getAll: async () => {
    // Fetch all data with a large limit to get all records
    return apiRequest<LaporanPenjualanProduk[]>("/api/v1/laporan-penjualan?limit=10000");
  },
  getByDateRange: async (params: { tanggal_start: string; tanggal_end: string }) => {
    const queryParams = new URLSearchParams({
      ...params,
      limit: '10000' // Add large limit to get all records
    });
    return apiRequest<LaporanPenjualanProduk[]>(`/api/v1/laporan-penjualan?${queryParams}`);
  },
  filter: async (params: any) =>
    apiRequest<LaporanPenjualanProduk[]>(
      `/api/v1/laporan-penjualan/filter?${new URLSearchParams({ ...params, limit: '10000' })}`
    ),
  delete: async (id: number) =>
    apiRequest(`/api/v1/laporan-penjualan/${id}`, {
      method: "DELETE",
    }),
};

// ✅ Konsolidasi Keuangan API - TODO: Backend belum implement
export interface KonsolidasiKeuanganData {
  tanggal: string;
  perusahaan: string;
  penerimaan: number;
  pengeluaran: number;
  saldoAkhir: number;
  totalTransaksi: number;
}

export const konsolidasiKeuanganAPI = {
  getByDate: async (date: string) => {
    // TODO: Sementara return empty array sampai backend implement
    console.warn("⚠️ konsolidasiKeuanganAPI.getByDate - Backend endpoint belum tersedia");
    return { success: true, data: [] as KonsolidasiKeuanganData[] };
  },
  getByDateRange: async (startDate: string, endDate: string) => {
    console.warn("⚠️ konsolidasiKeuanganAPI.getByDateRange - Backend endpoint belum tersedia");
    return { success: true, data: [] as KonsolidasiKeuanganData[] };
  },
  getByPerusahaan: async (perusahaan: string, date: string) => {
    console.warn("⚠️ konsolidasiKeuanganAPI.getByPerusahaan - Backend endpoint belum tersedia");
    return { success: true, data: [] as KonsolidasiKeuanganData[] };
  },
};

// ✅ Perusahaan API - TODO: Backend belum implement
export const perusahaanAPI = {
  getAll: async () => {
    console.warn("⚠️ perusahaanAPI.getAll - Backend endpoint belum tersedia");
    return { success: true, data: [] };
  },
};

// Health API
export const healthAPI = {
  getStatus: async () => {
    const url = `${BASE_URL}/api/health`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch health status");
    return res.json();
  },
};

// HRD Statistics API
export const hrdAPI = {
  // Get HRD entries dengan filter
  getEntries: async (params: {
    tanggal_dari?: string;
    tanggal_sampai?: string;
    attendance_status?: string;
    shift?: string;
    account_id?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return await apiRequest<any>(`/api/v1/hrd?${queryParams}`, {
      method: "GET",
    });
  },

  // Get HRD statistics (UPDATED - menggunakan endpoint baru)
  getStatistics: async (params: {
    tanggal_dari?: string;
    tanggal_sampai?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.tanggal_dari) queryParams.append('tanggal_dari', params.tanggal_dari);
    if (params.tanggal_sampai) queryParams.append('tanggal_sampai', params.tanggal_sampai);

    return await apiRequest<any>(`/api/v1/hrd/statistics?${queryParams}`, {
      method: "GET",
    });
  },

  getStatisticsWithParams: async (tanggal_dari: string, tanggal_sampai: string) => {
    const params = new URLSearchParams({
      tanggal_dari,
      tanggal_sampai,
    });

    return await apiRequest<any>(`/api/v1/hrd/statistics?${params}`, {
      method: "GET",
    });
  },

  // Get HRD accounts (kategori karyawan)
  getAccounts: async () => {
    return await apiRequest<any>("/api/v1/hrd/accounts", {
      method: "GET",
    });
  },

  // Get summary by date
  getSummaryByDate: async (tanggal: string) => {
    return await apiRequest<any>(`/api/v1/hrd/summary/${tanggal}`, {
      method: "GET",
    });
  },

  // Create HRD entry
  create: async (data: any) => {
    return await apiRequest<any>("/api/v1/hrd", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Create batch HRD entries
  createBatch: async (entries: any[]) => {
    return await apiRequest<any>("/api/v1/hrd/batch", {
      method: "POST",
      body: JSON.stringify(entries),
    });
  },

  // Update HRD entry
  update: async (id: string, data: any) => {
    return await apiRequest<any>(`/api/v1/hrd/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete HRD entry
  delete: async (id: string) => {
    return await apiRequest<any>(`/api/v1/hrd/${id}`, {
      method: "DELETE",
    });
  },
};

// ===== PUBLIC ABSENSI API =====
export const publicAbsensiAPI = {
  updateStatus: async (id: number, hadir: boolean, status: string, setengahHari: boolean = false, tanggal?: string) => {
    try {
      // ✅ Validasi: Pastikan tanggal tidak kosong, jika kosong gunakan hari ini
      let finalTanggal = tanggal || new Date().toISOString().split('T')[0];

      // ✅ Pastikan format tanggal adalah YYYY-MM-DD
      if (finalTanggal && finalTanggal.length > 10) {
        finalTanggal = finalTanggal.split('T')[0]; // Ambil bagian tanggal saja
      }

      // OPSI 1: Coba dengan parameter query tanggal di URL
      const url = `https://sistem-hrd-padud.padudjayaputera.com/api/public-absensi/${id}?tanggal=${finalTanggal}`;

      // OPSI 2: Atau coba dengan payload yang include tanggal
      const payloadWithDate = { hadir, status, setengahHari, tanggal: finalTanggal };

      console.log("🚀 [PUBLIC ABSENSI API] Mengirim data absensi:", {
        karyawanId: id,
        url,
        payloadWithDate,
        tanggalAsli: tanggal,
        tanggalFinal: finalTanggal,
        tanggalHariIni: new Date().toISOString().split('T')[0]
      });

      // Hardcode gunakan PUBLIC_API_URL
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithDate),
      });
      if (!response.ok) {
        let error = "Gagal menyimpan absensi.";
        try {
          const data = await response.json();
          error = data?.error || error;
          console.error("❌ [PUBLIC ABSENSI API] Response error:", { status: response.status, data });
        } catch { }
        return { success: false, error };
      }

      // ✅ Debug: Log response sukses
      const responseData = await response.json();
      console.log("✅ [PUBLIC ABSENSI API] Response sukses:", responseData);

      return { success: true };
    } catch (err: any) {
      console.error("💥 [PUBLIC ABSENSI API] Network error:", err);
      return { success: false, error: "Terjadi kesalahan jaringan." };
    }
  },
};

// ===== PUBLIC KARYAWAN API =====
const PUBLIC_API_URL = "https://sistem-hrd-padud.padudjayaputera.com";

export const publicKaryawanAPI = {
  getAll: async () => {
    const url = `${PUBLIC_API_URL}/api/public-karyawan`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data karyawan publik");
    return res.json();
  },
};

// Get product accounts by division ID
export const getProductAccounts = async (divisionId: number) => {
  const data = await apiRequest<any[]>("/api/v1/accounts");
  return data.filter(account => account.division_id === divisionId);
};

// ===== SETTINGS API =====
export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | number | boolean;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'security' | 'ui' | 'notification';
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsObject {
  [key: string]: string | number | boolean;
}

export const settingsAPI = {
  // Get all settings (filtered by role automatically)
  getAll: async () => {
    return apiRequest<SystemSetting[]>("/api/v1/settings");
  },

  // Get settings as key-value object
  getObject: async () => {
    return apiRequest<SettingsObject>("/api/v1/settings/object");
  },

  // Get single setting by key
  getByKey: async (key: string) => {
    return apiRequest<SystemSetting>(`/api/v1/settings/${key}`);
  },

  // Update setting (SUPER_ADMIN only)
  update: async (key: string, value: string | number | boolean) => {
    return apiRequest<SystemSetting>(`/api/v1/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },

  // Reset setting to default (SUPER_ADMIN only)
  reset: async (key: string) => {
    return apiRequest<SystemSetting>(`/api/v1/settings/${key}/reset`, {
      method: "POST",
    });
  },

  // Export all settings (SUPER_ADMIN only)
  export: async () => {
    return apiRequest<{
      exported_at: string;
      exported_by: string;
      settings: SystemSetting[];
    }>("/api/v1/settings/export");
  },
};
