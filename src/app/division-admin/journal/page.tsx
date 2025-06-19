"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  BookOpen,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  Package,
  DollarSign,
  Warehouse,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // ✅ Add this import
import { getCurrentUser } from "@/lib/auth";
import {
  getAccountsByDivision,
  getEntriHarianByDate,
  saveEntriHarianBatch,
  deleteEntriHarian,
  type Account,
  type EntriHarian,
} from "@/lib/data";
import { Label } from "@/components/ui/label";
import type { CreateEntriHarianRequest } from "@/types/EntriHarian";

interface JournalRow {
  id: string;
  accountId: string;
  keterangan: string;
  nominal: string;
  kuantitas: string;
  // ✅ New fields for specialized divisions
  transactionType?: "PENERIMAAN" | "PENGELUARAN"; // For Keuangan
  targetAmount?: string; // For Pemasaran
  realisasiAmount?: string; // For Pemasaran
  hppAmount?: string; // For Produksi (paired with production)
  pemakaianAmount?: string; // For Gudang
  stokAkhir?: string; // For Gudang
}

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingEntries, setExistingEntries] = useState<EntriHarian[]>([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const user = getCurrentUser();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Form rows untuk input multiple entries
  const [journalRows, setJournalRows] = useState<JournalRow[]>([
    { id: "1", accountId: "", keterangan: "", nominal: "", kuantitas: "" },
  ]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    if (user?.division?.id) {
      try {
        // Load accounts dari "rak" divisi
        const accountsData = await getAccountsByDivision(user.division.id);
        setAccounts(accountsData);

        // Load existing entries untuk tanggal yang dipilih
        const entriesData = await getEntriHarianByDate(selectedDate);

        // Filter entries yang belong to current division
        const accountIds = accountsData.map((acc) => acc.id);

        const divisionEntries = entriesData.filter((entry) => {
          return accountIds.includes(entry.accountId);
        });

        setExistingEntries(divisionEntries);
      } catch (error) {
        setError("Gagal memuat data");
      }
    }
  };

  const addNewRow = () => {
    const newRow: JournalRow = {
      id: Date.now().toString(),
      accountId: "",
      keterangan: "",
      nominal: "",
      kuantitas: "",
      // ✅ Initialize specialized fields
      transactionType: undefined,
      targetAmount: "",
      realisasiAmount: "",
      hppAmount: "",
      pemakaianAmount: "",
      stokAkhir: "",
    };
    setJournalRows([...journalRows, newRow]);
  };

  const removeRow = (rowId: string) => {
    if (journalRows.length > 1) {
      setJournalRows(journalRows.filter((row) => row.id !== rowId));
    }
  };

  const updateRow = (rowId: string, field: keyof JournalRow, value: string) => {
    setJournalRows((prevRows) => {
      const newRows = prevRows.map((row) => {
        if (row.id === rowId) {
          return { ...row, [field]: value };
        }
        return row;
      });
      return newRows;
    });
  };

  const getAccountDisplay = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return "Akun tidak ditemukan";
    return `${account.accountCode} - ${account.accountName}`;
  };

  const getSelectedAccount = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId);
  };

  const getInputValue = (row: JournalRow) => {
    const account = getSelectedAccount(row.accountId);
    if (!account) return "";

    return account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
  };

  const formatDisplayValue = (value: string, valueType: string) => {
    if (!value || Number.parseFloat(value) === 0) return "-";

    const numValue = Number.parseFloat(value);

    if (valueType === "NOMINAL") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(numValue);
    } else {
      return `${numValue.toLocaleString("id-ID")} unit`;
    }
  };

  const saveJournalEntries = async () => {
    const validRows = journalRows.filter((row) => {
      const account = getSelectedAccount(row.accountId);
      if (!account) {
        return false;
      }

      // ✅ UPDATED: Special validation untuk KEUANGAN
      if (divisionType === "KEUANGAN") {
        // Untuk keuangan, wajib ada transaction type dan nominal
        const hasKeuanganData =
          row.transactionType &&
          row.nominal &&
          Number.parseFloat(row.nominal) > 0;
        return hasKeuanganData && row.accountId;
      }

      // ✅ Check for other division-specific data
      if (divisionType !== "GENERAL") {
        const hasSpecificData =
          (divisionType === "PEMASARAN" &&
            (row.targetAmount || row.realisasiAmount)) ||
          (divisionType === "PRODUKSI" && row.kuantitas && row.hppAmount) ||
          (divisionType === "GUDANG" && (row.pemakaianAmount || row.stokAkhir));

        return hasSpecificData && row.accountId;
      }

      // For GENERAL division, use existing validation
      const value =
        account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
      return row.accountId && value && Number.parseFloat(value) > 0;
    });

    if (validRows.length === 0) {
      setError("Tidak ada entri yang valid untuk disimpan");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // ✅ UPDATED: Create entries dengan logic yang benar untuk keuangan
    const entriesToSave: CreateEntriHarianRequest[] = validRows.map((row) => {
      const account = getSelectedAccount(row.accountId)!;

      // ✅ UPDATED: Determine nilai based on division type
      let nilai: number;
      if (divisionType === "GENERAL") {
        const value =
          account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
        nilai = Number.parseFloat(value);
      } else {
        // For specialized divisions, determine nilai from appropriate field
        switch (divisionType) {
          case "KEUANGAN":
            // ✅ FIXED: Untuk keuangan selalu gunakan nominal
            nilai = Number.parseFloat(row.nominal || "0");
            break;
          case "PEMASARAN":
            nilai = Number.parseFloat(
              row.realisasiAmount || row.targetAmount || "0"
            );
            break;
          case "PRODUKSI":
            nilai = Number.parseFloat(row.kuantitas || "0");
            break;
          case "GUDANG":
            nilai = Number.parseFloat(row.pemakaianAmount || "0");
            break;
          default:
            nilai = 0;
        }
      }

      const entry: CreateEntriHarianRequest = {
        accountId: Number(row.accountId),
        tanggal: selectedDate,
        nilai: nilai,
        description: row.keterangan || "",

        // ✅ Include division-specific data
        ...(row.transactionType && { transactionType: row.transactionType }),
        ...(row.targetAmount && {
          targetAmount: Number.parseFloat(row.targetAmount),
        }),
        ...(row.realisasiAmount && {
          realisasiAmount: Number.parseFloat(row.realisasiAmount),
        }),
        ...(row.hppAmount && { hppAmount: Number.parseFloat(row.hppAmount) }),
        ...(row.pemakaianAmount && {
          pemakaianAmount: Number.parseFloat(row.pemakaianAmount),
        }),
        ...(row.stokAkhir && { stokAkhir: Number.parseFloat(row.stokAkhir) }),
      };

      return entry;
    });

    try {
      const saved = await saveEntriHarianBatch(entriesToSave);
      await loadData(); // Force reload data from backend

      // Reset form
      setJournalRows([
        {
          id: "row_1",
          accountId: "",
          keterangan: "",
          nominal: "",
          kuantitas: "",
          transactionType: undefined,
          targetAmount: "",
          realisasiAmount: "",
          hppAmount: "",
          pemakaianAmount: "",
          stokAkhir: "",
        },
      ]);

      // ✅ IMPROVED: Better success message untuk keuangan
      let successMessage;
      if (divisionType === "KEUANGAN") {
        successMessage = `✅ ${
          saved.length
        } transaksi keuangan berhasil ditambahkan untuk tanggal ${new Date(
          selectedDate
        ).toLocaleDateString("id-ID")}!`;
      } else {
        successMessage =
          saved.length === entriesToSave.length
            ? `✅ ${
                saved.length
              } entri ${divisionType} berhasil disimpan untuk tanggal ${new Date(
                selectedDate
              ).toLocaleDateString("id-ID")}!`
            : `✅ ${saved.length} dari ${entriesToSave.length} entri berhasil disimpan (beberapa mungkin di-update)`;
      }

      setSuccess(successMessage);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      let errorMessage = "Gagal menyimpan entri jurnal";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const removeExistingEntry = async (id: string) => {
    if (confirm("Hapus entri ini?")) {
      if (await deleteEntriHarian(id)) {
        loadData();
        setSuccess("Entri berhasil dihapus");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Gagal menghapus entri");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const testSaveMinimal = async () => {
    const testEntry: CreateEntriHarianRequest = {
      accountId: 11, // ID account yang ada
      tanggal: "2025-06-19", // Pastikan format ISO string
      nilai: 100.0,
      description: "Test entry manual",
    };

    try {
      const saved = await saveEntriHarianBatch([testEntry]);
      setSuccess("Test berhasil!");
    } catch (error) {
      setError("Test gagal: " + (error as Error).message);
    }
  };

  // ✅ Helper function to get division type
  const getDivisionType = () => {
    const divisionName = user?.division?.name?.toLowerCase();
    if (divisionName?.includes("keuangan")) return "KEUANGAN";
    if (divisionName?.includes("produksi")) return "PRODUKSI";
    if (
      divisionName?.includes("pemasaran") ||
      divisionName?.includes("marketing")
    )
      return "PEMASARAN";
    if (divisionName?.includes("gudang") || divisionName?.includes("warehouse"))
      return "GUDANG";
    return "GENERAL";
  };

  const divisionType = getDivisionType();

  // ✅ Get division color scheme
  const getDivisionStyle = () => {
    switch (divisionType) {
      case "KEUANGAN":
        return {
          bg: "bg-blue-600",
          hover: "hover:bg-blue-700",
          icon: DollarSign,
        };
      case "PRODUKSI":
        return {
          bg: "bg-green-600",
          hover: "hover:bg-green-700",
          icon: Package,
        };
      case "PEMASARAN":
        return {
          bg: "bg-orange-600",
          hover: "hover:bg-orange-700",
          icon: TrendingUp,
        };
      case "GUDANG":
        return {
          bg: "bg-purple-600",
          hover: "hover:bg-purple-700",
          icon: Warehouse,
        };
      default:
        return {
          bg: "bg-gray-600",
          hover: "hover:bg-gray-700",
          icon: BookOpen,
        };
    }
  };

  const divisionStyle = getDivisionStyle();
  const DivisionIcon = divisionStyle.icon;

  // ✅ Render specialized input based on division - MOVED AND IMPLEMENTED
  const renderSpecializedInput = (
    row: JournalRow,
    selectedAccount: Account | undefined
  ) => {
    if (!selectedAccount) return null;

    switch (divisionType) {
      case "KEUANGAN":
        // For cash accounts, show transaction type selector
        if (selectedAccount.accountName.toLowerCase().includes("kas")) {
          return (
            <div className="col-span-12 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    <DollarSign className="inline h-3 w-3 mr-1" />
                    Jenis Transaksi
                  </label>
                  <Select
                    value={row.transactionType || ""}
                    onValueChange={(value) =>
                      updateRow(row.id, "transactionType", value)
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Pilih jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENERIMAAN">💰 Penerimaan</SelectItem>
                      <SelectItem value="PENGELUARAN">
                        💸 Pengeluaran
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Nominal
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={row.nominal}
                    onChange={(e) =>
                      updateRow(row.id, "nominal", e.target.value)
                    }
                    className="text-right text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Saldo akan terhitung otomatis
                  </div>
                </div>
              </div>
            </div>
          );
        }
        break;

      case "PRODUKSI":
        // For production accounts, show production + HPP input
        return (
          <div className="col-span-12 mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  <Package className="inline h-3 w-3 mr-1" />
                  Hasil Produksi
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.kuantitas}
                  onChange={(e) =>
                    updateRow(row.id, "kuantitas", e.target.value)
                  }
                  className="text-right text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Unit/Pcs yang diproduksi
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  <DollarSign className="inline h-3 w-3 mr-1" />
                  HPP (Harga Pokok Produksi)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.hppAmount}
                  onChange={(e) =>
                    updateRow(row.id, "hppAmount", e.target.value)
                  }
                  className="text-right text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Biaya produksi total
                </div>
              </div>
            </div>
          </div>
        );

      case "PEMASARAN":
        // For sales accounts, show target vs realization
        return (
          <div className="col-span-12 mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-orange-700 mb-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Target Penjualan
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.targetAmount}
                  onChange={(e) =>
                    updateRow(row.id, "targetAmount", e.target.value)
                  }
                  className="text-right text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Target yang harus dicapai
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-orange-700 mb-1">
                  <DollarSign className="inline h-3 w-3 mr-1" />
                  Realisasi Penjualan
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.realisasiAmount}
                  onChange={(e) =>
                    updateRow(row.id, "realisasiAmount", e.target.value)
                  }
                  className="text-right text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Penjualan aktual hari ini
                </div>
              </div>
            </div>
            {/* Performance indicator */}
            {row.targetAmount && row.realisasiAmount && (
              <div className="mt-2 p-2 bg-white rounded border">
                <div className="text-xs text-center">
                  Performance:{" "}
                  {Math.round(
                    (parseFloat(row.realisasiAmount) /
                      parseFloat(row.targetAmount)) *
                      100
                  )}
                  %
                  <div
                    className={`text-xs font-medium ${
                      parseFloat(row.realisasiAmount) >=
                      parseFloat(row.targetAmount)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {parseFloat(row.realisasiAmount) >=
                    parseFloat(row.targetAmount)
                      ? "✅ Target Tercapai"
                      : "⚠️ Belum Mencapai Target"}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "GUDANG":
        // For inventory accounts, show usage + remaining stock
        return (
          <div className="col-span-12 mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  <Warehouse className="inline h-3 w-3 mr-1" />
                  Pemakaian Hari Ini
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.pemakaianAmount}
                  onChange={(e) =>
                    updateRow(row.id, "pemakaianAmount", e.target.value)
                  }
                  className="text-right text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Yang dipakai untuk produksi
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  <Package className="inline h-3 w-3 mr-1" />
                  Stok Akhir
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.stokAkhir}
                  onChange={(e) =>
                    updateRow(row.id, "stokAkhir", e.target.value)
                  }
                  className="text-right text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Sisa stok di gudang
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DivisionIcon className="h-8 w-8 text-gray-600" />
            Jurnal {user?.division?.name}
            <Badge className={`${divisionStyle.bg} text-white text-sm`}>
              {divisionType}
            </Badge>
          </h1>
          <p className="text-gray-600 mt-2">
            {divisionType === "KEUANGAN" &&
              "Kategorisasi Transaksi Kas & Keuangan"}
            {divisionType === "PRODUKSI" &&
              "Input Hasil Produksi & HPP Terintegrasi"}
            {divisionType === "PEMASARAN" &&
              "Pelacakan Target vs Realisasi Penjualan"}
            {divisionType === "GUDANG" && "Pencatatan Pemakaian & Stok Akhir"}
            {divisionType === "GENERAL" && "Tambah Baru Data Jurnal"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date(selectedDate).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="date">Tgl Jurnal:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Journal Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DivisionIcon className="h-5 w-5" />
            Form Input Jurnal {divisionType}
          </CardTitle>
          <CardDescription>
            {divisionType === "KEUANGAN" &&
              "Pilih akun kas, tentukan jenis transaksi (Penerimaan/Pengeluaran), dan masukkan nominal"}
            {divisionType === "PRODUKSI" &&
              "Input hasil produksi dan HPP dalam satu formulir terintegrasi"}
            {divisionType === "PEMASARAN" &&
              "Catat target dan realisasi penjualan untuk monitoring kinerja"}
            {divisionType === "GUDANG" &&
              "Catat pemakaian bahan baku dan update stok akhir"}
            {divisionType === "GENERAL" &&
              "Pilih akun dari rak divisi, tambahkan keterangan, dan masukkan nilai sesuai tipe akun"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header - Updated for specialized divisions */}
            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-600 border-b pb-2">
              <div className="col-span-2">Tgl Jurnal</div>
              <div className="col-span-4">Akun</div>
              <div className="col-span-3">Keterangan</div>
              <div className="col-span-2">
                {divisionType === "GENERAL" ? "Nilai" : "Nilai Dasar"}
              </div>
              <div className="col-span-1">Aksi</div>
            </div>

            {/* Journal Rows */}
            {journalRows.map((row) => {
              const selectedAccount = getSelectedAccount(row.accountId);

              return (
                <div key={row.id} className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Tanggal */}
                    <div className="col-span-2">
                      <Input
                        type="date"
                        value={selectedDate}
                        disabled
                        className="bg-gray-50 text-sm"
                      />
                    </div>

                    {/* Akun Dropdown */}
                    <div className="col-span-4">
                      <Select
                        value={row.accountId}
                        onValueChange={(value) => {
                          if (value && value !== "no-accounts") {
                            updateRow(row.id, "accountId", value);
                            // Reset all values when account changes
                            updateRow(row.id, "nominal", "");
                            updateRow(row.id, "kuantitas", "");
                            updateRow(row.id, "transactionType", "");
                            updateRow(row.id, "targetAmount", "");
                            updateRow(row.id, "realisasiAmount", "");
                            updateRow(row.id, "hppAmount", "");
                            updateRow(row.id, "pemakaianAmount", "");
                            updateRow(row.id, "stokAkhir", "");
                          }
                        }}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Pilih akun dari rak...">
                            {/* ✅ Custom display untuk selected value */}
                            {row.accountId
                              ? (() => {
                                  const selectedAccount = getSelectedAccount(
                                    row.accountId
                                  );
                                  return selectedAccount ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-blue-600">
                                        {selectedAccount.accountCode}
                                      </span>
                                      <span className="text-sm">
                                        {selectedAccount.accountName}
                                      </span>
                                      <Badge
                                        className={`text-xs ${
                                          selectedAccount.valueType ===
                                          "NOMINAL"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {selectedAccount.valueType === "NOMINAL"
                                          ? "Rp"
                                          : "Unit"}
                                      </Badge>
                                    </div>
                                  ) : (
                                    "Akun tidak ditemukan"
                                  );
                                })()
                              : "Pilih akun dari rak..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-blue-600">
                                    {account.accountCode}
                                  </span>
                                  <span className="text-sm">
                                    {account.accountName}
                                  </span>
                                  <Badge
                                    className={`text-xs ${
                                      account.valueType === "NOMINAL"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {account.valueType === "NOMINAL"
                                      ? "Rp"
                                      : "Unit"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-accounts" disabled>
                              Tidak ada akun tersedia
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Keterangan */}
                    <div className="col-span-3">
                      <Input
                        placeholder="Keterangan..."
                        value={row.keterangan}
                        onChange={(e) =>
                          updateRow(row.id, "keterangan", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    {/* Nilai Input - Only show for GENERAL or as fallback */}
                    <div className="col-span-2">
                      {divisionType === "GENERAL" && selectedAccount ? (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            placeholder={
                              selectedAccount.valueType === "NOMINAL"
                                ? "0"
                                : "0 unit"
                            }
                            value={
                              selectedAccount.valueType === "NOMINAL"
                                ? row.nominal
                                : row.kuantitas
                            }
                            onChange={(e) => {
                              const field =
                                selectedAccount.valueType === "NOMINAL"
                                  ? "nominal"
                                  : "kuantitas";
                              updateRow(row.id, field, e.target.value);
                            }}
                            className="text-right text-sm"
                          />
                          <div className="text-xs text-gray-500 text-center">
                            {selectedAccount.valueType === "NOMINAL"
                              ? "💰 Rupiah"
                              : "📦 Unit/Jumlah"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-2">
                          {selectedAccount
                            ? "Gunakan form di bawah"
                            : "Pilih akun dulu"}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={journalRows.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ✅ Specialized Input Section - NOW WORKING */}
                  {renderSpecializedInput(row, selectedAccount)}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={addNewRow}
                className="bg-gray-50 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                ADD{" "}
                {divisionType === "KEUANGAN"
                  ? "TRANSAKSI"
                  : divisionType === "PRODUKSI"
                  ? "PRODUKSI"
                  : divisionType === "PEMASARAN"
                  ? "PENJUALAN"
                  : divisionType === "GUDANG"
                  ? "INVENTORY"
                  : "TRANSACTION"}
              </Button>

              <Button
                onClick={saveJournalEntries}
                className={`${divisionStyle.bg} ${divisionStyle.hover} text-white`}
              >
                <Save className="mr-2 h-4 w-4" />
                SAVE {divisionType}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Entries - Updated Display */}
      {existingEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Entri Tersimpan -{" "}
              {new Date(selectedDate).toLocaleDateString("id-ID")}
            </CardTitle>
            <CardDescription>
              {existingEntries.length} entri tercatat untuk divisi{" "}
              {user?.division?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kode Akun</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingEntries.map((entry) => {
                    const account = accounts.find(
                      (acc) => acc.id === entry.accountId
                    );
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-blue-600">
                          {account?.accountCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {account?.accountName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              account?.valueType === "NOMINAL"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {account?.valueType === "NOMINAL"
                              ? "💰 Rp"
                              : "📦 Unit"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.description || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDisplayValue(
                            entry.nilai.toString(),
                            account?.valueType || "NOMINAL"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeExistingEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary - Updated */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-blue-600">
                    Total Nominal (Rupiah)
                  </p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatDisplayValue(
                      existingEntries
                        .filter((entry) => {
                          const acc = accounts.find(
                            (a) => a.id === entry.accountId
                          );
                          return acc?.valueType === "NOMINAL";
                        })
                        .reduce((sum, entry) => sum + entry.nilai, 0)
                        .toString(),
                      "NOMINAL"
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-green-600">
                    Total Kuantitas (Unit)
                  </p>
                  <p className="text-xl font-bold text-green-800">
                    {formatDisplayValue(
                      existingEntries
                        .filter((entry) => {
                          const acc = accounts.find(
                            (a) => a.id === entry.accountId
                          );
                          return acc?.valueType === "KUANTITAS";
                        })
                        .reduce((sum, entry) => sum + entry.nilai, 0)
                        .toString(),
                      "KUANTITAS"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info untuk akun kosong */}
      {accounts.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-yellow-900">
                Rak Akun Masih Kosong
              </h3>
              <p className="text-yellow-800 text-sm mt-2">
                Belum ada akun di rak divisi {user?.division?.name}. Silakan
                tambahkan akun terlebih dahulu di menu "Rak Akun Divisi".
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
