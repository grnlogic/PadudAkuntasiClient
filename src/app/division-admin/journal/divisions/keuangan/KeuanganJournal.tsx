"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  DollarSign,
  Save,
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import {
  saveEntriHarianBatch,
  deleteEntriHarian,
  getToken,
  type Account,
  type EntriHarian,
} from "@/lib/data";
import { useDivisionData } from "../../shared/hooks/useDivisionData";
import { SummaryCard } from "../../shared/components/SummaryCard";
import KeuanganSummaryCard from "./components/KeuanganSummaryCard";
import PiutangSummaryCard from "./components/PiutangSummaryCard";
import UtangSummaryCard from "./components/UtangSummaryCard";
import { PDFControls } from "../../shared/components/PDFControls";

interface JournalRow {
  id: string;
  accountId: string;
  keterangan: string;
  nominal: string;
  transactionType?:
    | "PENERIMAAN"
    | "PENGELUARAN"
    | "SALDO_AKHIR"
    | "PIUTANG_BARU"
    | "PIUTANG_TERTAGIH"
    | "PIUTANG_MACET"
    | "SALDO_AKHIR_PIUTANG"
    | "UTANG_BARU"
    | "UTANG_DIBAYAR"
    | "SALDO_AKHIR_UTANG";
  saldoAkhir?: string;
}

interface KeuanganJournalProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function KeuanganJournal({
  selectedDate,
  onDateChange,
}: KeuanganJournalProps) {
  const {
    user,
    divisionInfo,
    accounts,
    existingEntries,
    loading,
    refetchData,
    companyFilter,
  } = useDivisionData(selectedDate);

  // State untuk tab transaksi
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    "KAS" | "PIUTANG" | "UTANG"
  >("KAS");

  // State untuk form entry - support multi entry
  const [journalRows, setJournalRows] = useState<JournalRow[]>([
    {
      id: "1",
      accountId: "",
      keterangan: "",
      nominal: "",
      transactionType: undefined,
      saldoAkhir: "",
    },
  ]);

  // State untuk multi-entry mode
  const [isMultiEntryMode, setIsMultiEntryMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk data piutang dan utang
  const [piutangData, setPiutangData] = useState<any[]>([]);
  const [utangData, setUtangData] = useState<any[]>([]);
  const [isLoadingPiutangUtang, setIsLoadingPiutangUtang] = useState(false);

  // ✅ FIXED: Filter accounts dengan company filter yang benar
  const kasAccounts = accounts.filter((acc) => {
    const name = acc.accountName.toLowerCase();
    const isKasAccount =
      name.includes("kas") &&
      !name.includes("piutang") &&
      !name.includes("utang");

    console.log(`🔍 KAS Filter: ${acc.accountCode} - ${acc.accountName}:`, {
      isKasAccount,
      name: name,
    });

    return isKasAccount;
  });

  console.log(
    "🔍 All accounts:",
    accounts.length,
    accounts.map((a) => `${a.id}:${a.accountCode}-${a.accountName}`)
  );
  console.log(
    "🔍 KAS accounts:",
    kasAccounts.length,
    kasAccounts.map((a) => `${a.id}:${a.accountCode}-${a.accountName}`)
  );
  console.log("🔍 Company filter:", companyFilter);

  // Emergency debug: If no KAS accounts found, show all accounts temporarily
  if (kasAccounts.length === 0 && accounts.length > 0) {
    console.warn(
      "⚠️ No KAS accounts found! Available accounts:",
      accounts.map((a) => `${a.accountCode} - ${a.accountName}`)
    );
  }

  const piutangAccounts = accounts.filter((acc) =>
    acc.accountName.toLowerCase().includes("piutang")
  );

  const utangAccounts = accounts.filter((acc) => {
    const name = acc.accountName.toLowerCase();
    return name.includes("utang") && !name.includes("piutang");
  });

  console.log(
    "🔍 PIUTANG accounts:",
    piutangAccounts.length,
    piutangAccounts.map((a) => `${a.accountCode}-${a.accountName}`)
  );
  console.log(
    "🔍 UTANG accounts:",
    utangAccounts.length,
    utangAccounts.map((a) => `${a.accountCode}-${a.accountName}`)
  );

  // ✅ Get accounts berdasarkan tab aktif
  const getAccountsForTab = () => {
    switch (selectedTransactionType) {
      case "KAS":
        return kasAccounts;
      case "PIUTANG":
        return piutangAccounts;
      case "UTANG":
        return utangAccounts;
      default:
        return accounts;
    }
  };

  // ✅ Fetch piutang dan utang data
  const fetchPiutangUtangData = async () => {
    setIsLoadingPiutangUtang(true);
    try {
      const token = getToken();
      if (!token) {
        console.warn("No token found for piutang/utang fetch");
        return;
      }

      // ✅ FIXED: Fetch ALL data for the date, then filter client-side
      // This ensures we get data with perusahaan_id = NULL (shared accounts)
      const [piutangResponse, utangResponse] = await Promise.all([
        fetch(
          `http://localhost:7070/api/v1/piutang?tanggal_start=${selectedDate}&tanggal_end=${selectedDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `http://localhost:7070/api/v1/utang?tanggal_start=${selectedDate}&tanggal_end=${selectedDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      if (piutangResponse.ok) {
        const piutangResult = await piutangResponse.json();
        setPiutangData(piutangResult.data || []);
        console.log(
          "📊 Piutang data loaded:",
          piutangResult.data?.length || 0,
          "entries"
        );
        console.log("🔍 First piutang entry:", piutangResult.data?.[0]);
      }

      if (utangResponse.ok) {
        const utangResult = await utangResponse.json();
        setUtangData(utangResult.data || []);
        console.log(
          "📊 Utang data loaded:",
          utangResult.data?.length || 0,
          "entries"
        );
      }
    } catch (error) {
      console.error("Error fetching piutang/utang data:", error);
    } finally {
      setIsLoadingPiutangUtang(false);
    }
  };

  // ✅ Auto-fetch piutang/utang data ketika tanggal atau company filter berubah
  useEffect(() => {
    if (selectedDate) {
      refetchData(); // Refetch entri harian (kas) with new filter
      fetchPiutangUtangData(); // Refetch piutang/utang with new filter
    }
  }, [selectedDate, companyFilter.perusahaanId]);

  // ✅ FIXED: Fungsi untuk menghitung summary keuangan dengan data dari berbagai sumber
  const calculateKeuanganSummary = () => {
    // ✅ FIXED: Filter entries KAS untuk tanggal yang dipilih (dari existingEntries)
    const todayEntries = existingEntries.filter((entry: any) => {
      // Prioritize 'date' or 'tanggal' which are guaranteed by data.ts
      const entryDate =
        entry.date ||
        entry.tanggal ||
        entry.tanggalLaporan ||
        entry.tanggal_laporan ||
        entry.createdAt;
      
      if (!entryDate) return false;

      const normalizedEntryDate = new Date(entryDate)
        .toISOString()
        .split("T")[0];
      const normalizedSelectedDate = new Date(selectedDate)
        .toISOString()
        .split("T")[0];

      return normalizedEntryDate === normalizedSelectedDate;
    });

    console.log("📊 [KeuanganSummary] Filtered entries for date:", {
        selectedDate,
        totalEntries: existingEntries.length,
        todayEntries: todayEntries.length,
        kasAccountsCount: kasAccounts.length
    });

    // Filter PIUTANG dan UTANG data untuk tanggal yang dipilih dengan company filtering
    const todayPiutang = piutangData.filter((entry: any) => {
      const entryDate = new Date(entry.tanggal_transaksi)
        .toISOString()
        .split("T")[0];
      const isDateMatch = entryDate === selectedDate;

      // Apply company filtering based on perusahaan_id
      const isCompanyMatch =
        companyFilter.perusahaanId === null ||
        entry.perusahaan_id === companyFilter.perusahaanId ||
        entry.perusahaan_id == null; // tampilkan data lama yang belum menyimpan perusahaan_id

      return isDateMatch && isCompanyMatch;
    });

    const todayUtang = utangData.filter((entry: any) => {
      const entryDate = new Date(entry.tanggal_transaksi)
        .toISOString()
        .split("T")[0];
      const isDateMatch = entryDate === selectedDate;

      // Apply company filtering based on perusahaan_id
      const isCompanyMatch =
        companyFilter.perusahaanId === null ||
        entry.perusahaan_id === companyFilter.perusahaanId ||
        entry.perusahaan_id == null;

      return isDateMatch && isCompanyMatch;
    });

    const kasAccountIds = kasAccounts.map((acc) => acc.id);

    const summary = {
      totalPenerimaan: 0,
      totalPengeluaran: 0,
      totalSaldoAkhir: 0,
    };

    const piutangSummary = {
      baru: 0,
      tertagih: 0,
      macet: 0,
      saldoAkhir: 0,
    };

    const utangSummary = {
      baru: 0,
      dibayar: 0,
      saldoAkhir: 0,
    };

    // Hitung KAS summary dari existingEntries
    todayEntries.forEach((entry: any) => {
      const nilai = Number(entry.nilai) || 0;
      const accountId = String(entry.accountId); // Ensure string comparison
      const type = entry.transactionType || entry.transaction_type; 

      // Debug each entry processing
      // console.log("Processing Entry:", { id: entry.id, accountId, type, nilai });

      // KAS Summary - hanya untuk account kas
      if (kasAccountIds.includes(accountId) && type) {
        if (type === "PENERIMAAN") {
          summary.totalPenerimaan += nilai;
        } else if (type === "PENGELUARAN") {
          summary.totalPengeluaran += nilai;
        } else if (type === "SALDO_AKHIR") {
          const saldoValue = Number(entry.saldoAkhir) || nilai;
          summary.totalSaldoAkhir += saldoValue;
        }
      }
    });

    // Hitung PIUTANG summary dari piutangData
    todayPiutang.forEach((entry: any) => {
      const nominal = Number(entry.nominal) || 0;

      if (entry.tipe_transaksi === "PIUTANG_BARU") {
        piutangSummary.baru += nominal;
      } else if (entry.tipe_transaksi === "PIUTANG_TERTAGIH") {
        piutangSummary.tertagih += nominal;
      } else if (entry.tipe_transaksi === "PIUTANG_MACET") {
        piutangSummary.macet += nominal;
      } else if (entry.tipe_transaksi === "SALDO_AKHIR_PIUTANG") {
        piutangSummary.saldoAkhir += nominal;
      }
    });

    // Hitung saldo akhir piutang (Manual Entry)
    // piutangSummary.saldoAkhir comes directly from SALDO_AKHIR_PIUTANG entries now

    // Hitung UTANG summary dari utangData
    todayUtang.forEach((entry: any) => {
      const nominal = Number(entry.nominal) || 0;

      if (entry.tipe_transaksi === "UTANG_BARU") {
        utangSummary.baru += nominal;
      } else if (entry.tipe_transaksi === "UTANG_DIBAYAR") {
        utangSummary.dibayar += nominal;
      } else if (entry.tipe_transaksi === "SALDO_AKHIR_UTANG") {
        // SALDO_AKHIR_UTANG adalah record saldo akhir periode sebelumnya
        // Bisa ditampilkan terpisah atau diabaikan dalam perhitungan harian
      }
    });

    // Hitung saldo akhir utang
    utangSummary.saldoAkhir = utangSummary.baru - utangSummary.dibayar;

    return { summary, piutangSummary, utangSummary };
  };

  const {
    summary: keuanganSummary,
    piutangSummary,
    utangSummary,
  } = calculateKeuanganSummary();

  // ✅ Update row data
  const updateRow = (rowId: string, field: keyof JournalRow, value: string) => {
    setJournalRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  // ✅ Get account display
  const getAccountDisplay = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return "Pilih akun";
    const keterangan =
      account.valueType === "NOMINAL" ? "💰 Nominal" : "📦 Kuantitas";
    return `${account.accountCode} - ${account.accountName} (${keterangan})`;
  };

  // ✅ Add new row untuk multi-entry
  const addNewRow = () => {
    const newId = (journalRows.length + 1).toString();
    setJournalRows((prev) => [
      ...prev,
      {
        id: newId,
        accountId: "",
        keterangan: "",
        nominal: "",
        transactionType: undefined,
        saldoAkhir: "",
      },
    ]);
  };

  // ✅ Remove row untuk multi-entry
  const removeRow = (rowId: string) => {
    if (journalRows.length <= 1) return;
    setJournalRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  // ✅ Validate form - support multi entries
  const validateForm = (): boolean => {
    const rowsToValidate = isMultiEntryMode ? journalRows : [journalRows[0]];

    for (const row of rowsToValidate) {
      if (!row.accountId) {
        toastError.validation(
          `Baris ${row.id}: Pilih Chart of Account terlebih dahulu`
        );
        return false;
      }

      if (!row.transactionType) {
        toastError.validation(
          `Baris ${row.id}: Pilih jenis transaksi terlebih dahulu`
        );
        return false;
      }

      // Validasi khusus untuk KAS yang memiliki SALDO_AKHIR
      if (
        selectedTransactionType === "KAS" &&
        row.transactionType === "SALDO_AKHIR"
      ) {
        if (!row.saldoAkhir || Number(row.saldoAkhir) <= 0) {
          toastError.validation(
            `Baris ${row.id}: Masukkan saldo akhir yang valid`
          );
          return false;
        }
      } else {
        // Untuk semua transaksi lainnya (termasuk PIUTANG dan UTANG), validasi nominal
        if (!row.nominal || Number(row.nominal) <= 0) {
          toastError.validation(`Baris ${row.id}: Masukkan nominal yang valid`);
          return false;
        }
      }

      if (!row.keterangan.trim()) {
        toastError.validation(`Baris ${row.id}: Masukkan keterangan transaksi`);
        return false;
      }
    }

    return true;
  };

  // ✅ Save journal entry - support multi entries
  const saveJournalEntry = async () => {
    if (!validateForm()) return;

    const rowsToSave = isMultiEntryMode ? journalRows : [journalRows[0]];

    // Validate all accounts exist
    for (const row of rowsToSave) {
      const account = accounts.find((acc) => acc.id === row.accountId);
      if (!account) {
        console.error("❌ Account validation failed:", {
          searchingFor: row.accountId,
          availableAccounts: accounts.map((acc) => ({
            id: acc.id,
            code: acc.accountCode,
            name: acc.accountName,
          })),
        });
        toastError.custom(
          `Akun dengan ID ${row.accountId} tidak ditemukan dalam daftar ${selectedTransactionType} accounts`
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      if (selectedTransactionType === "KAS") {
        // KAS menggunakan entri harian
        const entriesData = rowsToSave.map((row) => {
          const account = accounts.find((acc) => acc.id === row.accountId);
          console.log("🔍 Account validation for row:", {
            rowAccountId: row.accountId,
            accountFound: !!account,
            accountDetails: account
              ? `${account.accountCode} - ${account.accountName}`
              : "NOT FOUND",
          });

          const baseData: any = {
            tanggal: selectedDate, // ✅ FIXED: Use frontend format for API transformation
            accountId: Number(row.accountId),
            description: row.keterangan,
            nilai:
              row.transactionType === "SALDO_AKHIR"
                ? Number(row.saldoAkhir)
                : Number(row.nominal),
            transactionType: row.transactionType,
            perusahaan_id: companyFilter.perusahaanId ?? user?.perusahaan_id ?? null, // ✅ NEW: Add company ID
          };

          if (row.transactionType === "SALDO_AKHIR") {
            baseData.saldoAkhir = Number(row.saldoAkhir);
          }

          return baseData;
        });

        console.log("💾 Saving KAS entries:", entriesData);
        console.log(
          "📊 Available accounts:",
          kasAccounts.map(
            (acc) => `${acc.id}: ${acc.accountCode} - ${acc.accountName}`
          )
        );
        await saveEntriHarianBatch(entriesData);
      } else if (selectedTransactionType === "PIUTANG") {
        // PIUTANG menggunakan API piutang
        const token = getToken();
        console.log("🔐 Using token:", token ? "Token found" : "No token");

        for (const row of rowsToSave) {
          const piutangData = {
            tanggal_transaksi: selectedDate,
            account_id: Number(row.accountId),
            tipe_transaksi: row.transactionType,
            nominal: Number(row.nominal),
            keterangan: row.keterangan,
            perusahaan_id:
              companyFilter.perusahaanId ?? user?.perusahaan_id ?? null,
          };

          console.log("💾 Saving PIUTANG entry:", piutangData);
          const response = await fetch("http://localhost:7070/api/v1/piutang", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify(piutangData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("PIUTANG API Error:", response.status, errorData);
            throw new Error(
              errorData.message ||
                `Gagal menyimpan piutang (${response.status})`
            );
          }
        }
      } else if (selectedTransactionType === "UTANG") {
        // UTANG menggunakan API utang
        const token = getToken();
        console.log(
          "🔐 Using token for UTANG:",
          token ? "Token found" : "No token"
        );

        for (const row of rowsToSave) {
          const utangData = {
            tanggal_transaksi: selectedDate,
            account_id: Number(row.accountId),
            tipe_transaksi: row.transactionType,
            nominal: Number(row.nominal),
            keterangan: row.keterangan,
            perusahaan_id:
              companyFilter.perusahaanId ?? user?.perusahaan_id ?? null,
          };

          console.log("💾 Saving UTANG entry:", utangData);
          const response = await fetch("http://localhost:7070/api/v1/utang", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify(utangData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("UTANG API Error:", response.status, errorData);
            throw new Error(
              errorData.message || `Gagal menyimpan utang (${response.status})`
            );
          }
        }
      }

      toastSuccess.custom(
        `Berhasil menyimpan ${
          rowsToSave.length
        } entri ${selectedTransactionType.toLowerCase()}`
      );

      // Reset form
      setJournalRows([
        {
          id: "1",
          accountId: "",
          keterangan: "",
          nominal: "",
          transactionType: undefined,
          saldoAkhir: "",
        },
      ]);
      setIsMultiEntryMode(false);

      // Refresh data
      await refetchData();
      await fetchPiutangUtangData();
    } catch (error: any) {
      console.error("Error saving journal entry:", error);
      const errorMessage = error.message || "Gagal menyimpan entri jurnal";
      toastError.custom(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Delete existing entry - handle different transaction types
  const deleteEntry = async (id: string) => {
    if (!confirm("Hapus entri ini?")) return;

    try {
      const token = getToken();

      if (selectedTransactionType === "PIUTANG") {
        // Delete piutang via piutang API
        const response = await fetch(
          `http://localhost:7070/api/v1/piutang/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal menghapus piutang");
        }
      } else if (selectedTransactionType === "UTANG") {
        // Delete utang via utang API
        const response = await fetch(
          `http://localhost:7070/api/v1/utang/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal menghapus utang");
        }
      } else {
        // Delete KAS via entri harian API
        await deleteEntriHarian(id);
      }

      toastSuccess.custom(`${selectedTransactionType} berhasil dihapus`);
      await refetchData();
      await fetchPiutangUtangData(); // Refresh piutang/utang data
    } catch (error) {
      console.error("Error deleting entry:", error);
      toastError.custom("Gagal menghapus entri");
    }
  };

  // ✅ Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ PDF Functions - FIXED: Use filtered data by date and company
  const handleDownloadPDF = async () => {
    const { downloadEnhancedPDF } = await import("@/lib/enhanced-pdf");

    // Gabungkan semua data yang sudah difilter berdasarkan tanggal dan company
    const kasEntries = getFilteredEntries().filter((entry) =>
      kasAccounts.map((acc) => acc.id).includes(entry.accountId)
    );
    const piutangEntries = piutangData
      .filter((entry) => {
        const entryDate = new Date(entry.tanggal_transaksi)
          .toISOString()
          .split("T")[0];
        return entryDate === selectedDate;
      })
      .map((entry) => ({
        id: entry.id,
        accountId: entry.account_id,
        accountName: entry.account_name,
        accountCode: entry.account_code,
        transactionType: entry.tipe_transaksi,
        nilai: Number(entry.nominal),
        keterangan: entry.keterangan,
        createdAt: entry.created_at,
        tanggalLaporan: entry.tanggal_transaksi,
      }));
    const utangEntries = utangData
      .filter((entry) => {
        const entryDate = new Date(entry.tanggal_transaksi)
          .toISOString()
          .split("T")[0];
        return entryDate === selectedDate;
      })
      .map((entry) => ({
        id: entry.id,
        accountId: entry.account_id,
        accountName: entry.account_name,
        accountCode: entry.account_code,
        transactionType: entry.tipe_transaksi,
        nilai: Number(entry.nominal),
        keterangan: entry.keterangan,
        createdAt: entry.created_at,
        tanggalLaporan: entry.tanggal_transaksi,
      }));

    const reportData = {
      date: selectedDate,
      divisionName: divisionInfo?.name || "DIVISI KEUANGAN & ADMINISTRASI",
      entries: [...kasEntries, ...piutangEntries, ...utangEntries],
      accounts: accounts,
      keuanganSummary,
      piutangSummary,
      utangSummary,
    };

    console.log("🔍 [PDF EXPORT] Report data:", {
      date: selectedDate,
      kasCount: kasEntries.length,
      piutangCount: piutangEntries.length,
      utangCount: utangEntries.length,
      totalEntries: reportData.entries.length,
    });

    downloadEnhancedPDF(reportData);
  };

  const handlePreviewPDF = async () => {
    const { previewEnhancedPDF } = await import("@/lib/enhanced-pdf");

    // Gabungkan semua data yang sudah difilter berdasarkan tanggal dan company
    const kasEntries = getFilteredEntries().filter((entry) =>
      kasAccounts.map((acc) => acc.id).includes(entry.accountId)
    );
    const piutangEntries = piutangData
      .filter((entry) => {
        const entryDate = new Date(entry.tanggal_transaksi)
          .toISOString()
          .split("T")[0];
        return entryDate === selectedDate;
      })
      .map((entry) => ({
        id: entry.id,
        accountId: entry.account_id,
        accountName: entry.account_name,
        accountCode: entry.account_code,
        transactionType: entry.tipe_transaksi,
        nilai: Number(entry.nominal),
        keterangan: entry.keterangan,
        createdAt: entry.created_at,
        tanggalLaporan: entry.tanggal_transaksi,
      }));
    const utangEntries = utangData
      .filter((entry) => {
        const entryDate = new Date(entry.tanggal_transaksi)
          .toISOString()
          .split("T")[0];
        return entryDate === selectedDate;
      })
      .map((entry) => ({
        id: entry.id,
        accountId: entry.account_id,
        accountName: entry.account_name,
        accountCode: entry.account_code,
        transactionType: entry.tipe_transaksi,
        nilai: Number(entry.nominal),
        keterangan: entry.keterangan,
        createdAt: entry.created_at,
        tanggalLaporan: entry.tanggal_transaksi,
      }));

    const reportData = {
      date: selectedDate,
      divisionName: divisionInfo?.name || "DIVISI KEUANGAN & ADMINISTRASI",
      entries: [...kasEntries, ...piutangEntries, ...utangEntries],
      accounts: accounts,
      keuanganSummary,
      piutangSummary,
      utangSummary,
    };

    console.log("🔍 [PDF PREVIEW] Report data:", {
      date: selectedDate,
      kasCount: kasEntries.length,
      piutangCount: piutangEntries.length,
      utangCount: utangEntries.length,
      totalEntries: reportData.entries.length,
    });

    previewEnhancedPDF(reportData);
  };

  // ✅ Render tab menu
  const renderTabMenu = () => (
    <div className="flex gap-2 mb-4">
      {["KAS", "PIUTANG", "UTANG"].map((type) => (
        <button
          key={type}
          className={`px-4 py-2 rounded-t font-semibold border-b-2 transition-all ${
            selectedTransactionType === type
              ? "border-blue-600 text-blue-700 bg-white"
              : "border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() => setSelectedTransactionType(type as any)}
          type="button"
        >
          {type.charAt(0) + type.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );

  // ✅ Render form berdasarkan tab - support multi entries
  const renderTabForm = () => {
    const tabAccounts = getAccountsForTab();
    console.log(
      `🔍 ${selectedTransactionType} tabAccounts:`,
      tabAccounts.length,
      tabAccounts.map((a) => `${a.accountCode}-${a.accountName}`)
    );
    const rowsToRender = isMultiEntryMode ? journalRows : [journalRows[0]];

    return (
      <div className="space-y-6">
        {rowsToRender.map((row, index) => (
          <div
            key={row.id}
            className={`${
              isMultiEntryMode ? "p-4 border rounded-lg bg-gray-50" : ""
            }`}
          >
            {isMultiEntryMode && (
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">Entri #{row.id}</h4>
                {journalRows.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {renderSingleRowForm(row, tabAccounts)}
          </div>
        ))}
      </div>
    );
  };

  // ✅ Render single row form
  const renderSingleRowForm = (row: JournalRow, tabAccounts: Account[]) => {
    switch (selectedTransactionType) {
      case "KAS":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Chart of Account (COA)</Label>
              <Select
                value={row.accountId}
                onValueChange={(value) => updateRow(row.id, "accountId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih COA" />
                </SelectTrigger>
                <SelectContent>
                  {tabAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountDisplay(account.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jenis Transaksi</Label>
              <Select
                value={row.transactionType || ""}
                onValueChange={(value) =>
                  updateRow(row.id, "transactionType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENERIMAAN">💰 Penerimaan</SelectItem>
                  <SelectItem value="PENGELUARAN">💸 Pengeluaran</SelectItem>
                  <SelectItem value="SALDO_AKHIR">📊 Saldo Akhir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {row.transactionType === "SALDO_AKHIR" ? (
              <div>
                <Label>Saldo Akhir</Label>
                <NumericFormat
                  value={row.saldoAkhir || ""}
                  thousandSeparator="."
                  decimalSeparator=","
                  allowNegative={false}
                  onValueChange={(values: { value: string }) =>
                    updateRow(row.id, "saldoAkhir", values.value)
                  }
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="Rp 0"
                  customInput={Input}
                />
              </div>
            ) : (
              <div>
                <Label>Nominal</Label>
                <NumericFormat
                  value={row.nominal || ""}
                  thousandSeparator="."
                  decimalSeparator=","
                  allowNegative={false}
                  onValueChange={(values: { value: string }) =>
                    updateRow(row.id, "nominal", values.value)
                  }
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="Rp 0"
                  customInput={Input}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi transaksi"
                value={row.keterangan}
                onChange={(e) =>
                  updateRow(row.id, "keterangan", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      case "PIUTANG":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Chart of Account (COA)</Label>
              <Select
                value={row.accountId}
                onValueChange={(value) => updateRow(row.id, "accountId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih COA Piutang" />
                </SelectTrigger>
                <SelectContent>
                  {tabAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountDisplay(account.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipe Piutang</Label>
              <Select
                value={row.transactionType || ""}
                onValueChange={(value) =>
                  updateRow(row.id, "transactionType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe piutang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIUTANG_BARU">🆕 Piutang Baru</SelectItem>
                  <SelectItem value="PIUTANG_TERTAGIH">
                    💰 Piutang Tertagih
                  </SelectItem>
                  <SelectItem value="PIUTANG_MACET">
                    ⚠️ Piutang Macet
                  </SelectItem>
                  <SelectItem value="SALDO_AKHIR_PIUTANG">
                    📊 Saldo Akhir Piutang
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nominal</Label>
              <NumericFormat
                value={row.nominal || ""}
                thousandSeparator="."
                decimalSeparator=","
                allowNegative={false}
                onValueChange={(values: { value: string }) =>
                  updateRow(row.id, "nominal", values.value)
                }
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Rp 0"
                customInput={Input}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi transaksi piutang"
                value={row.keterangan}
                onChange={(e) =>
                  updateRow(row.id, "keterangan", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      case "UTANG":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Chart of Account (COA)</Label>
              <Select
                value={row.accountId}
                onValueChange={(value) => updateRow(row.id, "accountId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih COA Utang" />
                </SelectTrigger>
                <SelectContent>
                  {tabAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountDisplay(account.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipe Utang</Label>
              <Select
                value={row.transactionType || ""}
                onValueChange={(value) =>
                  updateRow(row.id, "transactionType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe utang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTANG_BARU">🆕 Utang Baru</SelectItem>
                  <SelectItem value="UTANG_DIBAYAR">
                    💰 Utang Dibayar
                  </SelectItem>
                  <SelectItem value="SALDO_AKHIR_UTANG">
                    📊 Saldo Akhir Utang
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nominal</Label>
              <NumericFormat
                value={row.nominal || ""}
                thousandSeparator="."
                decimalSeparator=","
                allowNegative={false}
                onValueChange={(values: { value: string }) =>
                  updateRow(row.id, "nominal", values.value)
                }
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Rp 0"
                customInput={Input}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi transaksi utang"
                value={row.keterangan}
                onChange={(e) =>
                  updateRow(row.id, "keterangan", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ✅ Get filtered entries untuk tabel dengan data transformation
  const getFilteredEntries = () => {
    switch (selectedTransactionType) {
      case "PIUTANG":
        console.log("🔍 PIUTANG Filtering Debug:");
        console.log("  - Company Filter:", companyFilter);
        console.log("  - Selected Date:", selectedDate);
        console.log("  - Raw PIUTANG data count:", piutangData.length);
        console.log(
          "  - First 3 entries:",
          piutangData.slice(0, 3).map((e) => ({
            id: e.id,
            tanggal: e.tanggal_transaksi,
            perusahaan_id: e.perusahaan_id,
            account: e.account_name,
          }))
        );

        const piutangFiltered = piutangData
          .filter((entry) => {
            const entryDate = new Date(entry.tanggal_transaksi)
              .toISOString()
              .split("T")[0];
            const isDateMatch = entryDate === selectedDate;

            // Apply company filtering based on perusahaan_id
            const isCompanyMatch =
              companyFilter.perusahaanId === null ||
              entry.perusahaan_id === companyFilter.perusahaanId ||
              entry.perusahaan_id == null;

            if (!isDateMatch) {
              console.log(
                `  ❌ Date mismatch: ${entryDate} vs ${selectedDate}`
              );
            }
            if (!isCompanyMatch) {
              console.log(
                `  ❌ Company mismatch: entry.perusahaan_id=${entry.perusahaan_id} vs filter=${companyFilter.perusahaanId}`
              );
            }

            return isDateMatch && isCompanyMatch;
          })
          .map((entry) => ({
            id: entry.id,
            accountId: entry.account_id,
            accountName: entry.account_name,
            accountCode: entry.account_code,
            transactionType: entry.tipe_transaksi,
            nilai: Number(entry.nominal),
            keterangan: entry.keterangan,
            createdAt: entry.created_at,
          }));
        console.log("  ✅ Filtered PIUTANG entries:", piutangFiltered.length);
        return piutangFiltered;
      case "UTANG":
        console.log("🔍 UTANG Filtering Debug:");
        console.log("  - Company Filter:", companyFilter);
        console.log("  - Selected Date:", selectedDate);
        console.log("  - Raw UTANG data count:", utangData.length);
        console.log(
          "  - First 3 entries:",
          utangData.slice(0, 3).map((e) => ({
            id: e.id,
            tanggal: e.tanggal_transaksi,
            perusahaan_id: e.perusahaan_id,
            account: e.account_name,
          }))
        );

        const utangFiltered = utangData
          .filter((entry) => {
            const entryDate = new Date(entry.tanggal_transaksi)
              .toISOString()
              .split("T")[0];
            const isDateMatch = entryDate === selectedDate;

            // Apply company filtering based on perusahaan_id
            const isCompanyMatch =
              companyFilter.perusahaanId === null ||
              entry.perusahaan_id === companyFilter.perusahaanId ||
              entry.perusahaan_id == null;

            return isDateMatch && isCompanyMatch;
          })
          .map((entry) => ({
            id: entry.id,
            accountId: entry.account_id,
            accountName: entry.account_name,
            accountCode: entry.account_code,
            transactionType: entry.tipe_transaksi,
            nilai: Number(entry.nominal),
            keterangan: entry.keterangan,
            createdAt: entry.created_at,
          }));
        console.log("  ✅ Filtered UTANG entries:", utangFiltered.length);
        return utangFiltered;
      default:
        // Filter KAS entries untuk tanggal yang dipilih dan akun KAS
        const accountIds = getAccountsForTab().map((acc) => acc.id);

        console.log("🔍 KAS Filtering Debug:", {
          selectedTransactionType,
          selectedDate,
          totalExistingEntries: existingEntries.length,
          kasAccountIds: accountIds,
          kasAccountsCount: accountIds.length,
        });

        return existingEntries.filter((entry) => {
          // Filter berdasarkan account ID (harus KAS account)
          const isKasAccount = accountIds.includes(entry.accountId);

          // Filter berdasarkan tanggal - hanya tampilkan data hari ini
          const entryDate =
            entry.date || entry.tanggal || entry.createdAt;
          if (!entryDate) {
            console.log(`⚠️ Entry ${entry.id} has no date`);
            return false;
          }

          const normalizedEntryDate = new Date(entryDate)
            .toISOString()
            .split("T")[0];
          const normalizedSelectedDate = new Date(selectedDate)
            .toISOString()
            .split("T")[0];

          const isDateMatch = normalizedEntryDate === normalizedSelectedDate;

          // Apply company filtering based on perusahaan_id
          const account = accounts.find((acc) => acc.id === entry.accountId);
          const isCompanyMatch =
            companyFilter.perusahaanId === null ||
            account?.perusahaanId === companyFilter.perusahaanId ||
            account?.perusahaan_id === companyFilter.perusahaanId ||
            account?.perusahaanId == null || // ✅ FIXED: Allow shared accounts
            account?.perusahaan_id == null;

          return isKasAccount && isDateMatch && isCompanyMatch;
        });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin mx-auto mb-4 h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-gray-600">Loading Keuangan Journal...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KAS Summary */}
        <KeuanganSummaryCard
          title="Ringkasan KAS"
          summary={keuanganSummary}
          isLoading={loading}
        />

        {/* PIUTANG Summary */}
        <PiutangSummaryCard
          title="Ringkasan PIUTANG"
          summary={piutangSummary}
          isLoading={loading}
        />

        {/* UTANG Summary */}
        <UtangSummaryCard
          title="Ringkasan UTANG"
          summary={utangSummary}
          isLoading={loading}
        />
      </div>

      {/* Form Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Form Input Transaksi Keuangan
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multiEntry"
                  checked={isMultiEntryMode}
                  onChange={(e) => setIsMultiEntryMode(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="multiEntry" className="text-sm font-normal">
                  Multi Entry Mode
                </Label>
              </div>
            </div>
            <PDFControls
              onDownloadPDF={handleDownloadPDF}
              onPreviewPDF={handlePreviewPDF}
              dataCount={existingEntries.length}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderTabMenu()}
          {renderTabForm()}

          {/* Multi-entry controls */}
          {isMultiEntryMode && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewRow}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Baris
                </Button>
                {journalRows.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      removeRow(journalRows[journalRows.length - 1].id)
                    }
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Baris Terakhir
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {journalRows.length} entri siap disimpan
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={saveJournalEntry}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan {isMultiEntryMode
                    ? `${journalRows.length} `
                    : ""}Entri {selectedTransactionType}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Transaksi {selectedTransactionType}</span>
            <Badge variant="outline">{getFilteredEntries().length} entri</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredEntries().length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Belum ada data transaksi {selectedTransactionType.toLowerCase()}{" "}
                untuk tanggal ini
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>COA</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredEntries().map((entry) => {
                  // For PIUTANG/UTANG, account info comes from API. For KAS, find from accounts array
                  const account = (entry as any).accountName
                    ? {
                        accountName: (entry as any).accountName,
                        accountCode: (entry as any).accountCode,
                      }
                    : accounts.find((acc) => acc.id === entry.accountId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="font-medium">
                          {account?.accountName || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {account?.accountCode || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.transactionType?.replace(/_/g, " ") || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(entry.nilai || 0)}</TableCell>
                      <TableCell>{entry.keterangan || "-"}</TableCell>
                      <TableCell>
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
