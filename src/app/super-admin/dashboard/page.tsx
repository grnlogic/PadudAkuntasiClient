"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  TrendingUp,
  Eye,
  Filter,
  Calendar,
  Bell,
  X,
} from "lucide-react";
import {
  getAccounts,
  getUsers,
  getEntriHarian,
  getPiutangTransaksi,
  getUtangTransaksi,
  getLaporanGudang,
  getLaporanPenjualanProduk,
  getLaporanProduksi,
} from "@/lib/data";
import { notificationAPI } from "@/lib/api";
import ModernNotificationBell from "@/components/modern-notification-bell";
import { Input } from "@/components/ui/input";
import { toastSuccess, toastError } from "@/lib/toast-utils";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeUsers: 0,
    todayTransactions: 0,
    totalDivisions: 0,
  });

  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("all");
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState("2025-06-19"); // Tanggal awal
  const [endDate, setEndDate] = useState(todayStr); // Tanggal akhir default: hari ini

  // Separate state for applied filters
  const [appliedStartDate, setAppliedStartDate] = useState("2025-06-19");
  const [appliedEndDate, setAppliedEndDate] = useState(todayStr);
  const [appliedDivision, setAppliedDivision] = useState("all");

  useEffect(() => {
    loadMonitoringData();
  }, [appliedStartDate, appliedEndDate, appliedDivision]);

  const loadMonitoringData = async () => {
    try {
      console.log("=== SUPER ADMIN: Loading monitoring data ===");
      console.log("Applied filters:", {
        appliedStartDate,
        appliedEndDate,
        appliedDivision,
      });

      const accounts = await getAccounts();
      const users = await getUsers();

      // ✅ ENHANCED: Load data from ALL sources
      const entries = await getEntriHarian();
      const piutangData = await getPiutangTransaksi();
      const utangData = await getUtangTransaksi();
      const laporanGudangData = await getLaporanGudang();
      const laporanPenjualanProdukData = await getLaporanPenjualanProduk();
      const laporanProduksiData = await getLaporanProduksi();

      console.log("Raw accounts data:", accounts);
      console.log("Raw users data:", users);
      console.log("Raw entries data:", entries);
      console.log("Raw piutang data:", piutangData);
      console.log("Raw utang data:", utangData);
      console.log("Raw laporan gudang data:", laporanGudangData);
      console.log(
        "Raw laporan penjualan produk data:",
        laporanPenjualanProdukData
      );
      console.log("Raw laporan produksi data:", laporanProduksiData);

      setAccounts(accounts);

      // Calculate stats
      const divisions = [
        ...new Set(users.map((u) => u.division?.id).filter(Boolean)),
      ];

      // ✅ ENHANCED: Combine all data sources for comprehensive monitoring
      const allDataSources = [
        // Entri Harian (existing)
        ...entries.map((entry) => ({
          ...entry,
          source: "entri_harian",
          originalData: entry,
        })),

        // Piutang Transaksi
        ...(piutangData || []).map((piutang) => ({
          id: `piutang-${piutang.id}`,
          accountId: piutang.account?.id?.toString() || "PIUTANG",
          tanggal: piutang.tanggalTransaksi || piutang.tanggal_transaksi || "",
          date: piutang.tanggalTransaksi || piutang.tanggal_transaksi || "",
          nilai: Number(piutang.nominal) || 0,
          description: piutang.keterangan || "Transaksi Piutang",
          createdBy: piutang.user?.username || "system",
          createdAt:
            piutang.createdAt || piutang.created_at || new Date().toISOString(),
          transactionType:
            piutang.tipeTransaksi || piutang.tipe_transaksi || "PIUTANG",
          source: "piutang_transaksi",
          originalData: piutang,
        })),

        // Utang Transaksi
        ...(utangData || []).map((utang) => ({
          id: `utang-${utang.id}`,
          accountId: utang.account?.id?.toString() || "UTANG",
          tanggal: utang.tanggalTransaksi || utang.tanggal_transaksi || "",
          date: utang.tanggalTransaksi || utang.tanggal_transaksi || "",
          nilai: Number(utang.nominal) || 0,
          description: utang.keterangan || "Transaksi Utang",
          createdBy: utang.user?.username || "system",
          createdAt:
            utang.createdAt || utang.created_at || new Date().toISOString(),
          transactionType:
            utang.tipeTransaksi || utang.tipe_transaksi || "UTANG",
          source: "utang_transaksi",
          originalData: utang,
        })),

        // Laporan Gudang
        ...(laporanGudangData || []).map((gudang) => ({
          id: `gudang-${gudang.id}`,
          accountId: gudang.account?.id?.toString() || "GUDANG",
          tanggal: gudang.tanggalLaporan || "",
          date: gudang.tanggalLaporan || "",
          nilai: Number(gudang.stokAkhir || 0),
          description: gudang.keterangan || "Laporan Gudang",
          createdBy: gudang.createdBy?.username || "system",
          createdAt: gudang.createdAt || new Date().toISOString(),
          transactionType: "GUDANG",
          stokAwal: gudang.barangMasuk,
          pemakaian: gudang.pemakaian,
          stokAkhir: gudang.stokAkhir,
          kondisiGudang: gudang.keterangan,
          source: "laporan_gudang_harian",
          originalData: gudang,
        })),

        // Laporan Penjualan Produk
        ...(laporanPenjualanProdukData || []).map((penjualan) => ({
          id: `penjualan-${penjualan?.id || "unknown"}`,
          accountId: penjualan?.productAccountId?.toString() || "PENJUALAN",
          tanggal: penjualan?.tanggalLaporan || "",
          date: penjualan?.tanggalLaporan || "",
          nilai: Number(penjualan?.realisasiKuantitas || 0),
          description: `Penjualan ${penjualan?.namaAccount || "Unknown"} - ${
            penjualan?.namaSalesperson || "Unknown"
          }`,
          createdBy: penjualan?.createdByUsername || "system",
          createdAt: penjualan?.createdAt || new Date().toISOString(),
          transactionType: "PENJUALAN_PRODUK",
          targetAmount: penjualan?.targetKuantitas,
          realisasiAmount: penjualan?.realisasiKuantitas,
          source: "laporan_penjualan_produk",
          originalData: penjualan,
        })),

        // Laporan Produksi
        ...(laporanProduksiData || []).map((produksi) => ({
          id: `produksi-${produksi.id}`,
          accountId: produksi.account?.id?.toString() || "PRODUKSI",
          tanggal: produksi.tanggalLaporan || "",
          date: produksi.tanggalLaporan || "",
          nilai: Number(produksi.hasilProduksi || 0),
          description: "Laporan Produksi",
          createdBy: produksi.createdBy?.username || "system",
          createdAt: produksi.createdAt || new Date().toISOString(),
          transactionType: "PRODUKSI",
          hasilProduksi: produksi.hasilProduksi,
          barangGagal: produksi.barangGagal,
          stockBarangJadi: produksi.stockBarangJadi,
          hpBarangJadi: produksi.hpBarangJadi,
          source: "laporan_produksi_harian",
          originalData: produksi,
        })),
      ];

      console.log("📊 Combined data sources:", {
        totalEntries: entries.length,
        totalPiutang: piutangData?.length || 0,
        totalUtang: utangData?.length || 0,
        totalGudang: laporanGudangData?.length || 0,
        totalPenjualanProduk: laporanPenjualanProdukData?.length || 0,
        totalProduksi: laporanProduksiData?.length || 0,
        combinedTotal: allDataSources.length,
      });

      // ✅ FIXED: Use applied filter variables instead of startDate/endDate
      const rangeEntries = allDataSources.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        let entryDateOnly = null;

        if (entryDate) {
          entryDateOnly = entryDate.includes("T")
            ? entryDate.split("T")[0]
            : entryDate;
        }

        if (!entryDateOnly) return false;

        const startDateOnly = appliedStartDate.includes("T")
          ? appliedStartDate.split("T")[0]
          : appliedStartDate;
        const endDateOnly = appliedEndDate.includes("T")
          ? appliedEndDate.split("T")[0]
          : appliedEndDate;

        const isInRange =
          entryDateOnly >= startDateOnly && entryDateOnly <= endDateOnly;
        console.log(
          `Entry ${entry.id} (${entry.source}): date='${entryDateOnly}' in range [${startDateOnly} - ${endDateOnly}] → match=${isInRange}`
        );
        return isInRange;
      });

      console.log(
        "✅ Matched entries for range",
        `${appliedStartDate} - ${appliedEndDate}`,
        ":",
        rangeEntries.length,
        rangeEntries
      );

      setStats({
        totalAccounts: accounts.length,
        activeUsers: users.filter((u) => u.status === "active").length,
        todayTransactions: rangeEntries.length,
        totalDivisions: divisions.length,
      });

      // Filter entries by division and date range
      let filteredEntries = allDataSources.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        let entryDateOnly = null;

        if (entryDate) {
          entryDateOnly = entryDate.includes("T")
            ? entryDate.split("T")[0]
            : entryDate;
        }

        if (!entryDateOnly) return false;

        const startDateOnly = appliedStartDate.includes("T")
          ? appliedStartDate.split("T")[0]
          : appliedStartDate;
        const endDateOnly = appliedEndDate.includes("T")
          ? appliedEndDate.split("T")[0]
          : appliedEndDate;

        return entryDateOnly >= startDateOnly && entryDateOnly <= endDateOnly;
      });

      console.log(
        "📅 Entries filtered by date range:",
        filteredEntries.length,
        filteredEntries
      );

      if (appliedDivision !== "all") {
        const divisionAccounts = accounts.filter((acc) => {
          const accDivisionId = acc.division?.id?.toString();
          console.log(
            `Account ${acc.id} division: ${accDivisionId}, comparing with selected: ${appliedDivision}`
          );
          return accDivisionId === appliedDivision;
        });

        const accountIds = divisionAccounts.map((acc) => acc.id);
        console.log("🏢 Division accounts:", divisionAccounts);
        console.log("📋 Account IDs to filter:", accountIds);

        filteredEntries = filteredEntries.filter((entry) => {
          const entryAccountId = entry.accountId.toString();
          const belongs = accountIds.some(
            (id) => id.toString() === entryAccountId
          );
          console.log(
            `Entry ${entry.id} (${entry.source}) accountId ${entryAccountId} belongs to division:`,
            belongs
          );
          return belongs;
        });

        console.log(
          "🏢 Entries filtered by division:",
          filteredEntries.length,
          filteredEntries
        );
      }

      // ✅ ENHANCED: Comprehensive data mapping for all division types
      const enrichedEntries = filteredEntries.map((entry, index) => {
        console.log(
          `🔄 Processing entry ${index + 1}/${filteredEntries.length} (${
            entry.source
          }):`,
          entry
        );

        const account = accounts.find((acc) => {
          const match = acc.id.toString() === entry.accountId.toString();
          if (match) {
            console.log(
              `✅ Found matching account for entry ${entry.id}:`,
              acc
            );
          }
          return match;
        });

        if (!account) {
          console.warn(
            `❌ Account not found for entry ${entry.id} with accountId ${entry.accountId}`
          );
          return {
            ...entry,
            account_code: "N/A",
            account_name: "Account Not Found",
            division_name: "N/A",
            value_type: "NOMINAL",
            created_by: entry.createdBy || "system",
          };
        }

        // ✅ ENHANCED: Map all specialized fields with comprehensive fallbacks
        const enriched = {
          ...entry,
          account_code: account.accountCode || "N/A",
          account_name: account.accountName || "N/A",
          division_name: account.division?.name || "N/A",
          value_type: account.valueType || "NOMINAL",
          created_by: entry.createdBy || "system",

          // ✅ COMPREHENSIVE: Map all division-specific fields
          // Keuangan fields
          transactionType: entry.transactionType || "NOMINAL",
          targetAmount: entry.targetAmount,
          realisasiAmount: entry.realisasiAmount,
          saldoAkhir: entry.saldoAkhir,

          // HRD fields
          attendanceStatus: (entry as any).attendanceStatus,
          absentCount: (entry as any).absentCount,
          shift: (entry as any).shift,
          keteranganKendala: (entry as any).keteranganKendala,

          // Pemasaran fields
          salesUserId: (entry as any).salesUserId,
          returPenjualan: (entry as any).returPenjualan,

          // Produksi fields
          hasilProduksi: (entry as any).hasilProduksi,
          barangGagal: (entry as any).barangGagal,
          stockBarangJadi: (entry as any).stockBarangJadi,
          hpBarangJadi: (entry as any).hpBarangJadi,

          // Gudang/Persediaan fields
          stokAwal: (entry as any).stokAwal,
          pemakaian: (entry as any).pemakaian,
          kondisiGudang: (entry as any).kondisiGudang,

          // Additional specialized fields
          hppAmount: (entry as any).hppAmount,
          pemakaianAmount: (entry as any).pemakaianAmount,
          stokAkhir: (entry as any).stokAkhir,
        };

        // ✅ ADD: Enhanced logging for division-specific data
        const divisionName = account.division?.name?.toLowerCase() || "";
        if (divisionName.includes("hrd")) {
          console.log(`👥 HRD Entry ${entry.id}:`, {
            attendanceStatus: enriched.attendanceStatus,
            absentCount: enriched.absentCount,
            shift: enriched.shift,
            keteranganKendala: enriched.keteranganKendala,
          });
        } else if (divisionName.includes("pemasaran")) {
          console.log(`📈 PEMASARAN Entry ${entry.id}:`, {
            targetAmount: enriched.targetAmount,
            realisasiAmount: enriched.realisasiAmount,
            salesUserId: enriched.salesUserId,
            returPenjualan: enriched.returPenjualan,
          });
        } else if (divisionName.includes("produksi")) {
          console.log(`🏭 PRODUKSI Entry ${entry.id}:`, {
            hasilProduksi: enriched.hasilProduksi,
            barangGagal: enriched.barangGagal,
            stockBarangJadi: enriched.stockBarangJadi,
            hpBarangJadi: enriched.hpBarangJadi,
          });
        } else if (
          divisionName.includes("gudang") ||
          divisionName.includes("persediaan")
        ) {
          console.log(`📦 GUDANG Entry ${entry.id}:`, {
            stokAwal: enriched.stokAwal,
            pemakaian: enriched.pemakaian,
            kondisiGudang: enriched.kondisiGudang,
            stokAkhir: enriched.stokAkhir,
          });
        } else if (divisionName.includes("keuangan")) {
          console.log(`💰 KEUANGAN Entry ${entry.id}:`, {
            transactionType: enriched.transactionType,
            saldoAkhir: enriched.saldoAkhir,
          });
        }

        console.log(
          `✅ Successfully enriched entry ${entry.id} (${entry.source}):`,
          enriched
        );
        return enriched;
      });

      // Sort by creation time (most recent first)
      enrichedEntries.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      console.log(
        "📊 FINAL ENRICHED ENTRIES:",
        enrichedEntries.length,
        enrichedEntries
      );
      console.log("🔄 Setting recent entries state...");

      setRecentEntries(enrichedEntries.slice(0, 20));

      // ✅ ADD: Enhanced verification with division breakdown
      setTimeout(() => {
        const divisionBreakdown = enrichedEntries.reduce((acc, entry) => {
          const division = entry.division_name || "Unknown";
          acc[division] = (acc[division] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sourceBreakdown = enrichedEntries.reduce((acc, entry) => {
          const source = entry.source || "Unknown";
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log("🔍 Verification - recentEntries state should now be:", {
          total: enrichedEntries.slice(0, 20).length,
          divisionBreakdown,
          sourceBreakdown,
          sampleEntries: enrichedEntries.slice(0, 3),
        });
      }, 100);
    } catch (error) {
      console.error("❌ Error loading monitoring data:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDivisionColor = (divisionName: string) => {
    const colors: { [key: string]: string } = {
      "KEUANGAN & ADMINISTRASI": "bg-blue-100 text-blue-800",
      "PEMASARAN & PENJUALAN": "bg-green-100 text-green-800",
      PRODUKSI: "bg-yellow-100 text-yellow-800",
      PERSEDIAAN_BAHAN_BAKU: "bg-purple-100 text-purple-800",
      HRD: "bg-orange-100 text-orange-800",
    };
    return colors[divisionName] || "bg-gray-100 text-gray-800";
  };

  // ✅ FIXED: Get unique divisions with better logging
  const getAvailableDivisions = () => {
    if (!accounts || accounts.length === 0) {
      console.log("No accounts available for divisions");
      return [];
    }

    const divisions = accounts
      .filter((acc) => {
        const hasValidDivision =
          acc.division && acc.division.id && acc.division.name;
        if (!hasValidDivision) {
          console.log("Account with invalid division:", acc);
        }
        return hasValidDivision;
      })
      .map((acc) => ({
        id: acc.division.id.toString(),
        name: acc.division.name,
      }));

    // Remove duplicates by id
    const uniqueDivisions = divisions.filter(
      (div, index, self) => index === self.findIndex((d) => d.id === div.id)
    );

    console.log("Available divisions:", uniqueDivisions);
    return uniqueDivisions;
  };

  // ✅ Dynamic title for period stats
  const getPeriodTitle = () => {
    if (startDate === endDate) {
      return `Entri ${new Date(startDate).toLocaleDateString("id-ID")}`;
    }
    return `Entri ${new Date(startDate).toLocaleDateString(
      "id-ID"
    )} - ${new Date(endDate).toLocaleDateString("id-ID")}`;
  };

  const statsData = [
    {
      title: "Total Akun",
      value: stats.totalAccounts.toString(),
      description: "Akun dari semua divisi",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Admin Aktif",
      value: stats.activeUsers.toString(),
      description: "Operator divisi",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: getPeriodTitle(),
      value: stats.todayTransactions.toString(),
      description:
        "Transaksi dari semua sumber (entri, piutang, utang, laporan)",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Total Divisi",
      value: stats.totalDivisions.toString(),
      description: "Divisi operasional",
      icon: Eye,
      color: "text-orange-600",
    },
  ];

  // ✅ Function to apply filters
  const applyFilters = () => {
    console.log("Applying filters:", { startDate, endDate, selectedDivision });
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedDivision(selectedDivision);
  };

  // ✅ Function to reset all filters
  const resetFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate("2025-06-19");
    setEndDate(today);
    setSelectedDivision("all");
    setAppliedStartDate("2025-06-19");
    setAppliedEndDate(today);
    setAppliedDivision("all");
  };

  function SendNotificationForm() {
    const [message, setMessage] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
      if (!message.trim()) return;

      setIsLoading(true);
      try {
        // ✅ FIXED: Gunakan notificationAPI yang konsisten dengan pola lainnya
        const response = await notificationAPI.send(message, linkUrl);

        if (!response.success) {
          throw new Error(response.error || "Gagal mengirim notifikasi");
        }

        toastSuccess.custom(
          "🎉 Notifikasi berhasil dikirim ke semua pengguna!"
        );
        setMessage("");
        setLinkUrl("");
      } catch (e: any) {
        console.error("Error sending notification:", e);
        toastError.custom(e.message || "Gagal mengirim notifikasi");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        <style jsx>{`
          .notification-form {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 24px;
            color: white;
            box-shadow: 0 20px 50px rgba(102, 126, 234, 0.3);
          }

          .form-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .form-subtitle {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-bottom: 20px;
          }

          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
          }

          .form-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          .form-input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.5);
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .form-textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-top: 16px;
          }

          .send-button {
            background: rgba(255, 255, 255, 0.9);
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }

          .send-button:hover:not(:disabled) {
            background: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }

          .send-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .clear-button {
            background: transparent;
            color: rgba(255, 255, 255, 0.8);
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 20px;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
          }

          .clear-button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
          }

          .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            border-top: 2px solid #667eea;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .char-count {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-align: right;
            margin-top: -8px;
            margin-bottom: 12px;
          }
        `}</style>

        <div className="notification-form">
          <div className="form-title">
            <Bell size={24} />
            Kirim Notifikasi Broadcast
          </div>
          <div className="form-subtitle">
            Kirim pesan penting ke semua pengguna sistem secara bersamaan
          </div>

          <textarea
            className="form-input form-textarea"
            placeholder="Tulis pesan notifikasi di sini... (contoh: Sistem akan maintenance pada hari Minggu jam 02:00 - 04:00 WIB)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
          />
          <div className="char-count">{message.length}/200 karakter</div>

          <input
            type="url"
            className="form-input"
            placeholder="🔗 Link terkait (opsional) - contoh: https://example.com/info"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />

          <div className="form-actions">
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Kirim ke Semua Pengguna
                </>
              )}
            </button>

            {(message || linkUrl) && !isLoading && (
              <button
                className="clear-button"
                onClick={() => {
                  setMessage("");
                  setLinkUrl("");
                }}
              >
                <X size={16} />
                Bersihkan
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Menara Kontrol - Dashboard Pemantauan
          </h1>
          <p className="text-gray-600 mt-2">
            Pantau seluruh aktivitas dari semua divisi secara real-time
          </p>
        </div>
        <ModernNotificationBell />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monitoring Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pemantauan Real-Time
          </CardTitle>
          <CardDescription>Filter dan pantau aktivitas divisi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Tanggal Awal</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Filter Divisi</label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger className="mt-1">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {getAvailableDivisions().map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <Button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tampilkan Data
              </Button>
            </div>
          </div>
          {/* ✅ Quick action buttons */}
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("All Data button clicked - before:", {
                  startDate,
                  endDate,
                  selectedDivision,
                });
                setStartDate("2025-06-19");
                setEndDate(todayStr);
                setSelectedDivision("all");
                console.log("All Data button clicked - after setting states");
              }}
              className="hover:bg-gray-50"
            >
              All Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="hover:bg-gray-50"
            >
              Reset Filters
            </Button>
            {/* Show filter status ONLY when user changes from defaults */}
            {(startDate !== "2025-06-19" ||
              endDate !== todayStr ||
              selectedDivision !== "all") && (
              <span className="text-sm text-blue-600 ml-2">
                📊 Filter:
                {startDate === endDate
                  ? new Date(startDate).toLocaleDateString("id-ID")
                  : `${new Date(startDate).toLocaleDateString(
                      "id-ID"
                    )} - ${new Date(endDate).toLocaleDateString("id-ID")}`}
                {selectedDivision !== "all" &&
                  ` | ${
                    getAvailableDivisions().find(
                      (d) => d.id === selectedDivision
                    )?.name || "Divisi"
                  }`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Aktivitas Entri Harian -{" "}
            {startDate === endDate
              ? new Date(startDate).toLocaleDateString("id-ID")
              : `${new Date(startDate).toLocaleDateString(
                  "id-ID"
                )} s/d ${new Date(endDate).toLocaleDateString("id-ID")}`}
          </CardTitle>
          <CardDescription>
            Menampilkan {recentEntries.length} entri
            {selectedDivision !== "all"
              ? ` dari divisi yang dipilih`
              : " dari semua divisi"}
            {/* ✅ ADD: Helpful hint if no data */}
            {recentEntries.length === 0 && (
              <span className="text-yellow-600 ml-2">
                • Coba ubah tanggal ke 19 Juni 2025 untuk melihat data yang
                tersedia
              </span>
            )}
          </CardDescription>
        
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Info Tambahan</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries &&
                Array.isArray(recentEntries) &&
                recentEntries.length > 0 ? (
                  recentEntries.map((entry, index) => {
                    console.log(
                      `Rendering table row ${index + 1} for entry:`,
                      entry
                    );

                    return (
                      <TableRow key={entry.id || `entry-${index}`}>
                        <TableCell className="text-sm">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getDivisionColor(
                              entry.division_name || "N/A"
                            )}
                          >
                            {entry.division_name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div>
                            <div className="font-medium">
                              {entry.account_code || "N/A"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {entry.account_name || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              entry.value_type === "NOMINAL"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {entry.value_type === "NOMINAL"
                              ? "💰 Nominal"
                              : "📦 Kuantitas"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {/* ✅ ENHANCED: Show division-specific values */}
                          {(() => {
                            const divisionName =
                              entry.division_name?.toLowerCase() || "";

                            // HRD: Show attendance info
                            if (divisionName.includes("hrd")) {
                              const attendanceStatus = (entry as any)
                                .attendanceStatus;
                              const absentCount = (entry as any).absentCount;
                              const shift = (entry as any).shift;

                              if (attendanceStatus && absentCount) {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {absentCount} orang - {attendanceStatus}
                                    </div>
                                    {shift && (
                                      <div className="text-xs text-gray-500">
                                        Shift: {shift}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }

                            // Pemasaran: Show target vs realisasi
                            if (divisionName.includes("pemasaran")) {
                              const targetAmount = (entry as any).targetAmount;
                              const realisasiAmount = (entry as any)
                                .realisasiAmount;

                              if (targetAmount || realisasiAmount) {
                                return (
                                  <div className="text-sm">
                                    {targetAmount && (
                                      <div className="text-blue-600">
                                        Target: {formatCurrency(targetAmount)}
                                      </div>
                                    )}
                                    {realisasiAmount && (
                                      <div className="text-green-600">
                                        Realisasi:{" "}
                                        {formatCurrency(realisasiAmount)}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }

                            // Produksi: Show production data
                            if (divisionName.includes("produksi")) {
                              const hasilProduksi = (entry as any)
                                .hasilProduksi;
                              const barangGagal = (entry as any).barangGagal;
                              const stockBarangJadi = (entry as any)
                                .stockBarangJadi;

                              if (
                                hasilProduksi ||
                                barangGagal ||
                                stockBarangJadi
                              ) {
                                return (
                                  <div className="text-sm">
                                    {hasilProduksi && (
                                      <div className="text-green-600">
                                        Hasil: {hasilProduksi} unit
                                      </div>
                                    )}
                                    {barangGagal && (
                                      <div className="text-red-600">
                                        Gagal: {barangGagal} unit
                                      </div>
                                    )}
                                    {stockBarangJadi && (
                                      <div className="text-blue-600">
                                        Stock: {stockBarangJadi} unit
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }

                            // Gudang/Persediaan: Show stock data
                            if (
                              divisionName.includes("gudang") ||
                              divisionName.includes("persediaan")
                            ) {
                              const stokAwal = (entry as any).stokAwal;
                              const pemakaian = (entry as any).pemakaian;
                              const stokAkhir = (entry as any).stokAkhir;

                              if (stokAwal || pemakaian || stokAkhir) {
                                return (
                                  <div className="text-sm">
                                    {stokAwal && (
                                      <div className="text-blue-600">
                                        Awal: {stokAwal} unit
                                      </div>
                                    )}
                                    {pemakaian && (
                                      <div className="text-orange-600">
                                        Pakai: {pemakaian} unit
                                      </div>
                                    )}
                                    {stokAkhir && (
                                      <div className="text-green-600">
                                        Akhir: {stokAkhir} unit
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }

                            // Keuangan: Show transaction type and amount
                            if (divisionName.includes("keuangan")) {
                              const transactionType = (entry as any)
                                .transactionType;
                              const saldoAkhir = (entry as any).saldoAkhir;

                              if (
                                transactionType === "SALDO_AKHIR" &&
                                saldoAkhir
                              ) {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-purple-600">
                                      Saldo: {formatCurrency(saldoAkhir)}
                                    </div>
                                  </div>
                                );
                              }
                            }

                            // Default: Show standard nilai
                            return entry.value_type === "NOMINAL"
                              ? formatCurrency(entry.nilai || 0)
                              : `${(entry.nilai || 0).toLocaleString(
                                  "id-ID"
                                )} unit`;
                          })()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {/* ✅ ENHANCED: Show additional division-specific information */}
                          {(() => {
                            const divisionName =
                              entry.division_name?.toLowerCase() || "";

                            // HRD: Show shift and keterangan kendala
                            if (divisionName.includes("hrd")) {
                              const shift = (entry as any).shift;
                              const keteranganKendala = (entry as any)
                                .keteranganKendala;

                              return (
                                <div className="text-xs">
                                  {shift && (
                                    <div className="text-blue-600 mb-1">
                                      Shift: {shift}
                                    </div>
                                  )}
                                  {keteranganKendala && (
                                    <div
                                      className="text-gray-600 truncate max-w-[150px]"
                                      title={keteranganKendala}
                                    >
                                      {keteranganKendala}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Pemasaran: Show retur and kendala
                            if (divisionName.includes("pemasaran")) {
                              const returPenjualan = (entry as any)
                                .returPenjualan;
                              const keteranganKendala = (entry as any)
                                .keteranganKendala;

                              return (
                                <div className="text-xs">
                                  {returPenjualan && (
                                    <div className="text-red-600 mb-1">
                                      Retur: {formatCurrency(returPenjualan)}
                                    </div>
                                  )}
                                  {keteranganKendala && (
                                    <div
                                      className="text-gray-600 truncate max-w-[150px]"
                                      title={keteranganKendala}
                                    >
                                      {keteranganKendala}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Produksi: Show HPP and kendala
                            if (divisionName.includes("produksi")) {
                              const hpBarangJadi = (entry as any).hpBarangJadi;
                              const keteranganKendala = (entry as any)
                                .keteranganKendala;

                              return (
                                <div className="text-xs">
                                  {hpBarangJadi && (
                                    <div className="text-purple-600 mb-1">
                                      HPP: {formatCurrency(hpBarangJadi)}
                                    </div>
                                  )}
                                  {keteranganKendala && (
                                    <div
                                      className="text-gray-600 truncate max-w-[150px]"
                                      title={keteranganKendala}
                                    >
                                      {keteranganKendala}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Gudang/Persediaan: Show kondisi gudang
                            if (
                              divisionName.includes("gudang") ||
                              divisionName.includes("persediaan")
                            ) {
                              const kondisiGudang = (entry as any)
                                .kondisiGudang;

                              if (kondisiGudang) {
                                return (
                                  <div
                                    className="text-xs text-gray-600 truncate max-w-[150px]"
                                    title={kondisiGudang}
                                  >
                                    {kondisiGudang}
                                  </div>
                                );
                              }
                            }

                            // Keuangan: Show transaction details
                            if (divisionName.includes("keuangan")) {
                              const transactionType = (entry as any)
                                .transactionType;

                              if (
                                transactionType &&
                                transactionType !== "NOMINAL"
                              ) {
                                return (
                                  <div className="text-xs">
                                    <Badge
                                      className={
                                        transactionType === "PENERIMAAN"
                                          ? "bg-green-100 text-green-800"
                                          : transactionType === "PENGELUARAN"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-purple-100 text-purple-800"
                                      }
                                    >
                                      {transactionType}
                                    </Badge>
                                  </div>
                                );
                              }
                            }

                            return "-";
                          })()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {entry.created_by || "system"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="space-y-2">
                        <div>
                          Tidak ada entri untuk tanggal dan divisi yang dipilih
                        </div>
                        <div className="text-xs text-gray-400">
                          Debug: recentEntries.length ={" "}
                          {recentEntries?.length || 0}
                        </div>
                        <div className="text-xs text-gray-400">
                          Debug: Array.isArray ={" "}
                          {Array.isArray(recentEntries) ? "true" : "false"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Debug: Applied filters = {appliedStartDate} -{" "}
                          {appliedEndDate} (Division: {appliedDivision})
                        </div>
                        <div className="text-xs text-gray-400">
                          Debug: Total accounts = {accounts?.length || 0}
                        </div>
                        {/* ✅ ADD: Helpful suggestion */}
                        <div className="text-sm text-blue-600 mt-4">
                          💡 Tip: Klik tombol "19 Jun (Ada Data)" di atas untuk
                          melihat transaksi yang tersedia
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Mode Darurat</CardTitle>
          <CardDescription>
            Aksi cepat untuk situasi darurat atau perbaikan sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Backup Darurat
            </Button>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Reset Sesi User
            </Button>
            <Button
              variant="outline"
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              Maintenance Mode
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Gunakan hanya dalam keadaan darurat atau untuk perbaikan sistem
          </p>
        </CardContent>
      </Card>

      <SendNotificationForm />
    </div>
  );
}
