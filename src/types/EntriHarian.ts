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

  // ✅ Specialized fields
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
