// Clean PDF utility file
// Uses HTML to PDF approach without external dependencies

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

// Re-export functions from simple-pdf
export const downloadSimplePDF = async (data: SimplePDFReportData) => {
  const { downloadSimplePDF: download } = await import("./simple-pdf");
  return download(data);
};

export const previewSimplePDF = async (data: SimplePDFReportData) => {
  const { previewSimplePDF: preview } = await import("./simple-pdf");
  return preview(data);
};
