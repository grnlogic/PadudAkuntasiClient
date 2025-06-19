// Updated data.ts to use API calls instead of localStorage
import { divisionsAPI, accountsAPI, entriesAPI, usersAPI } from "./api"

// Keep interfaces for type safety
export interface Account {
  id: string
  accountCode: string
  accountName: string
  valueType: "NOMINAL" | "KUANTITAS"
  division: {
    id: string
    name: string
  }
  status: "active" | "inactive"
  createdBy: string
  createdAt: string
}

export interface EntriHarian {
  date: string
  id: string
  accountId: string
  tanggal: string
  nilai: number
  description?: string
  createdBy: string
  createdAt: string
}

export interface AppUser {
  id: string
  username: string
  password?: string
  role: "SUPER_ADMIN" | "ADMIN_DIVISI"
  division?: {
    id: string
    name: string
  }
  status: "active" | "inactive"
  lastLogin?: string
  createdAt: string
}

export interface Division {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

// Divisions CRUD - now using API
export const getDivisions = async (): Promise<Division[]> => {
  const response = await divisionsAPI.getAll()
  return response.success ? response.data || [] : []
}

export const getDivisionById = async (id: string): Promise<Division | null> => {
  const response = await divisionsAPI.getAll()
  if (!response.success || !response.data) return null
  const division = response.data.find((div: Division) => div.id === id)
  return division || null
}

// Accounts CRUD - now using API
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const response = await accountsAPI.getAll()
    console.log("getAccounts response:", response) // Debug log
    
    if (response.success && response.data) {
      // Handle jika response.data adalah array
      if (Array.isArray(response.data)) {
        return response.data
      }
      // Handle jika response.data wrapped dalam property lain
      if (typeof response.data === 'object' && 'content' in response.data && Array.isArray((response.data as any).content)) {
        return (response.data as any).content
      }
    }
    
    console.warn("getAccounts: No data or unexpected format", response)
    return []
  } catch (error) {
    console.error("getAccounts error:", error)
    return []
  }
}

export const getAccountsByDivision = async (divisionId: string): Promise<Account[]> => {
  try {
    const response = await accountsAPI.getByDivision(divisionId)
    console.log("getAccountsByDivision response:", response) // Debug log
    
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        return response.data
      }
      if (typeof response.data === 'object' && 'content' in response.data && Array.isArray((response.data as any).content)) {
        return (response.data as any).content
      }
    }
    
    return []
  } catch (error) {
    console.error("getAccountsByDivision error:", error)
    return []
  }
}

export const saveAccount = async (account: Omit<Account, "id" | "createdAt">): Promise<Account> => {
  const response = await accountsAPI.create(account)
  if (!response.success) {
    throw new Error(response.error || "Failed to create account")
  }
  return response.data!
}

export const updateAccount = async (id: string, updates: Partial<Account>): Promise<Account | null> => {
  const response = await accountsAPI.update(id, updates)
  return response.success ? response.data || null : null
}

export const deleteAccount = async (id: string): Promise<boolean> => {
  const response = await accountsAPI.delete(id)
  return response.success
}

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
  }

  const prefix = typeToPrefix[type] || "1"
  const randomSuffix = Math.floor(Math.random() * 999) + 1
  return `${prefix}-${randomSuffix.toString().padStart(3, "0")}`
}

// Entri Harian CRUD - now using API
export const getEntriHarian = async (): Promise<EntriHarian[]> => {
  const response = await entriesAPI.getAll()
  return response.success ? response.data || [] : []
}

export const getEntriHarianByDivision = async (divisionId: string): Promise<EntriHarian[]> => {
  const response = await entriesAPI.getByDivision(divisionId)
  return response.success ? response.data || [] : []
}

export const getEntriHarianByDate = async (tanggal: string): Promise<EntriHarian[]> => {
  const response = await entriesAPI.getByDate(tanggal)
  return response.success ? response.data || [] : []
}

export const saveEntriHarianBatch = async (
  entries: Omit<EntriHarian, "id" | "createdAt">[],
): Promise<EntriHarian[]> => {
  const response = await entriesAPI.createBatch(entries)
  if (!response.success) {
    throw new Error(response.error || "Failed to save entries")
  }
  return response.data || []
}

export const updateEntriHarian = async (id: string, updates: Partial<EntriHarian>): Promise<EntriHarian | null> => {
  const response = await entriesAPI.update(id, updates)
  return response.success ? response.data || null : null
}

export const deleteEntriHarian = async (id: string): Promise<boolean> => {
  const response = await entriesAPI.delete(id)
  return response.success
}

// Users CRUD - now using API
export const getUsers = async (): Promise<AppUser[]> => {
  const response = await usersAPI.getAll()
  return response.success ? response.data || [] : []
}

// Update saveUser function untuk menggunakan RegisterRequest format
export const saveUser = async (user: Omit<AppUser, "id" | "createdAt">): Promise<AppUser> => {
  try {
    console.log("=== FRONTEND DEBUG: Original user data ===", user)
    
    // Convert to RegisterRequest format
    const registerRequest = {
      username: user.username,
      password: user.password,
      role: user.role,
      divisionId: user.division ? parseInt(user.division.id) : null
    }
    
    console.log("=== FRONTEND DEBUG: RegisterRequest format ===", {
      ...registerRequest,
      password: registerRequest.password ? "[HIDDEN]" : "NULL"
    })
    
    if (!registerRequest.password) {
      throw new Error("Password is required but was not provided")
    }
    
    const response = await usersAPI.create(registerRequest)
    console.log("Create user response:", response)
    
    if (response.success && response.data) {
      return {
        id: response.data.id.toString(),
        username: response.data.username,
        role: response.data.role,
        division: response.data.division ? {
          id: response.data.division.id.toString(),
          name: response.data.division.name
        } : undefined,
        status: "active",
        createdAt: response.data.createdAt || new Date().toISOString(),
      }
    }
    
    throw new Error(response.error || "Failed to create user")
  } catch (error) {
    console.error("saveUser error:", error)
    throw error
  }
}

export const saveUserWithDTO = async (createRequest: {
  username: string;
  password: string;
  role: string;
  divisionId: number | null;
}): Promise<AppUser> => {
  try {
    console.log("=== FRONTEND DEBUG: DTO Request ===", {
      ...createRequest,
      password: createRequest.password ? "[HIDDEN]" : "NULL"
    });
    
    const response = await usersAPI.create(createRequest);
    console.log("Create user response:", response);
    
    if (response.success && response.data) {
      return {
        id: response.data.id.toString(),
        username: response.data.username,
        role: response.data.role,
        division: response.data.division ? {
          id: response.data.division.id.toString(),
          name: response.data.division.name
        } : undefined,
        status: "active",
        createdAt: response.data.createdAt || new Date().toISOString(),
      };
    }
    
    throw new Error(response.error || "Failed to create user");
  } catch (error) {
    console.error("saveUserWithDTO error:", error);
    throw error;
  }
};

export const updateUser = async (id: string, updates: Partial<AppUser>): Promise<AppUser | null> => {
  const response = await usersAPI.update(id, updates)
  return response.success ? response.data || null : null
}

export const deleteUser = async (id: string): Promise<boolean> => {
  const response = await usersAPI.delete(id)
  return response.success
}

// Backward compatibility exports
export const getJournalEntries = getEntriHarian
export const saveJournalEntry = (entry: any) => saveEntriHarianBatch([entry])
export const deleteJournalEntry = deleteEntriHarian
export type JournalEntry = EntriHarian

// Default divisions list (can be fetched from API)
export const DIVISIONS = ["KEUANGAN & ADMINISTRASI", "PEMASARAN & PENJUALAN", "PRODUKSI", "DISTRIBUSI & GUDANG", "HRD"]
