// Updated data.ts to use API calls instead of localStorage
import {
  piutangAPI,
  utangAPI,
  laporanPenjualanSalesAPI,
  laporanProduksiAPI,
  laporanGudangAPI,
  accountsAPI,
  divisionsAPI,
  usersAPI,
  entriesAPI,
  notificationAPI,
  perusahaanAPI,
  salespersonAPI,
  laporanPenjualanProdukAPI,
  konsolidasiKeuanganAPI,
  getSalespeople as apiGetSalespeople,
  deleteSalesperson as apiDeleteSalesperson,
  healthAPI,
} from "./api";

// ✅ ADD: Helper function to get token (same as in api.ts)
export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}
import type {
  EntriHarian as ImportedEntriHarian,
  CreateEntriHarianRequest,
} from "@/types/EntriHarian";
import type {
  LaporanPenjualanSales,
  CreateLaporanPenjualanSalesRequest,
  LaporanProduksiHarian,
  CreateLaporanProduksiRequest,
  LaporanGudangHarian,
  CreateLaporanGudangRequest,
} from "./api";
import type { Notification } from "./api";

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

export interface EntriHarian {
  keterangan: string;
  date: string;
  id: string;
  accountId: string;
  tanggal: string;
  nilai: number;
  description?: string;
  createdBy: string;
  createdAt: string;
  // ✅ ADD: Support for specialized fields
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR";
  targetAmount?: number;
  realisasiAmount?: number;
  hppAmount?: number;
  pemakaianAmount?: number;
  stokAkhir?: number;
  // ✅ NEW: Keuangan saldo akhir
  saldoAkhir?: number;
  // ✅ NEW: HRD fields
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  absentCount?: number;
  shift?: "REGULER" | "LEMBUR";
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  role: "SUPER_ADMIN" | "ADMIN_DIVISI";
  division?: {
    id: string;
    name: string;
  };
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// Backend Account interface untuk type safety
interface BackendAccount {
  id: number;
  account_code: string;
  account_name: string;
  value_type: "NOMINAL" | "KUANTITAS";
  // ✅ Backend can return either nested division object OR flat division_id/division_name
  division?: {
    id: number;
    name: string;
  };
  division_id?: number;
  division_name?: string;
  perusahaan_id?: number;
  created_at?: string;
}

// Backend Division interface untuk type safety
interface BackendDivision {
  id: number;
  name: string;
}

// Helper function untuk transform backend account ke frontend format
const transformAccountFromBackend = (
  backendAccount: BackendAccount
): Account => {
  if (!backendAccount) {
    throw new Error("Backend account data is null or undefined");
  }

  return {
    id: (backendAccount.id || 0).toString(),
    accountCode: backendAccount.account_code || "",
    accountName: backendAccount.account_name || "",
    valueType: backendAccount.value_type || "NOMINAL",
    division: {
      // ✅ FIX: Backend returns flat division_id and division_name, not nested division object
      id: (backendAccount.division_id || backendAccount.division?.id || 0).toString(),
      name: backendAccount.division_name || backendAccount.division?.name || "Unknown Division",
    },
    perusahaanId: backendAccount.perusahaan_id || null,
    perusahaan_id: backendAccount.perusahaan_id || null,
    status: "active",
    createdBy: "system",
    createdAt: backendAccount.created_at || new Date().toISOString(),
  };
};

// Helper function untuk transform backend division ke frontend format
const transformDivisionFromBackend = (
  backendDivision: BackendDivision
): Division => {
  if (!backendDivision) {
    throw new Error("Backend division data is null or undefined");
  }

  return {
    id: (backendDivision.id || 0).toString(),
    name: backendDivision.name || "Unknown Division",
    description: "",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
};

// Divisions CRUD - now using API
export const getDivisions = async (): Promise<Division[]> => {
  try {
    const response = await divisionsAPI.getAll();
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data
        .filter((division: BackendDivision) => division && division.id)
        .map((division: BackendDivision) =>
          transformDivisionFromBackend(division)
        );
    }
    throw new Error(response.error || "Gagal mengambil data divisi");
  } catch (error) {
    throw error;
  }
};

export const getDivisionById = async (id: string): Promise<Division | null> => {
  try {
    const divisions = await getDivisions();
    return divisions.find((d) => d.id === id) || null;
  } catch (error) {
    throw error;
  }
};

// Accounts CRUD - now using API
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const response = await accountsAPI.getAll();
    if (response.success && response.data && Array.isArray(response.data)) {
      const accounts = response.data.map((account: any) => {
        if (account.accountCode && account.accountName) {
          return {
            id: account.id?.toString() || "",
            accountCode: account.accountCode || "",
            accountName: account.accountName || "",
            valueType: account.valueType as "NOMINAL" | "KUANTITAS",
            division: {
              id: account.division?.id?.toString() || "",
              name: account.division?.name || "Unknown Division",
            },
            status: account.status || ("active" as const),
            createdBy: account.createdBy || "system",
            createdAt: account.createdAt || new Date().toISOString(),
          };
        }
        return transformAccountFromBackend(account);
      });
      return accounts;
    }
    throw new Error(response.error || "Gagal mengambil data akun");
  } catch (error) {
    throw error;
  }
};

export const getAccountsByDivision = async (
  divisionId: string
): Promise<Account[]> => {
  try {
    const response = await accountsAPI.getByDivision(divisionId);

    if (response.success && response.data && Array.isArray(response.data)) {
      // ✅ FIX: Langsung transform semua account dari backend format (snake_case) ke frontend format (camelCase)
      const accounts = response.data
        .filter((account: any) => account && account.id) // Filter null/undefined
        .map((account: any) => transformAccountFromBackend(account));



      return accounts;
    }
    return [];
  } catch (error) {
    throw error;
  }
};

export const saveAccount = async (
  account: Omit<Account, "id" | "createdAt">
): Promise<Account> => {
  try {
    const accountData = {
      accountCode: account.accountCode,
      accountName: account.accountName,
      valueType: account.valueType,
      division: {
        id: Number(account.division.id),
        name: account.division.name,
      },
      status: account.status || "active",
      createdBy: account.createdBy,
    };

    const response = await accountsAPI.create(accountData);

    if (!response.success) {
      throw new Error(
        response.error || response.message || "Failed to create account"
      );
    }

    return response.data!;
  } catch (error: any) {
    throw error;
  }
};

export const updateAccount = async (
  id: string,
  updates: Partial<Account>
): Promise<Account | null> => {
  const response = await accountsAPI.update(id, updates);
  return response.success ? transformAccountFromBackend(response.data!) : null;
};

export const deleteAccount = async (id: string): Promise<boolean> => {
  const response = await accountsAPI.delete(id);
  return response.success;
};

// Generate account code (can be moved to backend later)
export const generateAccountCode = (type: string): string => {
  const typeToPrefix: { [key: string]: string } = {
    NOMINAL: "1",
    KUANTITAS: "3",
    Kas: "1",
    Piutang: "1",
    Persediaan: "3",
    Hutang: "1",
    Modal: "1",
    Pendapatan: "2",
    Beban: "1",
  };

  const prefix = typeToPrefix[type] || "1";
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
};

//piutang GET

export async function getPiutangTransaksi(params?: any) {
  const response = await piutangAPI.getAll(params);
  if (!response.success) throw new Error("Failed to fetch piutang");
  return response.data;
}

// ✅ NEW: Utang GET
export async function getUtangTransaksi(params?: any) {
  const response = await utangAPI.getAll(params);
  if (!response.success) throw new Error("Failed to fetch utang");
  return response.data;
}

// Entri Harian CRUD - now using API with fallback
export const getEntriHarian = async (): Promise<EntriHarian[]> => {
  try {
    const response = await entriesAPI.getAll();

    if (response.success && response.data && Array.isArray(response.data)) {
      const mappedEntries = response.data.map((entry: any) => {
        // ✅ FIXED: Proper mapping for keuangan division
        let transactionType = "";
        let nilai = Number(entry.nilai || 0);

        // ✅ PRIORITIZE: transaction_type (backend format) over transactionType
        if (entry.transaction_type) {
          transactionType = entry.transaction_type;
        } else if (entry.transactionType) {
          transactionType = entry.transactionType;
        } else {
          // Fallback logic for old format
          const penerimaan = Number(entry.penerimaan || 0);
          const pengeluaran = Number(entry.pengeluaran || 0);

          if (penerimaan > 0) {
            transactionType = "PENERIMAAN";
            nilai = penerimaan;
          } else if (pengeluaran > 0) {
            transactionType = "PENGELUARAN";
            nilai = pengeluaran;
          } else {
            transactionType = nilai >= 0 ? "PENERIMAAN" : "PENGELUARAN";
          }
        }

        const mappedEntry = {
          id: entry.id?.toString() || "",
          accountId:
            entry.account?.id?.toString() || entry.account_id?.toString() || entry.accountId?.toString() || "",
          date: entry.tanggalLaporan || entry.tanggal_laporan || entry.date || "",
          tanggal: entry.tanggalLaporan || entry.tanggal_laporan || entry.date || "",
          nilai: nilai,
          description: entry.description || entry.keterangan || "",
          keterangan: entry.keterangan || entry.description || "",
          createdBy: entry.username || entry.user?.username || entry.createdBy || "system",
          createdAt: entry.created_at || entry.createdAt || new Date().toISOString(),
          transactionType: transactionType,

          // ✅ FIXED: Map pemasaran fields with multiple fallbacks
          ...(entry.targetAmount && {
            targetAmount: Number(entry.targetAmount),
          }),
          ...(entry.target_amount && {
            targetAmount: Number(entry.target_amount),
          }),
          ...(entry.realisasiAmount && {
            realisasiAmount: Number(entry.realisasiAmount),
          }),
          ...(entry.realisasi_amount && {
            realisasiAmount: Number(entry.realisasi_amount),
          }),

          // ✅ Map other specialized fields
          ...(entry.hppAmount && { hppAmount: Number(entry.hppAmount) }),
          ...(entry.hpp_amount && { hppAmount: Number(entry.hpp_amount) }),
          ...(entry.pemakaianAmount && {
            pemakaianAmount: Number(entry.pemakaianAmount),
          }),
          ...(entry.pemakaian_amount && {
            pemakaianAmount: Number(entry.pemakaian_amount),
          }),
          ...(entry.stokAkhir && { stokAkhir: Number(entry.stokAkhir) }),
          ...(entry.stok_akhir && { stokAkhir: Number(entry.stok_akhir) }),
          // ✅ NEW: Map saldo akhir fields
          ...(entry.saldoAkhir !== undefined && {
            saldoAkhir: Number(entry.saldoAkhir),
          }),
          ...(entry.saldo_akhir !== undefined && {
            saldoAkhir: Number(entry.saldo_akhir),
          }),

          // ✅ NEW: Map HRD fields
          ...(entry.attendanceStatus && {
            attendanceStatus: entry.attendanceStatus,
          }),
          ...(entry.attendance_status && {
            attendanceStatus: entry.attendance_status,
          }),
          ...(entry.absentCount !== undefined && {
            absentCount: Number(entry.absentCount),
          }),
          ...(entry.absent_count !== undefined && {
            absentCount: Number(entry.absent_count),
          }),
          ...(entry.shift && {
            shift: entry.shift,
          }),
          ...(entry.keterangan_kendala && {
            keteranganKendala: entry.keterangan_kendala,
          }),
          ...(entry.keteranganKendala && {
            keteranganKendala: entry.keteranganKendala,
          }),

          // ✅ Map account details (untuk HRD dan divisi lain)
          ...(entry.account_name && {
            accountName: entry.account_name,
          }),
          ...(entry.accountName && {
            accountName: entry.accountName,
          }),
          ...(entry.account_code && {
            accountCode: entry.account_code,
          }),
          ...(entry.accountCode && {
            accountCode: entry.accountCode,
          }),
        };

        return mappedEntry;
      });

      return mappedEntries;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const getEntriHarianByDate = async (
  tanggal: string,
  perusahaanId?: number | null
): Promise<EntriHarian[]> => {
  try {
    // ✅ BETTER: Use the existing API pattern instead of direct fetch
    const response = await entriesAPI.getAll({
      date: tanggal,
      perusahaan_id: perusahaanId
    });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch entries by date");
    }

    const data = response.data;

    // ✅ FIXED: Enhanced transformation with robust HRD field mapping
    const transformEntryFromBackend = (entry: any): EntriHarian => {
      // ✅ FIXED: Better accountId mapping
      const accountId =
        entry.account?.id?.toString() ||
        entry.accountId?.toString() ||
        entry.account_id?.toString() ||
        "";

      // ✅ FIXED: Better date mapping
      const dateValue =
        entry.tanggalLaporan ||
        entry.tanggal_laporan ||
        entry.date ||
        entry.tanggal ||
        entry.createdAt ||
        "";

      // ✅ FIXED: Untuk HRD, gunakan absentCount sebagai nilai utama
      const nilai =
        entry.divisionType === "HRD"
          ? Number(entry.absentCount || entry.absent_count || 0)
          : Number(entry.nilai) || 0;

      return {
        id: entry.id?.toString() || Date.now().toString(),
        accountId: accountId, // ✅ FIXED
        tanggal: dateValue, // ✅ FIXED
        date: dateValue, // ✅ FIXED
        nilai: nilai,
        description: entry.description || entry.keterangan || "",
        createdBy:
          entry.user?.username ||
          entry.createdBy ||
          entry.created_by ||
          "system",
        createdAt:
          entry.createdAt || entry.created_at || new Date().toISOString(),
        keterangan: entry.description || entry.keterangan || "",

        // ✅ FIXED: Enhanced transaction type mapping
        ...(entry.transactionType && {
          transactionType: entry.transactionType,
        }),
        ...(entry.transaction_type && {
          transactionType: entry.transaction_type,
        }),

        // ✅ ADD: HRD field mapping with both camelCase and snake_case support
        ...(entry.attendanceStatus && {
          attendanceStatus: entry.attendanceStatus,
        }),
        ...(entry.attendance_status && {
          attendanceStatus: entry.attendance_status,
        }),
        ...(entry.absentCount !== undefined && {
          absentCount: Number(entry.absentCount),
        }),
        ...(entry.absent_count !== undefined && {
          absentCount: Number(entry.absent_count),
        }),
        ...(entry.shift && {
          shift: entry.shift, // Should be "REGULER" | "LEMBUR"
        }),
        ...(entry.keteranganKendala && {
          keteranganKendala: entry.keteranganKendala,
        }),
        ...(entry.keterangan_kendala && {
          keteranganKendala: entry.keterangan_kendala,
        }),

        // ✅ ADD: Other specialized fields mapping
        ...(entry.targetAmount !== undefined && {
          targetAmount: Number(entry.targetAmount),
        }),
        ...(entry.target_amount !== undefined && {
          targetAmount: Number(entry.target_amount),
        }),
        ...(entry.realisasiAmount !== undefined && {
          realisasiAmount: Number(entry.realisasiAmount),
        }),
        ...(entry.realisasi_amount !== undefined && {
          realisasiAmount: Number(entry.realisasi_amount),
        }),
        ...(entry.saldoAkhir !== undefined && {
          saldoAkhir: Number(entry.saldoAkhir),
        }),
        ...(entry.saldo_akhir !== undefined && {
          saldoAkhir: Number(entry.saldo_akhir),
        }),
        ...(entry.salesUserId !== undefined && {
          salesUserId: Number(entry.salesUserId),
        }),
        ...(entry.sales_user_id !== undefined && {
          salesUserId: Number(entry.sales_user_id),
        }),
        ...(entry.returPenjualan !== undefined && {
          returPenjualan: Number(entry.returPenjualan),
        }),
        ...(entry.retur_penjualan !== undefined && {
          returPenjualan: Number(entry.retur_penjualan),
        }),
        ...(entry.hasilProduksi !== undefined && {
          hasilProduksi: Number(entry.hasilProduksi),
        }),
        ...(entry.hasil_produksi !== undefined && {
          hasilProduksi: Number(entry.hasil_produksi),
        }),
        ...(entry.barangGagal !== undefined && {
          barangGagal: Number(entry.barangGagal),
        }),
        ...(entry.barang_gagal !== undefined && {
          barangGagal: Number(entry.barang_gagal),
        }),
        ...(entry.stockBarangJadi !== undefined && {
          stockBarangJadi: Number(entry.stockBarangJadi),
        }),
        ...(entry.stock_barang_jadi !== undefined && {
          stockBarangJadi: Number(entry.stock_barang_jadi),
        }),
        ...(entry.hpBarangJadi !== undefined && {
          hpBarangJadi: Number(entry.hpBarangJadi),
        }),
        ...(entry.hp_barang_jadi !== undefined && {
          hpBarangJadi: Number(entry.hp_barang_jadi),
        }),
        ...(entry.stokAwal !== undefined && {
          stokAwal: Number(entry.stokAwal),
        }),
        ...(entry.stok_awal !== undefined && {
          stokAwal: Number(entry.stok_awal),
        }),
        ...(entry.pemakaian !== undefined && {
          pemakaian: Number(entry.pemakaian),
        }),
        ...(entry.kondisiGudang && {
          kondisiGudang: entry.kondisiGudang,
        }),
        ...(entry.kondisi_gudang && {
          kondisiGudang: entry.kondisi_gudang,
        }),
      };
    };

    // ✅ FIXED: Apply transformation to all entries
    const transformedEntries = (Array.isArray(data) ? data : []).map(
      transformEntryFromBackend
    );

    return transformedEntries;
  } catch (error) {
    throw new Error("Gagal memuat entri harian");
  }
};

export const saveEntriHarianBatch = async (
  entries: CreateEntriHarianRequest[]
): Promise<EntriHarian[]> => {
  // ✅ FIXED: Filter out piutang entries - they should go to piutang API
  const validEntries = entries.filter(
    (e) => !e.piutangType // Remove piutang entries from regular batch
  );

  if (validEntries.length === 0) {
    return [];
  }

  try {
    const response = await entriesAPI.createBatch(validEntries);

    if (response.success && response.data) {
      const backendEntries = Array.isArray(response.data)
        ? response.data
        : [response.data];

      const mappedEntries = backendEntries.map((entry: any) => ({
        id: entry.id?.toString() || "",
        accountId:
          entry.account?.id?.toString() || entry.accountId?.toString() || "",
        date: entry.tanggalLaporan || entry.date || "",
        tanggal: entry.tanggalLaporan || entry.date || "",
        nilai: Number(entry.nilai) || 0,
        description: entry.description || "",
        keterangan: entry.keterangan || entry.description || "",
        createdBy: entry.user?.username || entry.createdBy || "system",
        createdAt: entry.createdAt || new Date().toISOString(),
      }));

      return mappedEntries;
    }

    throw new Error(
      response.error || response.message || "Failed to save entries"
    );
  } catch (error: any) {
    throw error;
  }
};
export const deleteEntriHarian = async (id: string): Promise<boolean> => {
  try {
    const response = await entriesAPI.delete(id);
    return response.success;
  } catch (error) {
    console.error("Delete entry error:", error);
    throw error; // Throw error instead of returning true
  }
};

export const getUsers = async (divisionId?: string): Promise<AppUser[]> => {
  try {
    const response = await usersAPI.getAll();
    if (response.success && response.data) {
      let users = response.data;
      if (divisionId) {
        users = users.filter(
          (user: AppUser) => user.division?.id === divisionId
        );
      }
      return users;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const saveUser = async (
  user: Omit<AppUser, "id" | "createdAt">
): Promise<AppUser> => {
  // Ensure divisionId is included in the payload
  const payload = {
    ...user,
    divisionId: user.division?.id || null,
  };
  const response = await usersAPI.create(payload);
  if (!response.success) {
    throw new Error(response.error || "Failed to create user");
  }
  return response.data!;
};

export const saveUserWithDTO = async (createRequest: {
  username: string;
  password: string;
  role: string;
  divisionId: number | null;
}): Promise<AppUser> => {
  // Ensure divisionId is present and valid
  if (!createRequest.divisionId) {
    throw new Error("Division ID must be provided when creating a user");
  }
  const response = await usersAPI.create(createRequest);
  if (!response.success) {
    throw new Error(response.error || "Failed to create user");
  }
  return response.data!;
};

export const updateUser = async (
  id: string,
  updates: Partial<AppUser>
): Promise<AppUser | null> => {
  const response = await usersAPI.update(id, updates);
  return response.success ? response.data! : null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const response = await usersAPI.delete(id);
  return response.success;
};

// ✅ NEW: LaporanPenjualanSales CRUD functions
export const getLaporanPenjualanSales = async (params?: {
  tanggal_start?: string;
  tanggal_end?: string;
}): Promise<LaporanPenjualanSales[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.tanggal_start) queryParams.append('tanggal_start', params.tanggal_start);
    if (params?.tanggal_end) queryParams.append('tanggal_end', params.tanggal_end);

    const response = await laporanPenjualanSalesAPI.get(`/summary?${queryParams}`);

    if (response.data?.success && response.data.data) {
      // Map summary data from backend to match frontend interface
      const mappedData = response.data.data.map((summary: any) => ({
        id: `summary-${summary.salesperson}`, // Generate unique ID for summary
        tanggalLaporan: new Date().toISOString().split('T')[0], // Use current date for summary
        salesperson: summary.salesperson,
        targetAmount: summary.total_target || 0,
        realisasiAmount: summary.total_realisasi || 0,
        returPenjualan: 0, // Not available in summary
        keteranganKendala: `${summary.total_laporan} laporan - Pencapaian: ${summary.pencapaian_persen || 0}%`,
        salesUserId: null,
        createdBy: "system",
        createdAt: new Date().toISOString(),
      }));
      return mappedData;
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching laporan penjualan sales summary:", error);
    return [];
  }
};

export const saveLaporanPenjualanSales = async (
  data: CreateLaporanPenjualanSalesRequest
): Promise<LaporanPenjualanSales> => {
  try {
    const response = await laporanPenjualanSalesAPI.create(data);
    if (!response.success) {
      throw new Error(
        response.error || "Failed to create laporan penjualan sales"
      );
    }
    return response.data!;
  } catch (error: any) {
    throw error;
  }
};

export const deleteLaporanPenjualanSales = async (
  id: number
): Promise<boolean> => {
  try {
    const response = await laporanPenjualanSalesAPI.delete(id);
    return response.success;
  } catch (error) {
    return false;
  }
};

// ✅ NEW: LaporanProduksi CRUD functions
export const getLaporanProduksi = async (): Promise<
  LaporanProduksiHarian[]
> => {
  try {
    const response = await laporanProduksiAPI.getAll();
    if (response.success && response.data) {
      // ✅ FIXED: Mapping dengan field yang konsisten untuk PDF
      const mappedData = response.data.map((laporan: any) => ({
        id: laporan.id,
        tanggalLaporan: laporan.tanggal_laporan || laporan.tanggalLaporan,
        account: laporan.account,
        // ✅ FIXED: Map ke field yang diharapkan PDF
        hasilProduksi: laporan.hasil_produksi ?? laporan.hasilProduksi,
        barangGagal: laporan.barang_gagal ?? laporan.barangGagal,
        stockBarangJadi: laporan.stock_barang_jadi ?? laporan.stockBarangJadi,
        hpBarangJadi: laporan.hp_barang_jadi ?? laporan.hpBarangJadi,
        // ✅ ADD: Map HPP amount untuk PDF
        hppAmount: laporan.hpp_amount ?? laporan.hppAmount,
        keteranganKendala:
          laporan.keterangan_kendala ?? laporan.keteranganKendala,
        createdBy: laporan.created_by ?? laporan.createdBy,
        createdAt: laporan.created_at ?? laporan.createdAt,
      }));
      return mappedData;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const saveLaporanProduksi = async (
  data: CreateLaporanProduksiRequest
): Promise<LaporanProduksiHarian> => {
  try {
    const response = await laporanProduksiAPI.create(data);
    if (!response.success) {
      throw new Error(response.error || "Failed to create laporan produksi");
    }
    return response.data!;
  } catch (error: any) {
    throw error;
  }
};

export const deleteLaporanProduksi = async (id: number): Promise<boolean> => {
  try {
    const response = await laporanProduksiAPI.delete(id);
    return response.success;
  } catch (error) {
    return false;
  }
};

// ✅ NEW: LaporanGudang CRUD functions
export const getLaporanGudang = async (options?: any): Promise<LaporanGudangHarian[]> => {
  try {
    // Default to larger limit if not specified
    const params = { limit: 1000, ...options };
    const response = await laporanGudangAPI.getAll(params);

    if (response.success && response.data) {
      // ✅ FIXED: Handle both direct array and nested data (pagination) structure
      const rawData = Array.isArray(response.data)
        ? response.data
        : (response.data as any).data && Array.isArray((response.data as any).data)
          ? (response.data as any).data
          : [];

      // ✅ FIXED: Backend mengembalikan flat structure (account_id, account_code, dll)
      const mappedData = rawData.map((laporan: any) => ({
        id: laporan.id,
        tanggalLaporan: laporan.tanggal_laporan || laporan.tanggalLaporan,
        // ✅ FIXED: Construct account object from flat fields
        account: {
          id: laporan.account_id || laporan.account?.id,
          division: {
            id: laporan.division_id || laporan.account?.division?.id,
            name: laporan.division_name || laporan.account?.division?.name,
          },
          accountCode: laporan.account_code || laporan.account?.accountCode,
          accountName: laporan.account_name || laporan.account?.accountName,
          valueType: laporan.value_type || laporan.account?.valueType || "NOMINAL",
          perusahaanId: laporan.perusahaan_id || laporan.perusahaanId,
        },
        // ✅ FIXED: Support both camelCase and snake_case field names
        barangMasuk: laporan.barang_masuk ?? laporan.barangMasuk,
        pemakaian: laporan.pemakaian,
        stokAkhir: laporan.stok_akhir ?? laporan.stokAkhir,
        keterangan: laporan.keterangan || laporan.keteranganGudang || laporan.kondisiGudang,
        // ✅ ADD: Map pemakaian amount untuk PDF
        pemakaianAmount: laporan.pemakaian ?? laporan.pemakaianAmount,
        // ✅ FIXED: createdBy from flat structure
        createdBy: {
          id: laporan.created_by_user_id || laporan.createdBy?.id,
          username: laporan.created_by || laporan.createdBy?.username || "system",
          role: laporan.role || laporan.createdBy?.role || "ADMIN_DIVISI",
          division: {
            id: laporan.division_id || laporan.createdBy?.division?.id,
            name: laporan.division_name || laporan.createdBy?.division?.name || "",
          },
        },
        createdAt: laporan.created_at || laporan.createdAt,
      }));

      // console.log("✅ LAPORAN GUDANG MAPPED:", {
      //   count: mappedData.length,
      //   sample: mappedData[0],
      // });

      return mappedData;
    }
    return [];
  } catch (error) {
    console.error("❌ GET LAPORAN GUDANG ERROR:", error);
    return [];
  }
};

export const saveLaporanGudang = async (
  data: CreateLaporanGudangRequest
): Promise<LaporanGudangHarian> => {
  try {
    const response = await laporanGudangAPI.create(data);
    if (!response.success) {
      throw new Error(response.error || "Failed to create laporan gudang");
    }
    return response.data!;
  } catch (error: any) {
    throw error;
  }
};

export const deleteLaporanGudang = async (id: number): Promise<boolean> => {
  try {
    const response = await laporanGudangAPI.delete(id);
    return response.success;
  } catch (error) {
    return false;
  }
};

// ================= NOTIFICATION DATA =================
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await notificationAPI.getAll();
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const markNotificationAsRead = async (id: number): Promise<boolean> => {
  try {
    const response = await notificationAPI.markAsRead(id);
    return response.success;
  } catch (error) {
    return false;
  }
};
// ================== LAPORAN PENJUALAN PRODUK (BARU) ==================

// Helper function untuk transform backend data ke frontend format
const transformLaporanPenjualanProdukFromBackend = (backendData: any) => {
  if (!backendData) return null;

  // ✅ FIXED: Backend menggunakan snake_case, perlu mapping ke camelCase
  const transformed = {
    id: backendData.id,
    tanggalLaporan: backendData.tanggal_laporan || backendData.tanggalLaporan,
    namaSalesperson: backendData.salesperson_nama || backendData.namaSalesperson,
    salespersonId: backendData.salesperson_id || backendData.salespersonId,
    namaAccount: backendData.product_name || backendData.namaAccount,
    productAccountId: backendData.product_account_id || backendData.productAccountId,
    targetKuantitas: backendData.target_kuantitas || backendData.targetKuantitas,
    realisasiKuantitas: backendData.realisasi_kuantitas || backendData.realisasiKuantitas,
    keteranganKendala: backendData.keterangan_kendala || backendData.keteranganKendala,
    createdByUsername: backendData.created_by || backendData.createdByUsername,
    createdAt: backendData.created_at || backendData.createdAt,
  };

  return transformed;
};

export const getLaporanPenjualanProduk = async () => {
  const response = await laporanPenjualanProdukAPI.getAll();

  if (response.success && response.data && Array.isArray(response.data)) {
    // Transform setiap item dari backend format ke frontend format
    const transformedData = response.data
      .map(transformLaporanPenjualanProdukFromBackend)
      .filter(Boolean);
    return transformedData;
  }
  return [];
};

export const getLaporanPenjualanProdukByDate = async (date: string) => {
  const params = {
    tanggal_start: date,
    tanggal_end: date
  };
  const response = await laporanPenjualanProdukAPI.getByDateRange(params);

  if (response.success && response.data && Array.isArray(response.data)) {
    console.log(`🔍 [DEBUG] Raw backend data for ${date}:`, response.data.length, 'records');
    // Transform setiap item dari backend format ke frontend format
    const transformedData = response.data
      .map(transformLaporanPenjualanProdukFromBackend)
      .filter(Boolean);
    console.log(`✅ [DEBUG] Transformed data for ${date}:`, transformedData.length, 'records');
    return transformedData;
  }
  return [];
};

export const saveLaporanPenjualanProduk = async (data: any) => {
  const response = await laporanPenjualanProdukAPI.create(data);
  if (!response.success)
    throw new Error(response.error || "Gagal simpan laporan penjualan produk");
  return response.data;
};

// ✅ ADD: Create laporan penjualan produk (alias for save)
export const createLaporanPenjualanProduk = async (data: any) => {
  return await saveLaporanPenjualanProduk(data);
};

// ✅ ADD: Update laporan penjualan produk
export const updateLaporanPenjualanProduk = async (id: string, data: any) => {
  const response = await laporanPenjualanProdukAPI.update(parseInt(id), data);
  if (!response.success)
    throw new Error(response.error || "Gagal update laporan penjualan produk");
  return response.data;
};

export const deleteLaporanPenjualanProduk = async (
  id: string | number
): Promise<boolean> => {
  try {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const response = await laporanPenjualanProdukAPI.delete(numId);
    return response.success;
  } catch (error) {
    console.error("❌ Error deleting laporan penjualan produk:", error);
    throw error;
  }
};

export const getSalespeopleByDivision = async (divisionId: number) => {
  console.log(
    divisionId
  );

  const response = await salespersonAPI.getByDivision(divisionId);


  if (response.success && response.data) return response.data;
  return [];
};

export const getProductAccounts = async (divisionId?: number) => {
  // Always use division-specific endpoint if divisionId is provided
  if (divisionId) {
    const response = await accountsAPI.getByDivision(divisionId.toString());
    if (response.success && response.data) {
      return response.data;
    }
  } else {
    console.warn("⚠️ No divisionId provided, cannot fetch products");
  }
  return [];
};

export const getSalespeople = apiGetSalespeople;

// ✅ NEW: Delete salesperson function
export const deleteSalesperson = async (id: number): Promise<boolean> => {
  try {
    return await apiDeleteSalesperson(id);
  } catch (error) {
    console.error("❌ Error deleting salesperson:", error);
    throw error;
  }
};

// ================== KONSOLIDASI KEUANGAN ==================
export interface KonsolidasiKeuanganData {
  tanggal: string;
  perusahaan: string;
  penerimaan: number;
  pengeluaran: number;
  saldoAkhir: number;
  totalTransaksi: number;
}

export const getKonsolidasiKeuanganByDate = async (
  date: string
): Promise<KonsolidasiKeuanganData[]> => {
  try {
    const response = await konsolidasiKeuanganAPI.getByDate(date);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching konsolidasi keuangan:", error);
    return [];
  }
};

export const getKonsolidasiKeuanganByDateRange = async (
  startDate: string,
  endDate: string
): Promise<KonsolidasiKeuanganData[]> => {
  try {
    const response = await konsolidasiKeuanganAPI.getByDateRange(
      startDate,
      endDate
    );
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error(
      "❌ Error fetching konsolidasi keuangan by date range:",
      error
    );
    return [];
  }
};

export const getKonsolidasiKeuanganByPerusahaan = async (
  perusahaan: string,
  date: string
): Promise<KonsolidasiKeuanganData[]> => {
  try {
    const response = await konsolidasiKeuanganAPI.getByPerusahaan(
      perusahaan,
      date
    );
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error(
      "❌ Error fetching konsolidasi keuangan by perusahaan:",
      error
    );
    return [];
  }
};
