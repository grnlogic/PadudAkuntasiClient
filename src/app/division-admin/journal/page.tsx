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
import { getPiutangTransaksi } from "@/lib/data";
import { Badge } from "@/components/ui/badge"; // ✅ Add this import
import { getCurrentUser } from "@/lib/auth";
import {
  getAccountsByDivision,
  getEntriHarianByDate,
  saveEntriHarianBatch,
  deleteEntriHarian,
  getUtangTransaksi,
  getLaporanPenjualanSales,
  saveLaporanPenjualanSales,
  deleteLaporanPenjualanSales,
  getLaporanProduksi, // ✅ ADD: Import laporan produksi
  saveLaporanProduksi, // ✅ ADD: Import laporan produksi
  deleteLaporanProduksi, // ✅ ADD: Import laporan produksi
  getLaporanGudang, // ✅ ADD: Import laporan gudang
  saveLaporanGudang, // ✅ ADD: Import laporan gudang
  deleteLaporanGudang, // ✅ ADD: Import laporan gudang
  getUsers, // ✅ ADD: Import getUsers function
  getLaporanPenjualanProduk, // ✅ ADD: Import laporan penjualan produk
  type Account,
  type EntriHarian,
} from "@/lib/data";
import { Label } from "@/components/ui/label";
import type { CreateEntriHarianRequest } from "@/types/EntriHarian";
import React from "react";
import {
  CreatePiutangRequest,
  CreateUtangRequest,
  piutangAPI,
  utangAPI,
} from "@/lib/api";
import type {
  LaporanPenjualanSales,
  CreateLaporanPenjualanSalesRequest,
  LaporanProduksiHarian, // ✅ ADD: Import laporan produksi types
  CreateLaporanProduksiRequest,
  LaporanGudangHarian, // ✅ ADD: Import laporan gudang types
  CreateLaporanGudangRequest,
} from "@/lib/api";
import { getSalespeople, createSalesperson, type Salesperson } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import dynamic from "next/dynamic";
import { getPerusahaan } from "@/lib/data";

const LaporanPenjualanWizard = dynamic(
  () => import("./LaporanPenjualanWizard"),
  { ssr: false }
);

const LaporanProduksiBlendingForm = dynamic(
  () => import("./LaporanProduksiBlendingForm"),
  { ssr: false }
);

interface JournalRow {
  id: string;
  accountId: string;
  keterangan: string;
  nominal: string;
  kuantitas: string;

  kategori?: "KARYAWAN" | "TOKO" | "BAHAN_BAKU";
  //piutang
  piutangType?: "PIUTANG_BARU" | "PIUTANG_TERTAGIH" | "PIUTANG_MACET";
  // ✅ NEW: Utang fields
  utangKategori?: "BAHAN_BAKU" | "BANK_HM" | "BANK_HENRY";
  // ✅ New fields for specialized divisions
  transactionType?: "PENERIMAAN" | "PENGELUARAN" | "SALDO_AKHIR"; // For Keuangan with 3 options
  targetAmount?: string; // For Pemasaran
  realisasiAmount?: string; // For Pemasaran
  pemakaianAmount?: string; // For Gudang
  stokAkhir?: string; // For Gudang
  // ✅ NEW: HRD fields - Updated
  attendanceStatus?: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN"; // For HRD
  absentCount?: string; // For HRD - Jumlah tidak hadir (ganti dari overtimeHours)
  shift?: "REGULER" | "LEMBUR"; // For HRD - Reguler (7-15) atau Lembur (15-20)
  // ✅ NEW: Keuangan field - Saldo Akhir
  saldoAkhir?: string; // For Keuangan
  // ✅ NEW: UTANG fields - Updated
  utangType?: "UTANG_BARU" | "UTANG_DIBAYAR"; // For Keuangan

  // ✅ NEW: Pemasaran Sales fields
  salesUserId?: string;
  returPenjualan?: string;
  keteranganKendala?: string;

  // ✅ NEW: Produksi fields
  hasilProduksi?: string;
  barangGagal?: string;
  stockBarangJadi?: string;
  hpBarangJadi?: string;
  // ✅ NEW: Gudang fields for PERSEDIAAN_BAHAN_BAKU
  barangMasuk?: string;
  pemakaian?: string;
  keteranganGudang?: string;
}

// Tambahkan tipe untuk salesRows
interface SalesRowType {
  id: string;
  salesUserId: string;
  targetAmount: string;
  realisasiAmount: string;
  returPenjualan: string;
  keteranganKendala: string;
}

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingEntries, setExistingEntries] = useState<EntriHarian[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Tambahkan state error

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

  // Tambahkan state untuk piutang summary
  const [piutangSummary, setPiutangSummary] = useState({
    baru: 0,
    tertagih: 0,
    macet: 0,
    saldoAkhir: 0,
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
      piutangType: undefined,
      transactionType: undefined,
      targetAmount: "",
      realisasiAmount: "",
      pemakaianAmount: "",
      stokAkhir: "",
      saldoAkhir: "",
      attendanceStatus: undefined,
      absentCount: "",
      shift: undefined,
      utangType: undefined,
      utangKategori: undefined,
      // ✅ NEW: Initialize pemasaran sales fields
      salesUserId: "",
      returPenjualan: "",
      keteranganKendala: "",
      hasilProduksi: "",
      barangGagal: "",
      stockBarangJadi: "",
      hpBarangJadi: "",
      // ✅ NEW: Initialize gudang fields
      barangMasuk: "",
      pemakaian: "",
      keteranganGudang: "",
    },
  ]);

  const [isPiutang, setIsPiutang] = useState(false); // Tambahkan state ini

  // State untuk tab jenis transaksi
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    "KAS" | "PIUTANG" | "UTANG"
  >("KAS");

  // ✅ NEW: State untuk laporan penjualan sales
  const [laporanPenjualanSales, setLaporanPenjualanSales] = useState<
    LaporanPenjualanSales[]
  >([]);
  const [users, setUsers] = useState<any[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [newSalespersonName, setNewSalespersonName] = useState("");

  // ✅ NEW: State untuk laporan produksi
  const [laporanProduksi, setLaporanProduksi] = useState<
    LaporanProduksiHarian[]
  >([]);

  // ✅ NEW: State untuk laporan gudang
  const [laporanGudang, setLaporanGudang] = useState<LaporanGudangHarian[]>([]);

  // ✅ NEW: State untuk laporan penjualan produk
  const [laporanPenjualanProduk, setLaporanPenjualanProduk] = useState<any[]>(
    []
  );

  // Ganti state tab pemasaran
  const [selectedPemasaranTab, setSelectedPemasaranTab] = useState<
    "LAPORAN_PRODUK" | "JURNAL"
  >("LAPORAN_PRODUK");
  const [salesRows, setSalesRows] = useState<SalesRowType[]>([
    {
      id: "1",
      salesUserId: "",
      targetAmount: "",
      realisasiAmount: "",
      returPenjualan: "",
      keteranganKendala: "",
    },
  ]);

  const [perusahaanList, setPerusahaanList] = useState<any[]>([]);
  const [selectedPerusahaanForNewSales, setSelectedPerusahaanForNewSales] =
    useState<string>("");

  useEffect(() => {
    loadData();
    getPerusahaan().then(setPerusahaanList);
  }, [selectedDate]);

  // ✅ FIXED: Fungsi untuk menghitung summary keuangan
  const calculateKeuanganSummary = (
    entries: EntriHarian[],
    accounts: Account[]
  ) => {
    console.log("🔍 KEUANGAN SUMMARY DEBUG - Input:", {
      entriesCount: entries.length,
      accountsCount: accounts.length,
      sampleEntry: entries[0],
      sampleAccount: accounts[0],
    });

    // ✅ FIXED: Better filtering logic
    const piutangAccountIds = accounts
      .filter((acc) => acc.accountName.toLowerCase().includes("piutang"))
      .map((acc) => acc.id);

    console.log("📋 Piutang Account IDs:", piutangAccountIds);

    const summary = {
      totalPenerimaan: 0,
      totalPengeluaran: 0,
      totalSaldoAkhir: 0,
    };

    // ✅ FIXED: Filter transaksi harian (yang bukan piutang dan accountId tidak kosong)
    const transaksiHarian = entries.filter((entry: any) => {
      const hasValidAccountId = entry.accountId && entry.accountId !== "";
      const isNotPiutang = !piutangAccountIds.includes(entry.accountId);
      const hasTransactionType =
        entry.transactionType &&
        ["PENERIMAAN", "PENGELUARAN", "SALDO_AKHIR"].includes(
          entry.transactionType
        );

      console.log("🔍 Entry filter check:", {
        entryId: entry.id,
        accountId: entry.accountId,
        hasValidAccountId,
        isNotPiutang,
        hasTransactionType,
        transactionType: entry.transactionType,
        passed: hasValidAccountId && isNotPiutang && hasTransactionType,
      });

      return hasValidAccountId && isNotPiutang && hasTransactionType;
    });

    console.log("📊 Filtered transaksi harian:", {
      totalFiltered: transaksiHarian.length,
      entries: transaksiHarian.map((e) => ({
        id: e.id,
        accountId: e.accountId,
        transactionType: e.transactionType,
        nilai: e.nilai,
      })),
    });

    transaksiHarian.forEach((entry: any) => {
      const nilai = Number(entry.nilai) || 0;

      if (entry.transactionType === "PENERIMAAN") {
        summary.totalPenerimaan += nilai;
      } else if (entry.transactionType === "PENGELUARAN") {
        summary.totalPengeluaran += nilai;
      } else if (entry.transactionType === "SALDO_AKHIR") {
        const saldoValue = Number(entry.saldoAkhir) || nilai;
        summary.totalSaldoAkhir += saldoValue;
      }

      console.log("💰 Processing entry:", {
        id: entry.id,
        type: entry.transactionType,
        nilai,
        runningTotal: summary,
      });
    });

    console.log("✅ FINAL KEUANGAN SUMMARY:", summary);
    return summary;
  };

  const loadData = async () => {
    if (user?.division?.id) {
      try {
        setLoading(true);

        const accountsPromise = getAccountsByDivision(user.division.id);
        const entriesPromise = getEntriHarianByDate(selectedDate);
        const piutangPromise = getPiutangTransaksi();
        const utangPromise = getUtangTransaksi();

        // ✅ FIXED: Ambil semua data dulu, filter di frontend
        const laporanGudangPromise =
          divisionType === "PERSEDIAAN_BAHAN_BAKU"
            ? getLaporanGudang()
            : Promise.resolve([]);
        const laporanProduksiPromise =
          divisionType === "PRODUKSI"
            ? getLaporanProduksi()
            : Promise.resolve([]);
        const laporanPromise =
          divisionType === "PEMASARAN"
            ? getLaporanPenjualanSales()
            : Promise.resolve([]);
        const laporanProdukPromise =
          divisionType === "PEMASARAN"
            ? getLaporanPenjualanProduk()
            : Promise.resolve([]);
        const usersPromise =
          divisionType === "PEMASARAN" ? getUsers() : Promise.resolve([]);
        const salespeoplePromise =
          divisionType === "PEMASARAN" ? getSalespeople() : Promise.resolve([]);

        const [
          accountsData,
          entriesData,
          piutangData,
          utangData,
          laporanGudangData,
          laporanProduksiData,
          laporanData,
          laporanProdukData,
          usersData,
          salespeopleData,
        ] = await Promise.all([
          accountsPromise,
          entriesPromise,
          piutangPromise,
          utangPromise,
          laporanGudangPromise,
          laporanProduksiPromise,
          laporanPromise,
          laporanProdukPromise,
          usersPromise,
          salespeoplePromise,
        ]);

        setAccounts(accountsData);
        setUsers(usersData);
        setSalespeople(salespeopleData);

        // ✅ FIXED: Filter dengan multiple format tanggal yang lebih robust
        let filteredLaporanSales: any[] = [];
        let filteredLaporanProduk: any[] = [];

        if (divisionType === "PEMASARAN") {
          filteredLaporanSales = laporanData.filter((laporan) => {
            const laporanDate = laporan.tanggalLaporan || laporan.createdAt;
            if (!laporanDate) return false;

            // Normalisasi tanggal ke format YYYY-MM-DD
            const normalizedDate = new Date(laporanDate)
              .toISOString()
              .split("T")[0];
            const normalizedSelectedDate = new Date(selectedDate)
              .toISOString()
              .split("T")[0];

            return normalizedDate === normalizedSelectedDate;
          });
          setLaporanPenjualanSales(filteredLaporanSales);
          console.log(
            "✅ FILTERED laporan sales untuk tanggal",
            selectedDate,
            ":",
            {
              total: laporanData.length,
              filtered: filteredLaporanSales.length,
              sampelDate:
                laporanData[0]?.tanggalLaporan || laporanData[0]?.createdAt,
            }
          );

          // ✅ NEW: Filter laporan penjualan produk dengan normalisasi tanggal
          filteredLaporanProduk = laporanProdukData.filter((laporan: any) => {
            const laporanDate =
              laporan.tanggalLaporan ||
              laporan.tanggal_laporan ||
              laporan.createdAt;
            if (!laporanDate) return false;

            // Normalisasi tanggal ke format YYYY-MM-DD
            const normalizedDate = new Date(laporanDate)
              .toISOString()
              .split("T")[0];
            const normalizedSelectedDate = new Date(selectedDate)
              .toISOString()
              .split("T")[0];

            return normalizedDate === normalizedSelectedDate;
          });
          setLaporanPenjualanProduk(filteredLaporanProduk);
          console.log(
            "✅ FILTERED laporan produk untuk tanggal",
            selectedDate,
            ":",
            {
              total: laporanProdukData.length,
              filtered: filteredLaporanProduk.length,
            }
          );
        }

        // ✅ FIXED: Filter laporan produksi dengan format fleksibel
        if (divisionType === "PRODUKSI") {
          const filteredLaporanProduksi = laporanProduksiData.filter(
            (laporan: any) => {
              const laporanDate =
                laporan.tanggal_laporan ||
                laporan.tanggalLaporan ||
                laporan.created_at;
              if (!laporanDate) return false;

              const dateStr = laporanDate.toString();
              return (
                dateStr.startsWith(selectedDate) ||
                dateStr.includes(selectedDate) ||
                dateStr.split("T")[0] === selectedDate
              );
            }
          );
          setLaporanProduksi(filteredLaporanProduksi);
          console.log(
            "✅ FILTERED laporan produksi untuk tanggal",
            selectedDate,
            ":",
            {
              total: laporanProduksiData.length,
              filtered: filteredLaporanProduksi.length,
            }
          );
        }

        // ✅ FIXED: Filter laporan gudang dengan format fleksibel
        if (divisionType === "PERSEDIAAN_BAHAN_BAKU") {
          const filteredLaporanGudang = laporanGudangData.filter(
            (laporan: any) => {
              const laporanDate =
                laporan.tanggal_laporan ||
                laporan.tanggalLaporan ||
                laporan.created_at;
              if (!laporanDate) return false;

              const dateStr = laporanDate.toString();
              return (
                dateStr.startsWith(selectedDate) ||
                dateStr.includes(selectedDate) ||
                dateStr.split("T")[0] === selectedDate
              );
            }
          );
          setLaporanGudang(filteredLaporanGudang);
          console.log(
            "✅ FILTERED laporan gudang untuk tanggal",
            selectedDate,
            ":",
            {
              total: laporanGudangData.length,
              filtered: filteredLaporanGudang.length,
            }
          );
        }

        // Filter entries yang belong to current division
        const accountIds = accountsData.map((acc) => acc.id);
        const divisionEntries = entriesData.filter(
          (entry: { accountId: string }) => accountIds.includes(entry.accountId)
        );

        // ✅ FIXED: Enhanced mapping untuk piutang entries
        const mappedPiutangEntries = (piutangData || [])
          .filter((p: any) => {
            const transaksiDate = p.tanggalTransaksi;
            if (!transaksiDate) return false;

            const dateStr = transaksiDate.toString();
            return (
              dateStr.startsWith(selectedDate) ||
              dateStr.includes(selectedDate) ||
              dateStr.split("T")[0] === selectedDate
            );
          })
          .map((p: any) => {
            console.log("🔍 MAPPING PIUTANG ENTRY:", p);

            const mapped = {
              id: `piutang-${p.id}`,
              accountId: p.account?.id?.toString() || "", // ✅ CRITICAL: Make sure this is not empty
              createdAt: p.tanggalTransaksi || p.createdAt,
              nilai: Number(p.nominal) || 0,
              description: p.keterangan || "",
              transactionType: p.tipeTransaksi,
              kategori: p.kategori,
              keterangan: p.keterangan || "",
              date: p.tanggalTransaksi || p.createdAt,
              tanggal: p.tanggalTransaksi || p.createdAt,
              createdBy: p.user?.username || "system",
            };

            console.log("✅ MAPPED PIUTANG ENTRY:", mapped);
            return mapped;
          });

        const mappedUtangEntries = (utangData || [])
          .filter((u: any) => {
            const transaksiDate = u.tanggal_transaksi || u.tanggalTransaksi;
            if (!transaksiDate) return false;

            const dateStr = transaksiDate.toString();
            return (
              dateStr.startsWith(selectedDate) ||
              dateStr.includes(selectedDate) ||
              dateStr.split("T")[0] === selectedDate
            );
          })
          .map((u: any) => ({
            id: `utang-${u.id}`,
            accountId: u.account_id?.toString() || u.accountId?.toString(),
            createdAt:
              u.tanggal_transaksi || u.tanggalTransaksi || u.created_at,
            nilai: Number(u.nominal) || 0,
            description: u.keterangan || "",
            transactionType: u.tipe_transaksi || u.tipeTransaksi,
            kategori: u.kategori,
            // ✅ ADD: Required EntriHarian fields
            keterangan: u.keterangan || "",
            date: u.tanggal_transaksi || u.tanggalTransaksi || u.created_at,
            tanggal: u.tanggal_transaksi || u.tanggalTransaksi || u.created_at,
            createdBy: u.created_by || "system",
          }));

        // Combine all entries
        const allEntries = [
          ...divisionEntries,
          ...mappedPiutangEntries,
          ...mappedUtangEntries,
        ];

        setExistingEntries(allEntries);

        // Calculate summaries
        if (divisionType === "KEUANGAN") {
          const summary = calculateKeuanganSummary(allEntries, accountsData);
          setKeuanganSummary(summary);

          const piutangSummaryData = calculatePiutangSummary(
            piutangData || [],
            selectedDate
          );
          setPiutangSummary(piutangSummaryData);
          // ✅ DEBUG LOGGING: Cek hasil summary dan data piutang
          console.log("[DEBUG] Piutang Data:", piutangData);
          console.log("[DEBUG] Piutang Summary Data:", piutangSummaryData);
        }

        console.log("✅ DATA LOADED SUCCESSFULLY:", {
          selectedDate,
          divisionEntries: divisionEntries.length,
          piutangEntries: mappedPiutangEntries.length,
          utangEntries: mappedUtangEntries.length,
          totalEntries: allEntries.length,
          laporanCount:
            divisionType === "PEMASARAN" ? filteredLaporanSales.length : 0,
        });

        // ✅ DEBUG: Log data untuk troubleshooting PDF
        if (divisionType === "PEMASARAN") {
          console.log("🔍 DEBUG PDF DATA - PEMASARAN:", {
            selectedDate,
            laporanPenjualanSales: filteredLaporanSales,
            laporanPenjualanProduk: filteredLaporanProduk,
            totalSalesReports: filteredLaporanSales.length,
            totalProductReports: filteredLaporanProduk.length,
            sampleSalesData: filteredLaporanSales[0],
            sampleProductData: filteredLaporanProduk[0],
            // ✅ ADD: Raw data untuk memastikan tidak double-filtered
            rawLaporanSales: laporanData,
            rawLaporanProduk: laporanProdukData,
            rawSalesCount: laporanData.length,
            rawProdukCount: laporanProdukData.length,
          });
        }

        // ✅ Only show success for manual refresh
        if (loading) {
          toastSuccess.custom("Data berhasil dimuat ulang");
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuat data laporan harian");
        setTimeout(() => setError(""), 5000);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  // ...existing code...

  const addNewRow = () => {
    const newRow: JournalRow = {
      id: Date.now().toString(),
      accountId: "",
      keterangan: "",
      nominal: "",
      kuantitas: "",
      piutangType: undefined,
      transactionType: undefined,
      targetAmount: "",
      realisasiAmount: "",
      pemakaianAmount: "",
      stokAkhir: "",
      saldoAkhir: "",
      attendanceStatus: undefined,
      absentCount: "",
      shift: undefined,
      utangType: undefined,
      utangKategori: undefined,
      // ✅ NEW: Initialize pemasaran sales fields
      salesUserId: "",
      returPenjualan: "",
      keteranganKendala: "",
      hasilProduksi: "",
      barangGagal: "",
      stockBarangJadi: "",
      hpBarangJadi: "",
      // ✅ NEW: Initialize gudang fields
      barangMasuk: "",
      pemakaian: "",
      keteranganGudang: "",
    };
    setJournalRows([...journalRows, newRow]);
    // Baris baru ditambahkan
  };

  const removeRow = (rowId: string) => {
    if (journalRows.length > 1) {
      setJournalRows(journalRows.filter((row) => row.id !== rowId));
      // Baris entri dihapus
    } else {
      // Minimal harus ada 1 baris entri
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

    // ✅ ADD: Keterangan berdasarkan valueType
    const keterangan =
      account.valueType === "NOMINAL" ? "💰 Nominal" : "📦 Kuantitas";
    return `${account.accountCode} - ${account.accountName} (${keterangan})`;
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
    // ✅ FIXED: Use transactionType from mapped entry
    if (entry.transactionType === "SALDO_AKHIR") {
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

    // Update validation logic untuk piutang
    const validRows = journalRows.filter((row) => {
      const account = getSelectedAccount(row.accountId);
      if (!account) return false;

      // Validasi khusus PEMASARAN
      if (divisionType === "PEMASARAN") {
        // Salesperson wajib, dan minimal salah satu target/realisasi/retur terisi
        if (
          row.salesUserId &&
          (row.targetAmount || row.realisasiAmount || row.returPenjualan)
        ) {
          return true;
        }
      }

      // ✅ NEW: Validasi khusus HRD
      if (divisionType === "HRD") {
        // Minimal salah satu field HRD terisi
        if (
          row.attendanceStatus ||
          row.absentCount ||
          row.shift ||
          row.keteranganKendala
        ) {
          return true;
        }
      }

      // ✅ NEW: Validasi khusus PRODUKSI
      if (divisionType === "PRODUKSI") {
        // Minimal salah satu field produksi terisi
        if (
          row.hasilProduksi ||
          row.barangGagal ||
          row.stockBarangJadi ||
          row.hpBarangJadi ||
          row.keteranganKendala
        ) {
          return true;
        }
      }

      // ✅ NEW: Validasi khusus PERSEDIAAN_BAHAN_BAKU - FLEKSIBEL
      if (divisionType === "PERSEDIAAN_BAHAN_BAKU") {
        // Minimal salah satu field gudang terisi (stok awal, pemakaian, stok akhir, atau kondisi)
        if (
          row.barangMasuk ||
          row.pemakaian ||
          row.stokAkhir ||
          row.keteranganGudang
        ) {
          return true;
        }
      }

      // Validasi piutang HANYA untuk KEUANGAN
      if (
        divisionType === "KEUANGAN" &&
        (row.piutangType ||
          (row.transactionType &&
            ["PIUTANG_BARU", "PIUTANG_TERTAGIH", "PIUTANG_MACET"].includes(
              row.transactionType
            )))
      ) {
        return (
          row.accountId &&
          row.nominal &&
          Number.parseFloat(row.nominal) > 0 &&
          selectedDate
        );
      }

      // Validasi utang HANYA untuk KEUANGAN
      if (
        divisionType === "KEUANGAN" &&
        (row.utangType ||
          (row.transactionType &&
            ["UTANG_BARU", "UTANG_DIBAYAR"].includes(row.transactionType)))
      ) {
        return (
          row.accountId &&
          row.nominal &&
          Number.parseFloat(row.nominal) > 0 &&
          selectedDate
        );
      }

      // Validasi regular entries
      if (
        row.transactionType &&
        ["PENERIMAAN", "PENGELUARAN", "SALDO_AKHIR"].includes(
          row.transactionType
        )
      ) {
        return (
          row.accountId &&
          row.nominal &&
          Number.parseFloat(row.nominal) > 0 &&
          selectedDate
        );
      }

      // Validasi default untuk GENERAL
      return (
        row.accountId &&
        ((account.valueType === "NOMINAL" &&
          row.nominal &&
          Number.parseFloat(row.nominal) > 0) ||
          (account.valueType === "KUANTITAS" &&
            row.kuantitas &&
            Number.parseFloat(row.kuantitas) > 0)) &&
        selectedDate
      );
    });

    console.log("📊 VALID ROWS COUNT:", validRows.length);

    if (validRows.length === 0) {
      console.log("❌ No valid rows - showing validation error");
      toastError.validation("Tidak ada entri yang valid untuk disimpan");
      return;
    }

    // ✅ CRITICAL FIX: Separate piutang entries from regular entries
    const piutangEntries =
      divisionType === "KEUANGAN"
        ? validRows.filter(
            (row) =>
              row.piutangType ||
              (row.transactionType &&
                ["PIUTANG_BARU", "PIUTANG_TERTAGIH", "PIUTANG_MACET"].includes(
                  row.transactionType
                ))
          )
        : [];

    // ✅ NEW: Separate utang entries
    const utangEntries =
      divisionType === "KEUANGAN"
        ? validRows.filter(
            (row) =>
              row.utangType ||
              (row.transactionType &&
                ["UTANG_BARU", "UTANG_DIBAYAR"].includes(row.transactionType))
          )
        : [];

    const regularEntries = validRows.filter(
      (row) =>
        (divisionType !== "KEUANGAN" ||
          (!row.piutangType &&
            !row.utangType &&
            !(
              row.transactionType &&
              [
                "PIUTANG_BARU",
                "PIUTANG_TERTAGIH",
                "PIUTANG_MACET",
                "UTANG_BARU",
                "UTANG_DIBAYAR",
              ].includes(row.transactionType)
            ))) &&
        (divisionType !== "PEMASARAN" || !row.salesUserId) &&
        (divisionType !== "HRD" || !row.attendanceStatus) && // ✅ ADD: Exclude HRD entries
        (divisionType !== "PERSEDIAAN_BAHAN_BAKU" ||
          !(
            row.barangMasuk ||
            row.pemakaian ||
            row.stokAkhir ||
            row.keteranganGudang
          )) && // ✅ ADD: Exclude PERSEDIAAN_BAHAN_BAKU gudang entries
        (divisionType !== "PRODUKSI" ||
          !(
            row.hasilProduksi ||
            row.barangGagal ||
            row.stockBarangJadi ||
            row.hpBarangJadi
          )) // ✅ ADD: Exclude PRODUKSI entries
    );

    // Tambahkan ini:
    const pemasaranSalesEntries = validRows.filter(
      (row) => row.salesUserId && divisionType === "PEMASARAN"
    );

    // ✅ NEW: Separate HRD entries
    const hrdEntries = validRows.filter(
      (row) =>
        divisionType === "HRD" &&
        (row.attendanceStatus || row.absentCount || row.shift)
    );

    // ✅ NEW: Separate produksi entries
    const produksiEntries = validRows.filter(
      (row) =>
        divisionType === "PRODUKSI" &&
        (row.hasilProduksi ||
          row.barangGagal ||
          row.stockBarangJadi ||
          row.hpBarangJadi)
    );

    // ✅ NEW: Separate gudang entries for PERSEDIAAN_BAHAN_BAKU
    const gudangEntries = validRows.filter(
      (row) =>
        divisionType === "PERSEDIAAN_BAHAN_BAKU" &&
        (row.barangMasuk ||
          row.pemakaian ||
          row.stokAkhir ||
          row.keteranganGudang)
    );

    console.log("📊 ENTRY SEPARATION:", {
      totalValid: validRows.length,
      piutangCount: piutangEntries.length,
      utangCount: utangEntries.length,
      regularCount: regularEntries.length,
      pemasaranSalesCount: pemasaranSalesEntries.length,
      hrdCount: hrdEntries.length, // ✅ ADD: HRD count
      produksiCount: produksiEntries.length,
      gudangCount: gudangEntries.length, // ✅ ADD: Gudang count
      piutangEntries: piutangEntries.map((r) => ({
        id: r.id,
        type: r.piutangType || r.transactionType,
      })),
      utangEntries: utangEntries.map((r) => ({
        id: r.id,
        type: r.utangType || r.transactionType,
      })),
      regularEntries: regularEntries.map((r) => ({
        id: r.id,
        transactionType: r.transactionType,
      })),
      pemasaranSalesEntries: pemasaranSalesEntries.map((r) => ({
        id: r.id,
        salesUserId: r.salesUserId,
      })),
      hrdEntries: hrdEntries.map((r) => ({
        // ✅ ADD: HRD entries logging
        id: r.id,
        attendanceStatus: r.attendanceStatus,
        absentCount: r.absentCount,
        shift: r.shift,
      })),
    });

    setLoading(true);

    try {
      const savedResults = [];

      // ✅ CRITICAL: Handle piutang entries FIRST and SEPARATELY

      if (piutangEntries.length > 0) {
        console.log("💰 PROCESSING PIUTANG ENTRIES:", piutangEntries);

        for (const row of piutangEntries) {
          // ✅ Get piutang type from either field
          const piutangType = row.piutangType || row.transactionType;

          // ✅ Validate piutang type
          if (
            !piutangType ||
            !["PIUTANG_BARU", "PIUTANG_TERTAGIH", "PIUTANG_MACET"].includes(
              piutangType
            )
          ) {
            console.error("❌ Invalid piutang type:", piutangType);
            throw new Error(
              `VALIDATION_ERROR: Tipe piutang tidak valid: ${piutangType}`
            );
          }

          // ✅ Validate nominal
          const nominal = Number.parseFloat(row.nominal);
          if (!nominal || nominal <= 0) {
            console.error("❌ Invalid nominal:", row.nominal);
            throw new Error(
              "VALIDATION_ERROR: Nominal piutang harus lebih dari 0"
            );
          }

          // ✅ Validate date
          if (!selectedDate) {
            console.error("❌ Invalid date:", selectedDate);
            throw new Error("VALIDATION_ERROR: Tanggal transaksi tidak valid");
          }

          // GUNAKAN LANGSUNG accountId dari row
          const accountId = Number(row.accountId);

          if (!accountId) {
            alert("Akun tidak valid!");
            return;
          }

          const piutangData: CreatePiutangRequest = {
            tanggalTransaksi: selectedDate,
            tipeTransaksi: piutangType as
              | "PIUTANG_BARU"
              | "PIUTANG_TERTAGIH"
              | "PIUTANG_MACET",
            kategori: row.kategori || "KARYAWAN",
            nominal: Number(nominal),
            keterangan: row.keterangan || "",
            accountId, // <-- langsung dari input user
          };

          console.log("📤 Akan mengirim piutang ke backend:", piutangData);
          const result = await piutangAPI.create(piutangData);
          console.log("✅ Hasil dari backend:", result);
          savedResults.push(result);
          console.log("✅ PIUTANG SAVED SUCCESSFULLY:", result);
        }
      }

      // ✅ NEW: Handle utang entries
      if (utangEntries.length > 0) {
        console.log("💳 PROCESSING UTANG ENTRIES:", utangEntries);

        for (const row of utangEntries) {
          // ✅ Get utang type from either field
          const utangType = row.utangType || row.transactionType;

          // ✅ Validate utang type
          if (
            !utangType ||
            !["UTANG_BARU", "UTANG_DIBAYAR"].includes(utangType)
          ) {
            console.error("❌ Invalid utang type:", utangType);
            throw new Error(
              `VALIDATION_ERROR: Tipe utang tidak valid: ${utangType}`
            );
          }

          // ✅ Validate nominal
          const nominal = Number.parseFloat(row.nominal);
          if (!nominal || nominal <= 0) {
            console.error("❌ Invalid nominal:", row.nominal);
            throw new Error(
              "VALIDATION_ERROR: Nominal utang harus lebih dari 0"
            );
          }

          // ✅ Validate date
          if (!selectedDate) {
            console.error("❌ Invalid date:", selectedDate);
            throw new Error("VALIDATION_ERROR: Tanggal transaksi tidak valid");
          }

          // GUNAKAN LANGSUNG accountId dari row
          const accountId = Number(row.accountId);

          if (!accountId) {
            alert("Akun tidak valid!");
            return;
          }

          const utangData: CreateUtangRequest = {
            tanggalTransaksi: selectedDate,
            tipeTransaksi: utangType as "UTANG_BARU" | "UTANG_DIBAYAR",
            kategori: row.utangKategori || "BAHAN_BAKU",
            nominal: Number(nominal),
            keterangan: row.keterangan || "",
            accountId, // <-- langsung dari input user
          };

          console.log("📤 Akan mengirim utang ke backend:", utangData);
          const result = await utangAPI.create(utangData);
          console.log("✅ Hasil dari backend:", result);
          savedResults.push(result);
          console.log("✅ UTANG SAVED SUCCESSFULLY:", result);
        }
      }

      // ✅ CRITICAL: Handle regular entries ONLY if there are any
      if (regularEntries.length > 0) {
        console.log("📝 PROCESSING REGULAR ENTRIES:", regularEntries);

        const entriesToSave: CreateEntriHarianRequest[] = regularEntries.map(
          (row) => {
            const account = getSelectedAccount(row.accountId)!;

            let nilai: number;
            if (divisionType === "GENERAL") {
              const value =
                account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
              nilai = Number.parseFloat(value);
            } else {
              switch (divisionType) {
                case "PEMASARAN":
                  // Jika ini sales entry, ambil dari realisasi/target
                  if (row.salesUserId) {
                    nilai = Number.parseFloat(
                      row.realisasiAmount || row.targetAmount || "0"
                    );
                  } else {
                    // Jika ini jurnal akuntansi biasa, ambil dari nominal
                    nilai = Number.parseFloat(row.nominal || "0");
                  }
                  break;
                case "KEUANGAN":
                  nilai = Number.parseFloat(row.nominal || "0");
                  break;
                case "PERSEDIAAN_BAHAN_BAKU":
                  nilai = Number.parseFloat(row.kuantitas || "0");
                  break;
                case "GUDANG":
                  nilai = Number.parseFloat(row.pemakaianAmount || "0");
                  break;
                case "HRD":
                  nilai = row.attendanceStatus === "HADIR" ? 1 : 0;
                  break;
                default:
                  nilai = 0;
              }
            }

            let entryNilai = Number.parseFloat(row.nominal) || 0;
            let entrySaldoAkhir: number | undefined = undefined;

            if (row.transactionType === "SALDO_AKHIR") {
              entrySaldoAkhir = entryNilai;
              entryNilai = 0;
            }

            const entry: CreateEntriHarianRequest = {
              accountId: Number(row.accountId),
              tanggal: selectedDate,
              nilai: nilai,
              description: row.keterangan || "",

              ...(row.transactionType && {
                transactionType: row.transactionType,
              }),
              ...(row.targetAmount && {
                targetAmount: Number.parseFloat(row.targetAmount),
              }),
              ...(row.realisasiAmount && {
                realisasiAmount: Number.parseFloat(row.realisasiAmount),
              }),
              ...(row.pemakaianAmount && {
                pemakaianAmount: Number.parseFloat(row.pemakaianAmount),
              }),
              ...(row.stokAkhir && {
                stokAkhir: Number.parseFloat(row.stokAkhir),
              }),
              ...(row.attendanceStatus && {
                attendanceStatus: row.attendanceStatus,
              }),
              ...(row.absentCount && {
                absentCount: Number.parseFloat(row.absentCount),
              }),
              ...(row.shift && { shift: row.shift }),
              ...(entrySaldoAkhir && {
                saldoAkhir: entrySaldoAkhir,
              }),
            };

            return entry;
          }
        );

        console.log(
          "📤 SENDING REGULAR ENTRIES TO /api/v1/entri-harian/batch:",
          entriesToSave
        );

        try {
          const regularResult = await saveEntriHarianBatch(entriesToSave);
          savedResults.push(...regularResult);
          console.log("✅ REGULAR ENTRIES SAVED SUCCESSFULLY:", regularResult);
        } catch (regularError) {
          console.error("❌ REGULAR ENTRIES SAVE ERROR:", regularError);
          throw regularError; // Re-throw to be caught by main catch block
        }
      }

      // ✅ NEW: Handle pemasaran sales entries separately
      if (pemasaranSalesEntries.length > 0 && divisionType === "PEMASARAN") {
        console.log(
          " PROCESSING PEMASARAN SALES ENTRIES:",
          pemasaranSalesEntries
        );

        // ✅ NEW: Convert pemasaran entries to regular entri harian format
        const pemasaranEntriesToSave: CreateEntriHarianRequest[] =
          pemasaranSalesEntries.map((row) => {
            const account = getSelectedAccount(row.accountId)!;

            return {
              accountId: Number(row.accountId),
              tanggal: selectedDate,
              nilai: Number.parseFloat(
                row.realisasiAmount || row.targetAmount || "0"
              ),
              description: row.keteranganKendala || "",
              // ✅ ADD: Pemasaran-specific fields
              targetAmount: row.targetAmount
                ? Number.parseFloat(row.targetAmount)
                : undefined,
              realisasiAmount: row.realisasiAmount
                ? Number.parseFloat(row.realisasiAmount)
                : undefined,
              // ✅ ADD: Sales user info
              salesUserId: row.salesUserId
                ? Number(row.salesUserId)
                : undefined,
              returPenjualan: row.returPenjualan
                ? Number.parseFloat(row.returPenjualan)
                : undefined,
              keteranganKendala: row.keteranganKendala || undefined,
            };
          });

        console.log(
          "📤 SENDING PEMASARAN ENTRIES TO /api/v1/entri-harian/batch:",
          pemasaranEntriesToSave
        );

        try {
          const pemasaranResult = await saveEntriHarianBatch(
            pemasaranEntriesToSave
          );
          savedResults.push(...pemasaranResult);
          console.log(
            "✅ PEMASARAN ENTRIES SAVED SUCCESSFULLY:",
            pemasaranResult
          );
        } catch (pemasaranError) {
          console.error("❌ PEMASARAN ENTRIES SAVE ERROR:", pemasaranError);
          throw pemasaranError; // Re-throw to be caught by main catch block
        }
      }

      // ✅ NEW: Handle produksi entries separately
      if (produksiEntries.length > 0 && divisionType === "PRODUKSI") {
        console.log(" PROCESSING PRODUKSI ENTRIES:", produksiEntries);

        for (const row of produksiEntries) {
          const produksiData: CreateLaporanProduksiRequest = {
            tanggalLaporan: selectedDate,
            accountId: Number(row.accountId),
            hasilProduksi: row.hasilProduksi
              ? Number(row.hasilProduksi)
              : undefined,
            barangGagal: row.barangGagal ? Number(row.barangGagal) : undefined,
            stockBarangJadi: row.stockBarangJadi
              ? Number(row.stockBarangJadi)
              : undefined,
            hpBarangJadi: row.hpBarangJadi
              ? Number(row.hpBarangJadi)
              : undefined,
            keteranganKendala: row.keteranganKendala || undefined,
          };

          console.log(
            "📤 Akan mengirim laporan produksi ke backend:",
            produksiData
          );
          const result = await saveLaporanProduksi(produksiData);
          console.log("✅ Hasil dari backend:", result);
          savedResults.push(result);
          console.log("✅ LAPORAN PRODUKSI SAVED SUCCESSFULLY:", result);
        }
      }

      // ✅ NEW: Handle gudang entries separately
      if (
        gudangEntries.length > 0 &&
        divisionType === "PERSEDIAAN_BAHAN_BAKU"
      ) {
        console.log("📦 PROCESSING GUDANG ENTRIES:", gudangEntries);

        for (const row of gudangEntries) {
          const gudangData: CreateLaporanGudangRequest = {
            tanggalLaporan: selectedDate,
            accountId: Number(row.accountId),
            // ✅ CRITICAL: Kirim undefined hanya jika benar-benar kosong, kirim 0 jika user input 0
            stokAwal:
              row.barangMasuk === "" || row.barangMasuk === undefined
                ? undefined // Kosong = auto-calculate
                : Number(row.barangMasuk), // Ada input = gunakan input user (bisa 0)
            pemakaian: row.pemakaian ? Number(row.pemakaian) : undefined,
            stokAkhir: row.stokAkhir ? Number(row.stokAkhir) : undefined,
            kondisiGudang: row.keteranganGudang || undefined,
          };

          console.log(
            "📤 Akan mengirim laporan gudang ke backend:",
            gudangData
          );
          const result = await saveLaporanGudang(gudangData);
          console.log("✅ Hasil dari backend:", result);
          savedResults.push(result);
          console.log("✅ LAPORAN GUDANG SAVED SUCCESSFULLY:", result);
        }
      }

      // ✅ NEW: Handle HRD entries separately
      if (hrdEntries.length > 0 && divisionType === "HRD") {
        console.log("👥 PROCESSING HRD ENTRIES:", hrdEntries);

        for (const row of hrdEntries) {
          const hrdData: CreateEntriHarianRequest = {
            accountId: Number(row.accountId),
            tanggal: selectedDate,
            nilai: row.attendanceStatus === "HADIR" ? 1 : 0,
            description: row.keteranganKendala || "",
            attendanceStatus: row.attendanceStatus,
            absentCount: row.absentCount ? Number(row.absentCount) : undefined,
            shift: row.shift,
          };

          console.log("📤 Akan mengirim laporan HRD ke backend:", hrdData);
          const result = await saveEntriHarianBatch([hrdData]);
          console.log("✅ Hasil dari backend:", result);
          savedResults.push(...result);
          console.log("✅ LAPORAN HRD SAVED SUCCESSFULLY:", result);
        }
      }

      // ✅ SUCCESS HANDLING: Show success message and reload data
      if (savedResults.length > 0) {
        console.log("✅ ALL ENTRIES SAVED SUCCESSFULLY:", savedResults);

        const totalSaved = savedResults.length;
        const pemasaranCount = pemasaranSalesEntries.length;
        const piutangCount = piutangEntries.length;
        const utangCount = utangEntries.length;
        const regularCount = regularEntries.length;
        const hrdCount = hrdEntries.length; // ✅ ADD: HRD count
        const produksiCount = produksiEntries.length;
        const gudangCount = gudangEntries.length;

        let successMessage = `Berhasil menyimpan ${totalSaved} entri`;
        if (pemasaranCount > 0) {
          successMessage += ` (${pemasaranCount} laporan sales`;
        }
        if (piutangCount > 0) {
          successMessage +=
            pemasaranCount > 0
              ? `, ${piutangCount} piutang`
              : ` (${piutangCount} piutang`;
        }
        if (utangCount > 0) {
          successMessage +=
            pemasaranCount > 0 || piutangCount > 0
              ? `, ${utangCount} utang`
              : ` (${utangCount} utang`;
        }
        if (regularCount > 0) {
          successMessage +=
            pemasaranCount > 0 || piutangCount > 0 || utangCount > 0
              ? `, ${regularCount} reguler`
              : ` (${regularCount} reguler`;
        }
        if (hrdCount > 0) {
          // ✅ ADD: HRD success message
          successMessage +=
            pemasaranCount > 0 ||
            piutangCount > 0 ||
            utangCount > 0 ||
            regularCount > 0
              ? `, ${hrdCount} HRD`
              : ` (${hrdCount} HRD`;
        }
        if (produksiCount > 0) {
          successMessage +=
            pemasaranCount > 0 ||
            piutangCount > 0 ||
            utangCount > 0 ||
            regularCount > 0 ||
            hrdCount > 0
              ? `, ${produksiCount} produksi`
              : ` (${produksiCount} produksi`;
        }
        if (gudangCount > 0) {
          successMessage +=
            pemasaranCount > 0 ||
            piutangCount > 0 ||
            utangCount > 0 ||
            regularCount > 0 ||
            hrdCount > 0 ||
            produksiCount > 0
              ? `, ${gudangCount} gudang`
              : ` (${gudangCount} gudang`;
        }
        if (
          pemasaranCount > 0 ||
          piutangCount > 0 ||
          utangCount > 0 ||
          regularCount > 0 ||
          hrdCount > 0 ||
          produksiCount > 0 ||
          gudangCount > 0
        ) {
          successMessage += ")";
        }

        toastSuccess.custom(successMessage);

        // Clear form
        setJournalRows([
          {
            id: "1",
            accountId: "",
            keterangan: "",
            nominal: "",
            kuantitas: "",
            piutangType: undefined,
            transactionType: undefined,
            targetAmount: "",
            realisasiAmount: "",
            pemakaianAmount: "",
            stokAkhir: "",
            saldoAkhir: "",
            attendanceStatus: undefined,
            absentCount: "",
            shift: undefined,
            utangType: undefined,
            utangKategori: undefined,
            salesUserId: "",
            returPenjualan: "",
            keteranganKendala: "",
            hasilProduksi: "",
            barangGagal: "",
            stockBarangJadi: "",
            hpBarangJadi: "",
            // ✅ NEW: Initialize gudang fields
            barangMasuk: "",
            pemakaian: "",
            keteranganGudang: "",
          },
        ]);

        // Reload data to show updated entries
        await loadData();
      }

      // Rest of success handling...
    } catch (err) {
      console.error("❌ SAVE JOURNAL ENTRIES ERROR:", err);

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes("VALIDATION_ERROR")) {
          toastError.validation(err.message.replace("VALIDATION_ERROR: ", ""));
        } else if (err.message.includes("NETWORK_ERROR")) {
          toastError.custom(
            "Gagal terhubung ke server. Periksa koneksi internet Anda."
          );
        } else {
          toastError.custom(
            err.message || "Terjadi kesalahan saat menyimpan entri"
          );
        }
      } else {
        toastError.custom("Terjadi kesalahan yang tidak diketahui");
      }
    } finally {
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

  // ✅ NEW: Function to delete laporan penjualan sales
  const removeLaporanPenjualanSales = async (id: number) => {
    if (!confirm("Hapus laporan penjualan sales ini?")) return;

    try {
      await toastPromise.delete(
        deleteLaporanPenjualanSales(id),
        "laporan penjualan sales"
      );
      loadData();
    } catch (error) {
      toastError.custom("Gagal menghapus laporan penjualan sales");
    }
  };

  // ✅ NEW: Function to delete laporan produksi
  const removeLaporanProduksi = async (id: number) => {
    if (!confirm("Hapus laporan produksi ini?")) return;

    try {
      await toastPromise.delete(deleteLaporanProduksi(id), "laporan produksi");
      loadData();
    } catch (error) {
      toastError.custom("Gagal menghapus laporan produksi");
    }
  };

  // ✅ NEW: Function to delete laporan gudang
  const removeLaporanGudang = async (id: number) => {
    if (!confirm("Hapus laporan gudang ini?")) return;

    try {
      await toastPromise.delete(deleteLaporanGudang(id), "laporan gudang");
      loadData();
    } catch (error) {
      toastError.custom("Gagal menghapus laporan gudang");
    }
  };

  // ✅ Helper function to get division type
  const getDivisionType = (): string => {
    const divisionName = user?.division?.name?.toLowerCase();
    if (divisionName?.includes("blending"))
      return "BLENDING_PERSEDIAAN_BAHAN_BAKU";
    if (divisionName?.includes("keuangan")) return "KEUANGAN";
    if (
      divisionName?.includes("persediaan") ||
      divisionName?.includes("bahan baku")
    )
      return "PERSEDIAAN_BAHAN_BAKU";
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
      return "HRD";
    return "GENERAL";
  };

  // ✅ Helper function to check if division can access production form
  const canAccessProduksi = (): boolean => {
    const divisionName = user?.division?.name;
    return (
      divisionName === "DIVISI PRODUKSI" ||
      divisionName === "BLENDING PERSEDIAAN BAHAN BAKU" ||
      divisionName === "DIVISI BLENDING PERSEDIAAN BAHAN BAKU"
    );
  };

  const divisionType: string = getDivisionType();

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
      case "PERSEDIAAN_BAHAN_BAKU":
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
            // ✅ FIXED: Include specialized division data
            ...(divisionType === "PEMASARAN" && {
              laporanPenjualanSales,
              laporanPenjualanProduk,
            }),
            ...(divisionType === "PRODUKSI" && { laporanProduksi }),
            ...(divisionType === "PERSEDIAAN_BAHAN_BAKU" && { laporanGudang }),
            ...(divisionType === "KEUANGAN" && { summary: keuanganSummary }),
            // ✅ ADD: Include users and salespeople for reference
            users,
            salespeople,
          };

          // ✅ FIXED: Debug logging untuk memastikan data lengkap
          console.log("🔍 [PDF GENERATION DEBUG] reportData:", {
            divisionType,
            selectedDate,
            entriesCount: existingEntries.length,
            laporanSalesCount: laporanPenjualanSales.length,
            laporanProdukCount: laporanPenjualanProduk.length,
            sampleSalesData: laporanPenjualanSales[0],
            sampleProdukData: laporanPenjualanProduk[0],
            allSalesData: laporanPenjualanSales,
            allProdukData: laporanPenjualanProduk,
          });

          // ✅ DEBUG: Enhanced logging untuk troubleshooting account mapping
          console.log("=== DEBUG PDF GENERATION ===");
          console.log("divisionType:", divisionType);
          console.log("selectedDate:", selectedDate);
          console.log("accounts:", accounts);
          console.log("existingEntries:", existingEntries);

          if (divisionType === "PERSEDIAAN_BAHAN_BAKU") {
            console.log("=== DEBUG PERSEDIAAN_BAHAN_BAKU SPECIFIC ===");
            console.log("laporanGudang:", laporanGudang);
            console.log(
              "laporanGudang accounts:",
              laporanGudang.map((lg) => ({
                id: lg.id,
                account: lg.account,
                accountId: lg.account?.id,
              }))
            );
          }

          if (divisionType === "PRODUKSI") {
            console.log("=== DEBUG PRODUKSI SPECIFIC ===");
            console.log("laporanProduksi:", laporanProduksi);
          }

          console.log("reportData:", reportData);

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
            // ✅ FIXED: Include specialized division data
            ...(divisionType === "PEMASARAN" && {
              laporanPenjualanSales,
              laporanPenjualanProduk,
            }),
            ...(divisionType === "PRODUKSI" && { laporanProduksi }),
            ...(divisionType === "PERSEDIAAN_BAHAN_BAKU" && { laporanGudang }),
            ...(divisionType === "KEUANGAN" && { summary: keuanganSummary }),
            // ✅ ADD: Include users and salespeople for reference
            users,
            salespeople,
          };

          // ✅ FIXED: Debug logging untuk memastikan data lengkap
          console.log("🔍 [PDF PREVIEW DEBUG] reportData:", {
            divisionType,
            selectedDate,
            entriesCount: existingEntries.length,
            laporanSalesCount: laporanPenjualanSales.length,
            laporanProdukCount: laporanPenjualanProduk.length,
            sampleSalesData: laporanPenjualanSales[0],
            sampleProdukData: laporanPenjualanProduk[0],
            allSalesData: laporanPenjualanSales,
            allProdukData: laporanPenjualanProduk,
          });

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
        // Untuk akun kas, tampilkan selector jenis transaksi
        if (selectedAccount?.accountName.toLowerCase().includes("kas")) {
          return (
            <div className="col-span-12 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Jenis Transaksi</Label>
                  <Select
                    value={row.transactionType || ""}
                    onValueChange={(value) =>
                      updateRow(row.id, "transactionType", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENERIMAAN">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600">⬆️</span> Penerimaan
                        </span>
                      </SelectItem>
                      <SelectItem value="PENGELUARAN">
                        <span className="flex items-center gap-2">
                          <span className="text-red-600">⬇️</span> Pengeluaran
                        </span>
                      </SelectItem>
                      <SelectItem value="SALDO_AKHIR">
                        <span className="flex items-center gap-2">
                          <span className="text-purple-600">💰</span> Saldo
                          Akhir
                        </span>
                      </SelectItem>
                      {/* Tambahkan tipe piutang */}
                      <SelectItem value="PIUTANG_BARU">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-600">👤</span> Piutang Baru
                        </span>
                      </SelectItem>
                      <SelectItem value="PIUTANG_TERTAGIH">
                        <span className="flex items-center gap-2">
                          <span className="text-emerald-600">👤</span> Piutang
                          Tertagih
                        </span>
                      </SelectItem>
                      <SelectItem value="PIUTANG_MACET">
                        <span className="flex items-center gap-2">
                          <span className="text-orange-600">👤</span> Piutang
                          Macet
                        </span>
                      </SelectItem>
                      {/* ✅ NEW: Tambahkan tipe utang */}
                      <SelectItem value="UTANG_BARU">
                        <span className="flex items-center gap-2">
                          <span className="text-red-600">💳</span> Utang Baru
                        </span>
                      </SelectItem>
                      <SelectItem value="UTANG_DIBAYAR">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600">💳</span> Utang
                          Dibayar
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nominal</Label>
                  <Input
                    type="number"
                    placeholder="Rp 0"
                    value={row.nominal}
                    onChange={(e) =>
                      updateRow(row.id, "nominal", e.target.value)
                    }
                    className="mt-1"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <Label>Nilai Tampil</Label>
                  <div className="mt-1 p-2 bg-white rounded border text-sm">
                    {row.nominal
                      ? Number(row.nominal).toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "0"}
                  </div>
                </div>
              </div>
              {/* Dropdown kategori piutang hanya muncul jika tipe transaksi piutang dipilih */}
              {["PIUTANG_BARU", "PIUTANG_TERTAGIH", "PIUTANG_MACET"].includes(
                row.transactionType || ""
              ) && (
                <div className="mt-4">
                  <Label>Kategori Piutang</Label>
                  <Select
                    value={row.kategori || ""}
                    onValueChange={(value) =>
                      updateRow(row.id, "kategori", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih kategori piutang..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KARYAWAN">Karyawan</SelectItem>
                      <SelectItem value="TOKO">Toko</SelectItem>
                      <SelectItem value="BAHAN_BAKU">Bahan Baku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* ✅ NEW: Dropdown kategori utang hanya muncul jika tipe transaksi utang dipilih */}
              {["UTANG_BARU", "UTANG_DIBAYAR"].includes(
                row.transactionType || ""
              ) && (
                <div className="mt-4">
                  <Label>Kategori Utang</Label>
                  <Select
                    value={row.utangKategori || ""}
                    onValueChange={(value) =>
                      updateRow(row.id, "utangKategori", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih kategori utang..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAHAN_BAKU">Bahan Baku</SelectItem>
                      <SelectItem value="BANK_HM">Bank HM</SelectItem>
                      <SelectItem value="BANK_HENRY">Bank Henry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        }

      case "PRODUKSI":
        return (
          <div className="col-span-12 mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  🏭 Hasil Produksi (Unit)
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.hasilProduksi}
                  onChange={(e) =>
                    updateRow(row.id, "hasilProduksi", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  ❌ Barang Gagal (Unit)
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.barangGagal}
                  onChange={(e) =>
                    updateRow(row.id, "barangGagal", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  📦 Stock Barang Jadi (Unit)
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.stockBarangJadi}
                  onChange={(e) =>
                    updateRow(row.id, "stockBarangJadi", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Harga Pokok Barang Jadi (Rp)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.hpBarangJadi}
                  onChange={(e) =>
                    updateRow(row.id, "hpBarangJadi", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            {/* Kendala Produksi */}
            <div className="mt-4">
              <Label>Kendala Produksi</Label>
              <textarea
                placeholder="Tuliskan kendala produksi hari ini..."
                value={row.keteranganKendala}
                onChange={(e) =>
                  updateRow(row.id, "keteranganKendala", e.target.value)
                }
                className="mt-1 w-full border rounded p-2 min-h-[60px]"
              />
            </div>
          </div>
        );
      case "PERSEDIAAN_BAHAN_BAKU":
        return (
          <div className="col-span-12 mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                💡 <strong>Tips:</strong> Kosongkan stok awal untuk
                auto-calculate dari hari sebelumnya, atau isi dengan 0 untuk
                mulai dari nol.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  📦 Stok Awal (Opsional)
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.barangMasuk}
                  onChange={(e) =>
                    updateRow(row.id, "barangMasuk", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Kosongkan jika ingin dihitung otomatis
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  🔄 Pemakaian
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.pemakaian}
                  onChange={(e) =>
                    updateRow(row.id, "pemakaian", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  📦 Stok Akhir
                </label>
                <Input
                  type="number"
                  placeholder="0 unit"
                  value={row.stokAkhir}
                  onChange={(e) =>
                    updateRow(row.id, "stokAkhir", e.target.value)
                  }
                  className="text-right text-sm"
                  min="0"
                />
              </div>
              <div>
                <Label>Kondisi Gudang</Label>
                <textarea
                  placeholder="Tuliskan kondisi gudang hari ini..."
                  value={row.keteranganGudang}
                  onChange={(e) =>
                    updateRow(row.id, "keteranganGudang", e.target.value)
                  }
                  className="mt-1 w-full border rounded p-2 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        );
      case "PEMASARAN":
        return (
          <div className="col-span-12 mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Salesperson */}
              <div>
                <Label>Salesperson</Label>
                <Select
                  value={row.salesUserId || ""}
                  onValueChange={(value) =>
                    updateRow(row.id, "salesUserId", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih salesperson..." />
                  </SelectTrigger>
                  <SelectContent>
                    {salespeople.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id.toString()}>
                        {sp.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Target Penjualan */}
              <div>
                <Label>Target Penjualan</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.targetAmount}
                  onChange={(e) =>
                    updateRow(row.id, "targetAmount", e.target.value)
                  }
                  className="mt-1"
                  min="0"
                />
              </div>
              {/* Realisasi Penjualan */}
              <div>
                <Label>Realisasi Penjualan</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.realisasiAmount}
                  onChange={(e) =>
                    updateRow(row.id, "realisasiAmount", e.target.value)
                  }
                  className="mt-1"
                  min="0"
                />
              </div>
              {/* Retur/Potongan */}
              <div>
                <Label>Retur/Potongan</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={row.returPenjualan}
                  onChange={(e) =>
                    updateRow(row.id, "returPenjualan", e.target.value)
                  }
                  className="mt-1"
                  min="0"
                />
              </div>
              {/* Kendala Penjualan */}
              <div className="md:col-span-2">
                <Label>Kendala Penjualan</Label>
                <textarea
                  placeholder="Tuliskan kendala penjualan hari ini..."
                  value={row.keteranganKendala}
                  onChange={(e) =>
                    updateRow(row.id, "keteranganKendala", e.target.value)
                  }
                  className="mt-1 w-full border rounded p-2 min-h-[60px]"
                />
              </div>
            </div>
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
            {/* ✅ ADD: Keterangan Kendala HRD */}
            <div className="mt-4">
              <Label>Keterangan Kendala</Label>
              <textarea
                placeholder="Tuliskan keterangan kendala kehadiran hari ini..."
                value={row.keteranganKendala}
                onChange={(e) =>
                  updateRow(row.id, "keteranganKendala", e.target.value)
                }
                className="mt-1 w-full border rounded p-2 min-h-[60px]"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render tab menu
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

  // Render form input sesuai tab
  const renderTabForm = () => {
    switch (selectedTransactionType) {
      case "KAS":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Akun</Label>
              <Select
                value={journalRows[0].accountId}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "accountId", value)
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
            <div>
              <Label>Jenis Transaksi</Label>
              <Select
                value={journalRows[0].transactionType || ""}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "transactionType", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENERIMAAN">Penerimaan</SelectItem>
                  <SelectItem value="PENGELUARAN">Pengeluaran</SelectItem>
                  <SelectItem value="SALDO_AKHIR">Saldo Akhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nominal</Label>
              <Input
                type="number"
                placeholder="Rp 0"
                value={journalRows[0].nominal}
                onChange={(e) =>
                  updateRow(journalRows[0].id, "nominal", e.target.value)
                }
                className="mt-1"
                min="0"
                step="1000"
              />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi"
                value={journalRows[0].keterangan}
                onChange={(e) =>
                  updateRow(journalRows[0].id, "keterangan", e.target.value)
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
              <Label>Akun Piutang</Label>
              <Select
                value={journalRows[0].accountId}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "accountId", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih akun piutang" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((account) =>
                      account.accountName.toLowerCase().includes("piutang")
                    )
                    .map((account) => (
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
                value={journalRows[0].transactionType || ""}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "transactionType", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih tipe piutang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIUTANG_BARU">Baru</SelectItem>
                  <SelectItem value="PIUTANG_TERTAGIH">Tertagih</SelectItem>
                  <SelectItem value="PIUTANG_MACET">Macet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategori Piutang</Label>
              <Select
                value={journalRows[0].kategori || ""}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "kategori", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori piutang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KARYAWAN">👤 Karyawan</SelectItem>
                  <SelectItem value="TOKO">🏪 Toko</SelectItem>
                  <SelectItem value="BAHAN_BAKU">📦 Bahan Baku</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nominal</Label>
              <Input
                type="number"
                placeholder="Rp 0"
                value={journalRows[0].nominal}
                onChange={(e) =>
                  updateRow(journalRows[0].id, "nominal", e.target.value)
                }
                className="mt-1"
                min="0"
                step="1000"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi transaksi piutang"
                value={journalRows[0].keterangan}
                onChange={(e) =>
                  updateRow(journalRows[0].id, "keterangan", e.target.value)
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
              <Label>Akun Utang</Label>
              <Select
                value={journalRows[0].accountId}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "accountId", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih akun utang" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((account) =>
                      account.accountName.toLowerCase().includes("utang")
                    )
                    .map((account) => (
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
                value={journalRows[0].transactionType || ""}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "transactionType", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih tipe utang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTANG_BARU">Baru</SelectItem>
                  <SelectItem value="UTANG_DIBAYAR">Dibayar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategori Utang</Label>
              <Select
                value={journalRows[0].utangKategori || ""}
                onValueChange={(value) =>
                  updateRow(journalRows[0].id, "utangKategori", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori utang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAHAN_BAKU">📦 Bahan Baku</SelectItem>
                  <SelectItem value="BANK_HM">🏦 Bank HM</SelectItem>
                  <SelectItem value="BANK_HENRY">🏦 Bank Henry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nominal</Label>
              <Input
                type="number"
                placeholder="Rp 0"
                value={journalRows[0].nominal}
                onChange={(e) =>
                  updateRow(journalRows[0].id, "nominal", e.target.value)
                }
                className="mt-1"
                min="0"
                step="1000"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Deskripsi transaksi utang"
                value={journalRows[0].keterangan}
                onChange={(e) =>
                  updateRow(journalRows[0].id, "keterangan", e.target.value)
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

  const getPemasaranSummary = () => {
    console.log("DEBUG laporanPenjualanSales:", laporanPenjualanSales); // Tambahkan log ini
    let totalTarget = 0;
    let totalRealisasi = 0;
    let totalRetur = 0;

    laporanPenjualanSales.forEach((laporan) => {
      totalTarget += laporan.targetPenjualan || 0;
      totalRealisasi += laporan.realisasiPenjualan || 0;
      totalRetur += laporan.returPenjualan || 0;
    });

    return {
      totalTarget,
      totalRealisasi,
      totalRetur,
      jumlahSales: laporanPenjualanSales.length,
    };
  };

  // ✅ NEW: Get produksi summary
  const getProduksiSummary = () => {
    let totalHasilProduksi = 0;
    let totalBarangGagal = 0;
    let totalStockBarangJadi = 0;
    let totalHpBarangJadi = 0;

    laporanProduksi.forEach((laporan) => {
      // Cek dua-duanya, agar support data hasil mapping dan data mentah
      totalHasilProduksi += laporan.hasilProduksi ?? 0;
      totalBarangGagal += laporan.barangGagal ?? 0;
      totalStockBarangJadi += laporan.stockBarangJadi ?? 0;
      totalHpBarangJadi += laporan.hpBarangJadi ?? 0;
    });

    return {
      totalHasilProduksi,
      totalBarangGagal,
      totalStockBarangJadi,
      totalHpBarangJadi,
      jumlahLaporan: laporanProduksi.length,
    };
  };

  // ✅ NEW: Get gudang summary
  const getGudangSummary = () => {
    let totalStokAwal = 0;
    let totalPemakaian = 0;
    let totalStokAkhir = 0;

    laporanGudang.forEach((laporan) => {
      // ✅ FIXED: Use proper field names
      totalStokAwal += laporan.barangMasuk || 0;
      totalPemakaian += laporan.pemakaian || 0;
      totalStokAkhir += laporan.stokAkhir || 0;
    });

    return {
      totalStokAwal,
      totalPemakaian,
      totalStokAkhir,
      jumlahLaporan: laporanGudang.length,
    };
  };

  // Fungsi untuk menghitung summary piutang
  const calculatePiutangSummary = (piutangData: any[], tanggal: string) => {
    // ✅ FIXED: Gunakan field name yang benar dari backend
    const hariIni = piutangData.filter((p) => {
      const transaksiDateSummary = p.tanggalTransaksi; // ✅ Gunakan tanggalTransaksi bukan tanggal_transaksi
      if (!transaksiDateSummary) return false;
      // ✅ Normalisasi tanggal ke format YYYY-MM-DD
      const normalizedDate = new Date(transaksiDateSummary)
        .toISOString()
        .split("T")[0];
      const normalizedSelectedDate = new Date(tanggal)
        .toISOString()
        .split("T")[0];
      return normalizedDate === normalizedSelectedDate;
    });

    // ✅ FIXED: Gunakan tipeTransaksi bukan tipe_transaksi
    const baru = hariIni
      .filter((p) => p.tipeTransaksi === "PIUTANG_BARU")
      .reduce((sum, p) => sum + Number(p.nominal), 0);

    const tertagih = hariIni
      .filter((p) => p.tipeTransaksi === "PIUTANG_TERTAGIH")
      .reduce((sum, p) => sum + Number(p.nominal), 0);

    const macet = hariIni
      .filter((p) => p.tipeTransaksi === "PIUTANG_MACET")
      .reduce((sum, p) => sum + Number(p.nominal), 0);

    // Saldo akhir piutang bisa dihitung sesuai kebutuhan, misal total baru - tertagih - macet
    const saldoAkhir = baru - tertagih - macet;

    return { baru, tertagih, macet, saldoAkhir };
  };

  // ✅ NEW: Get HRD summary - FIXED
  const getHRDSummary = () => {
    let totalKaryawan = 0;
    let hadirCount = 0;
    let tidakHadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let totalAbsentCount = 0;
    let lemburCount = 0;

    existingEntries.forEach((entry) => {
      // ✅ Check if this is HRD data
      if (
        (entry as any).attendanceStatus ||
        (entry as any).absentCount ||
        (entry as any).shift
      ) {
        // ✅ FIXED: Total karyawan = sum of absentCount, bukan count entries
        const absentCount = Number((entry as any).absentCount) || 0;
        totalKaryawan += absentCount;
        totalAbsentCount += absentCount;

        const attendanceStatus = (entry as any).attendanceStatus;
        const shift = (entry as any).shift;

        if (attendanceStatus === "HADIR") {
          hadirCount += absentCount;
        } else if (attendanceStatus === "TIDAK_HADIR") {
          tidakHadirCount += absentCount;
        } else if (attendanceStatus === "SAKIT") {
          sakitCount += absentCount;
        } else if (attendanceStatus === "IZIN") {
          izinCount += absentCount;
        }

        if (shift === "LEMBUR") {
          lemburCount += absentCount;
        }
      }
    });

    const attendanceRate =
      totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;

    return {
      totalKaryawan,
      hadirCount,
      tidakHadirCount,
      sakitCount,
      izinCount,
      totalAbsentCount,
      lemburCount,
      attendanceRate,
      jumlahLaporan: existingEntries.filter(
        (entry) =>
          (entry as any).attendanceStatus ||
          (entry as any).absentCount ||
          (entry as any).shift
      ).length,
    };
  };

  // Fungsi untuk render tabel jurnal sesuai divisi
  function renderJournalTable() {
    // Untuk divisi selain PEMASARAN dan PRODUKSI/BLENDING
    if (
      divisionType === "KEUANGAN" ||
      divisionType === "GENERAL" ||
      divisionType === "HRD"
    ) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-600" />
              Jurnal Harian - {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Jenis Transaksi</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingEntries.map((entry, index) => {
                  const account = accounts.find(
                    (a) => a.id === entry.accountId
                  );
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {account?.accountCode || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account?.accountName || "Akun tidak ditemukan"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.description || entry.keterangan}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(entry as any).transactionType ||
                            (entry as any).piutangType ||
                            (entry as any).utangType ||
                            "REGULAR"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {/* ✅ FIXED: Untuk HRD, tampilkan absentCount bukan nilai */}
                        {divisionType === "HRD"
                          ? `${(entry as any).absentCount || 0} orang`
                          : account?.valueType === "NOMINAL" ||
                            account?.id === "SALES"
                          ? formatCurrency(entry.nilai)
                          : `${entry.nilai.toLocaleString("id-ID")} unit`}
                      </TableCell>
                      <TableCell>
                        {new Date(entry.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {existingEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada entri jurnal untuk tanggal {selectedDate}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Untuk divisi PRODUKSI
    if (divisionType === "PRODUKSI") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-600" />
              Laporan Produksi Harian - {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Hasil Produksi</TableHead>
                  <TableHead>Barang Gagal</TableHead>
                  <TableHead>Stock Barang Jadi</TableHead>
                  <TableHead>HP Barang Jadi</TableHead>
                  <TableHead>Kendala</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laporanProduksi.map((laporan) => (
                  <TableRow key={laporan.id}>
                    <TableCell>
                      {laporan.createdAt
                        ? new Date(laporan.createdAt).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>{laporan.account?.accountCode || "-"}</TableCell>
                    <TableCell>{laporan.account?.accountName || "-"}</TableCell>
                    <TableCell>{laporan.hasilProduksi ?? "-"}</TableCell>
                    <TableCell>{laporan.barangGagal ?? "-"}</TableCell>
                    <TableCell>{laporan.stockBarangJadi ?? "-"}</TableCell>
                    <TableCell>{laporan.hpBarangJadi ?? "-"}</TableCell>
                    <TableCell>{laporan.keteranganKendala || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {laporanProduksi.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada laporan produksi untuk tanggal {selectedDate}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Untuk divisi PERSEDIAAN_BAHAN_BAKU
    if (divisionType === "PERSEDIAAN_BAHAN_BAKU") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-600" />
              Laporan Gudang Harian - {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Stok Awal</TableHead>
                  <TableHead>Pemakaian</TableHead>
                  <TableHead>Stok Akhir</TableHead>
                  <TableHead>Kondisi Gudang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laporanGudang.map((laporan) => (
                  <TableRow key={laporan.id}>
                    <TableCell>
                      {laporan.createdAt
                        ? new Date(laporan.createdAt).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>{laporan.account?.accountCode || "-"}</TableCell>
                    <TableCell>{laporan.account?.accountName || "-"}</TableCell>
                    <TableCell>{laporan.barangMasuk ?? "-"}</TableCell>
                    <TableCell>{laporan.pemakaian ?? "-"}</TableCell>
                    <TableCell>{laporan.stokAkhir ?? "-"}</TableCell>
                    <TableCell>{laporan.keterangan || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {laporanGudang.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada laporan gudang untuk tanggal {selectedDate}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  // Fungsi untuk render summary card sesuai divisi
  function renderSummaryCard() {
    switch (divisionType) {
      case "PRODUKSI": {
        const summary = getProduksiSummary();
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">🏭</span>
                Ringkasan Produksi Hari Ini
              </CardTitle>
              <CardDescription>
                Total hasil produksi, barang gagal, stock barang jadi, dan HPP
                hari ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-800">
                    Total Hasil Produksi
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-2">
                    {summary.totalHasilProduksi}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="font-semibold text-orange-800">
                    Total Barang Gagal
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mt-2">
                    {summary.totalBarangGagal}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-semibold text-green-800">
                    Total Stock Barang Jadi
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-2">
                    {summary.totalStockBarangJadi}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-semibold text-purple-800">Total HPP</div>
                  <div className="text-2xl font-bold text-purple-900 mt-2">
                    {summary.totalHpBarangJadi}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      default:
        // Pemasaran, Keuangan, General: summary card sudah ada di bawah (tidak perlu double)
        return null;
    }
  }

  const handleCreateSalesperson = async () => {
    if (!newSalespersonName.trim() || !selectedPerusahaanForNewSales) return;
    try {
      const newSales = await createSalesperson(
        newSalespersonName.trim(),
        parseInt(selectedPerusahaanForNewSales),
        user?.division?.id ? parseInt(user.division.id) : 6
      );
      setSalespeople([...salespeople, newSales]);
      setNewSalespersonName("");
      setSelectedPerusahaanForNewSales("");
      toastSuccess.custom("Salesperson berhasil ditambahkan!");
    } catch (error: any) {
      toastError.custom("Gagal menambah salesperson: " + error.message);
    }
  };

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
            {(existingEntries.length > 0 ||
              (divisionType === "KEUANGAN" &&
                (keuanganSummary.totalPenerimaan > 0 ||
                  keuanganSummary.totalPengeluaran > 0 ||
                  keuanganSummary.totalSaldoAkhir > 0)) ||
              (divisionType === "PEMASARAN" &&
                (laporanPenjualanProduk.length > 0 ||
                  laporanPenjualanSales.length > 0)) ||
              (divisionType === "PRODUKSI" && laporanProduksi.length > 0) ||
              (divisionType === "PERSEDIAAN_BAHAN_BAKU" &&
                laporanGudang.length > 0) ||
              (divisionType === "HRD" && existingEntries.length > 0)) && (
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

        {/* === KEUANGAN: TAB KAS, PIUTANG, UTANG === */}
        {divisionType === "KEUANGAN" ? (
          <>
            {/* TAB MENU KEUANGAN */}
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

            {/* === FORM INPUT KEUANGAN BERDASARKAN TAB === */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Form Input {selectedTransactionType}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Render form sesuai tab yang dipilih */}
                {selectedTransactionType === "KAS" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pilih Akun Kas
                      </label>
                      <Select
                        value={journalRows[0].accountId}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "accountId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih akun kas..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((acc) =>
                              acc.accountName.toLowerCase().includes("kas")
                            )
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {getAccountDisplay(account.id)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Jenis Transaksi
                      </label>
                      <Select
                        value={journalRows[0].transactionType || ""}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "transactionType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis transaksi..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENERIMAAN">
                            💰 Penerimaan Kas
                          </SelectItem>
                          <SelectItem value="PENGELUARAN">
                            💸 Pengeluaran Kas
                          </SelectItem>
                          <SelectItem value="SALDO_AKHIR">
                            💵 Saldo Akhir Kas
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {journalRows[0].transactionType === "SALDO_AKHIR"
                          ? "Saldo Akhir"
                          : "Nominal"}
                      </label>
                      <Input
                        type="number"
                        placeholder="Rp 0"
                        value={
                          journalRows[0].transactionType === "SALDO_AKHIR"
                            ? journalRows[0].saldoAkhir
                            : journalRows[0].nominal
                        }
                        onChange={(e) =>
                          updateRow(
                            journalRows[0].id,
                            journalRows[0].transactionType === "SALDO_AKHIR"
                              ? "saldoAkhir"
                              : "nominal",
                            e.target.value
                          )
                        }
                        className="mt-1"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Keterangan
                      </label>
                      <Input
                        placeholder="Deskripsi transaksi kas"
                        value={journalRows[0].keterangan}
                        onChange={(e) =>
                          updateRow(
                            journalRows[0].id,
                            "keterangan",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {selectedTransactionType === "PIUTANG" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pilih Akun Piutang
                      </label>
                      <Select
                        value={journalRows[0].accountId}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "accountId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih akun piutang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((account) =>
                              account.accountName
                                .toLowerCase()
                                .includes("piutang")
                            )
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {getAccountDisplay(account.id)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Jenis Transaksi Piutang
                      </label>
                      <Select
                        value={journalRows[0].piutangType || ""}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "piutangType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis piutang..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PIUTANG_BARU">
                            📈 Piutang Baru
                          </SelectItem>
                          <SelectItem value="PIUTANG_TERTAGIH">
                            💰 Piutang Tertagih
                          </SelectItem>
                          <SelectItem value="PIUTANG_MACET">
                            ❌ Piutang Macet
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Kategori Piutang
                      </label>
                      <Select
                        value={journalRows[0].kategori || ""}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "kategori", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KARYAWAN">👥 Karyawan</SelectItem>
                          <SelectItem value="TOKO">🏪 Toko</SelectItem>
                          <SelectItem value="BAHAN_BAKU">
                            📦 Bahan Baku
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nominal Piutang
                      </label>
                      <Input
                        type="number"
                        placeholder="Rp 0"
                        value={journalRows[0].nominal}
                        onChange={(e) =>
                          updateRow(
                            journalRows[0].id,
                            "nominal",
                            e.target.value
                          )
                        }
                        className="mt-1"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Keterangan Piutang
                      </label>
                      <Input
                        placeholder="Deskripsi transaksi piutang"
                        value={journalRows[0].keterangan}
                        onChange={(e) =>
                          updateRow(
                            journalRows[0].id,
                            "keterangan",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {selectedTransactionType === "UTANG" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pilih Akun Utang
                      </label>
                      <Select
                        value={journalRows[0].accountId}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "accountId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih akun utang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((acc) =>
                              acc.accountName.toLowerCase().includes("utang")
                            )
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {getAccountDisplay(account.id)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Jenis Transaksi Utang
                      </label>
                      <Select
                        value={journalRows[0].utangType || ""}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "utangType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis utang..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTANG_BARU">
                            📈 Utang Baru
                          </SelectItem>
                          <SelectItem value="UTANG_DIBAYAR">
                            💰 Utang Dibayar
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Kategori Utang
                      </label>
                      <Select
                        value={journalRows[0].utangKategori || ""}
                        onValueChange={(value) =>
                          updateRow(journalRows[0].id, "utangKategori", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BAHAN_BAKU">
                            📦 Bahan Baku
                          </SelectItem>
                          <SelectItem value="BANK_HM">🏦 Bank HM</SelectItem>
                          <SelectItem value="BANK_HENRY">
                            🏦 Bank Henry
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nominal Utang
                      </label>
                      <Input
                        type="number"
                        placeholder="Rp 0"
                        value={journalRows[0].nominal}
                        onChange={(e) =>
                          updateRow(
                            journalRows[0].id,
                            "nominal",
                            e.target.value
                          )
                        }
                        className="mt-1"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Keterangan Utang
                      </label>
                      <Input
                        placeholder="Deskripsi transaksi utang"
                        value={journalRows[0].keterangan}
                        onChange={(e) =>
                          updateRow(
                            journalRows[0].id,
                            "keterangan",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Tombol Save untuk semua tab */}
                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={saveJournalEntries}
                    disabled={loading}
                    className={`${divisionStyle.bg} ${divisionStyle.hover} text-white`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan {selectedTransactionType}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : divisionType === "PEMASARAN" ? (
          <>
            {/* TAB MENU PEMASARAN */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-t font-semibold border-b-2 transition-all ${
                  selectedPemasaranTab === "LAPORAN_PRODUK"
                    ? "border-orange-600 text-orange-700 bg-white"
                    : "border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedPemasaranTab("LAPORAN_PRODUK")}
                type="button"
              >
                Laporan Produk
              </button>
            </div>

            {/* === FORM & TABEL LAPORAN PRODUK === */}
            {selectedPemasaranTab === "LAPORAN_PRODUK" && (
              <LaporanPenjualanWizard />
            )}
          </>
        ) : canAccessProduksi() ? (
          <>
            {/* === FORM KHUSUS PRODUKSI/BLENDING === */}
            <LaporanProduksiBlendingForm
              userDivision={user?.division!}
              onSuccess={() => {
                loadData();
                toastSuccess.custom("Laporan produksi berhasil disimpan!");
              }}
            />
          </>
        ) : (
          // ... existing code untuk divisi lain ...
          <>
            {/* === MULTIPLE ENTRIES FORM === */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Form Entri Multiple
                </CardTitle>
                <CardDescription>
                  Tambahkan beberapa entri sekaligus sebelum menyimpan. Klik
                  "Tambah Baris" untuk menambah entri baru.
                </CardDescription>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Entri Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Data Belum Lengkap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Akan Disimpan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">
                      Klik "Tambah Baris Entri" untuk menambah entri baru
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Multiple Entries List */}
                {journalRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="mb-6 p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-700">
                        Entri #{index + 1}
                      </h4>
                      {journalRows.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRow(row.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
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

                      {/* Tambah Salesperson Baru KHUSUS PEMASARAN */}
                      {divisionType === "PEMASARAN" && (
                        <div className="mb-2 flex flex-col gap-2">
                          <Label>Tambah Salesperson Baru</Label>
                          <Select
                            value={selectedPerusahaanForNewSales}
                            onValueChange={setSelectedPerusahaanForNewSales}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih perusahaan..." />
                            </SelectTrigger>
                            <SelectContent>
                              {perusahaanList.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nama salesperson baru"
                              value={newSalespersonName}
                              onChange={(e) =>
                                setNewSalespersonName(e.target.value)
                              }
                              disabled={!selectedPerusahaanForNewSales}
                            />
                            <Button
                              onClick={handleCreateSalesperson}
                              disabled={
                                !newSalespersonName.trim() ||
                                !selectedPerusahaanForNewSales
                              }
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Tambah
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Form detail muncul jika akun sudah dipilih */}
                    {row.accountId &&
                      renderSpecializedInput(
                        row,
                        getSelectedAccount(row.accountId)
                      )}
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    onClick={addNewRow}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Baris Entri
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
                        SAVE {journalRows.length} ENTRI {divisionType}
                      </>
                    )}
                  </Button>
                </div>

                {/* Summary of entries to be saved */}
                {journalRows.length > 1 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    {(() => {
                      const validRows = journalRows.filter((row) => {
                        const account = getSelectedAccount(row.accountId);
                        if (!account) return false;

                        // Validasi berdasarkan divisi
                        if (divisionType === "PEMASARAN") {
                          return (
                            row.salesUserId &&
                            (row.targetAmount ||
                              row.realisasiAmount ||
                              row.returPenjualan)
                          );
                        }
                        if (divisionType === "HRD") {
                          return (
                            row.attendanceStatus ||
                            row.absentCount ||
                            row.shift ||
                            row.keteranganKendala
                          );
                        }
                        if (divisionType === "PRODUKSI") {
                          return (
                            row.hasilProduksi ||
                            row.barangGagal ||
                            row.stockBarangJadi ||
                            row.hpBarangJadi ||
                            row.keteranganKendala
                          );
                        }
                        if (divisionType === "PERSEDIAAN_BAHAN_BAKU") {
                          return (
                            row.barangMasuk ||
                            row.pemakaian ||
                            row.stokAkhir ||
                            row.keteranganGudang
                          );
                        }
                        if (divisionType === "KEUANGAN") {
                          return (
                            row.accountId &&
                            row.nominal &&
                            Number.parseFloat(row.nominal) > 0
                          );
                        }

                        // Validasi default
                        return (
                          row.accountId &&
                          ((account.valueType === "NOMINAL" &&
                            row.nominal &&
                            Number.parseFloat(row.nominal) > 0) ||
                            (account.valueType === "KUANTITAS" &&
                              row.kuantitas &&
                              Number.parseFloat(row.kuantitas) > 0))
                        );
                      });

                      const invalidCount =
                        journalRows.length - validRows.length;

                      return (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-blue-800">
                              📝 <strong>Ringkasan:</strong> Akan menyimpan{" "}
                              {journalRows.length} entri sekaligus
                            </p>
                            <div className="flex gap-2">
                              <Badge
                                variant="outline"
                                className="text-green-700 bg-green-50 border-green-200"
                              >
                                ✅ {validRows.length} Valid
                              </Badge>
                              {invalidCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-red-700 bg-red-50 border-red-200"
                                >
                                  ⚠️ {invalidCount} Belum Lengkap
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Preview Entri */}
                          <div className="space-y-2">
                            {journalRows.map((row, index) => {
                              const account = getSelectedAccount(row.accountId);
                              const isValid = validRows.includes(row);

                              return (
                                <div
                                  key={row.id}
                                  className={`flex items-center gap-2 text-xs p-2 rounded border ${
                                    isValid
                                      ? "bg-green-50 border-green-200"
                                      : "bg-red-50 border-red-200"
                                  }`}
                                >
                                  <span
                                    className={`font-medium ${
                                      isValid
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    #{index + 1}
                                  </span>
                                  <span className="text-gray-800">
                                    {account
                                      ? `${account.accountCode} - ${account.accountName}`
                                      : "Akun belum dipilih"}
                                  </span>
                                  {/* Tampilkan absentCount untuk HRD */}
                                  {divisionType === "HRD" &&
                                    row.absentCount && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {row.absentCount} orang
                                      </Badge>
                                    )}
                                  {/* Tampilkan nominal untuk selain HRD */}
                                  {divisionType !== "HRD" && row.nominal && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {formatCurrency(Number(row.nominal))}
                                    </Badge>
                                  )}
                                  {row.kuantitas && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {row.kuantitas} unit
                                    </Badge>
                                  )}
                                  {row.transactionType && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {row.transactionType}
                                    </Badge>
                                  )}
                                  {!isValid && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-red-600 bg-red-100"
                                    >
                                      ⚠️ Data belum lengkap
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ✅ NEW: Summary untuk UTANG */}
        {divisionType === "KEUANGAN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-red-600">💳</span>
                Ringkasan Utang
              </CardTitle>
              <p className="text-sm text-gray-600">
                Rekap utang untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Utang Baru */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">🆕</span>
                    <h3 className="font-semibold text-red-800">Utang Baru</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (entry as any).transactionType === "UTANG_BARU"
                        )
                        .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                    )}
                  </p>
                </div>
                {/* Total Utang Dibayar */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <h3 className="font-semibold text-green-800">
                      Utang Dibayar
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (entry as any).transactionType === "UTANG_DIBAYAR"
                        )
                        .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                    )}
                  </p>
                </div>
                {/* Total Utang Bahan Baku */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">📦</span>
                    <h3 className="font-semibold text-orange-800">
                      Utang Bahan Baku
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (entry as any).transactionType === "UTANG_BARU" ||
                            (entry as any).transactionType === "UTANG_DIBAYAR"
                        )
                        .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                    )}
                  </p>
                </div>
                {/* Total Utang Bank */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">🏦</span>
                    <h3 className="font-semibold text-purple-800">
                      Utang Bank
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (entry as any).transactionType === "UTANG_BARU" ||
                            (entry as any).transactionType === "UTANG_DIBAYAR"
                        )
                        .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Ringkasan Kas */}
        {divisionType === "KEUANGAN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Ringkasan Kas Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Penerimaan */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">⬆️</span>
                    <h3 className="font-semibold text-green-800">
                      Total Penerimaan
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (
                              accounts.find((a) => a.id === entry.accountId)
                                ?.accountName || ""
                            )
                              .toLowerCase()
                              .includes("kas") &&
                            (entry as any).transactionType === "PENERIMAAN"
                        )
                        .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                    )}
                  </p>
                </div>
                {/* Total Pengeluaran */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">⬇️</span>
                    <h3 className="font-semibold text-red-800">
                      Total Pengeluaran
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (
                              accounts.find((a) => a.id === entry.accountId)
                                ?.accountName || ""
                            )
                              .toLowerCase()
                              .includes("kas") &&
                            (entry as any).transactionType === "PENGELUARAN"
                        )
                        .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                    )}
                  </p>
                </div>
                {/* Saldo Akhir */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">💰</span>
                    <h3 className="font-semibold text-blue-800">Saldo Akhir</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(
                      existingEntries
                        .filter(
                          (entry) =>
                            (
                              accounts.find((a) => a.id === entry.accountId)
                                ?.accountName || ""
                            )
                              .toLowerCase()
                              .includes("kas") &&
                            (entry as any).transactionType === "SALDO_AKHIR"
                        )
                        .reduce(
                          (sum, entry) =>
                            sum +
                            Number((entry as any).saldoAkhir || entry.nilai),
                          0
                        )
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Ringkasan Piutang */}
        {divisionType === "KEUANGAN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Ringkasan Piutang Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📈</span>
                    <h3 className="font-semibold text-blue-800">
                      Piutang Baru
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(piutangSummary.baru)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">💰</span>
                    <h3 className="font-semibold text-green-800">
                      Piutang Tertagih
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(piutangSummary.tertagih)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">❌</span>
                    <h3 className="font-semibold text-red-800">
                      Piutang Macet
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {formatCurrency(piutangSummary.macet)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">💵</span>
                    <h3 className="font-semibold text-purple-800">
                      Saldo Piutang
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {formatCurrency(piutangSummary.saldoAkhir)}
                  </p>
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
                  Belum ada entri hari ini, tambahkan entri hari ini (
                  {new Date().toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                  })}
                  )
                </h3>
                <p className="text-yellow-800 text-sm mt-2">
                  Belum ada entri di rak {user?.division?.name}. Silakan
                  tambahkan entri terlebih dahulu.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {divisionType === "PERSEDIAAN_BAHAN_BAKU" &&
          laporanGudang.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-green-600">📦</span>
                  Ringkasan Gudang Hari Ini
                </CardTitle>
                <CardDescription>
                  Kontrol stok awal, pemakaian, dan stok akhir gudang hari ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const summary = getGudangSummary();
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-semibold text-blue-800">
                          Total Stok Awal
                        </div>
                        <div className="text-2xl font-bold text-blue-900 mt-2">
                          {summary.totalStokAwal.toLocaleString()} Unit
                        </div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="font-semibold text-orange-800">
                          Total Pemakaian
                        </div>
                        <div className="text-2xl font-bold text-orange-900 mt-2">
                          {summary.totalPemakaian.toLocaleString()} Unit
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-semibold text-green-800">
                          Total Stok Akhir
                        </div>
                        <div className="text-2xl font-bold text-green-900 mt-2">
                          {summary.totalStokAkhir.toLocaleString()} Unit
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="font-semibold text-purple-800">
                          Jumlah Laporan
                        </div>
                        <div className="text-2xl font-bold text-purple-900 mt-2">
                          {summary.jumlahLaporan}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

        {/* ✅ NEW: Summary Card untuk HRD - Add this after the PRODUKSI summary card */}
        {divisionType === "HRD" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Ringkasan Kehadiran Karyawan -{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* ✅ FIXED: Total Karyawan dari absentCount */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Total Karyawan
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {(() => {
                      const summary = getHRDSummary();
                      return `${summary.totalKaryawan} orang`;
                    })()}
                  </p>
                </div>

                {/* Total Hadir */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-green-800">Hadir</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {(() => {
                      const summary = getHRDSummary();
                      return `${summary.hadirCount} orang`;
                    })()}
                  </p>
                </div>

                {/* Total Tidak Hadir */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-600" />
                    <h3 className="font-semibold text-red-800">Tidak Hadir</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {(() => {
                      const summary = getHRDSummary();
                      return `${
                        summary.tidakHadirCount +
                        summary.sakitCount +
                        summary.izinCount
                      } orang`;
                    })()}
                  </p>
                </div>

                {/* Tingkat Kehadiran */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">
                      Tingkat Kehadiran
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {(() => {
                      const summary = getHRDSummary();
                      return `${summary.attendanceRate.toFixed(1)}%`;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Only render journal table if NOT in PEMASARAN or PRODUKSI/BLENDING division */}
        {divisionType !== "PEMASARAN" &&
          !canAccessProduksi() &&
          renderJournalTable()}
        {renderSummaryCard()}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </ClientErrorBoundary>
  );
}
