// This file has been replaced by simple-pdf.ts
// Please use simple-pdf.ts for PDF generation

export {};
// Utility using HTML to PDF approach
// No external libraries required - uses browser's native print functionality

import jsPDF from "jspdf";
import "jspdf-autotable";
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
}

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface PDFReportData {
  date: string;
  divisionName: string;
  entries: EntriHarian[];
  accounts: Account[];
  summary?: {
    totalPenerimaan: number;
    totalPengeluaran: number;
    totalSaldoAkhir: number;
  };
}

export const generateJournalPDF = (data: PDFReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

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

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN JURNAL HARIAN", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Divisi ${data.divisionName}`, pageWidth / 2, 30, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text(`Tanggal: ${formatDate(data.date)}`, pageWidth / 2, 40, {
    align: "center",
  });

  // Company Info (optional)
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("PT. Padudjaya Putera", 20, 55);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 20, 62);

  let yPosition = 75;

  // Summary Section (for Keuangan division)
  if (data.summary) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN TRANSAKSI", 20, yPosition);
    yPosition += 10;

    const summaryData = [
      ["Total Penerimaan", formatCurrency(data.summary.totalPenerimaan)],
      ["Total Pengeluaran", formatCurrency(data.summary.totalPengeluaran)],
      ["Total Saldo Akhir", formatCurrency(data.summary.totalSaldoAkhir)],
      [
        "Saldo Bersih",
        formatCurrency(
          data.summary.totalPenerimaan - data.summary.totalPengeluaran
        ),
      ],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [["Keterangan", "Jumlah"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [54, 162, 235] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        1: { halign: "right" },
      },
    });

    yPosition = doc.lastAutoTable.finalY + 20;
  }

  // Detail Transactions
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DETAIL TRANSAKSI", 20, yPosition);
  yPosition += 10;

  if (data.entries.length === 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text("Tidak ada transaksi pada tanggal ini.", 20, yPosition);
  } else {
    // Prepare table data
    const tableData = data.entries.map((entry, index) => {
      const account = data.accounts.find((acc) => acc.id === entry.accountId);
      const accountDisplay = account
        ? `${account.accountCode} - ${account.accountName}`
        : "Akun tidak ditemukan";

      let additionalCells = "";
      if (data.divisionName.includes("KEUANGAN")) {
        additionalCells = `
        <td>${(entry as any).transactionType || "-"}</td>
        <td class="currency">${
          (entry as any).transactionType === "SALDO_AKHIR"
            ? formatCurrency((entry as any).saldoAkhir || 0)
            : "-"
        }</td>
      `;
      } else if (data.divisionName.includes("PEMASARAN")) {
        const percentage =
          (entry as any).targetAmount && (entry as any).realisasiAmount
            ? (
                ((entry as any).realisasiAmount / (entry as any).targetAmount) *
                100
              ).toFixed(1) + "%"
            : "-";
        additionalCells = `
        <td class="currency">${
          (entry as any).targetAmount
            ? formatCurrency((entry as any).targetAmount)
            : "-"
        }</td>
        <td class="currency">${
          (entry as any).realisasiAmount
            ? formatCurrency((entry as any).realisasiAmount)
            : "-"
        }</td>
        <td>${percentage}</td>
      `;
      } else if (data.divisionName.includes("PRODUKSI")) {
        const hppPerUnit =
          (entry as any).hppAmount && entry.nilai > 0
            ? formatCurrency((entry as any).hppAmount / entry.nilai)
            : "-";
        additionalCells = `
        <td class="currency">${
          (entry as any).hppAmount
            ? formatCurrency((entry as any).hppAmount)
            : "-"
        }</td>
        <td class="currency">${hppPerUnit}</td>
      `;
      } else if (data.divisionName.includes("GUDANG")) {
        additionalCells = `
        <td class="currency">${
          (entry as any).pemakaianAmount
            ? formatCurrency((entry as any).pemakaianAmount)
            : "-"
        }</td>
        <td class="currency">${
          (entry as any).stokAkhir
            ? formatCurrency((entry as any).stokAkhir)
            : "-"
        }</td>
      `;
      }

      return [
        (index + 1).toString(),
        accountDisplay,
        entry.description || "-",
        formatCurrency(entry.nilai),
        ...additionalCells.split("\n").map((cell) => cell.trim()),
      ];
    });

    // Prepare table headers
    let headers = ["No", "Akun", "Keterangan", "Nilai"];

    if (data.divisionName.includes("KEUANGAN")) {
      headers.push("Jenis Transaksi", "Saldo Akhir");
    } else if (data.divisionName.includes("PEMASARAN")) {
      headers.push("Target", "Realisasi", "Persentase");
    } else if (data.divisionName.includes("PRODUKSI")) {
      headers.push("HPP Total", "HPP/Unit");
    } else if (data.divisionName.includes("GUDANG")) {
      headers.push("Pemakaian", "Stok Akhir");
    }

    doc.autoTable({
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        3: { halign: "right" },
        ...(data.divisionName.includes("KEUANGAN") && {
          4: { halign: "center" },
          5: { halign: "right" },
        }),
        ...(data.divisionName.includes("PEMASARAN") && {
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "center" },
        }),
        ...(data.divisionName.includes("PRODUKSI") && {
          4: { halign: "right" },
          5: { halign: "right" },
        }),
        ...(data.divisionName.includes("GUDANG") && {
          4: { halign: "right" },
          5: { halign: "right" },
        }),
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
  }

  // Footer
  const finalY = doc.lastAutoTable
    ? doc.lastAutoTable.finalY + 20
    : yPosition + 40;

  // Signature area
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dibuat oleh:", 20, finalY);
  doc.text("Diperiksa oleh:", pageWidth / 2 + 20, finalY);

  doc.text("(                              )", 20, finalY + 25);
  doc.text("(                              )", pageWidth / 2 + 20, finalY + 25);

  doc.text(`Admin ${data.divisionName}`, 20, finalY + 30);
  doc.text("Manager", pageWidth / 2 + 20, finalY + 30);

  // Page number
  doc.setFontSize(8);
  doc.text(`Halaman 1`, pageWidth - 30, pageHeight - 10);

  return doc;
};

export const downloadJournalPDF = (data: PDFReportData) => {
  const doc = generateJournalPDF(data);
  const fileName = `Laporan_Jurnal_${data.divisionName}_${data.date.replace(
    /-/g,
    ""
  )}.pdf`;
  doc.save(fileName);
};

export const previewJournalPDF = (data: PDFReportData) => {
  const doc = generateJournalPDF(data);
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

// Alternative PDF generation without external libraries
// Using HTML to PDF approach with print styles

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
      
      ${
        data.summary
          ? `
      <div class="summary-section">
        <div class="summary-title">RINGKASAN TRANSAKSI</div>
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
                    (entry) => (entry as any).transactionType === "PIUTANG_BARU" || (entry as any).transactionType === "SALDO_AKHIR_PIUTANG"
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
                    (entry) => (entry as any).transactionType === "SALDO_AKHIR"
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
                <th>Nilai</th>
                ${
                  data.divisionName.includes("KEUANGAN")
                    ? "<th>Jenis Transaksi</th><th>Saldo Akhir</th>"
                    : ""
                }
                ${
                  data.divisionName.includes("PEMASARAN")
                    ? "<th>Target</th><th>Realisasi</th><th>%</th>"
                    : ""
                }
                ${
                  data.divisionName.includes("PRODUKSI")
                    ? "<th>HPP Total</th><th>HPP/Unit</th>"
                    : ""
                }
                ${
                  data.divisionName.includes("GUDANG")
                    ? "<th>Pemakaian</th><th>Stok Akhir</th>"
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${data.entries
                .map((entry, index) => {
                  const account = data.accounts.find(
                    (acc) => acc.id === entry.accountId
                  );
                  const accountDisplay = account
                    ? `${account.accountCode} - ${account.accountName}`
                    : "Akun tidak ditemukan";

                  let additionalCells = "";
                  if (data.divisionName.includes("KEUANGAN")) {
                    additionalCells = `
                    <td>${(entry as any).transactionType || "-"}</td>
                    <td class="currency">${
                      (entry as any).transactionType === "SALDO_AKHIR"
                        ? formatCurrency((entry as any).saldoAkhir || 0)
                        : "-"
                    }</td>
                  `;
                  } else if (data.divisionName.includes("PEMASARAN")) {
                    const percentage =
                      (entry as any).targetAmount &&
                      (entry as any).realisasiAmount
                        ? (
                            ((entry as any).realisasiAmount /
                              (entry as any).targetAmount) *
                            100
                          ).toFixed(1) + "%"
                        : "-";
                    additionalCells = `
                    <td class="currency">${
                      (entry as any).targetAmount
                        ? formatCurrency((entry as any).targetAmount)
                        : "-"
                    }</td>
                    <td class="currency">${
                      (entry as any).realisasiAmount
                        ? formatCurrency((entry as any).realisasiAmount)
                        : "-"
                    }</td>
                    <td>${percentage}</td>
                  `;
                  } else if (data.divisionName.includes("PRODUKSI")) {
                    const hppPerUnit =
                      (entry as any).hppAmount && entry.nilai > 0
                        ? formatCurrency((entry as any).hppAmount / entry.nilai)
                        : "-";
                    additionalCells = `
                    <td class="currency">${
                      (entry as any).hppAmount
                        ? formatCurrency((entry as any).hppAmount)
                        : "-"
                    }</td>
                    <td class="currency">${hppPerUnit}</td>
                  `;
                  } else if (data.divisionName.includes("GUDANG")) {
                    additionalCells = `
                    <td class="currency">${
                      (entry as any).pemakaianAmount
                        ? formatCurrency((entry as any).pemakaianAmount)
                        : "-"
                    }</td>
                    <td class="currency">${
                      (entry as any).stokAkhir
                        ? formatCurrency((entry as any).stokAkhir)
                        : "-"
                    }</td>
                  `;
                  }

                  return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${accountDisplay}</td>
                    <td>${entry.description || "-"}</td>
                    <td class="currency">${formatCurrency(entry.nilai)}</td>
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
