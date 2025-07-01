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

  // ✅ NEW: HRD fields
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  overtimeHours?: number;
  shift?: "PAGI" | "SIANG" | "MALAM";

  // ✅ NEW: Pemasaran Sales fields
  salesUserId?: number;
  returPenjualan?: number;
  keteranganKendala?: string;

  // ✅ NEW: Produksi fields
  hasilProduksi?: number;
  barangGagal?: number;
  stockBarangJadi?: number;
  hpBarangJadi?: number;

  // ✅ NEW: Gudang fields for BLENDING - Updated field names
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
  keteranganKendala?: string;
  // ✅ Produksi fields
  hasilProduksi?: number;
  barangGagal?: number;
  stockBarangJadi?: number;
  hpBarangJadi?: number;
  // ✅ Gudang fields
  pemakaianAmount?: number;
  stokAkhir?: number;
  // ✅ HRD fields
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN";
  absentCount?: number;
  shift?: "REGULER" | "LEMBUR";
  // ✅ NEW: Gudang fields for BLENDING - Updated field names
  stokAwal?: number;
  pemakaian?: number;
  kondisiGudang?: string;
}
