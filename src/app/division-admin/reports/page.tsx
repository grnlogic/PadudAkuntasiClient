"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPiutangTransaksi, getUtangTransaksi } from "@/lib/data";
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
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { getEntriHarian, type EntriHarian } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getAccountsByDivision, type Account } from "@/lib/data";
import ClientErrorBoundary from "@/components/client-error-boundary";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast-utils";

export default function ReportsPage() {
  const [entries, setEntries] = useState<EntriHarian[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      generateReport();
    }
  }, [entries, accounts, reportType, selectedMonth]);

  const loadData = async () => {
    if (!user?.division?.id) {
      toastError.custom("Divisi pengguna tidak ditemukan");
      return;
    }

    setLoading(true);
    const loadingToast = toastInfo.loading("📊 Memuat data laporan...");

    try {
      console.log(
        "=== REPORTS: Loading data for division:",
        user.division.id,
        user.division.name
      );

      // Load accounts first
      const accountsData = await getAccountsByDivision(user.division.id);
      console.log("Loaded accounts:", accountsData.length, accountsData);
      setAccounts(accountsData);

      // Load ALL entries from backend
      const allEntries = await getEntriHarian();
      const allPiutang = await getPiutangTransaksi();
      const allUtang = await getUtangTransaksi();

      // Mapping piutang agar mirip entri harian
      const piutangAccount = accountsData.find((acc) =>
        acc.accountName.toLowerCase().includes("piutang")
      );

      const mappedPiutang = (allPiutang || []).map((p: any) => ({
        id: p.id,
        tanggal: p.tanggal_transaksi || p.tanggalTransaksi || "",
        accountId: piutangAccount ? piutangAccount.id : "PIUTANG",
        nilai: p.nominal,
        description: p.keterangan,
        transactionType: p.tipe_transaksi || p.tipeTransaksi || "",
        createdAt:
          p.created_at ||
          p.createdAt ||
          p.tanggal_transaksi ||
          p.tanggalTransaksi ||
          "",
        keterangan: p.keterangan,
        date: p.tanggal_transaksi || p.tanggalTransaksi || "",
        createdBy: p.user?.username || "system",
      }));

      // ✅ NEW: Mapping utang agar mirip entri harian
      const utangAccount = accountsData.find(
        (acc) =>
          acc.accountName.toLowerCase().includes("utang") ||
          acc.accountName.toLowerCase().includes("hutang")
      );

      const mappedUtang = (allUtang || []).map((u: any) => ({
        id: u.id,
        tanggal: u.tanggal_transaksi || u.tanggalTransaksi || "",
        accountId: utangAccount ? utangAccount.id : "UTANG",
        nilai: u.nominal,
        description: u.keterangan,
        transactionType: u.tipe_transaksi || u.tipeTransaksi || "",
        createdAt:
          u.created_at ||
          u.createdAt ||
          u.tanggal_transaksi ||
          u.tanggalTransaksi ||
          "",
        keterangan: u.keterangan,
        date: u.tanggal_transaksi || u.tanggalTransaksi || "",
        createdBy: u.user?.username || "system",
      }));

      // Gabungkan entri harian, piutang, dan utang
      const allCombinedEntries = [
        ...allEntries,
        ...mappedPiutang,
        ...mappedUtang,
      ];

      // Filter entries by current division's accounts
      const accountIds = accountsData.map((acc) => acc.id);
      console.log("Account IDs for division:", accountIds);

      const divisionEntries = allCombinedEntries.filter((entry) => {
        const belongs =
          accountIds.includes(entry.accountId) ||
          entry.accountId === "PIUTANG" ||
          entry.accountId === "UTANG";
        console.log(
          `Entry ${entry.id} (accountId: ${entry.accountId}) belongs to division:`,
          belongs
        );
        return belongs;
      });

      console.log("Division entries:", divisionEntries.length, divisionEntries);
      setEntries(divisionEntries);

      toastInfo.dismiss();
      toastSuccess.custom(`Data laporan ${divisionType} berhasil dimuat`);
    } catch (error) {
      toastInfo.dismiss();
      toastError.custom("Gagal memuat data laporan");
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Get division type for conditional rendering
  const getDivisionType = () => {
    const divisionName = user?.division?.name?.toLowerCase();
    if (divisionName?.includes("keuangan")) return "KEUANGAN";
    if (divisionName?.includes("produksi")) return "PRODUKSI";
    if (
      divisionName?.includes("pemasaran") ||
      divisionName?.includes("marketing")
    )
      return "PEMASARAN";
    if (
      divisionName?.includes("gudang") ||
      divisionName?.includes("warehouse") ||
      divisionName?.includes("PERSEDIAAN_BAHAN_BAKU")
    )
      return "GUDANG";
    if (
      divisionName?.includes("hrd") ||
      divisionName?.includes("sumber daya manusia")
    )
      return "HRD"; // ✅ ADD: HRD division detection
    return "GENERAL";
  };

  const divisionType = getDivisionType();

  const generateReport = () => {
    console.log("=== REPORTS: Generating report ===");
    console.log("Division type:", divisionType);
    console.log("Entries:", entries.length);
    console.log("Accounts:", accounts.length);
    console.log("Report type:", reportType);
    console.log("Selected month:", selectedMonth);

    // ✅ ENHANCED DEBUG: Log entries for pemasaran specifically
    if (divisionType === "PEMASARAN") {
      console.log("🎯 PEMASARAN DEBUG - All entries:", entries);
      console.log(
        "🎯 PEMASARAN DEBUG - Entries with marketing data:",
        entries.filter(
          (entry) =>
            (entry as any).targetAmount != null ||
            (entry as any).realisasiAmount != null
        )
      );
    }

    let filtered = [...entries];

    // Apply date filter
    if (reportType === "monthly") {
      console.log("Applying monthly filter for:", selectedMonth);
      filtered = entries.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        console.log(
          "Checking entry date:",
          entryDate,
          "against month:",
          selectedMonth
        );

        if (!entryDate) {
          console.log("Entry has no date, excluding");
          return false;
        }

        const belongs = entryDate.startsWith(selectedMonth);
        console.log(`Entry ${entry.id} belongs to ${selectedMonth}:`, belongs);
        return belongs;
      });
    } else if (reportType === "yearly") {
      const year = selectedMonth.split("-")[0];
      console.log("Applying yearly filter for:", year);
      filtered = entries.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        if (!entryDate) return false;
        const belongs = entryDate.startsWith(year);
        console.log(`Entry ${entry.id} belongs to year ${year}:`, belongs);
        return belongs;
      });
    }

    console.log("Filtered entries:", filtered.length, filtered);

    // ✅ ENHANCED DEBUG: Check filtered entries for pemasaran
    if (divisionType === "PEMASARAN") {
      console.log("🎯 PEMASARAN DEBUG - Filtered entries:", filtered);
      console.log(
        "🎯 PEMASARAN DEBUG - Filtered entries with marketing data:",
        filtered.filter(
          (entry) =>
            (entry as any).targetAmount != null ||
            (entry as any).realisasiAmount != null
        )
      );
    }

    // Initialize all accounts with zero values
    const grouped: { [key: string]: any } = {};
    accounts.forEach((account) => {
      const key = `${account.accountCode}-${account.accountName}`;

      // ✅ UPDATED: Initialize based on division type
      if (divisionType === "KEUANGAN") {
        grouped[key] = {
          accountCode: account.accountCode,
          accountName: account.accountName,
          penerimaan: 0,
          pengeluaran: 0,
          saldoBersih: 0,
          transactions: 0,
        };
      } else if (divisionType === "PRODUKSI") {
        grouped[key] = {
          accountCode: account.accountCode,
          accountName: account.accountName,
          totalProduksi: 0,
          totalHPP: 0,
          hppPerUnit: 0,
          transactions: 0,
        };
      } else if (divisionType === "PEMASARAN") {
        grouped[key] = {
          accountCode: account.accountCode,
          accountName: account.accountName,
          totalTarget: 0,
          totalRealisasi: 0,
          achievementRate: 0,
          transactions: 0,
        };
      } else if (divisionType === "GUDANG") {
        // ✅ FIXED: Use actual database fields
        grouped[key] = {
          accountCode: account.accountCode,
          accountName: account.accountName,
          totalPemakaian: 0,
          stokAwal: 0,
          stokAkhir: 0,
          transactions: 0,
        };
      } else if (divisionType === "HRD") {
        // ✅ NEW: HRD initialization
        grouped[key] = {
          accountCode: account.accountCode,
          accountName: account.accountName,
          totalKaryawan: 0,
          hadirCount: 0,
          tidakHadirCount: 0,
          overtimeHours: 0,
          attendanceRate: 0,
          transactions: 0,
        };
      } else {
        grouped[key] = {
          accountCode: account.accountCode,
          accountName: account.accountName,
          debet: 0,
          kredit: 0,
          transactions: 0,
        };
      }
    });

    console.log(
      "Initialized grouped structure for",
      divisionType,
      ":",
      grouped
    );

    // ✅ UPDATED: Process filtered entries based on division type
    filtered.forEach((entry, index) => {
      console.log(`Processing entry ${index + 1}:`, entry);

      const account = accounts.find((a) => a.id === entry.accountId);
      if (!account) {
        console.log(
          `Account not found for entry ${entry.id} with accountId ${entry.accountId}`
        );
        return;
      }

      console.log(`Found account for entry ${entry.id}:`, account);

      const key = `${account.accountCode}-${account.accountName}`;

      if (grouped[key]) {
        const nilai = Number(entry.nilai) || 0;

        // ✅ UPDATED: Process based on division type
        switch (divisionType) {
          case "KEUANGAN":
            const transactionType = (entry as any).transactionType;
            if (transactionType === "PENERIMAAN") {
              grouped[key].penerimaan += nilai;
            } else if (transactionType === "PENGELUARAN") {
              grouped[key].pengeluaran += nilai;
            }
            grouped[key].saldoBersih =
              grouped[key].penerimaan - grouped[key].pengeluaran;
            break;

          case "PRODUKSI":
            grouped[key].totalProduksi += nilai;
            const hppAmount = (entry as any).hppAmount || 0;
            grouped[key].totalHPP += Number(hppAmount);
            grouped[key].hppPerUnit =
              grouped[key].totalProduksi > 0
                ? grouped[key].totalHPP / grouped[key].totalProduksi
                : 0;
            break;

          case "PEMASARAN":
            const targetAmount = (entry as any).targetAmount || 0;
            const realisasiAmount = (entry as any).realisasiAmount || 0;

            // ✅ ENHANCED DEBUG: Log each pemasaran entry processing
            console.log(`🎯 PEMASARAN - Processing entry ${entry.id}:`, {
              targetAmount,
              realisasiAmount,
              accountKey: key,
              currentTotals: {
                target: grouped[key].totalTarget,
                realisasi: grouped[key].totalRealisasi,
              },
            });

            grouped[key].totalTarget += Number(targetAmount);
            grouped[key].totalRealisasi += Number(realisasiAmount);
            grouped[key].achievementRate =
              grouped[key].totalTarget > 0
                ? (grouped[key].totalRealisasi / grouped[key].totalTarget) * 100
                : 0;

            console.log(
              `🎯 PEMASARAN - Updated ${key}: target=${grouped[key].totalTarget}, realisasi=${grouped[key].totalRealisasi}, achievement=${grouped[key].achievementRate}%`
            );
            break;

          case "GUDANG":
            const pemakaianAmount = (entry as any).pemakaianAmount || 0;
            const stokAkhir = (entry as any).stokAkhir || 0;

            grouped[key].totalPemakaian += Number(pemakaianAmount);

            // ✅ FIXED: Track stok properly
            if (Number(stokAkhir) > 0) {
              grouped[key].stokAkhir = Number(stokAkhir); // Keep latest stock level
            }

            // ✅ NEW: Calculate stok awal from previous entries (simplified)
            // In real scenario, this should come from previous day's stok akhir
            if (grouped[key].stokAwal === 0 && Number(stokAkhir) > 0) {
              grouped[key].stokAwal =
                Number(stokAkhir) + Number(pemakaianAmount);
            }

            console.log(
              `GUDANG - Updated ${key}: pemakaian=${grouped[key].totalPemakaian}, stokAwal=${grouped[key].stokAwal}, stokAkhir=${grouped[key].stokAkhir}`
            );
            break;

          // ✅ NEW: HRD processing
          case "HRD":
            const attendanceStatus = (entry as any).attendanceStatus;
            const overtimeHours = (entry as any).overtimeHours || 0;

            grouped[key].totalKaryawan += 1;

            if (attendanceStatus === "HADIR") {
              grouped[key].hadirCount += 1;
            } else if (
              attendanceStatus === "TIDAK_HADIR" ||
              attendanceStatus === "SAKIT" ||
              attendanceStatus === "IZIN"
            ) {
              grouped[key].tidakHadirCount += 1;
            }

            grouped[key].overtimeHours += Number(overtimeHours);

            // Calculate attendance rate
            if (grouped[key].totalKaryawan > 0) {
              grouped[key].attendanceRate =
                (grouped[key].hadirCount / grouped[key].totalKaryawan) * 100;
            }

            console.log(
              `HRD - Updated ${key}: total=${grouped[key].totalKaryawan}, hadir=${grouped[key].hadirCount}, rate=${grouped[key].attendanceRate}%`
            );
            break;

          default:
            // GENERAL - use existing debet/kredit logic
            grouped[key].debet += nilai;
            console.log(
              `GENERAL - Updated ${key}: debet=${grouped[key].debet}`
            );
        }

        grouped[key].transactions += 1;
      } else {
        console.log(`Group ${key} not found in initialized structure`);
      }
    });

    const reportArray = Object.values(grouped);
    console.log("Final report data for", divisionType, ":", reportArray);

    // ✅ ENHANCED DEBUG: Final check for pemasaran
    if (divisionType === "PEMASARAN") {
      console.log("🎯 PEMASARAN DEBUG - Final report array:", reportArray);
      console.log(
        "🎯 PEMASARAN DEBUG - Report entries with data:",
        reportArray.filter(
          (item) =>
            item.totalTarget > 0 ||
            item.totalRealisasi > 0 ||
            item.transactions > 0
        )
      );
    }

    setReportData(reportArray);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ UPDATED: Division-specific totals
  type ReportItem = (typeof reportData)[number];
  const getDivisionTotals = () => {
    switch (divisionType) {
      case "KEUANGAN":
        return {
          total1: {
            label: "Total Penerimaan",
            value: reportData.reduce(
              (sum, item: ReportItem) => sum + (item.penerimaan || 0),
              0
            ),
            format: "currency",
          },
          total2: {
            label: "Total Pengeluaran",
            value: reportData.reduce(
              (sum, item: ReportItem) => sum + (item.pengeluaran || 0),
              0
            ),
            format: "currency",
          },
          total3: {
            label: "Saldo Bersih",
            value: reportData.reduce(
              (sum, item: ReportItem) => sum + (item.saldoBersih || 0),
              0
            ),
            format: "currency",
          },
        };

      case "PRODUKSI":
        return {
          total1: {
            label: "Total Produksi",
            value: reportData.reduce(
              (sum, item) => sum + (item.totalProduksi || 0),
              0
            ),
            format: "unit",
          },
          total2: {
            label: "Total HPP",
            value: reportData.reduce(
              (sum, item) => sum + (item.totalHPP || 0),
              0
            ),
            format: "currency",
          },
          total3: {
            label: "Rata-rata HPP/Unit",
            value:
              reportData.length > 0
                ? reportData.reduce(
                    (sum, item) => sum + (item.hppPerUnit || 0),
                    0
                  ) / reportData.length
                : 0,
            format: "currency",
          },
        };

      case "PEMASARAN":
        return {
          total1: {
            label: "Total Target",
            value: reportData.reduce(
              (sum, item) => sum + (item.totalTarget || 0),
              0
            ),
            format: "currency",
          },
          total2: {
            label: "Total Realisasi",
            value: reportData.reduce(
              (sum, item) => sum + (item.totalRealisasi || 0),
              0
            ),
            format: "currency",
          },
          total3: {
            label: "Rata-rata Achievement",
            value:
              reportData.length > 0
                ? reportData.reduce(
                    (sum, item) => sum + (item.achievementRate || 0),
                    0
                  ) / reportData.length
                : 0,
            format: "percentage",
          },
        };

      case "GUDANG":
        return {
          total1: {
            label: "Total Pemakaian",
            value: reportData.reduce(
              (sum, item) => sum + (item.totalPemakaian || 0),
              0
            ),
            format: "unit",
          },
          total2: {
            label: "Item dengan Stok",
            value: reportData.filter((item) => (item.stokAkhir || 0) > 0)
              .length,
            format: "number",
          },
          total3: {
            label: "Item Stok Rendah",
            value: reportData.filter((item) => (item.stokAkhir || 0) < 100)
              .length,
            format: "number",
          },
        };

      // ✅ NEW: HRD totals
      case "HRD":
        const totalKaryawan = reportData.reduce(
          (sum, item) => sum + (item.totalKaryawan || 0),
          0
        );
        const totalHadir = reportData.reduce(
          (sum, item) => sum + (item.hadirCount || 0),
          0
        );
        const overallAttendanceRate =
          totalKaryawan > 0 ? (totalHadir / totalKaryawan) * 100 : 0;

        return {
          total1: {
            label: "Total Karyawan",
            value: totalKaryawan,
            format: "number",
          },
          total2: {
            label: "Total Kehadiran",
            value: totalHadir,
            format: "number",
          },
          total3: {
            label: "Rata-rata Kehadiran",
            value: overallAttendanceRate,
            format: "percentage",
          },
        };

      default:
        return {
          total1: {
            label: "Total Debet",
            value: reportData.reduce((sum, item) => sum + (item.debet || 0), 0),
            format: "currency",
          },
          total2: {
            label: "Total Kredit",
            value: reportData.reduce(
              (sum, item) => sum + (item.kredit || 0),
              0
            ),
            format: "currency",
          },
          total3: {
            label: "Selisih",
            value: Math.abs(
              reportData.reduce((sum, item) => sum + (item.debet || 0), 0) -
                reportData.reduce((sum, item) => sum + (item.kredit || 0), 0)
            ),
            format: "currency",
          },
        };
    }
  };

  const totals = getDivisionTotals();

  // ✅ NEW: Format value based on type
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "unit":
        return `${value.toLocaleString("id-ID")} unit`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getTotalDebet = () => {
    return reportData.reduce((sum, item) => sum + item.debet, 0);
  };

  const getTotalKredit = () => {
    return reportData.reduce((sum, item) => sum + item.kredit, 0);
  };

  const getTotalTransactions = () => {
    return reportData.reduce((sum, item) => sum + item.transactions, 0);
  };

  const handleGenerateReport = () => {
    console.log("Manual generate report clicked");
    generateReport();
  };

  const handleRefreshData = async () => {
    console.log("Refresh data clicked");
    await loadData();
  };

  const exportReport = () => {
    try {
      let headers: string[] = [];
      let rows: any[][] = [];
      switch (divisionType) {
        case "KEUANGAN":
          headers = [
            "Kode Akun",
            "Nama Akun",
            "Penerimaan",
            "Pengeluaran",
            "Saldo Bersih",
            "Jumlah Transaksi",
          ];
          rows = reportData.map((item) => [
            item.accountCode,
            item.accountName,
            item.penerimaan,
            item.pengeluaran,
            item.saldoBersih,
            item.transactions,
          ]);
          break;
        case "PRODUKSI":
          headers = [
            "Kode Akun",
            "Nama Akun",
            "Total Produksi",
            "Total HPP",
            "HPP/Unit",
            "Jumlah Transaksi",
          ];
          rows = reportData.map((item) => [
            item.accountCode,
            item.accountName,
            item.totalProduksi,
            item.totalHPP,
            item.hppPerUnit,
            item.transactions,
          ]);
          break;
        case "PEMASARAN":
          headers = [
            "Kode Akun",
            "Nama Akun",
            "Total Target",
            "Total Realisasi",
            "Achievement Rate (%)",
            "Jumlah Transaksi",
          ];
          rows = reportData.map((item) => [
            item.accountCode,
            item.accountName,
            item.totalTarget,
            item.totalRealisasi,
            item.achievementRate,
            item.transactions,
          ]);
          break;
        case "GUDANG":
          headers = [
            "Kode Akun",
            "Nama Akun",
            "Total Pemakaian",
            "Stok Awal",
            "Stok Akhir",
            "Jumlah Transaksi",
          ];
          rows = reportData.map((item) => [
            item.accountCode,
            item.accountName,
            item.totalPemakaian,
            item.stokAwal,
            item.stokAkhir,
            item.transactions,
          ]);
          break;
        case "HRD":
          headers = [
            "Kode Akun",
            "Nama Akun",
            "Total Karyawan",
            "Hadir",
            "Total Orang",
            "Overtime",
            "Attendance Rate (%)",
            "Jumlah Transaksi",
          ];
          rows = reportData.map((item) => [
            item.accountCode,
            item.accountName,
            item.totalKaryawan,
            item.hadirCount,
            item.tidakHadirCount,
            item.overtimeHours,
            item.attendanceRate,
            item.transactions,
          ]);
          break;
        default:
          headers = [
            "Kode Akun",
            "Nama Akun",
            "Total Debet",
            "Total Kredit",
            "Selisih",
            "Jumlah Transaksi",
          ];
          rows = reportData.map((item) => [
            item.accountCode,
            item.accountName,
            item.debet,
            item.kredit,
            (item.debet || 0) - (item.kredit || 0),
            item.transactions,
          ]);
      }
      const csvContent = [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-${user?.division?.name}-${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastSuccess.custom(
        `📄 Laporan ${user?.division?.name} berhasil diexport`
      );
    } catch (error) {
      toastError.custom("Gagal mengexport laporan");
    }
  };

  // ✅ Tambahkan fungsi untuk summary piutang
  const getPiutangSummary = () => {
    const totalPiutangBaru = entries
      .filter((entry) => (entry as any).transactionType === "PIUTANG_BARU")
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    const totalPiutangTertagih = entries
      .filter((entry) => (entry as any).transactionType === "PIUTANG_TERTAGIH")
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    const totalPiutangMacet = entries
      .filter((entry) => (entry as any).transactionType === "PIUTANG_MACET")
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    const totalSaldoAkhirPiutang = entries
      .filter((entry) => (entry as any).transactionType === "SALDO_AKHIR")
      .reduce(
        (sum, entry) => sum + Number((entry as any).saldoAkhir || entry.nilai),
        0
      );
    return {
      totalPiutangBaru,
      totalPiutangTertagih,
      totalPiutangMacet,
      totalSaldoAkhirPiutang,
    };
  };
  const piutangSummary = getPiutangSummary();

  // ✅ NEW: Tambahkan fungsi untuk summary utang
  const getUtangSummary = () => {
    const totalUtangBaru = entries
      .filter((entry) => (entry as any).transactionType === "UTANG_BARU")
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    const totalUtangDibayar = entries
      .filter((entry) => (entry as any).transactionType === "UTANG_DIBAYAR")
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    const totalBahanBaku = entries
      .filter((entry) => (entry as any).kategori === "BAHAN_BAKU")
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    const totalBank = entries
      .filter(
        (entry) =>
          (entry as any).kategori === "BANK_HM" ||
          (entry as any).kategori === "BANK_HENRY"
      )
      .reduce((sum, entry) => sum + Number(entry.nilai), 0);
    return {
      totalUtangBaru,
      totalUtangDibayar,
      totalBahanBaku,
      totalBank,
    };
  };
  const utangSummary = getUtangSummary();

  return (
    <ClientErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Laporan {divisionType === "GENERAL" ? "Keuangan" : divisionType}
            </h1>
            <p className="text-gray-600 mt-2">
              Laporan transaksi {user?.division?.name}
            </p>
          </div>
          <div className="flex gap-2">
            {/* ✅ Update refresh button with loading state */}
            <Button
              onClick={handleRefreshData}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Memuat..." : "Refresh Data"}
            </Button>
            <Button
              onClick={exportReport}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Report Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Jenis Laporan</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="yearly">Tahunan</SelectItem>
                    <SelectItem value="all">Semua Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === "monthly" && (
                <div>
                  <label className="text-sm font-medium">Bulan</label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex items-end">
                <Button
                  onClick={handleGenerateReport}
                  variant="outline"
                  className="w-full"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Generate Laporan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transaksi</p>
                  <p className="text-2xl font-bold">{getTotalTransactions()}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{totals.total1.label}</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatValue(totals.total1.value, totals.total1.format)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{totals.total2.label}</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatValue(totals.total2.value, totals.total2.format)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{totals.total3.label}</p>
                  <p
                    className={`text-xl font-bold ${
                      totals.total3.value >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatValue(totals.total3.value, totals.total3.format)}
                  </p>
                </div>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    totals.total3.value >= 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {totals.total3.value >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tambahkan info penjelas di bawah summary utama */}
        {divisionType === "KEUANGAN" && (
          <div className="mt-2 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded px-4 py-2 text-xs text-blue-800">
              <strong>Info:</strong> Total Penerimaan, Pengeluaran, dan Saldo
              Bersih <b>tidak termasuk transaksi Piutang maupun Utang</b>. Lihat
              rekap Piutang dan Utang di bagian bawah.
            </div>
          </div>
        )}

        {/* Tambahkan summary piutang khusus untuk KEUANGAN */}
        {divisionType === "KEUANGAN" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-blue-600 font-semibold mb-1">
                      Piutang Baru
                    </span>
                    <span className="text-2xl font-bold text-blue-800">
                      {formatCurrency(piutangSummary.totalPiutangBaru)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-green-600 font-semibold mb-1">
                      Piutang Tertagih
                    </span>
                    <span className="text-2xl font-bold text-green-800">
                      {formatCurrency(piutangSummary.totalPiutangTertagih)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-orange-600 font-semibold mb-1">
                      Piutang Macet
                    </span>
                    <span className="text-2xl font-bold text-orange-800">
                      {formatCurrency(piutangSummary.totalPiutangMacet)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-purple-600 font-semibold mb-1">
                      Saldo Akhir Piutang
                    </span>
                    <span className="text-2xl font-bold text-purple-800">
                      {formatCurrency(piutangSummary.totalSaldoAkhirPiutang)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabel rekap piutang per COA */}
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2 text-gray-700">
                Rekap Piutang per COA
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border rounded">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Kode Akun</th>
                      <th className="px-2 py-1 text-left">Nama Akun</th>
                      <th className="px-2 py-1 text-blue-800">Piutang Baru</th>
                      <th className="px-2 py-1 text-green-800">
                        Piutang Tertagih
                      </th>
                      <th className="px-2 py-1 text-orange-800">
                        Piutang Macet
                      </th>
                      <th className="px-2 py-1 text-purple-800">
                        Saldo Akhir Piutang
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => {
                      // Hitung total piutang per COA
                      const piutangBaru = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).transactionType === "PIUTANG_BARU"
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      const piutangTertagih = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).transactionType === "PIUTANG_TERTAGIH"
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      const piutangMacet = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).transactionType === "PIUTANG_MACET"
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      const saldoAkhir = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).transactionType === "SALDO_AKHIR"
                        )
                        .reduce(
                          (sum, e) =>
                            sum + Number((e as any).saldoAkhir || e.nilai),
                          0
                        );
                      // Tampilkan hanya jika ada salah satu nilai piutang
                      if (
                        piutangBaru === 0 &&
                        piutangTertagih === 0 &&
                        piutangMacet === 0 &&
                        saldoAkhir === 0
                      )
                        return null;
                      return (
                        <tr key={acc.id} className="border-b">
                          <td className="px-2 py-1 font-mono text-blue-900">
                            {acc.accountCode}
                          </td>
                          <td className="px-2 py-1 font-medium text-gray-900">
                            {acc.accountName}
                          </td>
                          <td className="px-2 py-1 text-blue-800 font-semibold">
                            {formatCurrency(piutangBaru)}
                          </td>
                          <td className="px-2 py-1 text-green-800 font-semibold">
                            {formatCurrency(piutangTertagih)}
                          </td>
                          <td className="px-2 py-1 text-orange-800 font-semibold">
                            {formatCurrency(piutangMacet)}
                          </td>
                          <td className="px-2 py-1 text-purple-800 font-semibold">
                            {formatCurrency(saldoAkhir)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tambahkan summary utang khusus untuk KEUANGAN */}
        {divisionType === "KEUANGAN" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-red-600 font-semibold mb-1">
                      Utang Baru
                    </span>
                    <span className="text-2xl font-bold text-red-800">
                      {formatCurrency(utangSummary.totalUtangBaru)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-green-600 font-semibold mb-1">
                      Utang Dibayar
                    </span>
                    <span className="text-2xl font-bold text-green-800">
                      {formatCurrency(utangSummary.totalUtangDibayar)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-orange-600 font-semibold mb-1">
                      Bahan Baku
                    </span>
                    <span className="text-2xl font-bold text-orange-800">
                      {formatCurrency(utangSummary.totalBahanBaku)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-purple-600 font-semibold mb-1">
                      Bank (HM + Henry)
                    </span>
                    <span className="text-2xl font-bold text-purple-800">
                      {formatCurrency(utangSummary.totalBank)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabel rekap utang per COA */}
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2 text-gray-700">
                Rekap Utang per COA
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border rounded">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Kode Akun</th>
                      <th className="px-2 py-1 text-left">Nama Akun</th>
                      <th className="px-2 py-1 text-red-800">Utang Baru</th>
                      <th className="px-2 py-1 text-green-800">
                        Utang Dibayar
                      </th>
                      <th className="px-2 py-1 text-orange-800">Bahan Baku</th>
                      <th className="px-2 py-1 text-purple-800">
                        Bank (HM + Henry)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => {
                      // Hitung total utang per COA
                      const utangBaru = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).transactionType === "UTANG_BARU"
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      const utangDibayar = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).transactionType === "UTANG_DIBAYAR"
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      const bahanBaku = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            (e as any).kategori === "BAHAN_BAKU"
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      const bank = entries
                        .filter(
                          (e) =>
                            e.accountId === acc.id &&
                            ((e as any).kategori === "BANK_HM" ||
                              (e as any).kategori === "BANK_HENRY")
                        )
                        .reduce((sum, e) => sum + Number(e.nilai), 0);
                      // Tampilkan hanya jika ada salah satu nilai utang
                      if (
                        utangBaru === 0 &&
                        utangDibayar === 0 &&
                        bahanBaku === 0 &&
                        bank === 0
                      )
                        return null;
                      return (
                        <tr key={acc.id} className="border-b">
                          <td className="px-2 py-1 font-mono text-red-900">
                            {acc.accountCode}
                          </td>
                          <td className="px-2 py-1 font-medium text-gray-900">
                            {acc.accountName}
                          </td>
                          <td className="px-2 py-1 text-red-800 font-semibold">
                            {formatCurrency(utangBaru)}
                          </td>
                          <td className="px-2 py-1 text-green-800 font-semibold">
                            {formatCurrency(utangDibayar)}
                          </td>
                          <td className="px-2 py-1 text-orange-800 font-semibold">
                            {formatCurrency(bahanBaku)}
                          </td>
                          <td className="px-2 py-1 text-purple-800 font-semibold">
                            {formatCurrency(bank)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>Laporan Per Akun - {divisionType}</CardTitle>
            <CardDescription>
              Ringkasan transaksi berdasarkan akun untuk periode{" "}
              {reportType === "monthly" ? selectedMonth : "semua data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Akun</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    {/* ✅ CONDITIONAL: Different columns based on division */}
                    {divisionType === "KEUANGAN" ? (
                      <>
                        <TableHead>Total Penerimaan</TableHead>
                        <TableHead>Total Pengeluaran</TableHead>
                        <TableHead>Saldo Bersih</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                      </>
                    ) : divisionType === "PRODUKSI" ? (
                      <>
                        <TableHead>Total Produksi</TableHead>
                        <TableHead>Total HPP</TableHead>
                        <TableHead>HPP per Unit</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                      </>
                    ) : divisionType === "PEMASARAN" ? (
                      <>
                        <TableHead>Total Target</TableHead>
                        <TableHead>Total Realisasi</TableHead>
                        <TableHead>Achievement Rate</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                      </>
                    ) : divisionType === "GUDANG" ? (
                      <>
                        <TableHead>Total Pemakaian</TableHead>
                        <TableHead>Stok Awal</TableHead>
                        <TableHead>Stok Akhir</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                      </>
                    ) : divisionType === "HRD" ? (
                      <>
                        <TableHead>Total Karyawan</TableHead>
                        <TableHead>Kehadiran</TableHead>
                        <TableHead>Tingkat Kehadiran</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Total Debet</TableHead>
                        <TableHead>Total Kredit</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.length > 0 ? (
                    reportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {item.accountCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.accountName}
                        </TableCell>

                        {/* ✅ CONDITIONAL: Different data based on division */}
                        {divisionType === "KEUANGAN" ? (
                          <>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(item.penerimaan || 0)}
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {formatCurrency(item.pengeluaran || 0)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${
                                  (item.saldoBersih || 0) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(
                                  Math.abs(item.saldoBersih || 0)
                                )}
                              </span>
                              <Badge
                                variant="outline"
                                className={`ml-2 ${
                                  (item.saldoBersih || 0) >= 0
                                    ? "border-green-200 text-green-700"
                                    : "border-red-200 text-red-700"
                                }`}
                              >
                                {(item.saldoBersih || 0) >= 0
                                  ? "Surplus"
                                  : "Defisit"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.transactions}</TableCell>
                          </>
                        ) : divisionType === "PRODUKSI" ? (
                          <>
                            <TableCell className="text-blue-600 font-medium">
                              {(item.totalProduksi || 0).toLocaleString(
                                "id-ID"
                              )}{" "}
                              unit
                            </TableCell>
                            <TableCell className="text-orange-600 font-medium">
                              {formatCurrency(item.totalHPP || 0)}
                            </TableCell>
                            <TableCell className="text-purple-600 font-medium">
                              {formatCurrency(item.hppPerUnit || 0)}
                            </TableCell>
                            <TableCell>{item.transactions}</TableCell>
                          </>
                        ) : divisionType === "PEMASARAN" ? (
                          <>
                            <TableCell className="text-blue-600 font-medium">
                              {formatCurrency(item.totalTarget || 0)}
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(item.totalRealisasi || 0)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${
                                  (item.achievementRate || 0) >= 100
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {(item.achievementRate || 0).toFixed(1)}%
                              </span>
                              <Badge
                                variant="outline"
                                className={`ml-2 ${
                                  (item.achievementRate || 0) >= 100
                                    ? "border-green-200 text-green-700"
                                    : "border-orange-200 text-orange-700"
                                }`}
                              >
                                {(item.achievementRate || 0) >= 100
                                  ? "Tercapai"
                                  : "Belum"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.transactions}</TableCell>
                          </>
                        ) : divisionType === "GUDANG" ? (
                          <>
                            <TableCell className="text-orange-600 font-medium">
                              {(item.totalPemakaian || 0).toLocaleString(
                                "id-ID"
                              )}{" "}
                              unit
                            </TableCell>
                            <TableCell className="text-blue-600 font-medium">
                              {(item.stokAwal || 0).toLocaleString("id-ID")}{" "}
                              unit
                            </TableCell>
                            <TableCell className="text-purple-600 font-medium">
                              <div className="flex items-center gap-2">
                                <span>
                                  {(item.stokAkhir || 0).toLocaleString(
                                    "id-ID"
                                  )}{" "}
                                  unit
                                </span>
                                {/* ✅ Status indicator */}
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    (item.stokAkhir || 0) >= 100
                                      ? "border-green-200 text-green-700 bg-green-50"
                                      : (item.stokAkhir || 0) >= 50
                                      ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                      : "border-red-200 text-red-700 bg-red-50"
                                  }`}
                                >
                                  {(item.stokAkhir || 0) >= 100
                                    ? "Aman"
                                    : (item.stokAkhir || 0) >= 50
                                    ? "Perhatian"
                                    : "Rendah"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{item.transactions}</TableCell>
                          </>
                        ) : divisionType === "HRD" ? (
                          <>
                            <TableCell className="text-blue-600 font-medium">
                              {item.totalKaryawan || 0} orang
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              <div className="space-y-1">
                                <div>Hadir: {item.hadirCount || 0} orang</div>
                                <div className="text-red-600 text-xs">
                                  Total Orang: {item.tidakHadirCount || 0} orang
                                </div>
                                <div className="text-purple-600 text-xs">
                                  Lembur: {item.overtimeHours || 0} jam
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${
                                  (item.attendanceRate || 0) >= 90
                                    ? "text-green-600"
                                    : (item.attendanceRate || 0) >= 80
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(item.attendanceRate || 0).toFixed(1)}%
                              </span>
                              <Badge
                                variant="outline"
                                className={`ml-2 ${
                                  (item.attendanceRate || 0) >= 90
                                    ? "border-green-200 text-green-700 bg-green-50"
                                    : (item.attendanceRate || 0) >= 80
                                    ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                    : "border-red-200 text-red-700 bg-red-50"
                                }`}
                              >
                                {(item.attendanceRate || 0) >= 90
                                  ? "Excellent"
                                  : (item.attendanceRate || 0) >= 80
                                  ? "Good"
                                  : "Poor"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.transactions}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(item.debet || 0)}
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {formatCurrency(item.kredit || 0)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${
                                  (item.debet || 0) >= (item.kredit || 0)
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(
                                  Math.abs(
                                    (item.debet || 0) - (item.kredit || 0)
                                  )
                                )}
                              </span>
                              <Badge
                                variant="outline"
                                className={`ml-2 ${
                                  (item.debet || 0) >= (item.kredit || 0)
                                    ? "border-green-200 text-green-700"
                                    : "border-red-200 text-red-700"
                                }`}
                              >
                                {(item.debet || 0) >= (item.kredit || 0)
                                  ? "Debet"
                                  : "Kredit"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.transactions}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={divisionType === "GENERAL" ? 6 : 6}
                        className="text-center py-8 text-gray-500"
                      >
                        {loading
                          ? "Loading data..."
                          : entries.length === 0
                          ? "Belum ada transaksi yang tercatat untuk divisi ini"
                          : "Tidak ada data untuk periode yang dipilih. Periksa debug info di atas."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientErrorBoundary>
  );
}
