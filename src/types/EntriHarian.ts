export interface EntriHarian {
  id: string;
  accountId: string;
  date: string;
  tanggal: string;
  nilai: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

// ✅ UPDATE: Add specialized division fields
export interface CreateEntriHarianRequest {
  accountId: number;
  tanggal: string;
  nilai: number;
  description: string;

  // ✅ NEW: Fields for division-specific data
  transactionType?: "PENERIMAAN" | "PENGELUARAN"; // Keuangan
  targetAmount?: number; // Pemasaran
  realisasiAmount?: number; // Pemasaran
  hppAmount?: number; // Produksi
  pemakaianAmount?: number; // Gudang
  stokAkhir?: number; // Gudang
}
