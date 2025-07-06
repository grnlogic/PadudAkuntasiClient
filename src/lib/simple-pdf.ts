// PDF generation utility using HTML to PDF approach
// No external libraries required - uses browser's native print functionality

import type { EntriHarian, Account } from "./data";

interface SimplePDFReportData {
  date: string;
  divisionName: string;
  entries: EntriHarian[];
  accounts: Account[];
  summary?: {
    totalPenerimaan: number;
    totalPengeluaran: number;
    totalSaldoAkhir: number;
  };

  // ✅ NEW: Data untuk divisi Produksi
  laporanProduksiData?: Array<{
    accountName: string;
    hasilProduksi: number;
    barangGagal: number;
    stockBarangJadi: number;
    hpBarangJadi: number;
    keteranganKendala: string;
  }>;

  // ✅ NEW: Data untuk divisi Blending/Gudang
  laporanBlendingData?: Array<{
    accountName: string;
    barangMasuk: number;
    pemakaian: number;
    stokAkhir: number;
    keteranganGudang: string;
  }>;
}

export const generateSimplePDF = (data: SimplePDFReportData) => {
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Jurnal Harian - ${data.divisionName}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .header h1 {
          font-size: 18px;
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .header h2 {
          font-size: 14px;
          margin: 5px 0;
          color: #666;
        }
        
        .company-info {
          margin-bottom: 20px;
          font-size: 10px;
          color: #666;
        }
        
        .summary-section {
          margin-bottom: 25px;
        }
        
        .summary-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .summary-table th,
        .summary-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .summary-table th {
          background-color: #3498db;
          color: white;
          font-weight: bold;
        }
        
        .summary-table td:last-child {
          text-align: right;
          font-weight: bold;
        }
        
        .details-section {
          margin-bottom: 25px;
        }
        
        .details-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        
        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .details-table th,
        .details-table td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: left;
        }
        
        .details-table th {
          background-color: #3498db;
          color: white;
          font-weight: bold;
        }
        
        .details-table tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .details-table td:first-child {
          text-align: center;
        }
        
        .details-table td:last-child,
        .details-table td.currency {
          text-align: right;
        }
        
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        
        .signature-box {
          width: 200px;
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #333;
          height: 50px;
          margin-bottom: 5px;
        }
        
        .footer {
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 8px;
          color: #666;
        }
        
        .no-data {
          text-align: center;
          font-style: italic;
          color: #666;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LAPORAN JURNAL HARIAN</h1>
        <h2>Divisi ${data.divisionName}</h2>
        <p>Tanggal: ${formatDate(data.date)}</p>
      </div>
      
      <div class="company-info">
        <strong>PT. Padudjaya Putera</strong><br>
        Dicetak pada: ${new Date().toLocaleString("id-ID")}
      </div>
      
        {/* ✅ ENHANCED: Division-specific summary */}
        ${
          data.summary
            ? `
        <div class="summary-section">
          <div class="summary-title">RINGKASAN TRANSAKSI KEUANGAN</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Penerimaan</td>
                <td>${formatCurrency(data.summary.totalPenerimaan)}</td>
              </tr>
              <tr>
                <td>Total Pengeluaran</td>
                <td>${formatCurrency(data.summary.totalPengeluaran)}</td>
              </tr>
              <tr>
                <td>Total Saldo Akhir</td>
                <td>${formatCurrency(data.summary.totalSaldoAkhir)}</td>
              </tr>
              <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Saldo Bersih</td>
                <td>${formatCurrency(
                  data.summary.totalPenerimaan - data.summary.totalPengeluaran
                )}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ✅ NEW: Piutang Summary -->
        <div class="summary-section">
          <div class="summary-title">RINGKASAN PIUTANG</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Piutang Baru</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) =>
                        (entry as any).transactionType === "PIUTANG_BARU"
                    )
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
              <tr>
                <td>Piutang Tertagih</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) =>
                        (entry as any).transactionType === "PIUTANG_TERTAGIH"
                    )
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
              <tr>
                <td>Piutang Macet</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) =>
                        (entry as any).transactionType === "PIUTANG_MACET"
                    )
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
              <tr>
                <td>Saldo Akhir Piutang</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) =>
                        (entry as any).transactionType === "SALDO_AKHIR"
                    )
                    .reduce(
                      (sum, entry) =>
                        sum + Number((entry as any).saldoAkhir || entry.nilai),
                      0
                    )
                )}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ✅ NEW: Utang Summary -->
        <div class="summary-section">
          <div class="summary-title">RINGKASAN UTANG</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Utang Baru</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) => (entry as any).transactionType === "UTANG_BARU"
                    )
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
              <tr>
                <td>Utang Dibayar</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) =>
                        (entry as any).transactionType === "UTANG_DIBAYAR"
                    )
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
              <tr>
                <td>Bahan Baku</td>
                <td>${formatCurrency(
                  data.entries
                    .filter((entry) => (entry as any).kategori === "BAHAN_BAKU")
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
              <tr>
                <td>Bank (HM + Henry)</td>
                <td>${formatCurrency(
                  data.entries
                    .filter(
                      (entry) =>
                        (entry as any).kategori === "BANK_HM" ||
                        (entry as any).kategori === "BANK_HENRY"
                    )
                    .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                )}</td>
              </tr>
            </tbody>
          </table>
        </div>
        `
            : data.divisionName.includes("PEMASARAN")
            ? `
        <div class="summary-section">
          <div class="summary-title">RINGKASAN PERFORMANCE PEMASARAN</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Target</td>
                <td>${formatCurrency(
                  data.entries.reduce((sum, entry) => {
                    const target = (entry as any).targetAmount || 0;
                    return sum + Number(target);
                  }, 0)
                )}</td>
              </tr>
              <tr>
                <td>Total Realisasi</td>
                <td>${formatCurrency(
                  data.entries.reduce((sum, entry) => {
                    const realisasi = (entry as any).realisasiAmount || 0;
                    return sum + Number(realisasi);
                  }, 0)
                )}</td>
              </tr>
              <tr>
                <td>Achievement Rate</td>
                <td>${(() => {
                  const totalTarget = data.entries.reduce((sum, entry) => {
                    const target = (entry as any).targetAmount || 0;
                    return sum + Number(target);
                  }, 0);
                  const totalRealisasi = data.entries.reduce((sum, entry) => {
                    const realisasi = (entry as any).realisasiAmount || 0;
                    return sum + Number(realisasi);
                  }, 0);
                  const rate =
                    totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
                  return rate.toFixed(1) + "%";
                })()}</td>
              </tr>
              <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Status</td>
                <td>${(() => {
                  const totalTarget = data.entries.reduce((sum, entry) => {
                    const target = (entry as any).targetAmount || 0;
                    return sum + Number(target);
                  }, 0);
                  const totalRealisasi = data.entries.reduce((sum, entry) => {
                    const realisasi = (entry as any).realisasiAmount || 0;
                    return sum + Number(realisasi);
                  }, 0);
                  const rate =
                    totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
                  return rate >= 100 ? "Target Tercapai" : "Belum Tercapai";
                })()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        `
            : data.laporanProduksiData && data.laporanProduksiData.length > 0
            ? `
        <!-- ✅ NEW: Production Data Table -->
        <div class="summary-section">
          <div class="summary-title">DETAIL LAPORAN PRODUKSI</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Hasil Produksi</th>
                <th>Barang Gagal</th>
                <th>Stock Barang Jadi</th>
                <th>HP Barang Jadi</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${data.laporanProduksiData
                .map(
                  (item) => `
                <tr>
                  <td>${item.accountName}</td>
                  <td style="text-align: right;">${item.hasilProduksi.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${item.barangGagal.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${item.stockBarangJadi.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${formatCurrency(
                    item.hpBarangJadi
                  )}</td>
                  <td>${item.keteranganKendala || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : data.laporanBlendingData && data.laporanBlendingData.length > 0
            ? `
        <div class="summary-section">
          <div class="summary-title">RINGKASAN INVENTORI HARIAN</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Pemakaian</td>
                <td>${data.entries
                  .reduce((sum, entry) => {
                    const pemakaian = (entry as any).pemakaianAmount || 0;
                    return sum + Number(pemakaian);
                  }, 0)
                  .toLocaleString("id-ID")} unit</td>
              </tr>
              <tr>
                <td>Rata-rata Stok</td>
                <td>${(() => {
                  const validEntries = data.entries.filter(
                    (entry) => (entry as any).stokAkhir != null
                  );
                  if (validEntries.length === 0) return "0 unit";
                  const avgStok =
                    validEntries.reduce((sum, entry) => {
                      const stok = (entry as any).stokAkhir || 0;
                      return sum + Number(stok);
                    }, 0) / validEntries.length;
                  return avgStok.toLocaleString("id-ID") + " unit";
                })()}</td>
              </tr>
              <tr>
                <td>Item Stok Rendah</td>
                <td>${
                  data.entries.filter((entry) => {
                    const stok = (entry as any).stokAkhir || 0;
                    return Number(stok) < 100;
                  }).length
                } item</td>
              </tr>
              <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Status Gudang</td>
                <td>${(() => {
                  const lowStockCount = data.entries.filter((entry) => {
                    const stok = (entry as any).stokAkhir || 0;
                    return Number(stok) < 100;
                  }).length;
                  return lowStockCount > 0 ? "Perlu Restock" : "Stok Aman";
                })()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- ✅ NEW: Blending Data Table -->
        ${
          data.laporanBlendingData && data.laporanBlendingData.length > 0
            ? `
        <div class="summary-section">
          <div class="summary-title">DETAIL LAPORAN BLENDING/GUDANG</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Bahan Baku</th>
                <th>Barang Masuk</th>
                <th>Pemakaian</th>
                <th>Stok Akhir</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${data.laporanBlendingData
                .map(
                  (item) => `
                <tr>
                  <td>${item.accountName}</td>
                  <td style="text-align: right;">${item.barangMasuk.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${item.pemakaian.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${item.stokAkhir.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td>${item.keteranganGudang || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        `
            : data.divisionName.includes("BLENDING")
            ? `
        <div class="summary-section">
          <div class="summary-title">RINGKASAN BLENDING HARIAN</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Barang Masuk</td>
                <td>${
                  data.laporanBlendingData
                    ? data.laporanBlendingData
                        .reduce((sum, item) => sum + item.barangMasuk, 0)
                        .toLocaleString("id-ID")
                    : "0"
                } unit</td>
              </tr>
              <tr>
                <td>Total Pemakaian</td>
                <td>${
                  data.laporanBlendingData
                    ? data.laporanBlendingData
                        .reduce((sum, item) => sum + item.pemakaian, 0)
                        .toLocaleString("id-ID")
                    : "0"
                } unit</td>
              </tr>
              <tr>
                <td>Total Stok Akhir</td>
                <td>${
                  data.laporanBlendingData
                    ? data.laporanBlendingData
                        .reduce((sum, item) => sum + item.stokAkhir, 0)
                        .toLocaleString("id-ID")
                    : "0"
                } unit</td>
              </tr>
              <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Status Stok</td>
                <td>${(() => {
                  if (!data.laporanBlendingData) return "Tidak ada data";
                  const lowStockCount = data.laporanBlendingData.filter(
                    (item) => item.stokAkhir < 100
                  ).length;
                  return lowStockCount > 0 ? "Perlu Restock" : "Stok Aman";
                })()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- ✅ NEW: Blending Data Table -->
        ${
          data.laporanBlendingData && data.laporanBlendingData.length > 0
            ? `
        <div class="summary-section">
          <div class="summary-title">DETAIL LAPORAN BLENDING</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Bahan Baku</th>
                <th>Barang Masuk</th>
                <th>Pemakaian</th>
                <th>Stok Akhir</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${data.laporanBlendingData
                .map(
                  (item) => `
                <tr>
                  <td>${item.accountName}</td>
                  <td style="text-align: right;">${item.barangMasuk.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${item.pemakaian.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td style="text-align: right;">${item.stokAkhir.toLocaleString(
                    "id-ID"
                  )}</td>
                  <td>${item.keteranganGudang || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        `
            : data.divisionName.includes("HRD")
            ? `
        <div class="summary-section">
          <div class="summary-title">RINGKASAN KEHADIRAN HARIAN</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Karyawan</td>
                <td>${data.entries.length} orang</td>
              </tr>
              <tr>
                <td>Karyawan Hadir</td>
                <td>${
                  data.entries.filter((entry) => {
                    const status = (entry as any).attendanceStatus;
                    return status === "HADIR";
                  }).length
                } orang</td>
              </tr>
              <tr>
                <td>Total Tidak Hadir</td>
                <td>${data.entries.reduce((sum, entry) => {
                  const absentCount = (entry as any).absentCount || 0;
                  return sum + Number(absentCount);
                }, 0)} orang</td>
              </tr>
              <tr>
                <td>Tingkat Kehadiran</td>
                <td>${(() => {
                  const totalKaryawan = data.entries.length;
                  const hadirCount = data.entries.filter((entry) => {
                    const status = (entry as any).attendanceStatus;
                    return status === "HADIR";
                  }).length;
                  const rate =
                    totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;
                  return rate.toFixed(1) + "%";
                })()}</td>
              </tr>
              <tr>
                <td>Shift Lembur</td>
                <td>${
                  data.entries.filter((entry) => {
                    const shift = (entry as any).shift;
                    return shift === "LEMBUR";
                  }).length
                } orang</td>
              </tr>
              <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Status Kehadiran</td>
                <td>${(() => {
                  const totalKaryawan = data.entries.length;
                  const hadirCount = data.entries.filter((entry) => {
                    const status = (entry as any).attendanceStatus;
                    return status === "HADIR";
                  }).length;
                  const rate =
                    totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;
                  return rate >= 90
                    ? "Excellent"
                    : rate >= 80
                    ? "Good"
                    : "Needs Improvement";
                })()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        `
            : ""
        }
      
      <div class="details-section">
        <div class="details-title">DETAIL TRANSAKSI</div>
        ${
          data.entries.length === 0
            ? `
          <div class="no-data">Tidak ada transaksi pada tanggal ini.</div>
        `
            : `
          <table class="details-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Akun</th>
                <th>Keterangan</th>
                ${
                  data.divisionName.includes("KEUANGAN")
                    ? "<th>Jenis Transaksi</th><th>Nominal</th>"
                    : ""
                }
                ${
                  data.divisionName.includes("PEMASARAN")
                    ? "<th>Target</th><th>Realisasi</th><th>Achievement</th>"
                    : ""
                }
                ${
                  data.laporanProduksiData &&
                  data.laporanProduksiData.length > 0
                    ? "<th>Produksi</th><th>HPP</th><th>HPP/Unit</th>"
                    : ""
                }
                ${
                  data.laporanBlendingData &&
                  data.laporanBlendingData.length > 0
                    ? "<th>Pemakaian</th><th>Stok Akhir</th><th>Status</th>"
                    : ""
                }
                ${
                  data.divisionName.includes("HRD")
                    ? "<th>Status Kehadiran</th><th>Tidak Hadir</th><th>Shift</th>"
                    : ""
                }
                ${
                  !["KEUANGAN", "PEMASARAN", "PRODUKSI", "GUDANG", "HRD"].some(
                    (d) => data.divisionName.toUpperCase().includes(d)
                  )
                    ? "<th>Nilai</th>"
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${data.entries
                .map((entry, idx) => {
                  const account = data.accounts.find(
                    (acc) => acc.id === entry.accountId
                  );
                  const accountDisplay = account
                    ? `${account.accountCode} - ${account.accountName}`
                    : "Akun tidak ditemukan";
                  const isKuantitas = account?.valueType === "KUANTITAS";
                  const isSaldoAkhir =
                    (entry as any).transactionType === "SALDO_AKHIR";
                  const nominalValue = isSaldoAkhir
                    ? (entry as any).saldoAkhir ?? entry.nilai
                    : entry.nilai;

                  let additionalCells = "";
                  if (data.divisionName.includes("KEUANGAN")) {
                    additionalCells = `
                      <td>${(entry as any).transactionType || "-"}</td>
                      <td style="text-align: right;">
                        ${
                          isKuantitas
                            ? nominalValue.toLocaleString("id-ID") + " pcs"
                            : formatCurrency(nominalValue)
                        }
                      </td>
                    `;
                  } else if (data.divisionName.includes("PEMASARAN")) {
                    const target = (entry as any).targetAmount || 0;
                    const realisasi = (entry as any).realisasiAmount || 0;
                    const achievement =
                      target > 0
                        ? ((realisasi / target) * 100).toFixed(1) + "%"
                        : "-";
                    additionalCells = `
                      <td style="text-align: right;">${formatCurrency(
                        target
                      )}</td>
                      <td style="text-align: right;">${formatCurrency(
                        realisasi
                      )}</td>
                      <td style="text-align: center;">${achievement}</td>
                    `;
                  } else if (
                    data.laporanProduksiData &&
                    data.laporanProduksiData.length > 0
                  ) {
                    const produksi = entry.nilai || 0;
                    const hpp = (entry as any).hppAmount || 0;
                    const hppPerUnit = produksi > 0 ? hpp / produksi : 0;
                    additionalCells = `
                      <td style="text-align: right;">${produksi.toLocaleString(
                        "id-ID"
                      )}</td>
                      <td style="text-align: right;">${formatCurrency(hpp)}</td>
                      <td style="text-align: right;">${formatCurrency(
                        hppPerUnit
                      )}</td>
                    `;
                  } else if (
                    data.laporanBlendingData &&
                    data.laporanBlendingData.length > 0
                  ) {
                    const pemakaian = (entry as any).pemakaianAmount || 0;
                    const stokAkhir = (entry as any).stokAkhir || 0;
                    const status =
                      stokAkhir < 100 ? "Stok Rendah" : "Stok Aman";
                    additionalCells = `
                      <td style="text-align: right;">${pemakaian.toLocaleString(
                        "id-ID"
                      )}</td>
                      <td style="text-align: right;">${stokAkhir.toLocaleString(
                        "id-ID"
                      )}</td>
                      <td style="text-align: center;">${status}</td>
                    `;
                  } else if (data.divisionName.includes("HRD")) {
                    const status = (entry as any).attendanceStatus || "-";
                    const absentCount = (entry as any).absentCount || 0;
                    const shift = (entry as any).shift || "-";
                    additionalCells = `
                      <td style="text-align: center;">${status}</td>
                      <td style="text-align: center;">${absentCount} orang</td>
                      <td style="text-align: center;">${shift}</td>
                    `;
                  } else {
                    additionalCells = `
                      <td style="text-align: right;">
                        ${
                          isKuantitas
                            ? nominalValue.toLocaleString("id-ID") + " pcs"
                            : formatCurrency(nominalValue)
                        }
                      </td>
                    `;
                  }

                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${accountDisplay}</td>
                      <td>${entry.keterangan || entry.description || "-"}</td>
                      ${additionalCells}
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        `
        }
      </div>
      
      <div class="signature-section">
        <div class="signature-box">
          <div>Dibuat oleh:</div>
          <div class="signature-line"></div>
          <div>Admin ${data.divisionName}</div>
        </div>
        <div class="signature-box">
          <div>Diperiksa oleh:</div>
          <div class="signature-line"></div>
          <div>Manager</div>
        </div>
      </div>
      
      <div class="footer">
        Halaman 1
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

export const downloadSimplePDF = (data: SimplePDFReportData) => {
  const htmlContent = generateSimplePDF(data);

  // Create a new window with the HTML content
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.close();
    };
  }
};

export const previewSimplePDF = (data: SimplePDFReportData) => {
  const htmlContent = generateSimplePDF(data);

  // Create a blob with the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Open in new tab
  window.open(url, "_blank");
};
