import { divisionsAPI } from "./api";
import type { Division } from "./data";

// Default divisions sesuai spesifikasi
const defaultDivisions: Division[] = [
  {
    id: "1",
    name: "KEUANGAN & ADMINISTRASI",
    description: "Divisi pengelolaan keuangan dan administrasi",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "PEMASARAN & PENJUALAN",
    description: "Divisi pemasaran dan penjualan produk",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "PRODUKSI",
    description: "Divisi produksi dan manufaktur",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "DISTRIBUSI & GUDANG",
    description: "Divisi distribusi dan pengelolaan gudang",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "HRD",
    description: "Divisi sumber daya manusia",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// CRUD Operations untuk Divisions - now using API
export const getDivisions = async (): Promise<Division[]> => {
  try {
    const response = await divisionsAPI.getAll();
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data.map((division: any) => ({
        id: division.id?.toString() || "",
        name: division.name || "",
        description: division.description || "",
        isActive: division.isActive !== false,
        createdAt: division.createdAt || new Date().toISOString(),
      }));
    }
    // Fallback to default divisions if API fails
    return defaultDivisions;
  } catch (error) {
    return defaultDivisions;
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

export const saveDivision = async (
  division: Omit<Division, "id" | "createdAt">
): Promise<Division> => {
  try {
    const response = await divisionsAPI.create(division);
    if (!response.success) {
      throw new Error(response.error || "Failed to create division");
    }
    return response.data!;
  } catch (error) {
    throw error;
  }
};

export const updateDivision = async (
  id: string,
  updates: Partial<Division>
): Promise<Division | null> => {
  try {
    const response = await divisionsAPI.update(id, updates);
    return response.success ? response.data! : null;
  } catch (error) {
    return null;
  }
};

// Backward compatibility for sync version
export const getDivisionsSync = (): Division[] => {
  return defaultDivisions;
};

export const getDivisionByIdSync = (id: string): Division | null => {
  return defaultDivisions.find((d) => d.id === id) || null;
};
