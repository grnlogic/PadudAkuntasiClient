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

    // Pastikan semua laporan sales ditambahkan
    if (data.laporanPenjualanSales && data.laporanPenjualanSales.length > 0) {
      console.log(
        "Processing laporanPenjualanSales:",
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

    // Pastikan semua laporan produk ditambahkan
    if (data.laporanPenjualanProduk && data.laporanPenjualanProduk.length > 0) {
      console.log(
        "Processing laporanPenjualanProduk:",
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
      "Total transformed entries for PEMASARAN:",
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
  const divisionName = data.divisionName.toUpperCase();

  // ✅ FIXED: Gunakan data yang sudah ditransform
  const allEntries = getAllTransformedEntries(data);

  // KEUANGAN Summary
  if (data.summary) {
    // Ringkasan transaksi keuangan
    let piutangSummary = "";
    let utangSummary = "";
    if (divisionName.includes("KEUANGAN")) {
      // Hitung total piutang dari data yang sudah ditransform
      const totalPiutangBaru = allEntries
        .filter((entry) => entry.transactionType === "PIUTANG_BARU")
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);
      const totalPiutangTertagih = allEntries
        .filter((entry) => entry.transactionType === "PIUTANG_TERTAGIH")
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);
      const totalPiutangMacet = allEntries
        .filter((entry) => entry.transactionType === "PIUTANG_MACET")
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);
      const totalSaldoAkhirPiutang = allEntries
        .filter((entry) => entry.transactionType === "SALDO_AKHIR")
        .reduce(
          (sum, entry) => sum + Number(entry.saldoAkhir || entry.nilai || 0),
          0
        );

      piutangSummary = `
        <div class="summary-title" style="margin-top:24px;">RINGKASAN PIUTANG</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th style="text-align: right;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Piutang Baru</td>
              <td style="text-align: right;">${formatCurrency(
                totalPiutangBaru
              )}</td>
            </tr>
            <tr>
              <td>Piutang Tertagih</td>
              <td style="text-align: right;">${formatCurrency(
                totalPiutangTertagih
              )}</td>
            </tr>
            <tr>
              <td>Piutang Macet</td>
              <td style="text-align: right;">${formatCurrency(
                totalPiutangMacet
              )}</td>
            </tr>
            <tr>
              <td>Saldo Akhir Piutang</td>
              <td style="text-align: right;">${formatCurrency(
                totalSaldoAkhirPiutang
              )}</td>
            </tr>
          </tbody>
        </table>
      `;

      // ✅ FIXED: Hitung total utang dari data yang sudah ditransform
      const totalUtangBaru = allEntries
        .filter((entry) => entry.transactionType === "UTANG_BARU")
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);
      const totalUtangDibayar = allEntries
        .filter((entry) => entry.transactionType === "UTANG_DIBAYAR")
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);
      const totalBahanBaku = allEntries
        .filter((entry) => entry.kategori === "BAHAN_BAKU")
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);
      const totalBank = allEntries
        .filter(
          (entry) =>
            entry.kategori === "BANK_HM" || entry.kategori === "BANK_HENRY"
        )
        .reduce((sum, entry) => sum + Number(entry.nilai || 0), 0);

      utangSummary = `
        <div class="summary-title" style="margin-top:24px;">RINGKASAN UTANG</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th style="text-align: right;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Utang Baru</td>
              <td style="text-align: right;">${formatCurrency(
                totalUtangBaru
              )}</td>
            </tr>
            <tr>
              <td>Utang Dibayar</td>
              <td style="text-align: right;">${formatCurrency(
                totalUtangDibayar
              )}</td>
            </tr>
            <tr>
              <td>Bahan Baku</td>
              <td style="text-align: right;">${formatCurrency(
                totalBahanBaku
              )}</td>
            </tr>
            <tr>
              <td>Bank (HM + Henry)</td>
              <td style="text-align: right;">${formatCurrency(totalBank)}</td>
            </tr>
          </tbody>
        </table>
      `;
    }
    return `
      <div class="summary-section keuangan">
        <div class="summary-title">RINGKASAN TRANSAKSI KEUANGAN</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Keterangan</th>
              <th style="text-align: right;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Penerimaan</td>
              <td style="text-align: right;">${formatCurrency(
                data.summary.totalPenerimaan
              )}</td>
            </tr>
            <tr>
              <td>Total Pengeluaran</td>
              <td style="text-align: right;">${formatCurrency(
                data.summary.totalPengeluaran
              )}</td>
            </tr>
            <tr>
              <td>Total Saldo Akhir</td>
              <td style="text-align: right;">${formatCurrency(
                data.summary.totalSaldoAkhir
              )}</td>
            </tr>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td>Saldo Bersih</td>
              <td style="text-align: right;">${formatCurrency(
                data.summary.totalPenerimaan - data.summary.totalPengeluaran
              )}</td>
            </tr>
          </tbody>
        </table>
        ${piutangSummary}
        ${utangSummary}
      </div>
    `;
  }

  // PEMASARAN Summary
  if (divisionName.includes("PEMASARAN")) {
    // ✅ Enhanced: Calculate from both laporanPenjualanSales and laporanPenjualanProduk
    let totalTarget = 0;
    let totalRealisasi = 0;
    let totalRetur = 0;
    let totalKendala = 0;

    // From regular entries (legacy)
    allEntries.forEach((entry) => {
      totalTarget += Number(entry.targetAmount) || 0;
      totalRealisasi += Number(entry.realisasiAmount) || 0;
    });

    // ✅ NEW: From laporanPenjualanProduk (wizard data)
    if (data.laporanPenjualanProduk) {
      data.laporanPenjualanProduk.forEach((produk: any) => {
        totalTarget += Number(produk.targetKuantitas) || 0;
        totalRealisasi += Number(produk.realisasiKuantitas) || 0;
        if (produk.keteranganKendala && produk.keteranganKendala.trim()) {
          totalKendala += 1;
        }
      });
    }

    // From laporanPenjualanSales (legacy)
    if (data.laporanPenjualanSales) {
      data.laporanPenjualanSales.forEach((sales: any) => {
        totalTarget += Number(sales.targetPenjualan) || 0;
        totalRealisasi += Number(sales.realisasiPenjualan) || 0;
        totalRetur += Number(sales.returPenjualan) || 0;
      });
    }

    const achievementRate =
      totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

    const totalLaporan =
      (data.laporanPenjualanSales?.length || 0) +
      (data.laporanPenjualanProduk?.length || 0);

    return `
      <div class="summary-section pemasaran">
        <div class="summary-title">RINGKASAN PERFORMANCE PEMASARAN</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Metrik</th>
              <th style="text-align: right;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Target</td>
              <td style="text-align: right;">${totalTarget.toLocaleString(
                "id-ID"
              )} Unit</td>
            </tr>
            <tr>
              <td>Total Realisasi</td>
              <td style="text-align: right;">${totalRealisasi.toLocaleString(
                "id-ID"
              )} Unit</td>
            </tr>
            ${
              totalRetur > 0
                ? `
            <tr>
              <td>Total Retur</td>
              <td style="text-align: right;">${totalRetur.toLocaleString(
                "id-ID"
              )} Unit</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td>Achievement Rate</td>
              <td style="text-align: right;">${achievementRate.toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Total Laporan</td>
              <td style="text-align: right;">${totalLaporan} Laporan</td>
            </tr>
            ${
              totalKendala > 0
                ? `
            <tr>
              <td>Laporan dengan Kendala</td>
              <td style="text-align: right;">${totalKendala} Laporan</td>
            </tr>
            `
                : ""
            }
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td>Status</td>
              <td style="text-align: right;">${
                achievementRate >= 100
                  ? "Target Tercapai ✅"
                  : achievementRate >= 80
                  ? "Mendekati Target 🎯"
                  : "Perlu Ditingkatkan 📈"
              }</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // PRODUKSI Summary
  if (divisionName.includes("PRODUKSI")) {
    const totalProduksi = allEntries.reduce((sum, entry) => {
      return sum + Number(entry.nilai || 0);
    }, 0);

    // GUNAKAN hpBarangJadi jika ada, fallback ke hppAmount
    const totalHPP = allEntries.reduce((sum, entry) => {
      const hpp = entry.hpBarangJadi || entry.hppAmount || 0;
      return sum + Number(hpp);
    }, 0);

    const hppPerUnit = totalProduksi > 0 ? totalHPP / totalProduksi : 0;

    return `
      <div class="summary-section produksi">
        <div class="summary-title">RINGKASAN PRODUKSI HARIAN</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Metrik</th>
              <th style="text-align: right;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Produksi</td>
              <td style="text-align: right;">${totalProduksi.toLocaleString(
                "id-ID"
              )} unit</td>
            </tr>
            <tr>
              <td>Total HPP</td>
              <td style="text-align: right;">${formatCurrency(totalHPP)}</td>
            </tr>
            <tr>
              <td>HPP per Unit</td>
              <td style="text-align: right;">${formatCurrency(hppPerUnit)}</td>
            </tr>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td>Status Efisiensi</td>
              <td style="text-align: right;">${
                hppPerUnit < 5000 ? "Efisien" : "Perlu Review"
              }</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // GUDANG/PERSEDIAAN_BAHAN_BAKU Summary
  if (
    divisionName.includes("GUDANG") ||
    divisionName.includes("PERSEDIAAN") ||
    divisionName.includes("BLENDING")
  ) {
    // ✅ FIXED: Use same fallback logic as detail table
    const totalBarangMasuk = allEntries.reduce((sum, entry) => {
      const barangMasuk = entry.barangMasuk || 0;
      return sum + Number(barangMasuk);
    }, 0);

    const totalPemakaian = allEntries.reduce((sum, entry) => {
      // ✅ FIXED: Use same fallback as detail table
      const pemakaian = entry.pemakaian || 0;
      return sum + Number(pemakaian);
    }, 0);

    const totalStokAkhir = allEntries.reduce((sum, entry) => {
      const stokAkhir = entry.stokAkhir || 0;
      return sum + Number(stokAkhir);
    }, 0);

    const validEntries = allEntries.filter((entry) => entry.stokAkhir != null);
    const avgStok =
      validEntries.length > 0
        ? validEntries.reduce((sum, entry) => {
            const stok = entry.stokAkhir || 0;
            return sum + Number(stok);
          }, 0) / validEntries.length
        : 0;

    const lowStockCount = allEntries.filter((entry) => {
      const stok = entry.stokAkhir || 0;
      return Number(stok) < 100;
    }).length;

    return `
      <div class="summary-section gudang">
        <div class="summary-title">RINGKASAN INVENTORI HARIAN</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Metrik</th>
              <th style="text-align: right;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Barang Masuk</td>
              <td style="text-align: right;">${totalBarangMasuk.toLocaleString(
                "id-ID"
              )} unit</td>
            </tr>
            <tr>
              <td>Total Pemakaian</td>
              <td style="text-align: right;">${totalPemakaian.toLocaleString(
                "id-ID"
              )} unit</td>
            </tr>
            <tr>
              <td>Total Stok Akhir</td>
              <td style="text-align: right;">${totalStokAkhir.toLocaleString(
                "id-ID"
              )} unit</td>
            </tr>
            <tr>
              <td>Rata-rata Stok</td>
              <td style="text-align: right;">${avgStok.toLocaleString(
                "id-ID"
              )} unit</td>
            </tr>
            <tr>
              <td>Item Stok Rendah</td>
              <td style="text-align: right;">${lowStockCount} item</td>
            </tr>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td>Status Gudang</td>
              <td style="text-align: right;">${
                lowStockCount > 0 ? "Perlu Restock" : "Stok Aman"
              }</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // HRD Summary
  if (divisionName.includes("HRD")) {
    const totalKaryawan = allEntries.length;
    const hadirCount = allEntries.filter((entry) => {
      const status = entry.attendanceStatus;
      return status === "HADIR";
    }).length;

    const attendanceRate =
      totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;

    const totalOvertime = allEntries.reduce((sum, entry) => {
      const overtime = entry.overtimeHours || 0;
      return sum + Number(overtime);
    }, 0);

    return `
      <div class="summary-section hrd">
        <div class="summary-title">RINGKASAN KEHADIRAN HARIAN</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Metrik</th>
              <th style="text-align: right;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Karyawan</td>
              <td style="text-align: right;">${totalKaryawan} orang</td>
            </tr>
            <tr>
              <td>Karyawan Hadir</td>
              <td style="text-align: right;">${hadirCount} orang</td>
            </tr>
            <tr>
              <td>Tingkat Kehadiran</td>
              <td style="text-align: right;">${attendanceRate.toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Total Jam Lembur</td>
              <td style="text-align: right;">${totalOvertime} jam</td>
            </tr>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td>Status Kehadiran</td>
              <td style="text-align: right;">${
                attendanceRate >= 90
                  ? "Excellent"
                  : attendanceRate >= 80
                  ? "Good"
                  : "Needs Improvement"
              }</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  return "";
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
    headerColumns = "<th>Jenis Transaksi</th><th>Nominal</th>";
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
        dataCells = `
          <td style="text-align: center;">${transactionType}</td>
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
