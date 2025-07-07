// Enhanced PDF Generator with Division-Specific Features
// filepath: /lib/enhanced-pdf.ts

interface PDFReportData {
  date: string;
  divisionName: string;
  entries: any[];
  accounts: any[];
  summary?: {
    totalPenerimaan: number;
    totalPengeluaran: number;
    totalSaldoAkhir: number;
  };
  // ✅ NEW: Support for specialized division data
  laporanPenjualanSales?: any[];
  laporanPenjualanProduk?: any[]; // ✅ ADD: Support for new product sales reports
  laporanProduksi?: any[];
  laporanGudang?: any[];
  laporanBlendingData?: any[]; // ✅ ADD: Support for blending data
  laporanProduksiData?: any[]; // ✅ ADD: Support for production data
  users?: any[];
  salespeople?: any[];
}

// ✅ NEW: Helper function untuk transform data dari backend format ke frontend format
function transformBackendData(entry: any): any {
  return {
    ...entry,
    // Transform snake_case to camelCase for common fields
    targetAmount: entry.target_amount || entry.targetAmount,
    realisasiAmount: entry.realisasi_amount || entry.realisasiAmount,
    hppAmount: entry.hpp_amount || entry.hppAmount,
    pemakaianAmount: entry.pemakaian_amount || entry.pemakaianAmount,
    stokAkhir: entry.stok_akhir || entry.stokAkhir,
    barangMasuk:
      entry.barang_masuk ||
      entry.barangMasuk ||
      entry.stok_awal ||
      entry.stokAwal,
    pemakaian:
      entry.pemakaian || entry.pemakaian_amount || entry.pemakaianAmount,
    hasilProduksi: entry.hasil_produksi || entry.hasilProduksi,
    barangGagal: entry.barang_gagal || entry.barangGagal,
    stockBarangJadi: entry.stock_barang_jadi || entry.stockBarangJadi,
    hpBarangJadi: entry.hpp_barang_jadi || entry.hpBarangJadi,
    returPenjualan: entry.retur_penjualan || entry.returPenjualan,
    keteranganKendala: entry.keterangan_kendala || entry.keteranganKendala,
    keterangan: entry.keterangan || entry.kondisi_gudang || entry.kondisiGudang,
    attendanceStatus: entry.attendance_status || entry.attendanceStatus,
    absentCount: entry.absent_count || entry.absentCount,
    overtimeHours: entry.overtime_hours || entry.overtimeHours,
    // Keuangan specific fields
    saldoAkhir: entry.saldo_akhir || entry.saldoAkhir,
    transactionType: entry.transaction_type || entry.transactionType,
    // Sales specific fields
    salesUserId: entry.sales_user_id || entry.salesUserId,
    // Date fields
    tanggalLaporan:
      entry.tanggal_laporan || entry.tanggalLaporan || entry.created_at,
    tanggalTransaksi: entry.tanggal_transaksi || entry.tanggalTransaksi,
  };
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk menampilkan nilai dengan unit jika account.valueType === "KUANTITAS"
function getNilaiDisplay(entry: any, accounts: any[]): string {
  const account = accounts.find((acc) => acc.id === entry.accountId);
  const isKuantitas = account?.valueType === "KUANTITAS";
  return isKuantitas
    ? (entry.nilai || 0).toLocaleString("id-ID") + " pcs"
    : formatCurrency(entry.nilai || 0);
}

// ✅ NEW: Helper untuk mendapatkan semua data entries yang sudah ditransform
function getAllTransformedEntries(data: PDFReportData): any[] {
  const divisionName = data.divisionName.toUpperCase();
  let transformedEntries: any[] = [];

  // ✅ ADD: Debug logging untuk troubleshooting
  console.log("🔍 [PDF DEBUG] getAllTransformedEntries called with:", {
    divisionName,
    date: data.date,
    entriesCount: data.entries?.length || 0,
    accountsCount: data.accounts?.length || 0,
    laporanSalesCount: data.laporanPenjualanSales?.length || 0,
    laporanProdukCount: data.laporanPenjualanProduk?.length || 0,
    laporanProduksiCount: data.laporanProduksi?.length || 0,
    laporanGudangCount: data.laporanGudang?.length || 0,
  });

  // Helper untuk filter entri harian sesuai divisi
  function filterEntriHarian(entries: any[]) {
    // Jika account ada di data.accounts, berarti milik divisi ini
    const accountIds = (data.accounts || []).map((acc: any) => acc.id);
    return entries.filter((entry) => accountIds.includes(entry.accountId));
  }

  // KEUANGAN: entries + piutang/utang
  if (divisionName.includes("KEUANGAN")) {
    transformedEntries = data.entries.map(transformBackendData);
    // Piutang/utang sudah dimasukkan di entries oleh page.tsx, jadi cukup entries saja
    return transformedEntries;
  }

  // PEMASARAN: entries + laporanPenjualanSales + laporanPenjualanProduk
  if (divisionName.includes("PEMASARAN")) {
    transformedEntries = filterEntriHarian(data.entries).map(
      transformBackendData
    );

    // ✅ FIXED: Gunakan semua data tanpa filter tambahan
    if (data.laporanPenjualanSales && data.laporanPenjualanSales.length > 0) {
      console.log(
        "🔍 [PDF DEBUG] ALL laporanPenjualanSales:",
        data.laporanPenjualanSales.length
      );
      const salesEntries = data.laporanPenjualanSales.map((sales: any) => {
        const transformed = transformBackendData(sales);
        return {
          ...transformed,
          id: `sales-${sales.id}`,
          accountId:
            sales.account_id?.toString() || sales.accountId?.toString(),
          description: `Laporan Sales - ${
            sales.salesperson?.username || sales.salesperson?.nama || "Unknown"
          }`,
          nilai: Number(transformed.realisasiAmount) || 0,
          targetAmount: Number(transformed.targetAmount) || 0,
          realisasiAmount: Number(transformed.realisasiAmount) || 0,
          returPenjualan: Number(transformed.returPenjualan) || 0,
          keteranganKendala: transformed.keteranganKendala || "",
        };
      });
      transformedEntries.push(...salesEntries);
    }

    // ✅ FIXED: Gunakan semua data laporanPenjualanProduk tanpa filter tambahan
    if (data.laporanPenjualanProduk && data.laporanPenjualanProduk.length > 0) {
      console.log(
        "🔍 [PDF DEBUG] ALL laporanPenjualanProduk:",
        data.laporanPenjualanProduk.length
      );
      const produkEntries = data.laporanPenjualanProduk.map((produk: any) => {
        return {
          id: `produk-${produk.id}`,
          accountId:
            produk.productAccountId?.toString() ||
            produk.product_account_id?.toString(),
          description: `${
            produk.namaAccount || produk.nama_account || "Produk"
          } - ${
            produk.namaSalesperson || produk.nama_salesperson || "Unknown"
          }`,
          keterangan: `${
            produk.namaPerusahaan || produk.nama_perusahaan || "Unknown Company"
          } - Target: ${produk.targetKuantitas || 0}, Realisasi: ${
            produk.realisasiKuantitas || 0
          }`,
          nilai: Number(produk.realisasiKuantitas) || 0,
          targetAmount: Number(produk.targetKuantitas) || 0,
          realisasiAmount: Number(produk.realisasiKuantitas) || 0,
          keteranganKendala:
            produk.keteranganKendala || produk.keterangan_kendala || "",
          tanggalLaporan: produk.tanggalLaporan || produk.tanggal_laporan,
          namaPerusahaan: produk.namaPerusahaan || produk.nama_perusahaan,
          namaSalesperson: produk.namaSalesperson || produk.nama_salesperson,
          namaAccount: produk.namaAccount || produk.nama_account,
          // ✅ Tambahan fields untuk PDF
          createdAt:
            produk.tanggalLaporan ||
            produk.tanggal_laporan ||
            produk.created_at,
          tanggal:
            produk.tanggalLaporan ||
            produk.tanggal_laporan ||
            produk.created_at,
        };
      });
      transformedEntries.push(...produkEntries);
    }

    console.log(
      "🔍 [PDF DEBUG] Total PEMASARAN entries:",
      transformedEntries.length
    );
    return transformedEntries;
  }

  // PRODUKSI: HANYA laporanProduksi
  if (divisionName.includes("PRODUKSI")) {
    if (data.laporanProduksi) {
      const produksiEntries = data.laporanProduksi.map((produksi: any) => {
        const transformed = transformBackendData(produksi);
        return {
          ...transformed,
          id: `produksi-${produksi.id}`,
          accountId: produksi.account?.id?.toString(),
          description: `Laporan Produksi - ${
            transformed.hasilProduksi || 0
          } unit`,
          nilai: Number(transformed.hasilProduksi) || 0,
          hppAmount: Number(transformed.hppAmount) || 0,
          hasilProduksi: Number(transformed.hasilProduksi) || 0,
          barangGagal: Number(transformed.barangGagal) || 0,
          stockBarangJadi: Number(transformed.stockBarangJadi) || 0,
          hpBarangJadi: Number(transformed.hpBarangJadi) || 0,
        };
      });
      // Debug log
      console.log("[PDF PRODUKSI] produksiEntries only:", produksiEntries);
      return produksiEntries;
    }
    return [];
  }

  // GUDANG/PERSEDIAAN_BAHAN_BAKU/DISTRIBUSI: HANYA laporanGudang (tidak gabung dengan entries)
  if (
    divisionName.includes("GUDANG") ||
    divisionName.includes("PERSEDIAAN") ||
    divisionName.includes("BAHAN BAKU") ||
    divisionName.includes("BLENDING") ||
    divisionName.includes("DISTRIBUSI")
  ) {
    // ✅ ADD: Debug logging untuk troubleshooting
    console.log("🔍 [PDF DEBUG] Division detected:", divisionName);
    console.log("🔍 [PDF DEBUG] laporanGudang data:", data.laporanGudang);
    console.log(
      "🔍 [PDF DEBUG] laporanGudang length:",
      data.laporanGudang?.length || 0
    );
    console.log("🔍 [PDF DEBUG] entries data:", data.entries);
    console.log("🔍 [PDF DEBUG] entries length:", data.entries?.length || 0);
    console.log("🔍 [PDF DEBUG] accounts data:", data.accounts);
    console.log("🔍 [PDF DEBUG] accounts length:", data.accounts?.length || 0);

    // ✅ FIXED: Hanya gunakan laporanGudang, jangan gabung dengan entries untuk mencegah duplikasi
    if (data.laporanGudang && data.laporanGudang.length > 0) {
      console.log(
        "🔍 [PDF DEBUG] Using laporanGudang, length:",
        data.laporanGudang.length
      );
      const gudangEntries = data.laporanGudang.map((gudang: any) => {
        const transformed = transformBackendData(gudang);
        console.log("🔍 [PDF DEBUG] Original gudang entry:", gudang);
        console.log("🔍 [PDF DEBUG] Transformed gudang entry:", transformed);

        const mappedEntry = {
          ...transformed,
          id: `gudang-${gudang.id}`,
          // ✅ FIXED: Perbaiki mapping accountId untuk laporanGudang
          accountId:
            gudang.account?.id?.toString() ||
            gudang.account_id?.toString() ||
            gudang.accountId?.toString(),
          description:
            transformed.keterangan || gudang.keterangan || `Laporan Gudang`,
          nilai: Number(transformed.pemakaian) || Number(gudang.pemakaian) || 0,
          pemakaianAmount: Number(transformed.pemakaianAmount) || 0,
          stokAkhir: Number(transformed.stokAkhir) || 0,
          barangMasuk: Number(transformed.barangMasuk) || 0,
          pemakaian: Number(transformed.pemakaian) || 0,
          keterangan: transformed.keterangan || "",
          // ✅ ADD: Include account object for easier lookup
          account: gudang.account,
        };
        console.log("🔍 [PDF DEBUG] Final mapped entry:", mappedEntry);
        return mappedEntry;
      });
      console.log(
        "[PDF PERSEDIAAN_BAHAN_BAKU] gudangEntries only:",
        gudangEntries
      );
      return gudangEntries;
    }

    // Fallback ke entries jika tidak ada laporanGudang
    console.log(
      "🔍 [PDF DEBUG] Fallback to entries, length:",
      data.entries.length
    );
    const fallbackEntries = filterEntriHarian(data.entries).map(
      transformBackendData
    );
    console.log(
      "🔍 [PDF DEBUG] Fallback entries after filter:",
      fallbackEntries
    );
    return fallbackEntries;
  }

  // HRD: entries HRD saja
  if (divisionName.includes("HRD")) {
    // Hanya entries yang ada attendanceStatus
    transformedEntries = filterEntriHarian(data.entries)
      .filter((entry) => entry.attendanceStatus)
      .map(transformBackendData);
    return transformedEntries;
  }

  // Default: entries yang relevan saja
  return filterEntriHarian(data.entries).map(transformBackendData);
}

export function downloadEnhancedPDF(data: PDFReportData) {
  const html = generateEnhancedHTML(data);

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
}

export function previewEnhancedPDF(data: PDFReportData) {
  const html = generateEnhancedHTML(data);

  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
}

function generateEnhancedHTML(data: PDFReportData): string {
  const divisionType = data.divisionName.toUpperCase();

  // ✅ ADD: Debug logging untuk troubleshooting
  console.log("🔍 [PDF HTML DEBUG] Starting generateEnhancedHTML");
  console.log("🔍 [PDF HTML DEBUG] Division:", divisionType);
  console.log("🔍 [PDF HTML DEBUG] Date:", data.date);
  console.log("🔍 [PDF HTML DEBUG] Raw data received:", data);

  const allEntries = getAllTransformedEntries(data);
  console.log("🔍 [PDF HTML DEBUG] All transformed entries:", allEntries);
  console.log("🔍 [PDF HTML DEBUG] Entries count:", allEntries.length);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Harian ${data.divisionName}</title>
      <style>
        /* Base Styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #2c3e50;
          background-color: #ffffff;
          padding: 20px;
        }
        
        /* Header Styles */
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3498db;
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .report-title {
          font-size: 18px;
          color: #3498db;
          margin-bottom: 10px;
        }
        
        .report-info {
          font-size: 14px;
          color: #7f8c8d;
        }
        
        /* Summary Section */
        .summary-section {
          margin-bottom: 30px;
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 5px solid #3498db;
        }
        
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .summary-table th,
        .summary-table td {
          border: 1px solid #bdc3c7;
          padding: 8px 12px;
          text-align: left;
        }
        
        .summary-table th {
          background-color: #3498db;
          color: white;
          font-weight: bold;
        }
        
        .summary-table tr:nth-child(even) {
          background-color: #ecf0f1;
        }
        
        /* Details Section */
        .details-section {
          margin-bottom: 30px;
        }
        
        .details-title {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
          text-transform: uppercase;
          border-bottom: 2px solid #ecf0f1;
          padding-bottom: 10px;
        }
        
        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        
        .details-table th,
        .details-table td {
          border: 1px solid #bdc3c7;
          padding: 6px 8px;
        }
        
        .details-table th {
          background-color: #34495e;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        .details-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .details-table tr:hover {
          background-color: #e3f2fd;
        }
        
        /* Footer */
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #7f8c8d;
          border-top: 1px solid #ecf0f1;
          padding-top: 20px;
        }
        
        /* Print Styles */
        @media print {
          body { padding: 10px; }
          .summary-section { break-inside: avoid; }
          .details-section { break-inside: avoid; }
        }
        
        /* Division-specific colors */
        .keuangan { border-left-color: #3498db; }
        .pemasaran { border-left-color: #e67e22; }
        .produksi { border-left-color: #27ae60; }
        .gudang { border-left-color: #9b59b6; }
        .hrd { border-left-color: #e74c3c; }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="company-name">PT. PADUDJAYA PUTERA</div>
        <div class="report-title">LAPORAN HARIAN  ${data.divisionName.toUpperCase()}</div>
        <div class="report-info">
          Tanggal: ${new Date(data.date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      ${generateSummarySection(data)}

      ${generateDetailsSection(data)}

      <!-- Footer -->
      <div class="footer">
        <p>Laporan ini digenerate secara otomatis pada ${new Date().toLocaleString(
          "id-ID"
        )}</p>
        <p>Sistem Akuntansi PT. PADUDJAYA PUTERA</p>
      </div>
    </body>
    </html>
  `;
}

function generateSummarySection(data: PDFReportData): string {
  const {
    summary,
    divisionName,
    laporanProduksi,
    laporanBlendingData,
    entries,
    accounts,
  } = data;
  const allEntries = getAllTransformedEntries(data);

  console.log("🔍 [PDF SUMMARY DEBUG] Division:", divisionName);
  console.log("🔍 [PDF SUMMARY DEBUG] All entries count:", allEntries.length);
  console.log("🔍 [PDF SUMMARY DEBUG] Summary data:", summary);

  // ✅ KEUANGAN: Conditional summary berdasarkan jenis transaksi yang ada
  if (divisionName.includes("KEUANGAN")) {
    // Check jenis transaksi yang ada di entries
    const hasKas = allEntries.some(
      (entry) =>
        entry.transactionType === "PENERIMAAN" ||
        entry.transactionType === "PENGELUARAN" ||
        entry.transactionType === "SALDO_AKHIR"
    );
    const hasPiutang = allEntries.some(
      (entry) =>
        entry.transactionType === "PIUTANG_BARU" ||
        entry.transactionType === "PIUTANG_TERTAGIH" ||
        entry.transactionType === "PIUTANG_MACET"
    );
    const hasUtang = allEntries.some(
      (entry) =>
        entry.transactionType === "UTANG_BARU" ||
        entry.transactionType === "UTANG_DIBAYAR"
    );

    console.log("🔍 [PDF KEUANGAN DEBUG] Transaction types:", {
      hasKas,
      hasPiutang,
      hasUtang,
    });

    let summaryHTML = "";

    // ✅ KAS Summary (hanya jika ada transaksi kas)
    if (
      hasKas &&
      summary &&
      (summary.totalPenerimaan > 0 ||
        summary.totalPengeluaran > 0 ||
        summary.totalSaldoAkhir > 0)
    ) {
      summaryHTML += `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">💰 RINGKASAN KAS HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Penerimaan</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${summary.totalPenerimaan.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Pengeluaran</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${summary.totalPengeluaran.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Saldo Akhir</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${summary.totalSaldoAkhir.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Saldo Bersih</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${(
                summary.totalPenerimaan - summary.totalPengeluaran
              ).toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // ✅ PIUTANG Summary (hanya jika ada transaksi piutang)
    if (hasPiutang) {
      const piutangBaru = allEntries
        .filter((entry) => entry.transactionType === "PIUTANG_BARU")
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);
      const piutangTertagih = allEntries
        .filter((entry) => entry.transactionType === "PIUTANG_TERTAGIH")
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);
      const piutangMacet = allEntries
        .filter((entry) => entry.transactionType === "PIUTANG_MACET")
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);
      const saldoAkhirPiutang = allEntries
        .filter((entry) => entry.transactionType === "SALDO_AKHIR")
        .reduce(
          (sum, entry) => sum + (entry.saldoAkhir || entry.nilai || 0),
          0
        );

      summaryHTML += `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📊 RINGKASAN PIUTANG HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kategori</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Piutang Baru</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${piutangBaru.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Piutang Tertagih</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${piutangTertagih.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Piutang Macet</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${piutangMacet.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Saldo Akhir Piutang</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${saldoAkhirPiutang.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // ✅ UTANG Summary (hanya jika ada transaksi utang)
    if (hasUtang) {
      const utangBaru = allEntries
        .filter((entry) => entry.transactionType === "UTANG_BARU")
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);
      const utangDibayar = allEntries
        .filter((entry) => entry.transactionType === "UTANG_DIBAYAR")
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);
      const bahanBaku = allEntries
        .filter((entry) => entry.kategori === "BAHAN_BAKU")
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);
      const bankTotal = allEntries
        .filter(
          (entry) =>
            entry.kategori === "BANK_HM" || entry.kategori === "BANK_HENRY"
        )
        .reduce((sum, entry) => sum + (entry.nilai || 0), 0);

      summaryHTML += `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">💳 RINGKASAN UTANG HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kategori</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Utang Baru</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${utangBaru.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Utang Dibayar</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${utangDibayar.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Bahan Baku</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${bahanBaku.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Bank (HM + Henry)</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${bankTotal.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // ✅ Return hasil: Jika tidak ada transaksi apapun, return empty string
    if (!hasKas && !hasPiutang && !hasUtang) {
      console.log(
        "⚠️ [PDF KEUANGAN DEBUG] No transactions found, no summary displayed"
      );
      return "";
    }

    return summaryHTML;
  }

  // ✅ Divisi lainnya tetap sama seperti sebelumnya...

  // PRODUKSI: Summary produksi
  if (divisionName.includes("PRODUKSI")) {
    if (laporanProduksi && laporanProduksi.length > 0) {
      const totalHasil = laporanProduksi.reduce(
        (sum: number, item: any) => sum + (Number(item.hasilProduksi) || 0),
        0
      );
      const totalGagal = laporanProduksi.reduce(
        (sum: number, item: any) => sum + (Number(item.barangGagal) || 0),
        0
      );
      const totalStok = laporanProduksi.reduce(
        (sum: number, item: any) => sum + (Number(item.stockBarangJadi) || 0),
        0
      );
      const totalHPP = laporanProduksi.reduce(
        (sum: number, item: any) => sum + (Number(item.hpBarangJadi) || 0),
        0
      );
      const efisiensi =
        totalHasil > 0 ? (totalHasil / (totalHasil + totalGagal)) * 100 : 0;

      return `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📊 RINGKASAN PRODUKSI HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Hasil Produksi</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalHasil.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Barang Gagal</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalGagal.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Stok Barang Jadi</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalStok.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total HPP Barang Jadi</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${totalHPP.toLocaleString()}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Efisiensi Produksi</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${efisiensi.toFixed(
                1
              )}%</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Entri Laporan</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
                laporanProduksi.length
              } item</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }
    // ✅ FIXED: Tampilkan summary default untuk PRODUKSI tanpa data
    return `
      <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📊 RINGKASAN PRODUKSI HARIAN</h3>
        <div style="text-align: center; padding: 20px; color: #666;">
          <p>Belum ada data produksi pada tanggal ini</p>
          <p style="font-size: 14px;">Total Entri: ${allEntries.length}</p>
        </div>
      </div>
    `;
  }

  // ✅ BLENDING: Summary blending
  if (
    divisionName.includes("BLENDING") ||
    divisionName.includes("PERSEDIAAN") ||
    divisionName.includes("GUDANG")
  ) {
    if (laporanBlendingData && laporanBlendingData.length > 0) {
      const totalMasuk = laporanBlendingData.reduce(
        (sum: number, item: any) => sum + (Number(item.barangMasuk) || 0),
        0
      );
      const totalPakai = laporanBlendingData.reduce(
        (sum: number, item: any) => sum + (Number(item.pemakaian) || 0),
        0
      );
      const totalStok = laporanBlendingData.reduce(
        (sum: number, item: any) => sum + (Number(item.stokAkhir) || 0),
        0
      );
      const rataStok =
        laporanBlendingData.length > 0
          ? totalStok / laporanBlendingData.length
          : 0;
      const itemStokRendah = laporanBlendingData.filter(
        (item: any) => Number(item.stokAkhir || 0) < 100
      ).length;
      const statusGudang = itemStokRendah > 0 ? "Perlu Perhatian" : "Stok Aman";

      return `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📦 RINGKASAN BLENDING/GUDANG HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Barang Masuk</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalMasuk.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Pemakaian</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalPakai.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Stok Akhir</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalStok.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Rata-rata Stok</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${rataStok.toFixed(
                1
              )} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Item Stok Rendah (&lt;100)</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${itemStokRendah} item</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Status Gudang</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${
                statusGudang === "Stok Aman" ? "green" : "orange"
              };">${statusGudang}</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }
    // ✅ FIXED: Tampilkan summary default untuk BLENDING/GUDANG tanpa data
    return `
      <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📦 RINGKASAN BLENDING/GUDANG HARIAN</h3>
        <div style="text-align: center; padding: 20px; color: #666;">
          <p>Belum ada data blending/gudang pada tanggal ini</p>
          <p style="font-size: 14px;">Total Entri: ${allEntries.length}</p>
        </div>
      </div>
    `;
  }

  // ✅ KEUANGAN: Summary keuangan - FIXED: Tampilkan meskipun nilai 0
  if (divisionName.includes("KEUANGAN")) {
    const safeSummary = summary || {
      totalPenerimaan: 0,
      totalPengeluaran: 0,
      totalSaldoAkhir: 0,
    };

    return `
      <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">💰 RINGKASAN KEUANGAN HARIAN</h3>
        <table class="summary-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Penerimaan</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${safeSummary.totalPenerimaan.toLocaleString()}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Pengeluaran</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${safeSummary.totalPengeluaran.toLocaleString()}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;">Saldo Akhir</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${safeSummary.totalSaldoAkhir.toLocaleString()}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Entri</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
              allEntries.length
            } transaksi</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // ✅ PEMASARAN: Summary pemasaran
  if (divisionName.includes("PEMASARAN")) {
    let totalTarget = 0;
    let totalRealisasi = 0;
    let totalLaporan = 0;

    // Hitung dari laporan penjualan sales
    if (data.laporanPenjualanSales) {
      data.laporanPenjualanSales.forEach((sales: any) => {
        totalTarget += Number(sales.targetAmount || sales.targetPenjualan || 0);
        totalRealisasi += Number(
          sales.realisasiAmount || sales.realisasiPenjualan || 0
        );
      });
      totalLaporan += data.laporanPenjualanSales.length;
    }

    // Hitung dari laporan penjualan produk
    if (data.laporanPenjualanProduk) {
      data.laporanPenjualanProduk.forEach((produk: any) => {
        totalTarget += Number(produk.targetKuantitas || 0);
        totalRealisasi += Number(produk.realisasiKuantitas || 0);
      });
      totalLaporan += data.laporanPenjualanProduk.length;
    }

    // Hanya tampilkan jika ada data
    if (totalLaporan > 0) {
      const achievement =
        totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
      const status =
        achievement >= 100
          ? "Target Tercapai"
          : achievement >= 80
          ? "Hampir Tercapai"
          : "Perlu Peningkatan";

      return `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">🎯 RINGKASAN PEMASARAN HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Target</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalTarget.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Realisasi</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalRealisasi.toLocaleString()} unit</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Achievement Rate</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${achievement.toFixed(
                1
              )}%</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Status</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${
                achievement >= 100
                  ? "green"
                  : achievement >= 80
                  ? "orange"
                  : "red"
              };">${status}</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Laporan</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalLaporan} entri</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }

    return ""; // Tidak ada data, tidak tampilkan summary
  }

  // HRD: Summary HRD
  if (divisionName.includes("HRD")) {
    if (allEntries.some((entry) => entry.attendanceStatus)) {
      let totalKaryawan = 0;
      let hadirCount = 0;
      let tidakHadirCount = 0;
      let totalAbsentCount = 0;

      allEntries.forEach((entry) => {
        if (entry.attendanceStatus) {
          totalKaryawan++;
          if (entry.attendanceStatus === "HADIR") {
            hadirCount++;
          } else {
            tidakHadirCount++;
          }
        }
        if (entry.absentCount) {
          totalAbsentCount += Number(entry.absentCount);
        }
      });

      const attendanceRate =
        totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;

      return `
        <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">👥 RINGKASAN HRD HARIAN</h3>
          <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Karyawan</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalKaryawan} orang</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Karyawan Hadir</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${hadirCount} orang</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Karyawan Tidak Hadir</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${tidakHadirCount} orang</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Absen</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalAbsentCount} orang</td></tr>
              <tr><td style="border: 1px solid #ddd; padding: 8px;">Tingkat Kehadiran</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${
                attendanceRate >= 90
                  ? "green"
                  : attendanceRate >= 80
                  ? "orange"
                  : "red"
              };">${attendanceRate.toFixed(1)}%</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }
    return ""; // Tidak ada data, tidak tampilkan summary
  }

  // ✅ DEFAULT: Summary umum untuk divisi lainnya
  return `
    <div class="summary-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📊 RINGKASAN TRANSAKSI HARIAN</h3>
      <table class="summary-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metrik</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Divisi</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${divisionName}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Total Entri</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${allEntries.length} transaksi</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Tanggal Laporan</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${data.date}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function generateDetailsSection(data: PDFReportData): string {
  const divisionName = data.divisionName.toUpperCase();
  const allEntries = getAllTransformedEntries(data);

  // ✅ ADD: Debug logging untuk troubleshooting
  console.log("🔍 [PDF DETAILS DEBUG] Division:", divisionName);
  console.log("🔍 [PDF DETAILS DEBUG] All entries received:", allEntries);
  console.log("🔍 [PDF DETAILS DEBUG] Entries count:", allEntries.length);

  let headerColumns = "";

  if (divisionName.includes("KEUANGAN")) {
    headerColumns = "<th>Jenis Transaksi</th><th>Kategori</th><th>Nominal</th>";
  } else if (divisionName.includes("PEMASARAN")) {
    headerColumns =
      "<th>Perusahaan</th><th>Salesperson</th><th>Produk</th><th>Target</th><th>Realisasi</th><th>Achievement</th><th>Kendala</th>";
  } else if (divisionName.includes("PRODUKSI")) {
    headerColumns =
      "<th>Hasil Produksi</th><th>Barang Gagal</th><th>Stock Barang Jadi</th><th>HPP</th><th>HP/Unit</th><th>Kendala</th>";
  } else if (
    divisionName.includes("GUDANG") ||
    divisionName.includes("PERSEDIAAN") ||
    divisionName.includes("BLENDING")
  ) {
    headerColumns =
      "<th>Barang Masuk</th><th>Pemakaian</th><th>Stok Akhir</th><th>Keterangan</th>";
  } else if (divisionName.includes("HRD")) {
    headerColumns =
      "<th>Status Kehadiran</th><th>Tidak Hadir</th><th>Shift</th><th>Jam Lembur</th>";
  } else {
    headerColumns = "<th>Nilai</th>";
  }

  const rows = allEntries
    .map((entry, index) => {
      // ✅ FIXED: Improved account lookup dengan multiple fallbacks yang lebih comprehensive
      let account = data.accounts.find((acc) => {
        return (
          acc.id?.toString() === entry.accountId?.toString() ||
          acc.id === entry.accountId ||
          acc.accountId?.toString() === entry.accountId?.toString()
        );
      });

      // Fallback: gunakan account dari entry jika ada (untuk laporanGudang)
      if (!account && entry.account) {
        account = entry.account;
      }

      // Jika masih tidak ketemu, buat fallback
      if (!account) {
        account = {
          id: entry.accountId,
          accountCode: "N/A",
          accountName: entry.namaAccount || "Unknown Account",
        };
      }

      let dataCells = "";
      if (divisionName.includes("KEUANGAN")) {
        const transactionType = entry.transactionType || "-";
        const nominalValue =
          transactionType === "SALDO_AKHIR"
            ? entry.saldoAkhir ?? entry.nilai
            : entry.nilai;

        // Get kategori for utang/piutang entries
        const kategori = entry.kategori || "-";

        dataCells = `
          <td style="text-align: center;">${transactionType}</td>
          <td style="text-align: center;">${kategori}</td>
          <td style="text-align: right;">${formatCurrency(
            nominalValue || 0
          )}</td>
        `;
      } else if (divisionName.includes("PEMASARAN")) {
        const target = entry.targetAmount || 0;
        const realisasi = entry.realisasiAmount || 0;
        const achievement =
          target > 0 ? ((realisasi / target) * 100).toFixed(1) + "%" : "-";
        const kendala = entry.keteranganKendala || "-";

        // ✅ Enhanced: Handle both legacy sales data and new product data
        const perusahaan =
          entry.namaPerusahaan || entry.salesperson?.perusahaan?.nama || "-";
        const salesperson =
          entry.namaSalesperson ||
          entry.salesperson?.username ||
          entry.salesperson?.nama ||
          "-";
        const produk = entry.namaAccount || account?.accountName || "Produk";

        dataCells = `
        <td style="text-align: left;">${perusahaan}</td>
        <td style="text-align: left;">${salesperson}</td>
        <td style="text-align: left;">${produk}</td>
        <td style="text-align: right;">${target.toLocaleString(
          "id-ID"
        )} Unit</td>
        <td style="text-align: right;">${realisasi.toLocaleString(
          "id-ID"
        )} Unit</td>
        <td style="text-align: center; ${
          achievement.includes("-")
            ? ""
            : achievement.includes("100") || parseFloat(achievement) >= 100
            ? "color: green; font-weight: bold;"
            : parseFloat(achievement) >= 80
            ? "color: orange; font-weight: bold;"
            : "color: red;"
        }">${achievement}</td>
        <td style="text-align: left; ${
          kendala !== "-" ? "color: red; font-style: italic;" : ""
        }">${kendala}</td>
      `;
      } else if (divisionName.includes("PRODUKSI")) {
        const hasil = entry.hasilProduksi || 0;
        const gagal = entry.barangGagal || 0;
        const stockJadi = entry.stockBarangJadi || 0;
        const hpp = entry.hppAmount || 0;
        const hpBarangJadi = entry.hpBarangJadi || 0;
        const hppPerUnit = hasil > 0 ? hpp / hasil : 0;
        const kendala = entry.keteranganKendala || "-";
        dataCells = `
        <td style="text-align: right;">${hasil.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">${gagal.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">${stockJadi.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">${formatCurrency(hpp)}</td>
        <td style="text-align: right;">${formatCurrency(
          hpBarangJadi || hppPerUnit
        )}</td>
        <td style="text-align: left;">${kendala}</td>
      `;
      } else if (
        divisionName.includes("GUDANG") ||
        divisionName.includes("PERSEDIAAN") ||
        divisionName.includes("BLENDING")
      ) {
        const barangMasuk = entry.barangMasuk || 0;
        const pemakaian = entry.pemakaian || 0;
        const stokAkhir = entry.stokAkhir || 0;
        const keterangan = entry.keterangan || "-";

        dataCells = `
        <td style="text-align: right;">${barangMasuk.toLocaleString(
          "id-ID"
        )}</td>
        <td style="text-align: right;">${pemakaian.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">${stokAkhir.toLocaleString("id-ID")}</td>
        <td style="text-align: left;">${keterangan}</td>
      `;
      } else if (divisionName.includes("HRD")) {
        const status = entry.attendanceStatus || "-";
        const absentCount = entry.absentCount || 0;
        const shift = entry.shift || "-";
        const overtime = entry.overtimeHours || 0;
        dataCells = `
        <td style="text-align: center;">${status}</td>
        <td style="text-align: center;">${absentCount} orang</td>
        <td style="text-align: center;">${shift}</td>
        <td style="text-align: right;">${overtime} jam</td>
      `;
      } else {
        dataCells = `
        <td style="text-align: right;">${getNilaiDisplay(
          entry,
          data.accounts
        )}</td>
        `;
      }
      return `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>
          <div style="font-weight: bold; color: #3498db;">${
            account?.accountCode || "-"
          }</div>
          <div style="font-size: 10px; color: #7f8c8d;">${
            account?.accountName || "Unknown Account"
          }</div>
        </td>
        <td>${entry.description || entry.keterangan || "-"}</td>
        ${dataCells}
      </tr>
    `;
    })
    .join("");

  return `
    <div class="details-section">
      <div class="details-title">DETAIL TRANSAKSI</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Akun</th>
            <th>Keterangan</th>
            ${headerColumns}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
