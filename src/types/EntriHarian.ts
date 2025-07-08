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

  piutangType?: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET"; // <-- Tambahkan ini jika ingin tracking di FE

  // ✅ Specialized fields for different divisions
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR";
  targetAmount?: number;
  realisasiAmount?: number;
  pemakaianAmount?: number;
  stokAkhir?: number;
  // ✅ NEW: Keuangan saldo akhir
  saldoAkhir?: number;

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
  tanggal: string;
  nilai: number;
  description?: string;
  piutangType?: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET";

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
  // ✅ FIXED: Standardized HRD fields
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  absentCount?: number;
  shift?: "REGULER" | "LEMBUR"; // ✅ BENAR: Sesuai meeting
  keteranganKendala?: string;
  // ✅ NEW: Gudang fields for PERSEDIAAN_BAHAN_BAKU - Updated field names
  stokAwal?: number;
  pemakaian?: number;
  kondisiGudang?: string;
}
