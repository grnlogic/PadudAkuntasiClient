// EntriHarian types with specialized division fields
export interface EntriHarian {
  id: string;
  accountId: string;
  tanggal: string;
  date: string;
  nilai: number;
  description?: string;
  createdBy: string;
  createdAt: string;

  // ✅ Specialized fields for different divisions
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
  overtimeHours?: number;
  shift?: "PAGI" | "SIANG" | "MALAM";
}

export interface CreateEntriHarianRequest {
  accountId: number;
  tanggal: string;
  nilai: number;
  description?: string;
  // ✅ Keuangan fields
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR";
  saldoAkhir?: number;
  // ✅ Pemasaran fields
  targetAmount?: number;
  realisasiAmount?: number;
  // ✅ Produksi fields
  hppAmount?: number;
  // ✅ Gudang fields
  pemakaianAmount?: number;
  stokAkhir?: number;
  // ✅ NEW: HRD fields - Fixed enum values
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  absentCount?: number;
  shift?: "REGULER" | "LEMBUR"; // HRD shift values, different from production shift
}
