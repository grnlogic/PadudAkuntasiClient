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
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

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
        <div class="company-name">PT. PADUDJA YAPUTERA</div>
        <div class="report-title">LAPORAN HARIAN DIVISI ${data.divisionName.toUpperCase()}</div>
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
        <p>Sistem Akuntansi PT. Padudja Yaputera</p>
      </div>
    </body>
    </html>
  `;
}

function generateSummarySection(data: PDFReportData): string {
  const divisionName = data.divisionName.toUpperCase();

  // KEUANGAN Summary
  if (data.summary) {
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
      </div>
    `;
  }

  // PEMASARAN Summary
  if (divisionName.includes("PEMASARAN")) {
    const totalTarget = data.entries.reduce((sum, entry) => {
      const target = (entry as any).targetAmount || 0;
      return sum + Number(target);
    }, 0);

    const totalRealisasi = data.entries.reduce((sum, entry) => {
      const realisasi = (entry as any).realisasiAmount || 0;
      return sum + Number(realisasi);
    }, 0);

    const achievementRate =
      totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

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
              <td style="text-align: right;">${formatCurrency(totalTarget)}</td>
            </tr>
            <tr>
              <td>Total Realisasi</td>
              <td style="text-align: right;">${formatCurrency(
                totalRealisasi
              )}</td>
            </tr>
            <tr>
              <td>Achievement Rate</td>
              <td style="text-align: right;">${achievementRate.toFixed(1)}%</td>
            </tr>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td>Status</td>
              <td style="text-align: right;">${
                achievementRate >= 100 ? "Target Tercapai" : "Belum Tercapai"
              }</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // PRODUKSI Summary
  if (divisionName.includes("PRODUKSI")) {
    const totalProduksi = data.entries.reduce((sum, entry) => {
      return sum + Number(entry.nilai);
    }, 0);

    const totalHPP = data.entries.reduce((sum, entry) => {
      const hpp = (entry as any).hppAmount || 0;
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

  // GUDANG Summary
  if (divisionName.includes("GUDANG")) {
    const totalPemakaian = data.entries.reduce((sum, entry) => {
      const pemakaian = (entry as any).pemakaianAmount || 0;
      return sum + Number(pemakaian);
    }, 0);

    const validEntries = data.entries.filter(
      (entry) => (entry as any).stokAkhir != null
    );
    const avgStok =
      validEntries.length > 0
        ? validEntries.reduce((sum, entry) => {
            const stok = (entry as any).stokAkhir || 0;
            return sum + Number(stok);
          }, 0) / validEntries.length
        : 0;

    const lowStockCount = data.entries.filter((entry) => {
      const stok = (entry as any).stokAkhir || 0;
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
              <td>Total Pemakaian</td>
              <td style="text-align: right;">${totalPemakaian.toLocaleString(
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
    const totalKaryawan = data.entries.length;
    const hadirCount = data.entries.filter((entry) => {
      const status = (entry as any).attendanceStatus;
      return status === "HADIR";
    }).length;

    const attendanceRate =
      totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;

    const totalOvertime = data.entries.reduce((sum, entry) => {
      const overtime = (entry as any).overtimeHours || 0;
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

  let headerColumns = "";

  if (divisionName.includes("KEUANGAN")) {
    headerColumns = "<th>Jenis Transaksi</th><th>Nominal</th>";
  } else if (divisionName.includes("PEMASARAN")) {
    headerColumns = "<th>Target</th><th>Realisasi</th><th>Achievement</th>";
  } else if (divisionName.includes("PRODUKSI")) {
    headerColumns = "<th>Produksi (Unit)</th><th>HPP</th><th>HPP/Unit</th>";
  } else if (divisionName.includes("GUDANG")) {
    headerColumns = "<th>Pemakaian</th><th>Stok Akhir</th><th>Status</th>";
  } else if (divisionName.includes("HRD")) {
    headerColumns =
      "<th>Status Kehadiran</th><th>Jam Lembur</th><th>Shift</th>";
  } else {
    headerColumns = "<th>Nilai</th>";
  }

  const rows = data.entries
    .map((entry, index) => {
      const account = data.accounts.find((acc) => acc.id === entry.accountId);

      let dataCells = "";

      if (divisionName.includes("KEUANGAN")) {
        const transactionType = (entry as any).transactionType || "-";
        const nilai = entry.nilai || 0;
        dataCells = `
        <td style="text-align: center;">${transactionType}</td>
        <td style="text-align: right;">${formatCurrency(nilai)}</td>
      `;
      } else if (divisionName.includes("PEMASARAN")) {
        const target = (entry as any).targetAmount || 0;
        const realisasi = (entry as any).realisasiAmount || 0;
        const achievement =
          target > 0 ? ((realisasi / target) * 100).toFixed(1) + "%" : "-";
        dataCells = `
        <td style="text-align: right;">${formatCurrency(target)}</td>
        <td style="text-align: right;">${formatCurrency(realisasi)}</td>
        <td style="text-align: center;">${achievement}</td>
      `;
      } else if (divisionName.includes("PRODUKSI")) {
        const produksi = entry.nilai || 0;
        const hpp = (entry as any).hppAmount || 0;
        const hppPerUnit = produksi > 0 ? hpp / produksi : 0;
        dataCells = `
        <td style="text-align: right;">${produksi.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">${formatCurrency(hpp)}</td>
        <td style="text-align: right;">${formatCurrency(hppPerUnit)}</td>
      `;
      } else if (divisionName.includes("GUDANG")) {
        const pemakaian = (entry as any).pemakaianAmount || 0;
        const stokAkhir = (entry as any).stokAkhir || 0;
        const status = stokAkhir < 100 ? "Stok Rendah" : "Stok Aman";
        dataCells = `
        <td style="text-align: right;">${pemakaian.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">${stokAkhir.toLocaleString("id-ID")}</td>
        <td style="text-align: center;">${status}</td>
      `;
      } else if (divisionName.includes("HRD")) {
        const status = (entry as any).attendanceStatus || "-";
        const overtime = (entry as any).overtimeHours || 0;
        const shift = (entry as any).shift || "-";
        dataCells = `
        <td style="text-align: center;">${status}</td>
        <td style="text-align: right;">${overtime} jam</td>
        <td style="text-align: center;">${shift}</td>
      `;
      } else {
        dataCells = `
        <td style="text-align: right;">${formatCurrency(entry.nilai)}</td>
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
        <td>${entry.description || "-"}</td>
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
