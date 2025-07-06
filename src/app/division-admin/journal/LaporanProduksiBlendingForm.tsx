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

interface LaporanProduksiBlendingFormProps {
  userDivision: {
    id: string;
    name: string;
  };
  onSuccess?: () => void;
}

export default function LaporanProduksiBlendingForm({
  userDivision,
  onSuccess,
}: LaporanProduksiBlendingFormProps) {
  const [tanggalLaporan, setTanggalLaporan] = useState("");
  const [entries, setEntries] = useState<ProduksiBlendingEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"produksi" | "blending">(
    "produksi"
  );

  // ✅ NEW: State untuk data tabel
  const [laporanProduksiData, setLaporanProduksiData] = useState<any[]>([]);
  const [laporanBlendingData, setLaporanBlendingData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ✅ Helper function untuk filter data berdasarkan tanggal hari ini
  const filterDataForToday = (data: any[]) => {
    const today = new Date().toISOString().split("T")[0];
    return data.filter((laporan: any) => {
      const laporanDate =
        laporan.tanggalLaporan || laporan.tanggal_laporan || laporan.createdAt;
      if (!laporanDate) return false;

      // Normalisasi tanggal ke format YYYY-MM-DD
      const normalizedDate = new Date(laporanDate).toISOString().split("T")[0];
      const normalizedToday = new Date(today).toISOString().split("T")[0];

      return normalizedDate === normalizedToday;
    });
  };

  // Check if division is production or blending
  const isProduksiOrBlending =
    userDivision.name === "DIVISI PRODUKSI" ||
    userDivision.name === "BLENDING PERSEDIAAN BAHAN BAKU" ||
    userDivision.name === "DIVISI BLENDING PERSEDIAAN BAHAN BAKU";

  const divisionDisplayName =
    userDivision.name === "BLENDING PERSEDIAAN BAHAN BAKU" ||
    userDivision.name === "DIVISI BLENDING PERSEDIAAN BAHAN BAKU"
      ? "Blending"
      : "Produksi";

  // Set initial tab based on user division
  useEffect(() => {
    if (userDivision.name === "DIVISI PRODUKSI") {
      setActiveTab("produksi");
    } else if (
      userDivision.name === "BLENDING PERSEDIAAN BAHAN BAKU" ||
      userDivision.name === "DIVISI BLENDING PERSEDIAAN BAHAN BAKU"
    ) {
      setActiveTab("blending");
    }
  }, [userDivision.name]);

  useEffect(() => {
    if (isProduksiOrBlending) {
      loadAccounts();
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];
      setTanggalLaporan(today);
    }
  }, [userDivision.id, isProduksiOrBlending]);

  // ✅ FIXED: Fungsi untuk memuat data laporan dengan filter tanggal hari ini
  const loadLaporanData = async () => {
    try {
      setIsLoadingData(true);
      const [produksiResponse, blendingResponse] = await Promise.all([
        laporanProduksiAPI.getAll(),
        laporanGudangAPI.getAll(),
      ]);

      const today = new Date().toISOString().split("T")[0];
      console.log(
        "🔍 LAPORAN PRODUKSI/BLENDING - Loading data for date:",
        today
      );
      console.log("🔍 PRODUKSI RESPONSE:", produksiResponse);
      console.log("🔍 BLENDING RESPONSE:", blendingResponse);

      if (produksiResponse.success) {
        console.log("✅ PRODUKSI DATA (before filter):", produksiResponse.data);
        // Filter data produksi untuk hari ini saja
        const filteredProduksiData = filterDataForToday(
          produksiResponse.data || []
        );
        console.log("✅ PRODUKSI DATA (after filter for today):", {
          total: produksiResponse.data?.length || 0,
          filtered: filteredProduksiData.length,
          today: today,
        });
        setLaporanProduksiData(filteredProduksiData);
      }

      if (blendingResponse.success) {
        console.log("✅ BLENDING DATA (before filter):", blendingResponse.data);
        // Filter data blending untuk hari ini saja
        const filteredBlendingData = filterDataForToday(
          blendingResponse.data || []
        );
        console.log("✅ BLENDING DATA (after filter for today):", {
          total: blendingResponse.data?.length || 0,
          filtered: filteredBlendingData.length,
          today: today,
        });
        setLaporanBlendingData(filteredBlendingData);
      }
    } catch (error) {
      console.error("Error loading laporan data:", error);
      toastError.custom("Gagal memuat data laporan");
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✅ NEW: Load data saat component mount dan setelah save success
  useEffect(() => {
    if (isProduksiOrBlending) {
      loadLaporanData();
    }
  }, [isProduksiOrBlending]);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const accountsData = await getAccountsByDivision(userDivision.id);

      // Filter only KUANTITAS accounts for production/blending
      const filteredAccounts = accountsData.filter(
        (account) => account.valueType === "KUANTITAS"
      );

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
    // Use functional update to ensure we have the latest state
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

      if (activeTab === "produksi") {
        // Konversi string ke number untuk validasi
        const hasilProduksi = parseFloat(entry.hasilProduksi) || 0;
        const barangGagal = parseFloat(entry.barangGagal) || 0;
        const stockBarangJadi = parseFloat(entry.stockBarangJadi) || 0;
        const hpBarangJadi = parseFloat(entry.hpBarangJadi) || 0;
        const hasProductionData =
          hasilProduksi > 0 ||
          barangGagal > 0 ||
          stockBarangJadi > 0 ||
          hpBarangJadi > 0;
        if (!hasProductionData) {
          newErrors[`${entry.id}_production`] =
            "Minimal satu field produksi harus diisi";
        }
        if (entry.hasilProduksi && hasilProduksi < 0) {
          newErrors[`${entry.id}_hasilProduksi`] = "Tidak boleh negatif";
        }
        if (entry.barangGagal && barangGagal < 0) {
          newErrors[`${entry.id}_barangGagal`] = "Tidak boleh negatif";
        }
        if (entry.stockBarangJadi && stockBarangJadi < 0) {
          newErrors[`${entry.id}_stockBarangJadi`] = "Tidak boleh negatif";
        }
        if (entry.hpBarangJadi && hpBarangJadi < 0) {
          newErrors[`${entry.id}_hpBarangJadi`] = "Tidak boleh negatif";
        }
      } else if (activeTab === "blending") {
        const barangMasuk = parseFloat(entry.barangMasuk) || 0;
        const pemakaian = parseFloat(entry.pemakaian) || 0;
        const stokAkhir = parseFloat(entry.stokAkhir) || 0;
        const hasBlendingData =
          barangMasuk > 0 || pemakaian > 0 || stokAkhir > 0;
        if (!hasBlendingData) {
          newErrors[`${entry.id}_blending`] =
            "Minimal satu field blending harus diisi";
        }
        if (entry.barangMasuk && barangMasuk < 0) {
          newErrors[`${entry.id}_barangMasuk`] = "Tidak boleh negatif";
        }
        if (entry.pemakaian && pemakaian < 0) {
          newErrors[`${entry.id}_pemakaian`] = "Tidak boleh negatif";
        }
        if (entry.stokAkhir && stokAkhir < 0) {
          newErrors[`${entry.id}_stokAkhir`] = "Tidak boleh negatif";
        }
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
            console.log("[Laporan Blending] Data dikirim ke BE:", laporanData);
            response = await laporanGudangAPI.create(laporanData);
          }
          if (response && response.success) {
            successCount++;
          } else {
            failCount++;
            console.error(
              `Failed to save entry for ${entry.accountName}:`,
              response?.error || "Unknown error"
            );
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
        setTanggalLaporan(new Date().toISOString().split("T")[0]);
        setErrors({});

        // Reset entries with one initial entry in a single setState call
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
          setEntries([initialEntry]); // Set directly to array with one entry
        } else {
          setEntries([]); // If no accounts, set to empty
        }

        // ✅ Reload data setelah save berhasil
        loadLaporanData();

        onSuccess?.();
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

  // ✅ NEW: Fungsi untuk delete laporan dengan konfirmasi
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

  // ✅ NEW: Fungsi untuk generate PDF
  const generatePDFReport = () => {
    console.log("🔍 GENERATE PDF - Starting...");
    const user = getCurrentUser();
    const today = new Date().toISOString().split("T")[0];

    console.log("🔍 GENERATE PDF - Data check:", {
      activeTab,
      produksiDataLength: laporanProduksiData.length,
      blendingDataLength: laporanBlendingData.length,
      user: user?.division?.name,
      today,
      rawProduksiData: laporanProduksiData,
      rawBlendingData: laporanBlendingData,
    });

    const pdfData = {
      date: today,
      divisionName: userDivision.name,
      entries: [], // Bisa kosong karena menggunakan data khusus
      accounts: accounts,

      // Tambahkan data sesuai tab aktif
      ...(activeTab === "produksi"
        ? {
            laporanProduksiData: laporanProduksiData.map((item) => {
              console.log("🔍 MAPPING PRODUKSI ITEM:", item);
              return {
                accountName:
                  item.account?.accountName || item.accountName || "-",
                hasilProduksi: Number(
                  item.hasilProduksi || item.hasil_produksi || 0
                ),
                barangGagal: Number(item.barangGagal || item.barang_gagal || 0),
                stockBarangJadi: Number(
                  item.stockBarangJadi || item.stock_barang_jadi || 0
                ),
                hpBarangJadi: Number(
                  item.hpBarangJadi || item.hp_barang_jadi || 0
                ),
                keteranganKendala:
                  item.keteranganKendala || item.keterangan_kendala || "-",
              };
            }),
          }
        : {
            laporanBlendingData: laporanBlendingData.map((item) => {
              console.log("🔍 MAPPING BLENDING ITEM:", item);
              return {
                accountName:
                  item.account?.accountName || item.accountName || "-",
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
                  item.kondisiGudang ||
                  item.kondisi_gudang ||
                  item.keteranganGudang ||
                  item.keterangan_gudang ||
                  "-",
              };
            }),
          }),
    };

    console.log("🔍 GENERATE PDF - Final data:", pdfData);
    return pdfData;
  };

  const handleDownloadPDF = async () => {
    try {
      console.log("🔍 DOWNLOAD PDF - Starting...");
      const pdfData = generatePDFReport();
      console.log("🔍 DOWNLOAD PDF - Generated data:", pdfData);
      await downloadSimplePDF(pdfData);
      console.log("✅ DOWNLOAD PDF - Success");
    } catch (error) {
      console.error("❌ DOWNLOAD PDF - Error:", error);
      toastError.custom("Gagal mengunduh PDF: " + (error as Error).message);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      console.log("🔍 PREVIEW PDF - Starting...");
      const pdfData = generatePDFReport();
      console.log("🔍 PREVIEW PDF - Generated data:", pdfData);
      await previewSimplePDF(pdfData);
      console.log("✅ PREVIEW PDF - Success");
    } catch (error) {
      console.error("❌ PREVIEW PDF - Error:", error);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Form Laporan Produksi & Blending
          <Badge variant="outline" className="ml-2">
            {userDivision.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("produksi")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "produksi"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Factory className="h-4 w-4" />
            Laporan Produksi
          </button>
          <button
            onClick={() => setActiveTab("blending")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "blending"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-4 w-4" />
            Laporan Blending
          </button>
        </div>

        {/* Tab Description */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {activeTab === "produksi" ? (
              <>
                <strong>Laporan Produksi:</strong> Input data hasil produksi
                harian meliputi jumlah produk jadi, barang gagal, stok, dan HPP
                untuk setiap produk yang diproduksi.
              </>
            ) : (
              <>
                <strong>Laporan Blending:</strong> Input data persediaan bahan
                baku meliputi barang masuk, pemakaian, dan stok akhir untuk
                setiap bahan baku di gudang.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label htmlFor="tanggalLaporan">Tanggal Laporan</Label>
          <Input
            id="tanggalLaporan"
            type="date"
            value={tanggalLaporan}
            onChange={(e) => setTanggalLaporan(e.target.value)}
            className={errors.tanggalLaporan ? "border-red-500" : ""}
          />
          {errors.tanggalLaporan && (
            <p className="text-sm text-red-500">{errors.tanggalLaporan}</p>
          )}
        </div>

        <Separator />

        {/* Entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Data {activeTab === "produksi" ? "Produksi" : "Blending"}
            </h3>
            <Button onClick={addNewEntry} size="sm" variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah Entry
            </Button>
          </div>

          {entries.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Belum ada entry. Klik "Tambah Entry" untuk menambah data.
              </AlertDescription>
            </Alert>
          ) : (
            entries.map((entry, index) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Entry {index + 1}</h4>
                  {entries.length > 1 && (
                    <Button
                      onClick={() => removeEntry(entry.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Selection */}
                  <div className="space-y-2">
                    <Label>
                      {activeTab === "produksi"
                        ? "Akun Produk Jadi"
                        : "Akun Bahan Baku"}
                    </Label>
                    <select
                      value={entry.accountId}
                      onChange={(e) =>
                        updateEntry(
                          entry.id,
                          "accountId",
                          parseInt(e.target.value)
                        )
                      }
                      className={`w-full p-2 border rounded-md ${
                        errors[`${entry.id}_accountId`] ? "border-red-500" : ""
                      }`}
                    >
                      <option value={0}>Pilih Akun</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.accountCode} - {account.accountName}
                        </option>
                      ))}
                    </select>
                    {errors[`${entry.id}_accountId`] && (
                      <p className="text-sm text-red-500">
                        {errors[`${entry.id}_accountId`]}
                      </p>
                    )}
                  </div>

                  {activeTab === "produksi" ? (
                    // ==== FIELDS UNTUK DIVISI PRODUKSI ====
                    <>
                      {/* Hasil Produksi */}
                      <div className="space-y-2">
                        <Label>Hasil Produksi (unit)</Label>
                        <Input
                          type="number"
                          value={entry.hasilProduksi}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "hasilProduksi",
                              e.target.value
                            )
                          }
                          placeholder="Jumlah unit produk yang berhasil dibuat"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_hasilProduksi`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_hasilProduksi`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_hasilProduksi`]}
                          </p>
                        )}
                      </div>

                      {/* Barang Gagal/Cacat */}
                      <div className="space-y-2">
                        <Label>Barang Gagal/Cacat (unit)</Label>
                        <Input
                          type="number"
                          value={entry.barangGagal}
                          onChange={(e) =>
                            updateEntry(entry.id, "barangGagal", e.target.value)
                          }
                          placeholder="Jumlah unit produk yang gagal/cacat"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_barangGagal`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_barangGagal`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_barangGagal`]}
                          </p>
                        )}
                      </div>

                      {/* Stok Barang Jadi */}
                      <div className="space-y-2">
                        <Label>Stok Barang Jadi (unit)</Label>
                        <Input
                          type="number"
                          value={entry.stockBarangJadi}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "stockBarangJadi",
                              e.target.value
                            )
                          }
                          placeholder="Total stok akhir produk jadi"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_stockBarangJadi`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_stockBarangJadi`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_stockBarangJadi`]}
                          </p>
                        )}
                      </div>

                      {/* HP Barang Jadi (HPP) */}
                      <div className="space-y-2">
                        <Label>HP Barang Jadi (Rp)</Label>
                        <Input
                          type="number"
                          value={entry.hpBarangJadi}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "hpBarangJadi",
                              e.target.value
                            )
                          }
                          placeholder="Total biaya produksi (HPP)"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_hpBarangJadi`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_hpBarangJadi`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_hpBarangJadi`]}
                          </p>
                        )}
                      </div>

                      {/* Keterangan Kendala Produksi */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Keterangan Kendala</Label>
                        <Input
                          type="text"
                          value={entry.keteranganKendala}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "keteranganKendala",
                              e.target.value
                            )
                          }
                          placeholder="Masukkan keterangan kendala produksi jika ada"
                        />
                      </div>
                    </>
                  ) : (
                    // ==== FIELDS UNTUK DIVISI BLENDING/GUDANG ====
                    <>
                      {/* Barang Masuk */}
                      <div className="space-y-2">
                        <Label>Barang Masuk (kg/unit)</Label>
                        <Input
                          type="number"
                          value={entry.barangMasuk}
                          onChange={(e) =>
                            updateEntry(entry.id, "barangMasuk", e.target.value)
                          }
                          placeholder="Jumlah bahan baku yang masuk hari ini"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_barangMasuk`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_barangMasuk`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_barangMasuk`]}
                          </p>
                        )}
                      </div>

                      {/* Pemakaian */}
                      <div className="space-y-2">
                        <Label>Pemakaian (kg/unit)</Label>
                        <Input
                          type="number"
                          value={entry.pemakaian}
                          onChange={(e) =>
                            updateEntry(entry.id, "pemakaian", e.target.value)
                          }
                          placeholder="Jumlah bahan baku yang digunakan"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_pemakaian`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_pemakaian`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_pemakaian`]}
                          </p>
                        )}
                      </div>

                      {/* Stok Akhir */}
                      <div className="space-y-2">
                        <Label>Stok Akhir (kg/unit)</Label>
                        <Input
                          type="number"
                          value={entry.stokAkhir}
                          onChange={(e) =>
                            updateEntry(entry.id, "stokAkhir", e.target.value)
                          }
                          placeholder="Sisa stok bahan baku di gudang"
                          min="0"
                          step="0.01"
                          className={
                            errors[`${entry.id}_stokAkhir`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`${entry.id}_stokAkhir`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${entry.id}_stokAkhir`]}
                          </p>
                        )}
                      </div>

                      {/* Keterangan Gudang */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Keterangan Kondisi Gudang</Label>
                        <Input
                          type="text"
                          value={entry.keteranganGudang}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "keteranganGudang",
                              e.target.value
                            )
                          }
                          placeholder="Catatan mengenai kondisi gudang atau bahan baku"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Entry-level validation error */}
                {(errors[`${entry.id}_production`] ||
                  errors[`${entry.id}_blending`]) && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors[`${entry.id}_production`] ||
                        errors[`${entry.id}_blending`]}
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            ))
          )}
        </div>

        <Separator />

        {/* ✅ NEW: Summary Card Section - Only for Produksi */}
        {activeTab === "produksi" && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Ringkasan Laporan Produksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center shadow-sm">
                  <span className="text-xs text-muted-foreground mb-1">
                    Total Entri
                  </span>
                  <span className="text-xl font-bold">
                    {laporanProduksiData.length}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center shadow-sm">
                  <span className="text-xs text-muted-foreground mb-1">
                    Total Hasil Produksi
                  </span>
                  <span className="text-xl font-bold">
                    {laporanProduksiData.reduce(
                      (acc, item) =>
                        acc +
                        (Number(item.hasilProduksi ?? item.hasil_produksi) ||
                          0),
                      0
                    )}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center shadow-sm">
                  <span className="text-xs text-muted-foreground mb-1">
                    Total Barang Gagal
                  </span>
                  <span className="text-xl font-bold">
                    {laporanProduksiData.reduce(
                      (acc, item) =>
                        acc +
                        (Number(item.barangGagal ?? item.barang_gagal) || 0),
                      0
                    )}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center shadow-sm">
                  <span className="text-xs text-muted-foreground mb-1">
                    Total Stock Barang Jadi
                  </span>
                  <span className="text-xl font-bold">
                    {laporanProduksiData.reduce(
                      (acc, item) =>
                        acc +
                        (Number(
                          item.stockBarangJadi ?? item.stock_barang_jadi
                        ) || 0),
                      0
                    )}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center shadow-sm">
                  <span className="text-xs text-muted-foreground mb-1">
                    Total HP Barang Jadi
                  </span>
                  <span className="text-xl font-bold">
                    {laporanProduksiData.reduce(
                      (acc, item) =>
                        acc +
                        (Number(item.hpBarangJadi ?? item.hp_barang_jadi) || 0),
                      0
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ PDF Export Buttons - Moved to top */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            onClick={handlePreviewPDF}
            variant="outline"
            size="sm"
            disabled={
              activeTab === "produksi"
                ? laporanProduksiData.length === 0
                : laporanBlendingData.length === 0
            }
          >
            <FileText className="h-4 w-4 mr-2" />
            Preview PDF
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            disabled={
              activeTab === "produksi"
                ? laporanProduksiData.length === 0
                : laporanBlendingData.length === 0
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* ✅ NEW: Data Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Data Laporan {activeTab === "produksi" ? "Produksi" : "Blending"}
            </h3>
            <div className="flex items-center gap-2">
              {isLoadingData && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Memuat data...
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={loadLaporanData}
                disabled={isLoadingData}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${
                    isLoadingData ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {activeTab === "produksi" ? (
            // ✅ Tabel Laporan Produksi
            <Card>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
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
                        <TableHead className="w-16">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {laporanProduksiData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-muted-foreground py-8"
                          >
                            {isLoadingData
                              ? "Memuat data..."
                              : "Belum ada data laporan produksi"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        laporanProduksiData.map((item) => {
                          console.log("🔍 PRODUKSI ITEM:", item);
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.tanggalLaporan ||
                                  item.tanggal_laporan ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                {item.account?.accountName ||
                                  item.account?.account_name ||
                                  item.accountName ||
                                  "-"}
                              </TableCell>
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
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            // ✅ Tabel Laporan Blending
            <Card>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Akun</TableHead>
                        <TableHead>Barang Masuk</TableHead>
                        <TableHead>Pemakaian</TableHead>
                        <TableHead>Stok Akhir</TableHead>
                        <TableHead>Kondisi Gudang</TableHead>
                        <TableHead className="w-16">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {laporanBlendingData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            {isLoadingData
                              ? "Memuat data..."
                              : "Belum ada data laporan blending"}
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
                            <TableCell>
                              {item.account?.accountName ||
                                item.account?.account_name ||
                                item.accountName ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {item.barangMasuk || item.barang_masuk || "-"}
                            </TableCell>
                            <TableCell>{item.pemakaian || "-"}</TableCell>
                            <TableCell>
                              {item.stokAkhir || item.stok_akhir || "-"}
                            </TableCell>
                            <TableCell className="max-w-32 truncate">
                              {item.keterangan || item.kondisi_gudang || "-"}
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
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSaving || entries.length === 0}
            className="min-w-32"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Laporan
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
