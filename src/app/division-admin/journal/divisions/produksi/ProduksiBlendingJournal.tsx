"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  MinusCircle,
  Save,
  AlertCircle,
  CheckCircle,
  Factory,
  Package,
  Trash2,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";
import { getAccountsByDivision } from "@/lib/data";
import { laporanProduksiAPI, laporanGudangAPI } from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { downloadSimplePDF, previewSimplePDF } from "@/lib/pdf-clean";
import { getCurrentUser } from "@/lib/auth";
import type { Account } from "@/lib/data";
import {
  downloadCombinedBlendingProduksiPDF,
  previewCombinedBlendingProduksiPDF,
} from "@/lib/combined-blending-produksi-pdf";
import { SummaryCard } from "../../shared/components/SummaryCard";

interface ProduksiBlendingEntry {
  id: string;
  accountId: number;
  accountName: string;

  // Fields untuk Divisi Produksi
  hasilProduksi: string;
  barangGagal: string;
  stockBarangJadi: string;
  hpBarangJadi: string;
  keteranganKendala: string;

  // Fields untuk Divisi Blending/Gudang
  barangMasuk: string; // sebelumnya stok_awal
  pemakaian: string;
  stokAkhir: string;
  keteranganGudang: string; // sebelumnya kondisi_gudang
}

interface ProduksiBlendingJournalProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function ProduksiBlendingJournal({
  selectedDate,
  onDateChange,
}: ProduksiBlendingJournalProps) {
  const user = getCurrentUser();

  // Mock userDivision - akan diganti dengan data dari context/props
  const userDivision = user?.division || {
    id: "1",
    name: "DIVISI PRODUKSI",
  };

  const [tanggalLaporan, setTanggalLaporan] = useState(selectedDate);
  const [entries, setEntries] = useState<ProduksiBlendingEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Determine default tab based on division name
  const isInventoryDivision = React.useMemo(() => {
    const name = userDivision.name.toUpperCase();
    return (
      name.includes("PERSEDIAAN") ||
      name.includes("GUDANG") ||
      name.includes("BLENDING")
    );
  }, [userDivision.name]);

  const [activeTab, setActiveTab] = useState<"produksi" | "blending">(
    isInventoryDivision ? "blending" : "produksi"
  );

  // Helper function untuk debugging nama akun
  const getAccountName = (item: any) => {
    // Untuk laporan produksi (menggunakan product_name)
    if (item.product_name) return item.product_name;

    // Untuk laporan gudang/persediaan (menggunakan account_name)
    if (item.account_name) return item.account_name;

    // Fallback untuk accountName (jika ada)
    if (item.accountName) return item.accountName;

    console.error("Account name not found:", {
      item_keys: Object.keys(item),
      product_name: item.product_name,
      account_name: item.account_name,
      accountName: item.accountName,
      account: item.account,
      full_item: item,
    });
    return `ERROR: No account name (ID: ${item.id || "unknown"})`;
  };

  // State untuk data tabel
  const [laporanProduksiData, setLaporanProduksiData] = useState<any[]>([]);
  const [laporanBlendingData, setLaporanBlendingData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ✅ NEW: Helper function untuk filtering berdasarkan perusahaan_id
  const filterDataByCompany = (data: any[]) => {
    const perusahaanId = user?.perusahaan_id;

    console.log("🔍 PRODUKSI/BLENDING Filter Debug:", {
      userId: user?.id,
      username: user?.username,
      perusahaanId: perusahaanId,
      totalDataCount: data.length,
      firstItemSample: data[0],
    });

    // No filtering for SUPER_ADMIN (no perusahaan_id)
    if (!perusahaanId) {
      console.log("🔓 No company filter - SUPER_ADMIN mode");
      return data;
    }

    const filtered = data.filter((item) => {
      // ✅ NEW: Check perusahaan_id from API response
      const itemPerusahaanId = item.perusahaan_id || item.perusahaanId;
      return itemPerusahaanId === perusahaanId;
    });

    console.log("🏢 Company Filter Applied:", {
      perusahaanId: perusahaanId,
      totalData: data.length,
      filteredData: filtered.length,
      sampleItems: filtered.slice(0, 5).map((item) => ({
        id: item.id,
        product_code: item.product_code,
        account_code: item.account_code,
        perusahaan_id: item.perusahaan_id,
      })),
    });

    return filtered;
  };

  // Helper function untuk filter data berdasarkan tanggal yang dipilih
  const filterDataForDate = (data: any[], targetDate: string) => {
    console.log("🔍 Debug Filter Data:", {
      totalData: data.length,
      targetDate: targetDate,
      sampleDates: data.slice(0, 5).map((item) => ({
        id: item.id,
        tanggalLaporan: item.tanggalLaporan,
        tanggal_laporan: item.tanggal_laporan,
        createdAt: item.createdAt,
      })),
    });

    const filtered = data.filter((laporan: any) => {
      const laporanDate =
        laporan.tanggalLaporan || laporan.tanggal_laporan || laporan.createdAt;

      if (!laporanDate) return false;

      const normalizedDate = new Date(laporanDate).toISOString().split("T")[0];
      const normalizedTargetDate = new Date(targetDate)
        .toISOString()
        .split("T")[0];

      const matches = normalizedDate === normalizedTargetDate;

      // Debug untuk item test kita
      if (laporan.id === 4708 || laporan.id === 4707) {
        console.log(`📅 Date test item ${laporan.id}:`, {
          laporanDate,
          normalizedDate,
          normalizedTargetDate,
          matches,
        });
      }

      return matches;
    });

    console.log("✅ Filter Result:", {
      filteredCount: filtered.length,
      targetDate: targetDate,
      filteredIds: filtered.map((item) => item.id),
    });

    return filtered;
  };

  // Check if division is production or blending
  const isProduksiOrBlending = React.useMemo(() => {
    const name = userDivision.name.toUpperCase();
    return (
      name.includes("PRODUKSI") ||
      name.includes("BLENDING") ||
      name.includes("PERSEDIAAN") ||
      name.includes("GUDANG")
    );
  }, [userDivision.name]);

  // Helper untuk deteksi divisi gabungan
  const isBlendingGabungan =
    userDivision.name === "DIVISI BLENDING PERSEDIAAN BAHAN BAKU" ||
    userDivision.name === "BLENDING PERSEDIAAN BAHAN BAKU";

  // Set initial tab based on user division
  // Set initial tab based on user division (handles async updates)
  useEffect(() => {
    if (isInventoryDivision) {
      setActiveTab("blending");
    } else {
      setActiveTab("produksi");
    }
  }, [isInventoryDivision]);

  useEffect(() => {
    if (isProduksiOrBlending) {
      loadAccounts();
      setTanggalLaporan(selectedDate);
    }
  }, [userDivision.id, isProduksiOrBlending, selectedDate]);

  // Sync dengan selectedDate dari parent
  useEffect(() => {
    setTanggalLaporan(selectedDate);
    console.log("🎯 ProduksiBlendingJournal - Date Changed:", {
      selectedDate,
      activeTab,
    });
    loadLaporanData();
  }, [selectedDate]);

  // Fungsi untuk memuat data laporan dengan filter tanggal yang dipilih
  const loadLaporanData = async () => {
    try {
      setIsLoadingData(true);

      const [produksiResult, blendingResult] = await Promise.allSettled([
        laporanProduksiAPI.getAll(),
        laporanGudangAPI.getAll(),
      ]);

      // Handle produksi response
      let produksiResponse = null;
      if (produksiResult.status === "fulfilled") {
        produksiResponse = produksiResult.value;
      }

      // Handle blending response
      let blendingResponse = null;
      if (blendingResult.status === "fulfilled") {
        blendingResponse = blendingResult.value;
      }

      // Process produksi data if successful
      if (produksiResponse?.success) {
        // Backend returns: {success: true, data: {data: [...], pagination: {...}}}
        // We need to extract the nested data array
        const responseData = produksiResponse.data;
        const rawProduksiData = Array.isArray(responseData)
          ? responseData
          : Array.isArray((responseData as any)?.data)
          ? (responseData as any).data
          : [];

        console.log("📦 Raw Produksi Data:", {
          totalCount: rawProduksiData.length,
          selectedDate: selectedDate,
          sampleData: rawProduksiData.slice(0, 3),
          fullResponse: produksiResponse,
        });

        const companyFilteredProduksiData =
          filterDataByCompany(rawProduksiData);
        const filteredProduksiData = filterDataForDate(
          companyFilteredProduksiData,
          selectedDate
        );

        console.log("🎯 Final Produksi Data:", {
          filteredCount: filteredProduksiData.length,
          data: filteredProduksiData,
        });

        setLaporanProduksiData(filteredProduksiData);
      }

      // Process blending data if successful
      if (blendingResponse?.success) {
        // Backend returns: {success: true, data: {data: [...], pagination: {...}}}
        // We need to extract the nested data array
        const responseData = blendingResponse.data;
        const rawBlendingData = Array.isArray(responseData)
          ? responseData
          : Array.isArray((responseData as any)?.data)
          ? (responseData as any).data
          : [];

        console.log("📦 Raw Blending Data:", {
          totalCount: rawBlendingData.length,
          selectedDate: selectedDate,
          sampleData: rawBlendingData.slice(0, 3),
          fullResponse: blendingResponse,
        });

        // Apply company filter first, then date filter
        const companyFilteredBlendingData =
          filterDataByCompany(rawBlendingData);
        const filteredBlendingData = filterDataForDate(
          companyFilteredBlendingData,
          selectedDate
        );

        console.log("🎯 Final Blending Data:", {
          filteredCount: filteredBlendingData.length,
          data: filteredBlendingData,
        });

        setLaporanBlendingData(filteredBlendingData);
      } else {
        console.error("❌ Blending Response Failed:", blendingResponse);
      }

      if (!produksiResponse?.success && !blendingResponse?.success) {
        toastError.custom("Gagal memuat data laporan dari server");
      }
    } catch (error) {
      console.error("Error loading laporan data:", error);
      toastError.custom("Gagal memuat data laporan");
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const accountsData = await getAccountsByDivision(userDivision.id);

      // Filter only KUANTITAS accounts for production/blending
      let filteredAccounts = accountsData.filter(
        (account) => account.valueType === "KUANTITAS"
      );

      // ✅ NEW: Filter by perusahaan_id (proper relational approach)
      const perusahaanId = user?.perusahaan_id;

      if (perusahaanId) {
        filteredAccounts = filteredAccounts.filter((acc) => {
          const accPerusahaanId = acc.perusahaan_id || acc.perusahaanId;
          return accPerusahaanId === perusahaanId;
        });

        console.log("🏢 Accounts filtered by perusahaan_id:", {
          perusahaanId,
          totalAccounts: accountsData.length,
          filteredAccounts: filteredAccounts.length,
        });
      } else {
        console.log("🔓 No perusahaan_id filter - SUPER_ADMIN mode");
      }

      setAccounts(filteredAccounts);

      // Add initial entry if accounts are available
      if (filteredAccounts.length > 0) {
        addNewEntry();
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      toastError.custom("Gagal memuat data akun");
    } finally {
      setIsLoading(false);
    }
  };

  const addNewEntry = () => {
    const newEntry: ProduksiBlendingEntry = {
      id: Date.now().toString(),
      accountId: accounts[0]?.id ? parseInt(accounts[0].id) : 0,
      accountName: accounts[0]?.accountName || "",
      // Produksi fields
      hasilProduksi: "",
      barangGagal: "",
      stockBarangJadi: "",
      hpBarangJadi: "",
      keteranganKendala: "",
      // Blending/Gudang fields
      barangMasuk: "",
      pemakaian: "",
      stokAkhir: "",
      keteranganGudang: "",
    };
    setEntries((prevEntries) => [...prevEntries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== id)
      );
      // Clear errors for removed entry
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${id}_`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const updateEntry = (
    id: string,
    field: keyof ProduksiBlendingEntry,
    value: any
  ) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value };

          // Update account name when account ID changes
          if (field === "accountId") {
            const selectedAccount = accounts.find(
              (acc) => acc.id === value.toString()
            );
            updatedEntry.accountName = selectedAccount?.accountName || "";
          }

          return updatedEntry;
        }
        return entry;
      })
    );

    // Clear error for this field
    const errorKey = `${id}_${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validateEntries = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tanggalLaporan) {
      newErrors.tanggalLaporan = "Tanggal laporan harus diisi";
    }

    entries.forEach((entry) => {
      if (!entry.accountId || entry.accountId <= 0) {
        newErrors[`${entry.id}_accountId`] = "Akun harus dipilih";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateEntries()) {
      toastError.custom("Mohon perbaiki kesalahan pada form");
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const entry of entries) {
        try {
          let response;
          if (activeTab === "produksi") {
            const laporanData = {
              tanggalLaporan,
              accountId: entry.accountId,
              hasilProduksi: entry.hasilProduksi
                ? parseFloat(entry.hasilProduksi)
                : undefined,
              barangGagal: entry.barangGagal
                ? parseFloat(entry.barangGagal)
                : undefined,
              stockBarangJadi: entry.stockBarangJadi
                ? parseFloat(entry.stockBarangJadi)
                : undefined,
              hpBarangJadi: entry.hpBarangJadi
                ? parseFloat(entry.hpBarangJadi)
                : undefined,
              keteranganKendala: entry.keteranganKendala || undefined,
            };
            response = await laporanProduksiAPI.create(laporanData);
          } else if (activeTab === "blending") {
            const laporanData = {
              tanggalLaporan,
              accountId: entry.accountId,
              stokAwal: entry.barangMasuk
                ? parseFloat(entry.barangMasuk)
                : undefined,
              pemakaian: entry.pemakaian
                ? parseFloat(entry.pemakaian)
                : undefined,
              stokAkhir: entry.stokAkhir
                ? parseFloat(entry.stokAkhir)
                : undefined,
              kondisiGudang: entry.keteranganGudang || undefined,
            };
            response = await laporanGudangAPI.create(laporanData);
          }
          if (response && response.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Error saving entry for ${entry.accountName}:`, error);
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        toastSuccess.custom(
          `Berhasil menyimpan ${successCount} laporan ${
            activeTab === "produksi" ? "produksi" : "blending"
          }`
        );

        // Reset form completely
        setTanggalLaporan(selectedDate);
        setErrors({});

        // Reset entries with one initial entry
        if (accounts.length > 0) {
          const initialEntry: ProduksiBlendingEntry = {
            id: Date.now().toString(),
            accountId: accounts[0]?.id ? parseInt(accounts[0].id) : 0,
            accountName: accounts[0]?.accountName || "",
            // Produksi fields
            hasilProduksi: "",
            barangGagal: "",
            stockBarangJadi: "",
            hpBarangJadi: "",
            keteranganKendala: "",
            // Blending/Gudang fields
            barangMasuk: "",
            pemakaian: "",
            stokAkhir: "",
            keteranganGudang: "",
          };
          setEntries([initialEntry]);
        } else {
          setEntries([]);
        }

        // Reload data setelah save berhasil
        loadLaporanData();
      } else if (successCount > 0 && failCount > 0) {
        toastError.custom(
          `${successCount} laporan berhasil, ${failCount} gagal disimpan`
        );
      } else {
        toastError.custom("Gagal menyimpan semua laporan");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toastError.custom("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi untuk delete laporan dengan konfirmasi
  const handleDeleteLaporan = async (
    id: number,
    type: "produksi" | "blending",
    accountName?: string
  ) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus laporan ${type} untuk akun "${
        accountName || "ini"
      }"?`
    );

    if (!confirmed) return;

    try {
      let response;
      if (type === "produksi") {
        response = await laporanProduksiAPI.delete(id);
      } else {
        response = await laporanGudangAPI.delete(id);
      }

      if (response && response.success) {
        toastSuccess.custom(`Laporan ${type} berhasil dihapus`);
        loadLaporanData(); // Reload data
      } else {
        toastError.custom(`Gagal menghapus laporan ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type} laporan:`, error);
      toastError.custom(`Gagal menghapus laporan ${type}`);
    }
  };

  // Fungsi untuk generate PDF - GABUNGAN kedua laporan
  const generatePDFReport = () => {
    const pdfData = {
      date: selectedDate,
      divisionName: userDivision.name,
      entries: [],
      accounts: accounts,

      // Gabungkan kedua data laporan dalam satu PDF
      laporanProduksiData: laporanProduksiData.map((item) => {
        return {
          accountName: getAccountName(item),
          hasilProduksi: Number(item.hasilProduksi || item.hasil_produksi || 0),
          barangGagal: Number(item.barangGagal || item.barang_gagal || 0),
          stockBarangJadi: Number(
            item.stockBarangJadi || item.stock_barang_jadi || 0
          ),
          hpBarangJadi: Number(item.hpBarangJadi || item.hp_barang_jadi || 0),
          keteranganKendala:
            item.keteranganKendala || item.keterangan_kendala || "-",
        };
      }),

      laporanBlendingData: laporanBlendingData.map((item) => {
        return {
          accountName: getAccountName(item),
          barangMasuk: Number(
            item.stokAwal ||
              item.stok_awal ||
              item.barangMasuk ||
              item.barang_masuk ||
              0
          ),
          pemakaian: Number(item.pemakaian || 0),
          stokAkhir: Number(item.stokAkhir || item.stok_akhir || 0),
          keteranganGudang:
            item.keterangan ||
            item.kondisiGudang ||
            item.kondisi_gudang ||
            item.keteranganGudang ||
            item.keterangan_gudang ||
            "-",
        };
      }),
    };

    return pdfData;
  };

  // Generate summary data for SummaryCard
  const generateSummaryData = () => {
    if (activeTab === "produksi") {
      const totalEntries = laporanProduksiData.length;
      const totalProduksi = laporanProduksiData.reduce(
        (acc, item) =>
          acc + (Number(item.hasilProduksi || item.hasil_produksi) || 0),
        0
      );
      const totalGagal = laporanProduksiData.reduce(
        (acc, item) =>
          acc + (Number(item.barangGagal || item.barang_gagal) || 0),
        0
      );
      const totalStock = laporanProduksiData.reduce(
        (acc, item) =>
          acc + (Number(item.stockBarangJadi || item.stock_barang_jadi) || 0),
        0
      );

      return [
        {
          label: "Total Entri",
          value: totalEntries,
          color: "blue" as const,
          icon: "chart" as const,
        },
        {
          label: "Total Hasil Produksi",
          value: totalProduksi,
          color: "green" as const,
          icon: "trending-up" as const,
        },
        {
          label: "Total Barang Gagal",
          value: totalGagal,
          color: "red" as const,
          icon: "trending-down" as const,
        },
        {
          label: "Total Stock Barang Jadi",
          value: totalStock,
          color: "purple" as const,
          icon: "chart" as const,
        },
      ];
    } else {
      const totalEntries = laporanBlendingData.length;
      const totalMasuk = laporanBlendingData.reduce(
        (acc, item) =>
          acc +
          (Number(
            item.stokAwal ||
              item.stok_awal ||
              item.barangMasuk ||
              item.barang_masuk
          ) || 0),
        0
      );
      const totalPemakaian = laporanBlendingData.reduce(
        (acc, item) => acc + (Number(item.pemakaian) || 0),
        0
      );
      const totalStokAkhir = laporanBlendingData.reduce(
        (acc, item) => acc + (Number(item.stokAkhir || item.stok_akhir) || 0),
        0
      );

      return [
        {
          label: "Total Entri",
          value: totalEntries,
          color: "blue" as const,
          icon: "chart" as const,
        },
        {
          label: "Total Barang Masuk",
          value: totalMasuk,
          color: "green" as const,
          icon: "trending-up" as const,
        },
        {
          label: "Total Pemakaian",
          value: totalPemakaian,
          color: "orange" as const,
          icon: "trending-down" as const,
        },
        {
          label: "Total Stok Akhir",
          value: totalStokAkhir,
          color: "purple" as const,
          icon: "chart" as const,
        },
      ];
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfData = generatePDFReport();
      await downloadSimplePDF(pdfData);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toastError.custom("Gagal mengunduh PDF: " + (error as Error).message);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const pdfData = generatePDFReport();
      await previewSimplePDF(pdfData);
    } catch (error) {
      console.error("Error previewing PDF:", error);
      toastError.custom("Gagal preview PDF: " + (error as Error).message);
    }
  };

  if (!isProduksiOrBlending) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Form ini hanya tersedia untuk Divisi Produksi dan Blending Persediaan
          Bahan Baku.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Memuat data akun...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "produksi" | "blending")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="produksi" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Laporan Produksi
          </TabsTrigger>
          <TabsTrigger value="blending" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Laporan Persediaan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produksi" className="space-y-6">
          {/* Summary Card Produksi */}
          <SummaryCard
            title={`Ringkasan Laporan Produksi - ${selectedDate}`}
            items={generateSummaryData()}
            variant="compact"
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Input Hasil Produksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PDF Export Buttons */}
              <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold text-sm">Export Laporan</h3>
                  <p className="text-xs text-muted-foreground">
                    PDF berisi Laporan Produksi & Persediaan
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreviewPDF}
                    variant="outline"
                    size="sm"
                    disabled={laporanProduksiData.length === 0 && laporanBlendingData.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Preview PDF
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    size="sm"
                    disabled={laporanProduksiData.length === 0 && laporanBlendingData.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Laporan Produksi:</strong> Input data hasil produksi harian meliputi jumlah produk jadi, barang gagal, stok, dan HPP untuk setiap produk yang diproduksi.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="tanggalLaporan">Tanggal Laporan</Label>
                <Input
                  id="tanggalLaporan"
                  type="date"
                  value={tanggalLaporan}
                  onChange={(e) => {
                    setTanggalLaporan(e.target.value);
                    onDateChange(e.target.value);
                  }}
                  className="w-auto"
                />
              </div>

              <Separator />

              {/* Form Entry Produksi */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Entry Laporan Produksi</h3>
                  <Button onClick={addNewEntry} size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tambah Entry
                  </Button>
                </div>

                {entries.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <p>Belum ada entry. Klik "Tambah Entry" untuk menambah data.</p>
                    </CardContent>
                  </Card>
                ) : (
                  entries.map((entry, index) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Entry #{index + 1}</h4>
                          {entries.length > 1 && (
                            <Button
                              onClick={() => removeEntry(entry.id)}
                              variant="outline"
                              size="sm"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Pilih Produk Jadi</Label>
                            <select
                              value={entry.accountId}
                              onChange={(e) => updateEntry(entry.id, "accountId", parseInt(e.target.value))}
                              className={`w-full p-2 border rounded-md ${errors[`${entry.id}_accountId`] ? "border-red-500" : ""}`}
                            >
                              <option value={0}>-- Pilih Produk --</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.accountCode} - {account.accountName}
                                </option>
                              ))}
                            </select>
                            {errors[`${entry.id}_accountId`] && (
                              <p className="text-sm text-red-500">{errors[`${entry.id}_accountId`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Hasil Produksi (gr/pcs)</Label>
                            <Input
                              type="number"
                              value={entry.hasilProduksi}
                              onChange={(e) => updateEntry(entry.id, "hasilProduksi", e.target.value)}
                              placeholder="Jumlah unit produk"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Barang Gagal/Cacat (pcs)</Label>
                            <Input
                              type="number"
                              value={entry.barangGagal}
                              onChange={(e) => updateEntry(entry.id, "barangGagal", e.target.value)}
                              placeholder="Jumlah produk gagal"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Stock Barang Jadi (pcs)</Label>
                            <Input
                              type="number"
                              value={entry.stockBarangJadi}
                              onChange={(e) => updateEntry(entry.id, "stockBarangJadi", e.target.value)}
                              placeholder="Stok tersedia"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>HP Barang Jadi (Rp)</Label>
                            <Input
                              type="number"
                              value={entry.hpBarangJadi}
                              onChange={(e) => updateEntry(entry.id, "hpBarangJadi", e.target.value)}
                              placeholder="Harga pokok"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Keterangan Kendala</Label>
                            <Input
                              type="text"
                              value={entry.keteranganKendala}
                              onChange={(e) => updateEntry(entry.id, "keteranganKendala", e.target.value)}
                              placeholder="Catatan kendala"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isSaving || entries.length === 0} className="min-w-32">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Laporan Produksi
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table Data Produksi */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Data Laporan Produksi</CardTitle>
              <div className="flex gap-2">
                  <Button onClick={loadLaporanData} variant="outline" size="sm" disabled={isLoadingData}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingData ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Akun</TableHead>
                          <TableHead>Hasil Produksi</TableHead>
                          <TableHead>Barang Gagal</TableHead>
                          <TableHead>Stock Barang Jadi</TableHead>
                          <TableHead>HP Barang Jadi</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingData ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              Memuat data...
                            </TableCell>
                          </TableRow>
                        ) : laporanProduksiData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              Belum ada data untuk tanggal ini
                            </TableCell>
                          </TableRow>
                        ) : (
                          laporanProduksiData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.tanggalLaporan ||
                                  item.tanggal_laporan ||
                                  "-"}
                              </TableCell>
                              <TableCell>{getAccountName(item)}</TableCell>
                              <TableCell>
                                {item.hasilProduksi ||
                                  item.hasil_produksi ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                {item.barangGagal || item.barang_gagal || "-"}
                              </TableCell>
                              <TableCell>
                                {item.stockBarangJadi ||
                                  item.stock_barang_jadi ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                {item.hpBarangJadi ||
                                  item.hp_barang_jadi ||
                                  "-"}
                              </TableCell>
                              <TableCell className="max-w-32 truncate">
                                {item.keteranganKendala ||
                                  item.keterangan_kendala ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteLaporan(
                                      item.id,
                                      "produksi",
                                      item.account?.accountName
                                    )
                                  }
                                  title="Hapus laporan"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blending" className="space-y-6">
          {/* Summary Card Persediaan */}
          <SummaryCard
            title={`Ringkasan Laporan Persediaan - ${selectedDate}`}
            items={generateSummaryData()}
            variant="compact"
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Input Data Persediaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PDF Export Buttons */}
              <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold text-sm">Export Laporan</h3>
                  <p className="text-xs text-muted-foreground">
                    PDF berisi Laporan Produksi & Persediaan
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreviewPDF}
                    variant="outline"
                    size="sm"
                    disabled={laporanProduksiData.length === 0 && laporanBlendingData.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Preview PDF
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    size="sm"
                    disabled={laporanProduksiData.length === 0 && laporanBlendingData.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Laporan Persediaan:</strong> Input data persediaan bahan baku meliputi barang masuk, pemakaian, dan stok akhir untuk setiap bahan baku di gudang.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="tanggalLaporanBlending">Tanggal Laporan</Label>
                <Input
                  id="tanggalLaporanBlending"
                  type="date"
                  value={tanggalLaporan}
                  onChange={(e) => {
                    setTanggalLaporan(e.target.value);
                    onDateChange(e.target.value);
                  }}
                  className="w-auto"
                />
              </div>

              <Separator />

              {/* Form Entry Persediaan */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Entry Laporan Persediaan</h3>
                  <Button onClick={addNewEntry} size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tambah Entry
                  </Button>
                </div>

                {entries.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <p>Belum ada entry. Klik "Tambah Entry" untuk menambah data.</p>
                    </CardContent>
                  </Card>
                ) : (
                  entries.map((entry, index) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Entry #{index + 1}</h4>
                          {entries.length > 1 && (
                            <Button
                              onClick={() => removeEntry(entry.id)}
                              variant="outline"
                              size="sm"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Pilih Bahan Baku</Label>
                            <select
                              value={entry.accountId}
                              onChange={(e) => updateEntry(entry.id, "accountId", parseInt(e.target.value))}
                              className={`w-full p-2 border rounded-md ${errors[`${entry.id}_accountId`] ? "border-red-500" : ""}`}
                            >
                              <option value={0}>-- Pilih Bahan Baku --</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.accountCode} - {account.accountName}
                                </option>
                              ))}
                            </select>
                            {errors[`${entry.id}_accountId`] && (
                              <p className="text-sm text-red-500">{errors[`${entry.id}_accountId`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Barang Masuk (gr/pcs)</Label>
                            <Input
                              type="number"
                              value={entry.barangMasuk}
                              onChange={(e) => updateEntry(entry.id, "barangMasuk", e.target.value)}
                              placeholder="Stok awal / masuk"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Pemakaian (gr/pcs)</Label>
                            <Input
                              type="number"
                              value={entry.pemakaian}
                              onChange={(e) => updateEntry(entry.id, "pemakaian", e.target.value)}
                              placeholder="Jumlah dipakai"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Stok Akhir (gr/pcs)</Label>
                            <Input
                              type="number"
                              value={entry.stokAkhir}
                              onChange={(e) => updateEntry(entry.id, "stokAkhir", e.target.value)}
                              placeholder="Sisa stok"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Keterangan Kondisi Gudang</Label>
                            <Input
                              type="text"
                              value={entry.keteranganGudang}
                              onChange={(e) => updateEntry(entry.id, "keteranganGudang", e.target.value)}
                              placeholder="Catatan gudang"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isSaving || entries.length === 0} className="min-w-32">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Laporan Persediaan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table Data Persediaan */}
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Data Laporan Persediaan</CardTitle>
                <div className="flex gap-2">
                    <Button onClick={loadLaporanData} variant="outline" size="sm" disabled={isLoadingData}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingData ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                </div>
              </CardHeader>
            <CardContent className="p-0">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Akun</TableHead>
                          <TableHead>Barang Masuk</TableHead>
                          <TableHead>Pemakaian</TableHead>
                          <TableHead>Stok Akhir</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingData ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              Memuat data...
                            </TableCell>
                          </TableRow>
                        ) : laporanBlendingData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              Belum ada data untuk tanggal ini
                            </TableCell>
                          </TableRow>
                        ) : (
                          laporanBlendingData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.tanggalLaporan ||
                                  item.tanggal_laporan ||
                                  "-"}
                              </TableCell>
                              <TableCell>{getAccountName(item)}</TableCell>
                              <TableCell>
                                {item.stokAwal ||
                                  item.stok_awal ||
                                  item.barangMasuk ||
                                  item.barang_masuk ||
                                  "-"}
                              </TableCell>
                              <TableCell>{item.pemakaian || "-"}</TableCell>
                              <TableCell>
                                {item.stokAkhir || item.stok_akhir || "-"}
                              </TableCell>
                              <TableCell className="max-w-32 truncate">
                                {item.keterangan ||
                                  item.kondisiGudang ||
                                  item.kondisi_gudang ||
                                  item.keteranganGudang ||
                                  item.keterangan_gudang ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteLaporan(
                                      item.id,
                                      "blending",
                                      item.account?.accountName
                                    )
                                  }
                                  title="Hapus laporan"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
