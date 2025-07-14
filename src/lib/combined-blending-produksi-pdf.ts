// PDF gabungan khusus untuk DIVISI BLENDING PERSEDIAAN BAHAN BAKU
// Menghasilkan 3 summary card (Total Produksi, Total Barang Masuk, Total Pemakaian) dan 2 tabel detail (Produksi & Persediaan)

export interface CombinedBlendingProduksiPDFData {
  date: string;
  divisionName: string;
  laporanProduksiData: Array<{
    accountName: string;
    hasilProduksi: number;
    barangGagal: number;
    stockBarangJadi: number;
    hpBarangJadi: number;
    keteranganKendala: string;
  }>;
  laporanBlendingData: Array<{
    accountName: string;
    barangMasuk: number;
    pemakaian: number;
    stokAkhir: number;
    keteranganGudang: string;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateCombinedBlendingProduksiHTML(
  data: CombinedBlendingProduksiPDFData
) {
  // Summary values
  const totalHasilProduksi = data.laporanProduksiData.reduce(
    (sum, item) => sum + (item.hasilProduksi || 0),
    0
  );
  const totalBarangMasuk = data.laporanBlendingData.reduce(
    (sum, item) => sum + (item.barangMasuk || 0),
    0
  );
  const totalPemakaian = data.laporanBlendingData.reduce(
    (sum, item) => sum + (item.pemakaian || 0),
    0
  );
  const totalBarangGagal = data.laporanProduksiData.reduce(
    (sum, item) => sum + (item.barangGagal || 0),
    0
  );
  const totalStockBarangJadi = data.laporanProduksiData.reduce(
    (sum, item) => sum + (item.stockBarangJadi || 0),
    0
  );
  const totalHPBarangJadi = data.laporanProduksiData.reduce(
    (sum, item) => sum + (item.hpBarangJadi || 0),
    0
  );
  const totalStokAkhir = data.laporanBlendingData.reduce(
    (sum, item) => sum + (item.stokAkhir || 0),
    0
  );

  // Hilangkan kata 'BLENDING' dari divisionName untuk header
  let divisionHeader = data.divisionName
    .replace(/ ?BLENDING ?/gi, " ")
    .replace(/  +/g, " ")
    .replace(/^ | $/g, "");
  if (divisionHeader === "") divisionHeader = data.divisionName; // fallback jika kosong

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Gabungan Produksi & Persediaan</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { font-size: 20px; margin-bottom: 4px; }
        .header h2 { font-size: 14px; color: #555; margin-bottom: 8px; }
        .summary-cards { display: flex; gap: 16px; margin-bottom: 24px; }
        .summary-card { flex: 1; background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 4px #0001; }
        .summary-label { font-size: 12px; color: #888; margin-bottom: 4px; }
        .summary-value { font-size: 20px; font-weight: bold; color: #2c3e50; }
        .summary-unit { font-size: 11px; color: #888; }
        .section-title { font-size: 15px; font-weight: bold; margin: 24px 0 8px 0; color: #2c3e50; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; }
        th { background: #3498db; color: #fff; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { text-align: center; color: #888; font-size: 10px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LAPORAN GABUNGAN PRODUKSI & PERSEDIAAN</h1>
        <h2>${divisionHeader}</h2>
        <div>Tanggal: ${formatDate(data.date)}</div>
      </div>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">Total Hasil Produksi</div>
          <div class="summary-value">${totalHasilProduksi.toLocaleString()}</div>
          <div class="summary-unit">unit</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Barang Masuk</div>
          <div class="summary-value">${totalBarangMasuk.toLocaleString()}</div>
          <div class="summary-unit">unit</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Pemakaian</div>
          <div class="summary-value">${totalPemakaian.toLocaleString()}</div>
          <div class="summary-unit">unit</div>
        </div>
      </div>
      <div class="section-title">TABEL LAPORAN PRODUKSI</div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Akun</th>
            <th>Hasil Produksi</th>
            <th>Barang Gagal</th>
            <th>Stock Barang Jadi</th>
            <th>HP Barang Jadi</th>
            <th>Keterangan Kendala</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.laporanProduksiData.length === 0
              ? `<tr><td colspan="7" style="text-align:center; color:#888;">Tidak ada data produksi</td></tr>`
              : data.laporanProduksiData
                  .map(
                    (item, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${item.accountName}</td>
                <td style="text-align:right;">${item.hasilProduksi.toLocaleString()}</td>
                <td style="text-align:right;">${item.barangGagal.toLocaleString()}</td>
                <td style="text-align:right;">${item.stockBarangJadi.toLocaleString()}</td>
                <td style="text-align:right;">${formatCurrency(
                  item.hpBarangJadi
                )}</td>
                <td>${item.keteranganKendala || "-"}</td>
              </tr>
            `
                  )
                  .join("")
          }
        </tbody>
      </table>
      <div class="section-title">TABEL LAPORAN PERSEDIAAN</div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Akun</th>
            <th>Barang Masuk</th>
            <th>Pemakaian</th>
            <th>Stok Akhir</th>
            <th>Keterangan Gudang</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.laporanBlendingData.length === 0
              ? `<tr><td colspan="6" style="text-align:center; color:#888;">Tidak ada data persediaan</td></tr>`
              : data.laporanBlendingData
                  .map(
                    (item, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${item.accountName}</td>
                <td style="text-align:right;">${item.barangMasuk.toLocaleString()}</td>
                <td style="text-align:right;">${item.pemakaian.toLocaleString()}</td>
                <td style="text-align:right;">${item.stokAkhir.toLocaleString()}</td>
                <td>${item.keteranganGudang || "-"}</td>
              </tr>
            `
                  )
                  .join("")
          }
        </tbody>
      </table>
      <div class="footer">
        Dicetak otomatis pada ${new Date().toLocaleString("id-ID")}<br>
        Sistem Akuntansi PT. Padudjaya Putera
      </div>
    </body>
    </html>
  `;
}

export function downloadCombinedBlendingProduksiPDF(
  data: CombinedBlendingProduksiPDFData
) {
  const html = generateCombinedBlendingProduksiHTML(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
}

export function previewCombinedBlendingProduksiPDF(
  data: CombinedBlendingProduksiPDFData
) {
  const html = generateCombinedBlendingProduksiHTML(data);
  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
}
