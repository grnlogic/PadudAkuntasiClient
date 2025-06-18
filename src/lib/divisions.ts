import type { Division } from "./data";

const DIVISIONS_KEY = "divisions";

// Default divisions sesuai spesifikasi
const defaultDivisions: Division[] = [
  {
    id: "div-1",
    name: "KEUANGAN & ADMINISTRASI",
    description: "Divisi pengelolaan keuangan dan administrasi",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "div-2",
    name: "PEMASARAN & PENJUALAN",
    description: "Divisi pemasaran dan penjualan produk",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "div-3",
    name: "PRODUKSI",
    description: "Divisi produksi dan manufaktur",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "div-4",
    name: "DISTRIBUSI & GUDANG",
    description: "Divisi distribusi dan pengelolaan gudang",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "div-5",
    name: "HRD",
    description: "Divisi sumber daya manusia",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// CRUD Operations untuk Divisions
export const getDivisions = (): Division[] => {
  if (typeof window === "undefined") return defaultDivisions;
  const stored = localStorage.getItem(DIVISIONS_KEY);
  if (!stored) {
    localStorage.setItem(DIVISIONS_KEY, JSON.stringify(defaultDivisions));
    return defaultDivisions;
  }
  return JSON.parse(stored);
};

export const getDivisionById = (id: string): Division | null => {
  const divisions = getDivisions();
  return divisions.find((d) => d.id === id) || null;
};

export const saveDivision = (
  division: Omit<Division, "id" | "createdAt">
): Division => {
  const divisions = getDivisions();
  const newDivision: Division = {
    ...division,
    id: `div-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  divisions.push(newDivision);
  localStorage.setItem(DIVISIONS_KEY, JSON.stringify(divisions));
  return newDivision;
};

export const updateDivision = (
  id: string,
  updates: Partial<Division>
): Division | null => {
  const divisions = getDivisions();
  const index = divisions.findIndex((d) => d.id === id);
  if (index === -1) return null;

  divisions[index] = { ...divisions[index], ...updates };
  localStorage.setItem(DIVISIONS_KEY, JSON.stringify(divisions));
  return divisions[index];
};
