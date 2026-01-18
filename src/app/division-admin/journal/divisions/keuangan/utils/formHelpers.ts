/**
 * Form data interfaces for keuangan transactions
 */
export interface KeuanganFormData {
  accountId: string;
  transactionType: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR";
  nilai: number;
  saldoAkhir?: number;
  keterangan?: string;
  tanggal: string;
}

export interface PiutangFormData {
  tipeTransaksi: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET" | "SALDO_AKHIR_PIUTANG";
  nominal: number;
  keterangan?: string;
  tanggalTransaksi: string;
}

export interface UtangFormData {
  tipeTransaksi: "UTANG_BARU" | "UTANG_DIBAYAR" | "SALDO_AKHIR_UTANG";
  nominal: number;
  keterangan?: string;
  tanggalTransaksi: string;
}

/**
 * Transaction type definitions untuk keuangan
 */
export const TRANSACTION_TYPES = {
  KEUANGAN: [
    { value: "PENERIMAAN", label: "Penerimaan" },
    { value: "PENGELUARAN", label: "Pengeluaran" },
    { value: "SALDO_AKHIR", label: "Saldo Akhir" },
  ],
  PIUTANG: [
    { value: "PIUTANG_BARU", label: "Piutang Baru" },
    { value: "PIUTANG_TERTAGIH", label: "Piutang Tertagih" },
    { value: "PIUTANG_MACET", label: "Piutang Macet" },
    { value: "SALDO_AKHIR_PIUTANG", label: "Saldo Akhir Piutang" },
  ],
  UTANG: [
    { value: "UTANG_BARU", label: "Utang Baru" },
    { value: "UTANG_DIBAYAR", label: "Utang Dibayar" },
    { value: "SALDO_AKHIR_UTANG", label: "Saldo Akhir Utang" },
  ],
} as const;

/**
 * Validasi form data keuangan
 */
export function validateKeuanganForm(data: Partial<KeuanganFormData>): string[] {
  const errors: string[] = [];
  
  if (!data.accountId) {
    errors.push("Account harus dipilih");
  }
  
  if (!data.transactionType) {
    errors.push("Tipe transaksi harus dipilih");
  }
  
  if (!data.nilai || data.nilai <= 0) {
    errors.push("Nilai harus lebih dari 0");
  }
  
  if (!data.tanggal) {
    errors.push("Tanggal harus diisi");
  }
  
  // Validasi khusus untuk SALDO_AKHIR
  if (data.transactionType === "SALDO_AKHIR" && !data.saldoAkhir) {
    errors.push("Saldo akhir harus diisi untuk tipe transaksi Saldo Akhir");
  }
  
  return errors;
}

/**
 * Validasi form data piutang
 */
export function validatePiutangForm(data: Partial<PiutangFormData>): string[] {
  const errors: string[] = [];
  
  if (!data.tipeTransaksi) {
    errors.push("Tipe transaksi harus dipilih");
  }
  
  if (!data.nominal || data.nominal <= 0) {
    errors.push("Nominal harus lebih dari 0");
  }
  
  if (!data.tanggalTransaksi) {
    errors.push("Tanggal transaksi harus diisi");
  }
  
  return errors;
}

/**
 * Validasi form data utang
 */
export function validateUtangForm(data: Partial<UtangFormData>): string[] {
  const errors: string[] = [];
  
  if (!data.tipeTransaksi) {
    errors.push("Tipe transaksi harus dipilih");
  }
  
  if (!data.nominal || data.nominal <= 0) {
    errors.push("Nominal harus lebih dari 0");
  }
  
  if (!data.tanggalTransaksi) {
    errors.push("Tanggal transaksi harus diisi");
  }
  
  return errors;
}

/**
 * Format nominal ke format currency Indonesia
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get default form data untuk keuangan
 */
export function getDefaultKeuanganForm(): KeuanganFormData {
  return {
    accountId: "",
    transactionType: "PENERIMAAN",
    nilai: 0,
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
  };
}

/**
 * Get default form data untuk piutang
 */
export function getDefaultPiutangForm(): PiutangFormData {
  return {
    tipeTransaksi: "PIUTANG_BARU",
    nominal: 0,
    tanggalTransaksi: new Date().toISOString().split("T")[0],
    keterangan: "",
  };
}

/**
 * Get default form data untuk utang
 */
export function getDefaultUtangForm(): UtangFormData {
  return {
    tipeTransaksi: "UTANG_BARU",
    nominal: 0,
    tanggalTransaksi: new Date().toISOString().split("T")[0],
    keterangan: "",
  };
}