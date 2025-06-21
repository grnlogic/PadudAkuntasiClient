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
  Users, // ✅ Add Users icon for HRD
  Clock, // ✅ Add Clock icon for attendance
  ArrowUpCircle, // ✅ Add for Penerimaan
  ArrowDownCircle, // ✅ Add for Pengeluaran
  Download, // ✅ Add for PDF download
  FileText, // ✅ Add for PDF preview
} from "lucide-react";
import ClientErrorBoundary from "@/components/client-error-boundary";
import {
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastPromise,
} from "@/lib/toast-utils";
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
import React from "react";

interface JournalRow {
  id: string;
  accountId: string;
  keterangan: string;
  nominal: string;
  kuantitas: string;
  // ✅ New fields for specialized divisions
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR"; // For Keuangan with 3 options
  targetAmount?: string; // For Pemasaran
  realisasiAmount?: string; // For Pemasaran
  hppAmount?: string; // For Produksi (paired with production)
  pemakaianAmount?: string; // For Gudang
  stokAkhir?: string; // For Gudang
  // ✅ NEW: HRD fields - Updated
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN"; // For HRD
  absentCount?: string; // For HRD - Jumlah tidak hadir (ganti dari overtimeHours)
  shift?: "REGULER" | "LEMBUR"; // For HRD - Reguler (7-15) atau Lembur (15-20)
  // ✅ NEW: Keuangan field - Saldo Akhir
  saldoAkhir?: string; // For Keuangan
}

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingEntries, setExistingEntries] = useState<EntriHarian[]>([]);
  const [loading, setLoading] = useState(false);

  const user = getCurrentUser();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ NEW: State untuk summary keuangan
  const [keuanganSummary, setKeuanganSummary] = useState({
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    totalSaldoAkhir: 0,
  });

  // Form rows untuk input multiple entries
  const [journalRows, setJournalRows] = useState<JournalRow[]>([
    {
      id: "1",
      accountId: "",
      keterangan: "",
      nominal: "",
      kuantitas: "",
      // ✅ Initialize all optional fields to prevent controlled/uncontrolled warnings
      transactionType: undefined,
      targetAmount: "",
      realisasiAmount: "",
      hppAmount: "",
      pemakaianAmount: "",
      stokAkhir: "",
      saldoAkhir: "",
      attendanceStatus: undefined,
      absentCount: "", // ✅ Initialize as empty string, not undefined
      shift: undefined,
    },
  ]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // ✅ NEW: Fungsi untuk menghitung summary keuangan
  const calculateKeuanganSummary = (entries: EntriHarian[]) => {
    console.log("🔍 calculateKeuanganSummary called with entries:", entries);

    const summary = {
      totalPenerimaan: 0,
      totalPengeluaran: 0,
      totalSaldoAkhir: 0,
    };

    entries.forEach((entry, index) => {
      // Cast ke any untuk mengakses field yang mungkin tidak ada di type
      const entryData = entry as any;

      console.log(`🔍 Processing entry ${index}:`, {
        id: entry.id,
        transactionType: entryData.transactionType,
        nilai: entry.nilai,
        saldoAkhir: entryData.saldoAkhir,
      });

      if (entryData.transactionType === "PENERIMAAN") {
        summary.totalPenerimaan += Number(entry.nilai) || 0;
        console.log(`✅ Added to PENERIMAAN: ${entry.nilai}`);
      } else if (entryData.transactionType === "PENGELUARAN") {
        summary.totalPengeluaran += Number(entry.nilai) || 0;
        console.log(`✅ Added to PENGELUARAN: ${entry.nilai}`);
      } else if (entryData.transactionType === "SALDO_AKHIR") {
        // Untuk SALDO_AKHIR, gunakan field saldoAkhir jika ada, fallback ke nilai
        const saldoValue =
          Number(entryData.saldoAkhir) || Number(entry.nilai) || 0;
        summary.totalSaldoAkhir += saldoValue;
        console.log(
          `✅ Added to SALDO_AKHIR: ${saldoValue} (from saldoAkhir: ${entryData.saldoAkhir}, nilai: ${entry.nilai})`
        );
      }
    });

    console.log("🔍 Final summary:", summary);
    return summary;
  };

  const loadData = async () => {
    if (user?.division?.id) {
      try {
        setLoading(true);

        // ✅ Use promise toast for loading
        const accountsPromise = getAccountsByDivision(user.division.id);
        const entriesPromise = getEntriHarianByDate(selectedDate);

        const [accountsData, entriesData] = await Promise.all([
          accountsPromise,
          entriesPromise,
        ]);

        setAccounts(accountsData);

        // Filter entries yang belong to current division
        const accountIds = accountsData.map((acc) => acc.id);
        const divisionEntries = entriesData.filter(
          (entry: { accountId: string }) => {
            return accountIds.includes(entry.accountId);
          }
        );

        setExistingEntries(divisionEntries);

        // ✅ NEW: Hitung summary untuk keuangan
        if (divisionType === "KEUANGAN") {
          const summary = calculateKeuanganSummary(divisionEntries);
          setKeuanganSummary(summary);
          console.log("🔍 KEUANGAN SUMMARY:", summary);
        }

        // ✅ Only show success for manual refresh
        if (loading) {
          toastSuccess.custom("Data berhasil dimuat ulang");
        }
      } catch (error) {
        toastError.custom("Gagal memuat data");
        console.error("Load data error:", error);
      } finally {
        setLoading(false);
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
      // ✅ Initialize specialized fields to prevent controlled/uncontrolled warnings
      transactionType: undefined,
      targetAmount: "",
      realisasiAmount: "",
      hppAmount: "",
      pemakaianAmount: "",
      stokAkhir: "",
      saldoAkhir: "",
      attendanceStatus: undefined,
      absentCount: "", // ✅ Initialize as empty string
      shift: undefined,
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

  // ✅ Helper function to get display value for entries
  const getDisplayValue = (entry: EntriHarian) => {
    if ((entry as any).transactionType === "SALDO_AKHIR") {
      // For SALDO_AKHIR, prioritize saldoAkhir field, fallback to nilai
      return (entry as any).saldoAkhir || entry.nilai || 0;
    }
    // For other transaction types, use nilai
    return entry.nilai || 0;
  };

  // ✅ Helper function to format display value
  const formatDisplayValue = (
    p0: string,
    valueType: string,
    entry: EntriHarian
  ) => {
    const value = getDisplayValue(entry);
    return value ? formatCurrency(value) : "-";
  };

  const saveJournalEntries = async () => {
    console.log("🚀 SAVE JOURNAL ENTRIES - START");

    const validRows = journalRows.filter((row) => {
      const account = getSelectedAccount(row.accountId);
      if (!account) {
        return false;
      }

      // ✅ ENHANCED DEBUG: Log validation process for pemasaran
      if (divisionType === "PEMASARAN") {
        console.log("🎯 PEMASARAN VALIDATION:", {
          rowId: row.id,
          accountId: row.accountId,
          targetAmount: row.targetAmount,
          realisasiAmount: row.realisasiAmount,
          hasTargetAmount: !!row.targetAmount,
          hasRealisasiAmount: !!row.realisasiAmount,
          hasEither: !!(row.targetAmount || row.realisasiAmount),
        });
      } // ✅ ENHANCED: For keuangan, use saldoAkhir if transaction type is SALDO_AKHIR
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
          (divisionType === "GUDANG" &&
            (row.pemakaianAmount || row.stokAkhir)) ||
          (divisionType === "HRD" && row.attendanceStatus); // ✅ NEW: HRD validation

        console.log("✅ VALIDATION RESULT:", {
          divisionType,
          hasSpecificData,
          accountId: row.accountId,
        });

        return hasSpecificData && row.accountId;
      }

      // For GENERAL division, use existing validation
      const value =
        account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
      return row.accountId && value && Number.parseFloat(value) > 0;
    });

    console.log("📊 VALID ROWS COUNT:", validRows.length);

    if (validRows.length === 0) {
      console.log("❌ No valid rows - showing validation error");
      toastError.validation("Tidak ada entri yang valid untuk disimpan");
      return;
    }

    // ✅ Enhanced loading state
    console.log("🔄 Starting save process...");
    setLoading(true);

    try {
      const entriesToSave: CreateEntriHarianRequest[] = validRows.map((row) => {
        const account = getSelectedAccount(row.accountId)!;

        let nilai: number;
        if (divisionType === "GENERAL") {
          const value =
            account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
          nilai = Number.parseFloat(value);
        } else {
          switch (divisionType) {
            case "PEMASARAN":
              // ✅ FIXED: Use realisasiAmount as primary nilai, fallback to targetAmount
              nilai = Number.parseFloat(
                row.realisasiAmount || row.targetAmount || "0"
              );
              console.log("🎯 PEMASARAN NILAI CALCULATION:", {
                rowId: row.id,
                realisasiAmount: row.realisasiAmount,
                targetAmount: row.targetAmount,
                calculatedNilai: nilai,
              });
              break;
            case "KEUANGAN":
              // ✅ FIXED: Untuk keuangan selalu gunakan nominal
              nilai = Number.parseFloat(row.nominal || "0");
              break;
            case "PRODUKSI":
              nilai = Number.parseFloat(row.kuantitas || "0");
              break;
            case "GUDANG":
              nilai = Number.parseFloat(row.pemakaianAmount || "0");
              break;
            case "HRD": // ✅ NEW: HRD logic
              // For HRD, nilai represents attendance (1 for present, 0 for absent)
              nilai = row.attendanceStatus === "HADIR" ? 1 : 0;
              break;
            default:
              nilai = 0;
          }
        } // ✅ ENHANCED: Set nilai berdasarkan jenis transaksi
        let entryNilai = Number.parseFloat(row.nominal) || 0;
        let entrySaldoAkhir: number | undefined = undefined;

        // Jika jenis transaksi adalah SALDO_AKHIR, simpan ke field saldoAkhir
        if (row.transactionType === "SALDO_AKHIR") {
          entrySaldoAkhir = entryNilai;
          entryNilai = 0; // Set nilai ke 0 karena ini bukan transaksi biasa
        }

        const entry: CreateEntriHarianRequest = {
          accountId: Number(row.accountId),
          tanggal: selectedDate,
          nilai: nilai,
          description: row.keterangan || "",

          // ✅ ENHANCED DEBUG: Log before creating entry
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
          // ✅ NEW: HRD fields - Updated
          ...(row.attendanceStatus && {
            attendanceStatus: row.attendanceStatus,
          }),
          ...(row.absentCount && {
            absentCount: Number.parseFloat(row.absentCount),
          }),
          ...(row.shift && { shift: row.shift }),
          // ✅ NEW: Keuangan saldo akhir field
          ...(entrySaldoAkhir && {
            saldoAkhir: entrySaldoAkhir,
          }),
        };

        // ✅ ENHANCED DEBUG: Log what we're about to send
        if (divisionType === "PEMASARAN") {
          console.log("🎯 SENDING PEMASARAN ENTRY:", {
            id: row.id,
            accountId: entry.accountId,
            targetAmount: entry.targetAmount,
            realisasiAmount: entry.realisasiAmount,
            rawTargetAmount: row.targetAmount,
            rawRealisasiAmount: row.realisasiAmount,
            hasTarget: !!entry.targetAmount,
            hasRealisasi: !!entry.realisasiAmount,
          });
        }

        return entry;
      });

      console.log("📤 SENDING TO BACKEND:", entriesToSave);

      // ✅ Manual save instead of promise toast for better debugging
      const saved = await saveEntriHarianBatch(entriesToSave);

      console.log("✅ BACKEND RESPONSE:", saved);

      // Force reload data
      await loadData();

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
          saldoAkhir: "",
          attendanceStatus: undefined,
          absentCount: "",
          shift: undefined,
        },
      ]);

      // ✅ Manual success toast
      const totalRequested = entriesToSave.length;
      const totalSaved = saved.length;

      console.log("📊 SAVE SUMMARY:", { totalRequested, totalSaved });

      if (totalSaved === totalRequested) {
        console.log("✅ All entries saved successfully");
        toastSuccess.save(totalSaved, `entri ${divisionType}`);
      } else if (totalSaved > 0) {
        console.log("⚠️ Partial save");
        toastWarning.partial(totalSaved, totalRequested);
      } else {
        console.log("ℹ️ No changes");
        toastInfo.noChanges();
      }
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);

      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        console.log("🔍 Error analysis:", errorMsg);

        if (errorMsg.includes("duplicate") || errorMsg.includes("constraint")) {
          console.log("🔄 Duplicate error detected");
          toastError.duplicate();
          setTimeout(() => loadData(), 1000);
        } else if (
          errorMsg.includes("validation") ||
          errorMsg.includes("invalid")
        ) {
          console.log("❌ Validation error detected");
          toastError.validation(err.message);
        } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
          console.log("🌐 Network error detected");
          toastError.network();
        } else if (
          errorMsg.includes("permission") ||
          errorMsg.includes("access")
        ) {
          console.log("🚫 Permission error detected");
          toastError.permission();
        } else {
          console.log("⚠️ Server error detected");
          toastError.server();
        }
      } else {
        console.log("❓ Unknown error detected");
        toastError.custom("Terjadi kesalahan yang tidak diketahui");
      }
    } finally {
      console.log("🏁 Save process finished");
      setLoading(false);
    }
  };

  const removeExistingEntry = async (id: string) => {
    if (!confirm("Hapus entri ini?")) return;

    try {
      await toastPromise.delete(deleteEntriHarian(id), "entri jurnal");

      loadData();
    } catch (error) {
      toastError.custom("Gagal menghapus entri");
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
    if (
      divisionName?.includes("hrd") ||
      divisionName?.includes("sumber daya manusia")
    )
      return "HRD"; // ✅ ADD: HRD division detection
    return "GENERAL";
  };

  const divisionType = getDivisionType();

  // ✅ Helper function untuk format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      // ✅ NEW: HRD style
      case "HRD":
        return {
          bg: "bg-indigo-600",
          hover: "hover:bg-indigo-700",
          icon: Users,
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

  // ✅ ENHANCED: PDF Generation Functions with Division-Specific Features
  const generatePDFReport = () => {
    try {
      // Dynamic import to avoid SSR issues
      import("@/lib/enhanced-pdf")
        .then(({ downloadEnhancedPDF }) => {
          const reportData = {
            date: selectedDate,
            divisionName: user?.division?.name || "UNKNOWN",
            entries: existingEntries,
            accounts: accounts,
            ...(divisionType === "KEUANGAN" && { summary: keuanganSummary }),
          };

          downloadEnhancedPDF(reportData);
          toastSuccess.custom("Jendela print PDF telah dibuka");
        })
        .catch((error) => {
          console.error("PDF generation error:", error);
          toastError.custom("Gagal generate PDF");
        });
    } catch (error) {
      console.error("PDF error:", error);
      toastError.custom("Terjadi kesalahan saat membuat PDF");
    }
  };

  const previewPDFReport = () => {
    try {
      import("@/lib/enhanced-pdf")
        .then(({ previewEnhancedPDF }) => {
          const reportData = {
            date: selectedDate,
            divisionName: user?.division?.name || "UNKNOWN",
            entries: existingEntries,
            accounts: accounts,
            ...(divisionType === "KEUANGAN" && { summary: keuanganSummary }),
          };

          previewEnhancedPDF(reportData);
          toastSuccess.custom("Preview PDF telah dibuka di tab baru");
        })
        .catch((error) => {
          console.error("PDF preview error:", error);
          toastError.custom("Gagal preview PDF");
        });
    } catch (error) {
      console.error("PDF preview error:", error);
      toastError.custom("Terjadi kesalahan saat preview PDF");
    }
  };

  // ✅ Render specialized input based on division - IMPLEMENTASI LENGKAP
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
                  <Label>Jenis Transaksi</Label>
                  <Select
                    value={row.transactionType || ""}
                    onValueChange={(
                      value: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR"
                    ) => updateRow(row.id, "transactionType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENERIMAAN">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          Penerimaan
                        </div>
                      </SelectItem>
                      <SelectItem value="PENGELUARAN">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          Pengeluaran
                        </div>
                      </SelectItem>
                      <SelectItem value="SALDO_AKHIR">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                          Saldo Akhir
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nominal</Label>
                  <Input
                    type="number"
                    placeholder={
                      selectedAccount?.valueType === "NOMINAL"
                        ? "Rp 0"
                        : "0 unit"
                    }
                    value={getInputValue(row)}
                    onChange={(e) => {
                      const field =
                        selectedAccount?.valueType === "NOMINAL"
                          ? "nominal"
                          : "kuantitas";
                      updateRow(row.id, field, e.target.value);
                    }}
                    className="mt-1"
                    min="0"
                    step={
                      selectedAccount?.valueType === "NOMINAL" ? "1000" : "1"
                    }
                  />
                </div>
                <div>
                  <Label>Nilai Tampil</Label>
                  <div className="mt-1 p-2 bg-white rounded border text-sm">
                    {selectedAccount
                      ? getInputValue(row)
                        ? formatCurrency(Number.parseFloat(getInputValue(row)))
                        : "0"
                      : "Pilih akun dulu"}
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

      // ✅ NEW: HRD specialized input - Updated
      case "HRD":
        // For employee accounts, show attendance status
        return (
          <div className="col-span-12 mt-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-indigo-700 mb-1">
                  <Users className="inline h-3 w-3 mr-1" />
                  Status Kehadiran
                </label>
                <Select
                  value={row.attendanceStatus || ""}
                  onValueChange={(value) =>
                    updateRow(row.id, "attendanceStatus", value)
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HADIR">✅ Hadir</SelectItem>
                    <SelectItem value="TIDAK_HADIR">❌ Tidak Hadir</SelectItem>
                    <SelectItem value="SAKIT">🤒 Sakit</SelectItem>
                    <SelectItem value="IZIN">📝 Izin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-700 mb-1">
                  <Users className="inline h-3 w-3 mr-1" />
                  Jumlah Tidak Hadir
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.absentCount}
                  onChange={(e) =>
                    updateRow(row.id, "absentCount", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Orang yang tidak hadir
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-700 mb-1">
                  Shift Kerja
                </label>
                <Select
                  value={row.shift || ""}
                  onValueChange={(value) => updateRow(row.id, "shift", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Pilih shift..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULER">
                      🌅 Reguler (07:00-15:00)
                    </SelectItem>
                    <SelectItem value="LEMBUR">
                      ⏰ Lembur (15:00-20:00)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Attendance summary */}
            {row.attendanceStatus && (
              <div className="mt-2 p-2 bg-white rounded border">
                <div className="text-xs text-center">
                  <div
                    className={`font-medium ${
                      row.attendanceStatus === "HADIR"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {row.attendanceStatus === "HADIR"
                      ? "✅ Karyawan Hadir"
                      : `❌ Karyawan ${
                          row.attendanceStatus === "SAKIT"
                            ? "Sakit"
                            : row.attendanceStatus === "IZIN"
                            ? "Izin"
                            : "Tidak Hadir"
                        }`}
                  </div>
                  {row.absentCount &&
                    Number.parseFloat(row.absentCount) > 0 && (
                      <div className="text-red-600 mt-1">
                        👥 Tidak Hadir: {row.absentCount} orang
                      </div>
                    )}
                  {row.shift === "LEMBUR" && (
                    <div className="text-blue-600 mt-1">
                      ⏰ Shift Lembur (15:00-20:00)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ✅ Debug: Log existing entries to check HRD field mapping
  useEffect(() => {
    if (existingEntries.length > 0) {
      console.log("🔍 EXISTING ENTRIES DEBUG:", existingEntries);
      existingEntries.forEach((entry, index) => {
        console.log(`Entry ${index}:`, {
          id: entry.id,
          transactionType: (entry as any).transactionType,
          nilai: entry.nilai,
          saldoAkhir: (entry as any).saldoAkhir,
          // ✅ NEW: Debug HRD fields
          attendanceStatus: (entry as any).attendanceStatus,
          absentCount: (entry as any).absentCount,
          shift: (entry as any).shift,
          // ✅ Check if HRD data exists
          hasHRDData: !!(
            (entry as any).attendanceStatus ||
            (entry as any).absentCount ||
            (entry as any).shift
          ),
          rawEntry: entry,
        });
      });

      // ✅ NEW: Special HRD data summary
      if (divisionType === "HRD") {
        console.log("🎯 HRD DATA SUMMARY:", {
          totalEntries: existingEntries.length,
          hadirCount: existingEntries.filter(
            (e) => (e as any).attendanceStatus === "HADIR"
          ).length,
          totalAbsent: existingEntries.reduce(
            (sum, e) => sum + (Number((e as any).absentCount) || 0),
            0
          ),
          lemburCount: existingEntries.filter(
            (e) => (e as any).shift === "LEMBUR"
          ).length,
        });
      }
    }
  }, [existingEntries, divisionType]);

  // ✅ Debug: Check if backend returns saldoAkhir field
  useEffect(() => {
    console.log("🔍 EXISTING ENTRIES:", existingEntries);
  }, [existingEntries]);

  return (
    <ClientErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DivisionIcon className="h-8 w-8 text-gray-600" />
              Jurnal {user?.division?.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Pilih akun, jenis transaksi, dan masukkan nominal.{" "}
              <span className="text-blue-600 font-medium">
                Gunakan "Cetak PDF" untuk laporan ke atasan.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* PDF Actions - Only show if there are entries or for summary view */}
            {(existingEntries.length > 0 ||
              (divisionType === "KEUANGAN" &&
                (keuanganSummary.totalPenerimaan > 0 ||
                  keuanganSummary.totalPengeluaran > 0 ||
                  keuanganSummary.totalSaldoAkhir > 0))) && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={previewPDFReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled={loading}
                  title="Preview laporan sebelum mencetak"
                >
                  <FileText className="h-4 w-4" />
                  Preview Laporan
                </Button>
                <Button
                  onClick={generatePDFReport}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                  disabled={loading}
                  title="Cetak laporan untuk diserahkan ke atasan"
                >
                  <Download className="h-4 w-4" />
                  Cetak PDF
                </Button>
              </div>
            )}

            {/* Date Info */}
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
        </div>

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
              {journalRows.map((row, index) => {
                const selectedAccount = getSelectedAccount(row.accountId);

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-gray-50"
                  >
                    {/* SIMPLIFIED: Hanya Akun dan Keterangan di form row putih */}

                    {/* Akun - 6 kolom */}
                    <div className="col-span-6">
                      <Label>Akun</Label>
                      <Select
                        value={row.accountId}
                        onValueChange={(value) =>
                          updateRow(row.id, "accountId", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Pilih akun" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {getAccountDisplay(account.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Keterangan - 5 kolom */}
                    <div className="col-span-5">
                      <Label>Keterangan</Label>
                      <Input
                        placeholder="Deskripsi"
                        value={row.keterangan}
                        onChange={(e) =>
                          updateRow(row.id, "keterangan", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>

                    {/* Delete Button - 1 kolom */}
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                        disabled={journalRows.length === 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* SEMUA FIELD LAINNYA dipindahkan ke bar bawah */}
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      SAVE {divisionType}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ ENHANCED: Summary Cards untuk Semua Divisi */}

        {/* Summary untuk KEUANGAN */}
        {divisionType === "KEUANGAN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Ringkasan Transaksi Harian KEUANGAN
              </CardTitle>
              <p className="text-sm text-gray-600">
                Ringkasan transaksi keuangan untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Penerimaan */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Total Penerimaan
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(keuanganSummary.totalPenerimaan)}
                  </p>
                </div>

                {/* Total Pengeluaran */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">
                      Total Pengeluaran
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {formatCurrency(keuanganSummary.totalPengeluaran)}
                  </p>
                </div>

                {/* Total Saldo Akhir */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Total Saldo Akhir
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(keuanganSummary.totalSaldoAkhir)}
                  </p>
                </div>
              </div>

              {/* Net Balance */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    Saldo Bersih Harian
                  </h3>
                  <p
                    className={`text-xl font-bold ${
                      keuanganSummary.totalPenerimaan -
                        keuanganSummary.totalPengeluaran >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      keuanganSummary.totalPenerimaan -
                        keuanganSummary.totalPengeluaran
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NEW: Summary untuk PEMASARAN */}
        {divisionType === "PEMASARAN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ringkasan Performance PEMASARAN
              </CardTitle>
              <p className="text-sm text-gray-600">
                Target vs Realisasi penjualan untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Total Target
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(
                      existingEntries.reduce((sum, entry) => {
                        const target = (entry as any).targetAmount || 0;
                        return sum + Number(target);
                      }, 0)
                    )}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Total Realisasi
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(
                      existingEntries.reduce((sum, entry) => {
                        const realisasi = (entry as any).realisasiAmount || 0;
                        return sum + Number(realisasi);
                      }, 0)
                    )}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">
                      Achievement Rate
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mt-2">
                    {(() => {
                      const totalTarget = existingEntries.reduce(
                        (sum, entry) => {
                          const target = (entry as any).targetAmount || 0;
                          return sum + Number(target);
                        },
                        0
                      );
                      const totalRealisasi = existingEntries.reduce(
                        (sum, entry) => {
                          const realisasi = (entry as any).realisasiAmount || 0;
                          return sum + Number(realisasi);
                        },
                        0
                      );
                      const rate =
                        totalTarget > 0
                          ? (totalRealisasi / totalTarget) * 100
                          : 0;
                      return rate.toFixed(1) + "%";
                    })()}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Status</h3>
                  </div>
                  <p className="text-lg font-bold text-purple-900 mt-2">
                    {(() => {
                      const totalTarget = existingEntries.reduce(
                        (sum, entry) => {
                          const target = (entry as any).targetAmount || 0;
                          return sum + Number(target);
                        },
                        0
                      );
                      const totalRealisasi = existingEntries.reduce(
                        (sum, entry) => {
                          const realisasi = (entry as any).realisasiAmount || 0;
                          return sum + Number(realisasi);
                        },
                        0
                      );
                      const rate =
                        totalTarget > 0
                          ? (totalRealisasi / totalTarget) * 100
                          : 0;
                      return rate >= 100 ? "Target Tercapai" : "Belum Tercapai";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NEW: Summary untuk PRODUKSI */}
        {divisionType === "PRODUKSI" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ringkasan Produksi Harian
              </CardTitle>
              <p className="text-sm text-gray-600">
                Hasil produksi dan HPP untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Total Produksi
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {existingEntries
                      .reduce((sum, entry) => {
                        return sum + Number(entry.nilai);
                      }, 0)
                      .toLocaleString("id-ID")}{" "}
                    unit
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">Total HPP</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mt-2">
                    {formatCurrency(
                      existingEntries.reduce((sum, entry) => {
                        const hpp = (entry as any).hppAmount || 0;
                        return sum + Number(hpp);
                      }, 0)
                    )}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      HPP per Unit
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {(() => {
                      const totalProduksi = existingEntries.reduce(
                        (sum, entry) => {
                          return sum + Number(entry.nilai);
                        },
                        0
                      );
                      const totalHPP = existingEntries.reduce((sum, entry) => {
                        const hpp = (entry as any).hppAmount || 0;
                        return sum + Number(hpp);
                      }, 0);
                      const hppPerUnit =
                        totalProduksi > 0 ? totalHPP / totalProduksi : 0;
                      return formatCurrency(hppPerUnit);
                    })()}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Efisiensi</h3>
                  </div>
                  <p className="text-lg font-bold text-purple-900 mt-2">
                    {(() => {
                      const totalProduksi = existingEntries.reduce(
                        (sum, entry) => {
                          return sum + Number(entry.nilai);
                        },
                        0
                      );
                      const totalHPP = existingEntries.reduce((sum, entry) => {
                        const hpp = (entry as any).hppAmount || 0;
                        return sum + Number(hpp);
                      }, 0);
                      const hppPerUnit =
                        totalProduksi > 0 ? totalHPP / totalProduksi : 0;
                      return hppPerUnit < 5000 ? "Efisien" : "Review";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NEW: Summary untuk GUDANG */}
        {divisionType === "GUDANG" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Ringkasan Inventori Harian
              </CardTitle>
              <p className="text-sm text-gray-600">
                Pemakaian dan stok untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Total Pemakaian
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {existingEntries
                      .reduce((sum, entry) => {
                        const pemakaian = (entry as any).pemakaianAmount || 0;
                        return sum + Number(pemakaian);
                      }, 0)
                      .toLocaleString("id-ID")}{" "}
                    unit
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Rata-rata Stok
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {(() => {
                      const validEntries = existingEntries.filter(
                        (entry) => (entry as any).stokAkhir != null
                      );
                      if (validEntries.length === 0) return "0 unit";
                      const avgStok =
                        validEntries.reduce((sum, entry) => {
                          const stok = (entry as any).stokAkhir || 0;
                          return sum + Number(stok);
                        }, 0) / validEntries.length;
                      return avgStok.toLocaleString("id-ID") + " unit";
                    })()}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">
                      Item Stok Rendah
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mt-2">
                    {
                      existingEntries.filter((entry) => {
                        const stok = (entry as any).stokAkhir || 0;
                        return Number(stok) < 100;
                      }).length
                    }{" "}
                    item
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">
                      Status Gudang
                    </h3>
                  </div>
                  <p className="text-lg font-bold text-purple-900 mt-2">
                    {(() => {
                      const lowStockCount = existingEntries.filter((entry) => {
                        const stok = (entry as any).stokAkhir || 0;
                        return Number(stok) < 100;
                      }).length;
                      return lowStockCount > 0 ? "Perlu Restock" : "Stok Aman";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NEW: Summary untuk HRD */}
        {divisionType === "HRD" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ringkasan Kehadiran Harian
              </CardTitle>
              <p className="text-sm text-gray-600">
                Status kehadiran karyawan untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Karyawan Hadir
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {
                      existingEntries.filter((entry) => {
                        const status = (entry as any).attendanceStatus;
                        return status === "HADIR";
                      }).length
                    }{" "}
                    orang
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Tingkat Kehadiran
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {(() => {
                      const totalKaryawan = existingEntries.length;
                      const hadirCount = existingEntries.filter((entry) => {
                        const status = (entry as any).attendanceStatus;
                        return status === "HADIR";
                      }).length;
                      const rate =
                        totalKaryawan > 0
                          ? (hadirCount / totalKaryawan) * 100
                          : 0;
                      return rate.toFixed(1) + "%";
                    })()}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">
                      Total Jam Lembur
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {existingEntries.reduce((sum, entry) => {
                      const overtime = (entry as any).overtimeHours || 0;
                      return sum + Number(overtime);
                    }, 0)}{" "}
                    jam
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">
                      Status Kehadiran
                    </h3>
                  </div>
                  <p className="text-lg font-bold text-orange-900 mt-2">
                    {(() => {
                      const totalKaryawan = existingEntries.length;
                      const hadirCount = existingEntries.filter((entry) => {
                        const status = (entry as any).attendanceStatus;
                        return status === "HADIR";
                      }).length;
                      const rate =
                        totalKaryawan > 0
                          ? (hadirCount / totalKaryawan) * 100
                          : 0;
                      return rate >= 90
                        ? "Excellent"
                        : rate >= 80
                        ? "Good"
                        : "Needs Improvement";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                              account?.valueType || "NOMINAL",
                              entry
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
                      {formatCurrency(
                        existingEntries
                          .filter((entry) => {
                            const acc = accounts.find(
                              (a) => a.id === entry.accountId
                            );
                            return acc?.valueType === "NOMINAL";
                          })
                          .reduce((sum, entry) => sum + entry.nilai, 0)
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
                      {existingEntries
                        .filter((entry) => {
                          const acc = accounts.find(
                            (a) => a.id === entry.accountId
                          );
                          return acc?.valueType === "KUANTITAS";
                        })
                        .reduce((sum, entry) => sum + entry.nilai, 0)
                        .toLocaleString("id-ID")}{" "}
                      unit
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
    </ClientErrorBoundary>
  );
}
