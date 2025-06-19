// Updated data.ts to use API calls instead of localStorage
import { accountsAPI, divisionsAPI, usersAPI, entriesAPI } from "./api";

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

export interface EntriHarian {
  date: string;
  id: string;
  accountId: string;
  tanggal: string;
  nilai: number;
  description?: string;
  createdBy: string;
  createdAt: string;
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
  division: {
    id: number;
    name: string;
  };
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
      id: (backendAccount.division?.id || 0).toString(),
      name: backendAccount.division?.name || "Unknown Division",
    },
    status: "active",
    createdBy: "system",
    createdAt: backendAccount.created_at || new Date().toISOString(),
  };
};

// Helper function untuk transform backend division ke frontend format
const transformDivisionFromBackend = (
  backendDivision: BackendDivision
): Division => {
  // Safety checks untuk memastikan data tidak undefined/null
  if (!backendDivision) {
    throw new Error("Backend division data is null or undefined");
  }

  return {
    id: (backendDivision.id || 0).toString(), // Convert Integer ke String
    name: backendDivision.name || "Unknown Division", // FIX: gunakan field yang benar
    description: "", // Default value
    isActive: true, // Default value
    createdAt: new Date().toISOString(), // Default value
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
    return [];
  } catch (error) {
    return [];
  }
};

export const getDivisionById = async (id: string): Promise<Division | null> => {
  try {
    const divisions = await getDivisions();
    return divisions.find((d) => d.id === id) || null;
  } catch (error) {
    return null;
  }
};

// Accounts CRUD - now using API
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const response = await accountsAPI.getAll();

    if (response.success && response.data && Array.isArray(response.data)) {
      const firstItem = response.data[0];
      if (
        firstItem &&
        "accountCode" in firstItem &&
        "accountName" in firstItem
      ) {
        // Data already in correct format
        const accounts = response.data.map((account: any) => ({
          id: account.id?.toString() || "",
          accountCode: account.accountCode || "",
          accountName: account.accountName || "",
          valueType: account.valueType as "NOMINAL" | "KUANTITAS",
          division: {
            id: account.division?.id?.toString() || "",
            name: account.division?.name || "Unknown Division",
          },
          status: "active" as const,
          createdBy: "system",
          createdAt: account.createdAt || new Date().toISOString(),
        }));

        return accounts;
      }

      // Transform if needed
      const accounts = response.data.map((account: any) => {
        return transformAccountFromBackend(account);
      });

      return accounts;
    }

    return [];
  } catch (error) {
    return [];
  }
};

export const getAccountsByDivision = async (
  divisionId: string
): Promise<Account[]> => {
  try {
    const response = await accountsAPI.getByDivision(divisionId);
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data
        .filter((account: BackendAccount) => account && account.id)
        .map((account: BackendAccount) => transformAccountFromBackend(account));
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const saveAccount = async (
  account: Omit<Account, "id" | "createdAt">
): Promise<Account> => {
  const response = await accountsAPI.create(account);
  if (!response.success) {
    throw new Error(response.error || "Failed to create account");
  }
  return transformAccountFromBackend(response.data!);
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
  // This will be replaced by backend logic
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

// Entri Harian CRUD - now using API
export const getEntriHarian = async (): Promise<EntriHarian[]> => {
  try {
    const response = await entriesAPI.getAll();
    return response.success && response.data ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const getEntriHarianByDivision = async (
  divisionId: string
): Promise<EntriHarian[]> => {
  try {
    const response = await entriesAPI.getByDivision(divisionId);
    return response.success && response.data ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const getEntriHarianByDate = async (
  tanggal: string
): Promise<EntriHarian[]> => {
  try {
    const response = await entriesAPI.getByDate(tanggal);
    return response.success && response.data ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const saveEntriHarianBatch = async (
  entries: Omit<EntriHarian, "id" | "createdAt">[]
): Promise<EntriHarian[]> => {
  const response = await entriesAPI.createBatch(entries);
  if (!response.success) {
    throw new Error(response.error || "Failed to create entries");
  }
  return response.data || [];
};

export const updateEntriHarian = async (
  id: string,
  updates: Partial<EntriHarian>
): Promise<EntriHarian | null> => {
  const response = await entriesAPI.update(id, updates);
  return response.success ? response.data! : null;
};

export const deleteEntriHarian = async (id: string): Promise<boolean> => {
  const response = await entriesAPI.delete(id);
  return response.success;
};

// Users CRUD - now using API
export const getUsers = async (): Promise<AppUser[]> => {
  try {
    const response = await usersAPI.getAll();
    return response.success && response.data ? response.data : [];
  } catch (error) {
    return [];
  }
};

// Update saveUser function untuk menggunakan RegisterRequest format
export const saveUser = async (
  user: Omit<AppUser, "id" | "createdAt">
): Promise<AppUser> => {
  const response = await usersAPI.create(user);
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

// Backward compatibility exports
export const getJournalEntries = getEntriHarian;
export const saveJournalEntry = (entry: any) => saveEntriHarianBatch([entry]);
export const deleteJournalEntry = deleteEntriHarian;
export type JournalEntry = EntriHarian;

// Default divisions list (can be fetched from API)
export const DIVISIONS = [
  "KEUANGAN & ADMINISTRASI",
  "PEMASARAN & PENJUALAN",
  "PRODUKSI",
  "DISTRIBUSI & GUDANG",
  "HRD",
];
