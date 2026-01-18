import { EntriHarian, Account } from "@/lib/data";

/**
 * Interface untuk summary keuangan
 */
export interface KeuanganSummary {
  totalPenerimaan: number;
  totalPengeluaran: number;
  totalSaldoAkhir: number;
}

export interface PiutangSummary {
  baru: number;
  tertagih: number;
  macet: number;
  saldoAkhir: number;
}

export interface UtangSummary {
  baru: number;
  dibayar: number;
  saldoAkhir: number;
}

/**
 * Menghitung summary keuangan berdasarkan entries
 */
export function calculateKeuanganSummary(
  entries: EntriHarian[],
  accounts: Account[]
): KeuanganSummary {
  console.log("🔍 KEUANGAN SUMMARY DEBUG - Input:", {
    entriesCount: entries.length,
    accountsCount: accounts.length,
    sampleEntry: entries[0],
    sampleAccount: accounts[0],
  });

  // ✅ FIXED: Better filtering logic
  const piutangAccountIds = accounts
    .filter((acc) => acc.accountName.toLowerCase().includes("piutang"))
    .map((acc) => acc.id);

  console.log("📋 Piutang Account IDs:", piutangAccountIds);

  const summary: KeuanganSummary = {
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    totalSaldoAkhir: 0,
  };

  // ✅ FIXED: Filter transaksi harian (yang bukan piutang dan accountId tidak kosong)
  const transaksiHarian = entries.filter((entry: any) => {
    const hasValidAccountId = entry.accountId && entry.accountId !== "";
    const isNotPiutang = !piutangAccountIds.includes(entry.accountId);
    const hasTransactionType =
      entry.transactionType &&
      ["PENERIMAAN", "PENGELUARAN", "SALDO_AKHIR"].includes(
        entry.transactionType
      );

    return hasValidAccountId && isNotPiutang && hasTransactionType;
  });

  transaksiHarian.forEach((entry: any) => {
    const nilai = Number(entry.nilai) || 0;

    if (entry.transactionType === "PENERIMAAN") {
      summary.totalPenerimaan += nilai;
    } else if (entry.transactionType === "PENGELUARAN") {
      summary.totalPengeluaran += nilai;
    } else if (entry.transactionType === "SALDO_AKHIR") {
      const saldoValue = Number(entry.saldoAkhir) || nilai;
      summary.totalSaldoAkhir += saldoValue;
      
      console.log("🔍 SALDO_AKHIR DEBUG:", {
        entryId: entry.id,
        saldoAkhir: entry.saldoAkhir,
        nilai: entry.nilai,
        saldoValue,
        runningTotal: summary.totalSaldoAkhir,
      });

    
      return;
    }

  
  });

  console.log("✅ FINAL KEUANGAN SUMMARY:", summary);
  return summary;
}

/**
 * Menghitung summary piutang berdasarkan data piutang
 */
export function calculatePiutangSummary(
  piutangData: any[],
  tanggal: string
): PiutangSummary {
  // ✅ FIXED: Gunakan field name yang benar dari backend (snake_case)
  const hariIni = piutangData.filter((p) => {
    const transaksiDateSummary = p.tanggal_transaksi || p.tanggalTransaksi;
    if (!transaksiDateSummary) return false;
    // ✅ Normalisasi tanggal ke format YYYY-MM-DD
    const normalizedDate = new Date(transaksiDateSummary)
      .toISOString()
      .split("T")[0];
    const normalizedSelectedDate = new Date(tanggal)
      .toISOString()
      .split("T")[0];
    return normalizedDate === normalizedSelectedDate;
  });

  // ✅ FIXED: Support both snake_case and camelCase
  const baru = hariIni
    .filter((p) => (p.tipe_transaksi || p.tipeTransaksi) === "PIUTANG_BARU")
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  const tertagih = hariIni
    .filter(
      (p) => (p.tipe_transaksi || p.tipeTransaksi) === "PIUTANG_TERTAGIH"
    )
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  const macet = hariIni
    .filter((p) => (p.tipe_transaksi || p.tipeTransaksi) === "PIUTANG_MACET")
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  const saldoAkhir = hariIni
    .filter(
      (p) => (p.tipe_transaksi || p.tipeTransaksi) === "SALDO_AKHIR_PIUTANG"
    )
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  console.log("📊 PIUTANG SUMMARY CALCULATION:", {
    tanggal,
    totalData: piutangData.length,
    hariIniCount: hariIni.length,
    baru,
    tertagih,
    macet,
    saldoAkhir,
    sampleData: hariIni[0],
  });

  return { baru, tertagih, macet, saldoAkhir };
}

/**
 * Menghitung summary utang berdasarkan data utang
 */
export function calculateUtangSummary(
  utangData: any[],
  tanggal: string
): UtangSummary {
  const hariIni = utangData.filter((u) => {
    const transaksiDateSummary = u.tanggal_transaksi || u.tanggalTransaksi;
    if (!transaksiDateSummary) return false;
    
    const normalizedDate = new Date(transaksiDateSummary)
      .toISOString()
      .split("T")[0];
    const normalizedSelectedDate = new Date(tanggal)
      .toISOString()
      .split("T")[0];
    return normalizedDate === normalizedSelectedDate;
  });

  const baru = hariIni
    .filter((u) => (u.tipe_transaksi || u.tipeTransaksi) === "UTANG_BARU")
    .reduce((sum, u) => sum + Number(u.nominal), 0);

  const dibayar = hariIni
    .filter((u) => (u.tipe_transaksi || u.tipeTransaksi) === "UTANG_DIBAYAR")
    .reduce((sum, u) => sum + Number(u.nominal), 0);

  const saldoAkhir = hariIni
    .filter(
      (u) => (u.tipe_transaksi || u.tipeTransaksi) === "SALDO_AKHIR_UTANG"
    )
    .reduce((sum, u) => sum + Number(u.nominal), 0);

  console.log("📊 UTANG SUMMARY CALCULATION:", {
    tanggal,
    totalData: utangData.length,
    hariIniCount: hariIni.length,
    baru,
    dibayar,
    saldoAkhir,
    sampleData: hariIni[0],
  });

  return { baru, dibayar, saldoAkhir };
}