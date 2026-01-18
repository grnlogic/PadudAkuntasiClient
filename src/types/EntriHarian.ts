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

  piutangType?: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET" | "SALDO_AKHIR_PIUTANG"; // <-- Tambahkan ini jika ingin tracking di FE

  // ✅ Specialized fields for different divisions
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR";
  targetAmount?: number;
  realisasiAmount?: number;
  pemakaianAmount?: number;
  stokAkhir?: number;
  // ✅ NEW: Keuangan saldo akhir
  saldoAkhir?: number;
  // ✅ NEW: Support for both date field formats
  tanggalLaporan?: string;
  tanggal_laporan?: string;

  // ✅ FIXED: Standardized HRD fields
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  absentCount?: number; // Jumlah yang Total Orang
  shift?: "REGULER" | "LEMBUR"; // ✅ BENAR: Sesuai meeting
  keteranganKendala?: string; // Untuk kendala HRD

  // ✅ NEW: Pemasaran Sales fields
  salesUserId?: number;
  returPenjualan?: number;

  // ✅ NEW: Produksi fields
  hasilProduksi?: number;
  barangGagal?: number;
  stockBarangJadi?: number;
  hpBarangJadi?: number;

  // ✅ NEW: Gudang fields for PERSEDIAAN_BAHAN_BAKU - Updated field names
  stokAwal?: number;
  pemakaian?: number;
  kondisiGudang?: string;
}

export interface CreateEntriHarianRequest {
  accountId: number;
  tanggal?: string; // Frontend format (backward compatibility)
  tanggal_laporan?: string; // Backend format (preferred)
  nilai: number;
  description?: string;
  piutangType?: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET" | "SALDO_AKHIR_PIUTANG";

  // ✅ Keuangan fields
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR";
  saldoAkhir?: number;
  // ✅ Pemasaran fields
  targetAmount?: number;
  realisasiAmount?: number;
  // ✅ NEW: Pemasaran Sales fields
  salesUserId?: number;
  returPenjualan?: number;
  // ✅ Produksi fields
  hasilProduksi?: number;
  barangGagal?: number;
  stockBarangJadi?: number;
  hpBarangJadi?: number;
  // ✅ Gudang fields
  pemakaianAmount?: number;
  stokAkhir?: number;
  // ✅ FIXED: Standardized HRD fields (support both camelCase and snake_case)
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  attendance_status?: string; // Backend format
  absentCount?: number;
  absent_count?: number; // Backend format
  shift?: "REGULER" | "LEMBUR";
  keteranganKendala?: string;
  keterangan_kendala?: string; // Backend format
  // ✅ NEW: Gudang fields for PERSEDIAAN_BAHAN_BAKU - Updated field names
  stokAwal?: number;
  pemakaian?: number;
  kondisiGudang?: string;
}
