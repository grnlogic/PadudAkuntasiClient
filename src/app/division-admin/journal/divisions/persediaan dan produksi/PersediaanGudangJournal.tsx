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
  Package,
  Trash2,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";
import { getAccountsByDivision } from "@/lib/data";
import { laporanGudangAPI } from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { downloadSimplePDF, previewSimplePDF } from "@/lib/pdf-clean";
import { getCurrentUser } from "@/lib/auth";
import type { Account } from "@/lib/data";
import { SummaryCard } from "../../shared/components/SummaryCard";

interface PersediaanGudangEntry {
  id: string;
  accountId: number;
  accountName: string;
  stokAwal: string;
  pemakaian: string;
  stokAkhir: string;
  kondisiGudang: string;
}

interface PersediaanGudangJournalProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function PersediaanGudangJournal({
  selectedDate,
  onDateChange,
}: PersediaanGudangJournalProps) {
  const user = getCurrentUser();

  // Mock userDivision - akan diganti dengan data dari context/props
  const userDivision = user?.division || {
    id: "1",
    name: "PERSEDIAAN GUDANG",
  };

  const [tanggalLaporan, setTanggalLaporan] = useState(selectedDate);
  const [entries, setEntries] = useState<PersediaanGudangEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State untuk data tabel
  const [laporanGudangData, setLaporanGudangData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ✅ NEW: Helper function untuk filtering berdasarkan perusahaan_id
  const filterDataByCompany = (data: any[]) => {
    const perusahaanId = user?.perusahaan_id;

    console.log("🔍 PERSEDIAAN Filter Debug:", {
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

    console.log("🏢 Company Filter Applied (Persediaan):", {
      perusahaanId: perusahaanId,
      totalData: data.length,
      filteredData: filtered.length,
      sampleItems: filtered.slice(0, 5).map((item) => ({
        id: item.id,
        account_code: item.account_code,
        perusahaan_id: item.perusahaan_id,
      })),
    });

    return filtered;
  };

  // Helper function untuk filter data berdasarkan tanggal yang dipilih
  const filterDataForDate = (data: any[], targetDate: string) => {
    console.log("🔍 PERSEDIAAN Date Filter Debug:", {
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

      // Debug untuk item tertentu
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

    console.log("✅ PERSEDIAAN Date Filter Result:", {
      filteredCount: filtered.length,
      targetDate: targetDate,
      filteredIds: filtered.map((item) => item.id),
    });

    return filtered;
  };

  // Check if division is for warehouse/persediaan
  const isPersediaanGudang =
    userDivision.name.includes("PERSEDIAAN") ||
    userDivision.name.includes("GUDANG") ||
    userDivision.name.includes("BLENDING");

  useEffect(() => {
    if (isPersediaanGudang) {
      loadAccounts();
      setTanggalLaporan(selectedDate);
    }
  }, [userDivision.id, isPersediaanGudang, selectedDate]);

  // Sync dengan selectedDate dari parent
  useEffect(() => {
    setTanggalLaporan(selectedDate);
    loadLaporanData();
  }, [selectedDate]);

  // Fungsi untuk memuat data laporan dengan filter tanggal yang dipilih
  const loadLaporanData = async () => {
    try {
      setIsLoadingData(true);

      const response = await laporanGudangAPI.getAll();

      if (response?.success) {
        const rawData = Array.isArray(response.data) ? response.data : [];

        console.log("📦 Raw Persediaan Data:", {
          totalCount: rawData.length,
          selectedDate: selectedDate,
          sampleData: rawData.slice(0, 3),
        });

        // Apply company filter first, then date filter
        const companyFilteredData = filterDataByCompany(rawData);
        const filteredData = filterDataForDate(
          companyFilteredData,
          selectedDate
        );

        console.log("🎯 Final Persediaan Data:", {
          filteredCount: filteredData.length,
          data: filteredData,
        });

        setLaporanGudangData(filteredData);
      } else {
        toastError.custom("Gagal memuat data laporan gudang");
      }
    } catch (error) {
      console.error("Error loading laporan gudang data:", error);
      toastError.custom("Gagal memuat data laporan gudang");
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const accountsData = await getAccountsByDivision(userDivision.id);

      // Filter only KUANTITAS accounts for warehouse/persediaan
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

        console.log("🏢 Persediaan accounts filtered by perusahaan_id:", {
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
    const newEntry: PersediaanGudangEntry = {
      id: Date.now().toString(),
      accountId: accounts[0]?.id ? parseInt(accounts[0].id) : 0,
      accountName: accounts[0]?.accountName || "",
      stokAwal: "",
      pemakaian: "",
      stokAkhir: "",
      kondisiGudang: "",
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
    field: keyof PersediaanGudangEntry,
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
          const laporanData = {
            tanggalLaporan,
            accountId: entry.accountId,
            stokAwal: entry.stokAwal ? parseFloat(entry.stokAwal) : undefined,
            pemakaian: entry.pemakaian
              ? parseFloat(entry.pemakaian)
              : undefined,
            stokAkhir: entry.stokAkhir
              ? parseFloat(entry.stokAkhir)
              : undefined,
            kondisiGudang: entry.kondisiGudang || undefined,
          };

          const response = await laporanGudangAPI.create(laporanData);

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
          `Berhasil menyimpan ${successCount} laporan persediaan gudang`
        );

        // Reset form completely
        setTanggalLaporan(selectedDate);
        setErrors({});

        // Reset entries with one initial entry
        if (accounts.length > 0) {
          const initialEntry: PersediaanGudangEntry = {
            id: Date.now().toString(),
            accountId: accounts[0]?.id ? parseInt(accounts[0].id) : 0,
            accountName: accounts[0]?.accountName || "",
            stokAwal: "",
            pemakaian: "",
            stokAkhir: "",
            kondisiGudang: "",
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
  const handleDeleteLaporan = async (id: number, accountName?: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus laporan persediaan gudang untuk akun "${
        accountName || "ini"
      }"?`
    );

    if (!confirmed) return;

    try {
      const response = await laporanGudangAPI.delete(id);

      if (response && response.success) {
        toastSuccess.custom("Laporan persediaan gudang berhasil dihapus");
        loadLaporanData(); // Reload data
      } else {
        toastError.custom("Gagal menghapus laporan persediaan gudang");
      }
    } catch (error) {
      console.error("Error deleting gudang laporan:", error);
      toastError.custom("Gagal menghapus laporan persediaan gudang");
    }
  };

  // Fungsi untuk generate PDF
  const generatePDFReport = () => {
    const pdfData = {
      date: selectedDate,
      divisionName: userDivision.name,
      entries: [],
      accounts: accounts,
      laporanBlendingData: laporanGudangData.map((item) => {
        return {
          accountName:
            item.account?.accountName ||
            item.accountName ||
            item.account_name ||
            "-",
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
    const totalEntries = laporanGudangData.length;
    const totalMasuk = laporanGudangData.reduce(
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
    const totalPemakaian = laporanGudangData.reduce(
      (acc, item) => acc + (Number(item.pemakaian) || 0),
      0
    );
    const totalStokAkhir = laporanGudangData.reduce(
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

  if (!isPersediaanGudang) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Form ini hanya tersedia untuk Divisi Persediaan Gudang dan Blending.
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
      {/* Summary Cards */}
      <SummaryCard
        title={`Ringkasan Laporan Persediaan Gudang - ${selectedDate}`}
        items={generateSummaryData()}
        variant="compact"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Form Laporan Persediaan Gudang
            <Badge variant="outline" className="ml-2">
              {userDivision.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Laporan Persediaan Gudang:</strong> Input data persediaan
              bahan baku meliputi stok awal, pemakaian, dan stok akhir untuk
              setiap bahan baku di gudang.
            </AlertDescription>
          </Alert>

          {/* Date Selection */}
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

          {/* Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Entry Laporan</h3>
              <Button onClick={addNewEntry} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Tambah Entry
              </Button>
            </div>

            {entries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <p>
                    Belum ada entry. Klik "Tambah Entry" untuk menambah data.
                  </p>
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
                      {/* Account Selection */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Pilih Akun</Label>
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
                            errors[`${entry.id}_accountId`]
                              ? "border-red-500"
                              : ""
                          }`}
                        >
                          <option value={0}>-- Pilih Akun --</option>
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

                      {/* Stok Awal / Barang Masuk */}
                      <div className="space-y-2">
                        <Label>Stok Awal / Barang Masuk (gr/pcs)</Label>
                        <Input
                          type="number"
                          value={entry.stokAwal}
                          onChange={(e) =>
                            updateEntry(entry.id, "stokAwal", e.target.value)
                          }
                          placeholder="Stok awal atau barang masuk gudang"
                          step="0.01"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>

                      {/* Pemakaian */}
                      <div className="space-y-2">
                        <Label>Pemakaian (gr/pcs)</Label>
                        <Input
                          type="number"
                          value={entry.pemakaian}
                          onChange={(e) =>
                            updateEntry(entry.id, "pemakaian", e.target.value)
                          }
                          placeholder="Jumlah bahan baku yang digunakan"
                          step="0.01"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>

                      {/* Stok Akhir */}
                      <div className="space-y-2">
                        <Label>Stok Akhir (gr/pcs)</Label>
                        <Input
                          type="number"
                          value={entry.stokAkhir}
                          onChange={(e) =>
                            updateEntry(entry.id, "stokAkhir", e.target.value)
                          }
                          placeholder="Sisa stok setelah pemakaian"
                          step="0.01"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>

                      {/* Keterangan Kondisi Gudang */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Keterangan Kondisi Gudang</Label>
                        <Input
                          type="text"
                          value={entry.kondisiGudang}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "kondisiGudang",
                              e.target.value
                            )
                          }
                          placeholder="Catatan mengenai kondisi gudang atau bahan baku"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Separator />

          {/* PDF Export Buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              onClick={handlePreviewPDF}
              variant="outline"
              size="sm"
              disabled={laporanGudangData.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              disabled={laporanGudangData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Data Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Data Laporan Persediaan Gudang
              </h3>
              <Button
                onClick={loadLaporanData}
                variant="outline"
                size="sm"
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

            <Card>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Akun</TableHead>
                        <TableHead>Stok Awal</TableHead>
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
                      ) : laporanGudangData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Belum ada data untuk tanggal ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        laporanGudangData.map((item) => (
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
                                item.account_name ||
                                "-"}
                            </TableCell>
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
                                    item.account?.accountName ||
                                      item.account_name
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
    </div>
  );
}
