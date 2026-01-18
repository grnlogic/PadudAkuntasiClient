"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ShoppingCart, Target, Users, Package } from "lucide-react";
import {
  getSalespeopleByDivision,
  getLaporanPenjualanProduk,
  getLaporanPenjualanProdukByDate,
  type Account,
} from "@/lib/data";
import { useDivisionData } from "../../shared/hooks/useDivisionData";
import { SummaryCard } from "../../shared/components/SummaryCard";
import { PDFControls } from "../../shared/components/PDFControls";
import LaporanPenjualanWizard from "./LaporanPenjualanWizard";

interface PemasaranJournalProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function PemasaranJournal({
  selectedDate,
  onDateChange,
}: PemasaranJournalProps) {
  // ✅ Helper functions dari backup
  const filterDataForToday = (data: any[]) => {
    const today = new Date().toISOString().split("T")[0];
    return data.filter((laporan: any) => {
      const laporanDate = laporan.tanggalLaporan || laporan.createdAt;
      if (!laporanDate) return false;

      // Normalisasi tanggal ke format YYYY-MM-DD
      const normalizedDate = new Date(laporanDate).toISOString().split("T")[0];
      const normalizedToday = new Date(today).toISOString().split("T")[0];

      return normalizedDate === normalizedToday;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const { user, divisionInfo, accounts, loading, refetchData, companyFilter } =
    useDivisionData(selectedDate);

  const [laporanProdukData, setLaporanProdukData] = useState<any[]>([]);
  const [salespeople, setSalespeople] = useState<any[]>([]);

  // ✅ Load data pemasaran
  const loadPemasaranData = async () => {
    try {
      if (!divisionInfo?.id) return;

      const [produkData, salespeopleData] = await Promise.all([
        getLaporanPenjualanProdukByDate(selectedDate, companyFilter.perusahaanId),
        getSalespeopleByDivision(parseInt(divisionInfo.id)),
      ]);

      console.log(
        `📊 [DEBUG] Loaded ${produkData.length} laporan produk for date: ${selectedDate}`
      );
      setLaporanProdukData(produkData);
      setSalespeople(salespeopleData);
    } catch (error) {
      console.error("Error loading pemasaran data:", error);
    }
  };

  useEffect(() => {
    if (divisionInfo?.id && selectedDate) {
      loadPemasaranData();
    }
  }, [divisionInfo?.id, selectedDate]);

  // ✅ Calculate summary
  const getPemasaranSummary = () => {
    let totalTargetProduk = 0;
    let totalRealisasiProduk = 0;

    // Summary dari laporan produk
    laporanProdukData.forEach((item) => {
      totalTargetProduk += Number(item.targetKuantitas || 0);
      totalRealisasiProduk += Number(item.realisasiKuantitas || 0);
    });

    return {
      totalTargetProduk,
      totalRealisasiProduk,
      jumlahProduk: laporanProdukData.length,
      jumlahSalesperson: salespeople.length,
    };
  };

  const summary = getPemasaranSummary();

  // ✅ PDF Functions dengan enhanced accounts data seperti backup
  const handleDownloadPDF = async () => {
    const { downloadEnhancedPDF } = await import("@/lib/enhanced-pdf");

    // ✅ FIXED: Enhanced accounts data untuk divisi pemasaran
    let enhancedAccounts = accounts;
    enhancedAccounts = accounts.map((account) => ({
      ...account,
      accountCode:
        account.accountCode || account.accountName?.substring(0, 10) || "N/A",
      accountId: account.id, // ✅ Tambahkan accountId untuk konsistensi
    }));

    const reportData = {
      date: selectedDate,
      divisionName: divisionInfo?.name || "DIVISI PEMASARAN & PENJUALAN",
      entries: [], // No regular entries for marketing
      laporanPenjualanProduk: laporanProdukData,
      accounts: enhancedAccounts, // ✅ Gunakan enhanced accounts
      salespeople: salespeople,
      users: [], // Add users array for compatibility
    };

    // ✅ Debug logging untuk memastikan data lengkap

    // ✅ Debug logging untuk memastikan data lengkap
    console.log("📊 PDF Report Data:", {
      date: reportData.date,
      divisionName: reportData.divisionName,
      laporanPenjualanProdukCount: reportData.laporanPenjualanProduk?.length,
      salespeople: reportData.salespeople?.length,
      accounts: reportData.accounts?.length,
      sampleLaporan: reportData.laporanPenjualanProduk?.[0],
    });

    downloadEnhancedPDF(reportData);
  };

  const handlePreviewPDF = async () => {
    const { previewEnhancedPDF } = await import("@/lib/enhanced-pdf");

    // ✅ FIXED: Enhanced accounts data untuk divisi pemasaran
    let enhancedAccounts = accounts;
    enhancedAccounts = accounts.map((account) => ({
      ...account,
      accountCode:
        account.accountCode || account.accountName?.substring(0, 10) || "N/A",
      accountId: account.id, // ✅ Tambahkan accountId untuk konsistensi
    }));

    const reportData = {
      date: selectedDate,
      divisionName: divisionInfo?.name || "DIVISI PEMASARAN & PENJUALAN",
      entries: [], // No regular entries for marketing
      laporanPenjualanProduk: laporanProdukData,
      accounts: enhancedAccounts, // ✅ Gunakan enhanced accounts
      salespeople: salespeople,
      users: [], // Add users array for compatibility
    };

    // ✅ Debug logging untuk memastikan data lengkap

    previewEnhancedPDF(reportData);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin mx-auto mb-4 h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full" />
          <p className="text-gray-600">Loading Pemasaran Journal...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Target vs Realisasi Produk"
          items={[
            {
              label: "Target Produk",
              value: summary.totalTargetProduk,
              color: "blue",
            },
            {
              label: "Realisasi Produk",
              value: summary.totalRealisasiProduk,
              color: "green",
            },
          ]}
        />

        <SummaryCard
          title="Laporan Produk"
          items={[
            {
              label: "Jumlah Laporan",
              value: summary.jumlahProduk,
              color: "purple",
            },
            {
              label: "Produk Berbeda",
              value: new Set(laporanProdukData.map((p) => p.productAccountId))
                .size,
              color: "orange",
            },
          ]}
        />

        <SummaryCard
          title="Tim Penjualan"
          items={[
            {
              label: "Jumlah Salesperson",
              value: summary.jumlahSalesperson,
              color: "blue",
            },
            {
              label: "Aktif Hari Ini",
              value: new Set(laporanProdukData.map((p) => p.namaSalesperson))
                .size,
              color: "green",
            },
          ]}
        />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Divisi Pemasaran & Penjualan
            </CardTitle>
            <PDFControls
              onDownloadPDF={handleDownloadPDF}
              onPreviewPDF={handlePreviewPDF}
              dataCount={summary.jumlahProduk}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-orange-600" />
            <h3 className="text-lg font-semibold">
              Entry Laporan Penjualan Produk
            </h3>
            <Badge variant="secondary" className="ml-2">
              {laporanProdukData.length} laporan
            </Badge>
          </div>
          <LaporanPenjualanWizard />
        </CardContent>
      </Card>
    </div>
  );
}
