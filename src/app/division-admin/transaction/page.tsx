"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Eye,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  TrendingUp,
  DollarSign,
  Warehouse,
  Target,
  Zap,
  Users, // ✅ Add Users icon for HRD
  Clock, // ✅ Add Clock icon for attendance
} from "lucide-react";
import {
  getEntriHarian,
  type EntriHarian,
  getPiutangTransaksi,
  getUtangTransaksi,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getAccountsByDivision, type Account } from "@/lib/data";
import ClientErrorBoundary from "@/components/client-error-boundary";

export default function TransactionPage() {
  const [entries, setEntries] = useState<EntriHarian[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntriHarian[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, filterType, filterDate]);

  // FIX: import harus di top-level, jadi pindahkan ke atas file bersama import lain
  // import { getPiutangTransaksi } from "@/lib/data";
  // Pastikan baris ini sudah ada di bagian atas:
  // import { getEntriHarian, type EntriHarian, getPiutangTransaksi } from "@/lib/data";

  // Di loadEntries:
  const loadEntries = async () => {
    if (!user?.division?.id) return;

    try {
      const accountsData = await getAccountsByDivision(user.division.id);
      setAccounts(accountsData);

      const allEntries = await getEntriHarian();
      let divisionEntries = allEntries.filter((entry) =>
        accountsData.map((acc) => acc.id).includes(entry.accountId)
      );

      let combinedEntries: EntriHarian[] = divisionEntries;

      // Hanya untuk KEUANGAN, mapping piutang dan utang
      if (divisionType === "KEUANGAN") {
        const piutangEntries = await getPiutangTransaksi();
        const utangEntries = await getUtangTransaksi();

        // Mapping piutang
        const piutangAccount = accountsData.find((acc) =>
          acc.accountName.toLowerCase().includes("piutang")
        );
        const mappedPiutang =
          piutangEntries?.map((p: any) => ({
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
          })) || [];

        // Mapping utang
        const utangAccount = accountsData.find(
          (acc) =>
            acc.accountName.toLowerCase().includes("utang") ||
            acc.accountName.toLowerCase().includes("hutang")
        );
        const mappedUtang =
          utangEntries?.map((u: any) => ({
            id: u.id,
            tanggal: u.tanggal_transaksi || u.tanggalTransaksi || "",
            accountId: utangAccount ? utangAccount.id : "UTANG",
            nilai: u.nominal,
            description: u.keterangan,
            transactionType: u.tipe_transaksi || u.tipeTransaksi || "",
            kategori: u.kategori || "",
            createdAt:
              u.created_at ||
              u.createdAt ||
              u.tanggal_transaksi ||
              u.tanggalTransaksi ||
              "",
            keterangan: u.keterangan,
            date: u.tanggal_transaksi || u.tanggalTransaksi || "",
            createdBy: u.user?.username || "system",
          })) || [];

        combinedEntries = [
          ...divisionEntries,
          ...mappedPiutang,
          ...mappedUtang,
        ];
      }

      setEntries(combinedEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };
  // ✅ ENHANCED: Get division type for conditional rendering
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

  const filterEntries = () => {
    let filtered = entries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((entry) => {
        const account = accounts.find(
          (acc: Account) => acc.id === entry.accountId
        );
        return (
          account &&
          (account.accountName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            account.accountCode
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (entry.description &&
              entry.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())))
        );
      });
    }

    // ✅ ENHANCED: Filter type logic for all divisions
    if (filterType !== "all") {
      filtered = filtered.filter((entry) => {
        switch (divisionType) {
          case "KEUANGAN":
            const transactionType =
              (entry as any).transactionType ||
              (entry as any).transaction_type ||
              (entry as any).type;

            if (filterType === "Penerimaan") {
              return transactionType === "PENERIMAAN";
            } else if (filterType === "Pengeluaran") {
              return transactionType === "PENGELUARAN";
            } else if (filterType === "UtangBaru") {
              return transactionType === "UTANG_BARU";
            } else if (filterType === "UtangDibayar") {
              return transactionType === "UTANG_DIBAYAR";
            }
            return true;

          case "PRODUKSI":
            const hasProductionData = (entry as any).hppAmount != null;

            if (filterType === "Produksi") {
              return hasProductionData && entry.nilai > 0;
            } else if (filterType === "HPP") {
              return hasProductionData;
            }
            return true;

          case "PEMASARAN":
            const hasMarketingData =
              (entry as any).targetAmount != null ||
              (entry as any).realisasiAmount != null;

            if (filterType === "Target") {
              return hasMarketingData && (entry as any).targetAmount > 0;
            } else if (filterType === "Realisasi") {
              return hasMarketingData && (entry as any).realisasiAmount > 0;
            } else if (filterType === "Tercapai") {
              const target = (entry as any).targetAmount || 0;
              const realisasi = (entry as any).realisasiAmount || 0;
              return target > 0 && realisasi >= target;
            } else if (filterType === "Belum Tercapai") {
              const target = (entry as any).targetAmount || 0;
              const realisasi = (entry as any).realisasiAmount || 0;
              return target > 0 && realisasi < target;
            }
            return true;

          case "GUDANG":
            const hasInventoryData =
              (entry as any).pemakaianAmount != null ||
              (entry as any).stokAkhir != null;

            if (filterType === "Pemakaian") {
              return hasInventoryData && (entry as any).pemakaianAmount > 0;
            } else if (filterType === "Stok Rendah") {
              const stokAkhir = (entry as any).stokAkhir || 0;
              return hasInventoryData && stokAkhir < 100;
            } else if (filterType === "Stok Aman") {
              const stokAkhir = (entry as any).stokAkhir || 0;
              return hasInventoryData && stokAkhir >= 100;
            }
            return true;

          // ✅ NEW: HRD division filtering
          case "HRD":
            const hasAttendanceData =
              (entry as any).attendanceStatus != null ||
              (entry as any).overtimeHours != null;

            if (filterType === "Hadir") {
              return (
                hasAttendanceData && (entry as any).attendanceStatus === "HADIR"
              );
            } else if (filterType === "Tidak Hadir") {
              return (
                hasAttendanceData &&
                ((entry as any).attendanceStatus === "TIDAK_HADIR" ||
                  (entry as any).attendanceStatus === "SAKIT" ||
                  (entry as any).attendanceStatus === "IZIN")
              );
            } else if (filterType === "Overtime") {
              const overtime = (entry as any).overtimeHours || 0;
              return hasAttendanceData && overtime > 0;
            } else if (filterType === "Perfect Attendance") {
              return (
                hasAttendanceData &&
                (entry as any).attendanceStatus === "HADIR" &&
                ((entry as any).overtimeHours || 0) === 0
              );
            }
            return true;

          default:
            // For general division, use debet/kredit logic
            if (filterType === "Debet") {
              return entry.nilai > 0;
            } else if (filterType === "Kredit") {
              return entry.nilai < 0;
            }
            return true;
        }
      });
    }

    // Date filter
    if (filterDate) {
      filtered = filtered.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        return entryDate === filterDate;
      });
    }

    // Sort by creation time (most recent first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredEntries(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ HELPER: Get account info for better detection
  const getAccountInfo = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId);
  };

  // ✅ ENHANCED: Different calculations for each division
  const getDivisionMetrics = () => {
    switch (divisionType) {
      case "KEUANGAN":
        // ✅ SIMPLIFIED: Gunakan transactionType yang sudah benar dari backend
        const totalPenerimaan = filteredEntries.reduce((sum, entry) => {
          const transactionType = (entry as any).transactionType;
          return transactionType === "PENERIMAAN"
            ? sum + Math.abs(entry.nilai)
            : sum;
        }, 0);

        const totalPengeluaran = filteredEntries.reduce((sum, entry) => {
          const transactionType = (entry as any).transactionType;
          return transactionType === "PENGELUARAN"
            ? sum + Math.abs(entry.nilai)
            : sum;
        }, 0);

        // ✅ NEW: Calculate utang metrics
        const totalUtangBaru = filteredEntries.reduce((sum, entry) => {
          const transactionType = (entry as any).transactionType;
          return transactionType === "UTANG_BARU"
            ? sum + Math.abs(entry.nilai)
            : sum;
        }, 0);

        const totalUtangDibayar = filteredEntries.reduce((sum, entry) => {
          const transactionType = (entry as any).transactionType;
          return transactionType === "UTANG_DIBAYAR"
            ? sum + Math.abs(entry.nilai)
            : sum;
        }, 0);

        // ✅ CLEAN DEBUG: Hanya untuk development
        if (process.env.NODE_ENV === "development") {
          console.log("🏦 KEUANGAN METRICS DEBUG:", {
            totalEntries: filteredEntries.length,
            totalPenerimaan,
            totalPengeluaran,
            totalUtangBaru,
            totalUtangDibayar,
            entriesBreakdown: filteredEntries.map((entry) => ({
              id: entry.id,
              type: (entry as any).transactionType,
              nilai: entry.nilai,
            })),
          });
        }

        return {
          metric1: {
            label: "Total Penerimaan",
            value: totalPenerimaan,
            type: "currency",
            color: "text-green-600",
          },
          metric2: {
            label: "Total Pengeluaran",
            value: totalPengeluaran,
            type: "currency",
            color: "text-red-600",
          },
          metric3: {
            label: "Saldo Bersih",
            value: totalPenerimaan - totalPengeluaran,
            type: "currency",
            color:
              totalPenerimaan >= totalPengeluaran
                ? "text-green-600"
                : "text-red-600",
          },
          metric4: {
            label: "Total Transaksi",
            value: filteredEntries.length,
            type: "number",
            color: "text-blue-600",
          },
        };

      case "PRODUKSI":
        const totalProduksi = filteredEntries.reduce(
          (sum, entry) => sum + entry.nilai,
          0
        );
        const totalHPP = filteredEntries.reduce((sum, entry) => {
          const hpp = (entry as any).hppAmount || 0;
          return sum + hpp;
        }, 0);
        const avgHPPPerUnit = totalProduksi > 0 ? totalHPP / totalProduksi : 0;

        return {
          metric1: {
            label: "Total Produksi",
            value: totalProduksi,
            type: "unit",
            color: "text-blue-600",
          },
          metric2: {
            label: "Total HPP",
            value: totalHPP,
            type: "currency",
            color: "text-orange-600",
          },
          metric3: {
            label: "HPP per Unit",
            value: avgHPPPerUnit,
            type: "currency",
            color: "text-purple-600",
          },
          metric4: {
            label: "Efisiensi",
            value: avgHPPPerUnit < 5000 ? "Efisien" : "Review",
            type: "text",
            color: avgHPPPerUnit < 5000 ? "text-green-600" : "text-yellow-600",
          },
        };

      case "PEMASARAN":
        const totalTarget = filteredEntries.reduce((sum, entry) => {
          const target = (entry as any).targetAmount || 0;
          return sum + target;
        }, 0);
        const totalRealisasi = filteredEntries.reduce((sum, entry) => {
          const realisasi = (entry as any).realisasiAmount || 0;
          return sum + realisasi;
        }, 0);
        const achievementRate =
          totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

        return {
          metric1: {
            label: "Total Target",
            value: totalTarget,
            type: "currency",
            color: "text-blue-600",
          },
          metric2: {
            label: "Total Realisasi",
            value: totalRealisasi,
            type: "currency",
            color: "text-green-600",
          },
          metric3: {
            label: "Achievement Rate",
            value: achievementRate,
            type: "percentage",
            color:
              achievementRate >= 100 ? "text-green-600" : "text-orange-600",
          },
          metric4: {
            label: "Status",
            value:
              achievementRate >= 100 ? "Target Tercapai" : "Belum Tercapai",
            type: "text",
            color: achievementRate >= 100 ? "text-green-600" : "text-red-600",
          },
        };

      case "GUDANG":
        const totalPemakaian = filteredEntries.reduce((sum, entry) => {
          const pemakaian = (entry as any).pemakaianAmount || 0;
          return sum + pemakaian;
        }, 0);

        // ✅ FIXED: Calculate average current stock instead of "mutasi"
        const avgStokAkhir =
          filteredEntries.length > 0
            ? filteredEntries.reduce((sum, entry) => {
                const stok = (entry as any).stokAkhir || 0;
                return sum + stok;
              }, 0) / filteredEntries.length
            : 0;

        const lowStockItems = filteredEntries.filter(
          (entry) => (entry as any).stokAkhir < 100
        ).length;

        // ✅ NEW: Calculate total movement (pemakaian)
        const totalMovement = totalPemakaian;

        return {
          metric1: {
            label: "Total Pemakaian",
            value: totalPemakaian,
            type: "unit",
            color: "text-blue-600",
          },
          metric2: {
            label: "Rata-rata Stok",
            value: avgStokAkhir,
            type: "unit",
            color: "text-green-600",
          },
          metric3: {
            label: "Item Stok Rendah",
            value: lowStockItems,
            type: "number",
            color: lowStockItems > 0 ? "text-red-600" : "text-green-600",
          },
          metric4: {
            label: "Status Gudang",
            value: lowStockItems > 0 ? "Perlu Restock" : "Stok Aman",
            type: "text",
            color: lowStockItems > 0 ? "text-red-600" : "text-green-600",
          },
        };

      // ✅ NEW: HRD metrics
      case "HRD":
        const totalKaryawan = filteredEntries.length;
        const hadirCount = filteredEntries.filter(
          (entry) => (entry as any).attendanceStatus === "HADIR"
        ).length;
        const tidakHadirCount = filteredEntries.filter(
          (entry) =>
            (entry as any).attendanceStatus === "TIDAK_HADIR" ||
            (entry as any).attendanceStatus === "SAKIT" ||
            (entry as any).attendanceStatus === "IZIN"
        ).length;
        const attendanceRate =
          totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;
        const totalOvertimeHours = filteredEntries.reduce((sum, entry) => {
          const overtime = (entry as any).overtimeHours || 0;
          return sum + overtime;
        }, 0);

        return {
          metric1: {
            label: "Total Karyawan",
            value: totalKaryawan,
            type: "number",
            color: "text-blue-600",
          },
          metric2: {
            label: "Tingkat Kehadiran",
            value: attendanceRate,
            type: "percentage",
            color:
              attendanceRate >= 90
                ? "text-green-600"
                : attendanceRate >= 80
                ? "text-yellow-600"
                : "text-red-600",
          },
          metric3: {
            label: "Total Jam Lembur",
            value: totalOvertimeHours,
            type: "hours",
            color: "text-purple-600",
          },
          metric4: {
            label: "Status Kehadiran",
            value:
              attendanceRate >= 90
                ? "Excellent"
                : attendanceRate >= 80
                ? "Good"
                : "Needs Improvement",
            type: "text",
            color:
              attendanceRate >= 90
                ? "text-green-600"
                : attendanceRate >= 80
                ? "text-yellow-600"
                : "text-red-600",
          },
        };

      default:
        const positiveSum = filteredEntries.reduce(
          (sum, entry) => sum + (entry.nilai > 0 ? entry.nilai : 0),
          0
        );
        const negativeSum = filteredEntries.reduce(
          (sum, entry) => sum + (entry.nilai < 0 ? Math.abs(entry.nilai) : 0),
          0
        );

        return {
          metric1: {
            label: "Total Debet",
            value: positiveSum,
            type: "currency",
            color: "text-green-600",
          },
          metric2: {
            label: "Total Kredit",
            value: negativeSum,
            type: "currency",
            color: "text-red-600",
          },
          metric3: {
            label: "Selisih",
            value: Math.abs(positiveSum - negativeSum),
            type: "currency",
            color:
              positiveSum >= negativeSum ? "text-green-600" : "text-red-600",
          },
          metric4: {
            label: "Total Transaksi",
            value: filteredEntries.length,
            type: "number",
            color: "text-blue-600",
          },
        };
    }
  };

  const metrics = getDivisionMetrics();

  // ✅ SIMPLIFIED: Badge logic menggunakan transactionType yang benar
  const getTransactionBadge = (entry: EntriHarian) => {
    const transactionType = (entry as any).transactionType;

    switch (divisionType) {
      case "KEUANGAN":
        if (transactionType === "PENERIMAAN") {
          return (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              ✅ Penerimaan
            </span>
          );
        } else if (transactionType === "PENGELUARAN") {
          return (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              ❌ Pengeluaran
            </span>
          );
        } else if (transactionType === "UTANG_BARU") {
          return (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              🆕 Utang Baru
            </span>
          );
        } else if (transactionType === "UTANG_DIBAYAR") {
          return (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              ✅ Utang Dibayar
            </span>
          );
        } else {
          return (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              📄 Transaksi
            </span>
          );
        }

      case "PRODUKSI":
        const hppAmount = (entry as any).hppAmount;
        const efficiency =
          hppAmount && entry.nilai > 0 ? hppAmount / entry.nilai : 0;

        return (
          <Badge
            className={`${
              efficiency < 5000
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            <Package className="h-3 w-3 mr-1" />
            {efficiency < 5000 ? "Efisien" : "Review"}
          </Badge>
        );

      case "PEMASARAN":
        const target = (entry as any).targetAmount || 0;
        const realisasi = (entry as any).realisasiAmount || 0;
        const achievement = target > 0 ? (realisasi / target) * 100 : 0;

        return (
          <Badge
            className={`${
              achievement >= 100
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            <Target className="h-3 w-3 mr-1" />
            {achievement.toFixed(0)}%
          </Badge>
        );

      case "GUDANG":
        const stokAkhir = (entry as any).stokAkhir || 0;

        return (
          <Badge
            className={`${
              stokAkhir >= 100
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <Warehouse className="h-3 w-3 mr-1" />
            {stokAkhir >= 100 ? "Stok Aman" : "Stok Rendah"}
          </Badge>
        );

      // ✅ NEW: HRD badge
      case "HRD":
        const attendanceStatus = (entry as any).attendanceStatus;
        const overtimeHours = (entry as any).overtimeHours || 0;

        if (attendanceStatus === "HADIR") {
          if (overtimeHours > 0) {
            return (
              <Badge className="bg-blue-100 text-blue-800">
                <Clock className="h-3 w-3 mr-1" />
                Hadir + Lembur ({overtimeHours}h)
              </Badge>
            );
          } else {
            return (
              <Badge className="bg-green-100 text-green-800">
                <Users className="h-3 w-3 mr-1" />
                Hadir
              </Badge>
            );
          }
        } else if (attendanceStatus === "SAKIT") {
          return (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Users className="h-3 w-3 mr-1" />
              Sakit
            </Badge>
          );
        } else if (attendanceStatus === "IZIN") {
          return (
            <Badge className="bg-orange-100 text-orange-800">
              <Users className="h-3 w-3 mr-1" />
              Izin
            </Badge>
          );
        } else if (attendanceStatus === "TIDAK_HADIR") {
          return (
            <Badge className="bg-red-100 text-red-800">
              <Users className="h-3 w-3 mr-1" />
              Tidak Hadir
            </Badge>
          );
        } else {
          return (
            <Badge className="bg-gray-100 text-gray-800">
              <Users className="h-3 w-3 mr-1" />
              Belum Dicatat
            </Badge>
          );
        }

      default:
        if (entry.nilai > 0) {
          return (
            <Badge className="bg-blue-100 text-blue-800">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Debet
            </Badge>
          );
        } else {
          return (
            <Badge className="bg-orange-100 text-orange-800">
              <ArrowDownCircle className="h-3 w-3 mr-1" />
              Kredit
            </Badge>
          );
        }
    }
  };

  // ✅ NEW: Get division-specific filter options
  const getDivisionFilterOptions = () => {
    switch (divisionType) {
      case "KEUANGAN":
        return [
          {
            value: "Penerimaan",
            label: "Penerimaan",
            icon: ArrowUpCircle,
            color: "text-green-600",
          },
          {
            value: "Pengeluaran",
            label: "Pengeluaran",
            icon: ArrowDownCircle,
            color: "text-red-600",
          },
          {
            value: "UtangBaru",
            label: "Utang Baru",
            icon: ArrowDownCircle,
            color: "text-red-600",
          },
          {
            value: "UtangDibayar",
            label: "Utang Dibayar",
            icon: ArrowUpCircle,
            color: "text-green-600",
          },
        ];

      case "PRODUKSI":
        return [
          {
            value: "Produksi",
            label: "Hasil Produksi",
            icon: Package,
            color: "text-blue-600",
          },
          {
            value: "HPP",
            label: "Data HPP",
            icon: DollarSign,
            color: "text-orange-600",
          },
        ];

      case "PEMASARAN":
        return [
          {
            value: "Target",
            label: "Ada Target",
            icon: Target,
            color: "text-blue-600",
          },
          {
            value: "Realisasi",
            label: "Ada Realisasi",
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            value: "Tercapai",
            label: "Target Tercapai",
            icon: Zap,
            color: "text-green-600",
          },
          {
            value: "Belum Tercapai",
            label: "Belum Tercapai",
            icon: TrendingUp,
            color: "text-orange-600",
          },
        ];

      case "GUDANG":
        return [
          {
            value: "Pemakaian",
            label: "Ada Pemakaian",
            icon: Package,
            color: "text-blue-600",
          },
          {
            value: "Stok Rendah",
            label: "Stok Rendah",
            icon: Warehouse,
            color: "text-red-600",
          },
          {
            value: "Stok Aman",
            label: "Stok Aman",
            icon: Warehouse,
            color: "text-green-600",
          },
        ];

      // ✅ NEW: HRD filter options
      case "HRD":
        return [
          {
            value: "Hadir",
            label: "Hadir",
            icon: Users,
            color: "text-green-600",
          },
          {
            value: "Tidak Hadir",
            label: "Tidak Hadir/Sakit/Izin",
            icon: Users,
            color: "text-red-600",
          },
          {
            value: "Overtime",
            label: "Ada Lembur",
            icon: Clock,
            color: "text-blue-600",
          },
          {
            value: "Perfect Attendance",
            label: "Kehadiran Sempurna",
            icon: Target,
            color: "text-green-600",
          },
        ];

      default:
        return [
          {
            value: "Debet",
            label: "Debet",
            icon: ArrowUpCircle,
            color: "text-blue-600",
          },
          {
            value: "Kredit",
            label: "Kredit",
            icon: ArrowDownCircle,
            color: "text-orange-600",
          },
        ];
    }
  };

  const filterOptions = getDivisionFilterOptions();

  // ✅ NEW: Format value based on type
  const formatValue = (value: number, type: string) => {
    switch (type) {
      case "currency":
        return formatCurrency(value);
      case "unit":
        return `${value.toLocaleString("id-ID")} unit`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
        return value.toString();
      case "hours": // ✅ NEW: Hours formatting for HRD
        return `${value} jam`;
      case "text":
        return value.toString();
      default:
        return value.toString();
    }
  };

  return (
    <ClientErrorBoundary>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Riwayat Transaksi {divisionType === "GENERAL" ? "" : divisionType}
          </h1>
          <p className="text-gray-600 mt-2">
            {divisionType === "KEUANGAN" &&
              `Riwayat penerimaan dan pengeluaran  ${user?.division?.name}`}
            {divisionType === "PRODUKSI" &&
              `Riwayat produksi dan HPP divisi ${user?.division?.name}`}
            {divisionType === "PEMASARAN" &&
              `Riwayat target dan realisasi penjualan divisi ${user?.division?.name}`}
            {divisionType === "GUDANG" &&
              `Riwayat pemakaian dan stok divisi ${user?.division?.name}`}
            {divisionType === "HRD" &&
              `Riwayat kehadiran dan aktivitas karyawan divisi ${user?.division?.name}`}{" "}
            {/* ✅ NEW */}
            {divisionType === "GENERAL" &&
              `Lihat semua transaksi divisi ${user?.division?.name}`}
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {filterOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <Icon className={`h-4 w-4 mr-2 ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Filter tanggal"
                />
              </div>

              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                    setFilterDate("");
                  }}
                  className="w-full"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - ENHANCED for all divisions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold">{filteredEntries.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{metrics.metric1.label}</p>
                <p className={`text-xl font-bold ${metrics.metric1.color}`}>
                  {formatValue(metrics.metric1.value, metrics.metric1.type)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{metrics.metric2.label}</p>
                <p className={`text-xl font-bold ${metrics.metric2.color}`}>
                  {formatValue(metrics.metric2.value, metrics.metric2.type)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{metrics.metric3.label}</p>
                <p className={`text-xl font-bold ${metrics.metric3.color}`}>
                  {formatValue(metrics.metric3.value, metrics.metric3.type)}
                </p>
                {metrics.metric4 && (
                  <p className={`text-xs mt-1 ${metrics.metric4.color}`}>
                    {metrics.metric4.value}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Ringkasan Piutang & Utang hanya untuk KEUANGAN */}
        {divisionType === "KEUANGAN" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-blue-600">💳</span>
                  Ringkasan Piutang
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Rekap piutang untuk semua transaksi
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Total Piutang Baru */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🆕</span>
                      <h3 className="font-semibold text-blue-800">
                        Piutang Baru
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      {formatCurrency(
                        entries
                          .filter(
                            (entry) =>
                              (entry as any).transactionType === "PIUTANG_BARU"
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                  {/* Total Piutang Tertagih */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <h3 className="font-semibold text-green-800">
                        Piutang Tertagih
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-2">
                      {formatCurrency(
                        entries
                          .filter(
                            (entry) =>
                              (entry as any).transactionType ===
                              "PIUTANG_TERTAGIH"
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                  {/* Total Piutang Macet */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">⚠️</span>
                      <h3 className="font-semibold text-orange-800">
                        Piutang Macet
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 mt-2">
                      {formatCurrency(
                        entries
                          .filter(
                            (entry) =>
                              (entry as any).transactionType === "PIUTANG_MACET"
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                  {/* Saldo Akhir Piutang */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">💰</span>
                      <h3 className="font-semibold text-purple-800">
                        Saldo Akhir Piutang
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-2">
                      {formatCurrency(
                        entries
                          .filter((entry) =>
                            [
                              "PIUTANG_BARU",
                              "PIUTANG_TERTAGIH",
                              "PIUTANG_MACET",
                            ].includes((entry as any).transactionType)
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Ringkasan Utang */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-red-600">💳</span>
                  Ringkasan Utang
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Rekap utang untuk semua transaksi
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
                        entries
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
                        entries
                          .filter(
                            (entry) =>
                              (entry as any).transactionType === "UTANG_DIBAYAR"
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                  {/* Total Bahan Baku */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">📦</span>
                      <h3 className="font-semibold text-orange-800">
                        Bahan Baku
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 mt-2">
                      {formatCurrency(
                        entries
                          .filter(
                            (entry) => (entry as any).kategori === "BAHAN_BAKU"
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                  {/* Total Bank */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">🏦</span>
                      <h3 className="font-semibold text-purple-800">
                        Bank (HM + Henry)
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-2">
                      {formatCurrency(
                        entries
                          .filter((entry) =>
                            ["BANK_HM", "BANK_HENRY"].includes(
                              (entry as any).kategori
                            )
                          )
                          .reduce((sum, entry) => sum + Number(entry.nilai), 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Transactions Table - ENHANCED */}
        <Card>
          <CardHeader>
            <CardTitle>
              Daftar Transaksi {divisionType === "GENERAL" ? "" : divisionType}
            </CardTitle>
            <CardDescription>
              {filteredEntries.length} entri ditemukan dari {entries.length}{" "}
              total entri divisi {user?.division?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Akun</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Status/Tipe</TableHead>
                    <TableHead>Nilai Utama</TableHead>
                    {/* ✅ CONDITIONAL: Additional columns based on division */}
                    {divisionType === "PRODUKSI" && <TableHead>HPP</TableHead>}
                    {divisionType === "PEMASARAN" && (
                      <TableHead>Target vs Realisasi</TableHead>
                    )}
                    {divisionType === "GUDANG" && (
                      <TableHead>Pemakaian/Stok</TableHead>
                    )}
                    {divisionType === "HRD" && (
                      <TableHead>Detail Kehadiran</TableHead>
                    )}{" "}
                    {/* ✅ NEW: HRD column */}
                    <TableHead>Waktu Input</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const account = accounts.find(
                      (acc: Account) => acc.id === entry.accountId
                    );

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(
                            entry.tanggal || entry.date
                          ).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div>
                            <div className="font-medium">
                              {account?.accountCode || "N/A"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {account?.accountName || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.description || "No description"}
                        </TableCell>
                        <TableCell>{getTransactionBadge(entry)}</TableCell>
                        <TableCell className="font-medium">
                          {account?.valueType === "NOMINAL"
                            ? formatCurrency(entry.nilai)
                            : `${entry.nilai.toLocaleString("id-ID")} unit`}
                        </TableCell>

                        {/* ✅ CONDITIONAL: Additional data columns */}
                        {divisionType === "PRODUKSI" && (
                          <TableCell className="text-sm">
                            {(entry as any).hppAmount
                              ? formatCurrency((entry as any).hppAmount)
                              : "-"}
                          </TableCell>
                        )}

                        {divisionType === "PEMASARAN" && (
                          <TableCell className="text-sm">
                            <div className="space-y-1">
                              <div className="text-blue-600">
                                Target:{" "}
                                {(entry as any).targetAmount
                                  ? formatCurrency((entry as any).targetAmount)
                                  : "-"}
                              </div>
                              <div className="text-green-600">
                                Realisasi:{" "}
                                {(entry as any).realisasiAmount
                                  ? formatCurrency(
                                      (entry as any).realisasiAmount
                                    )
                                  : "-"}
                              </div>
                            </div>
                          </TableCell>
                        )}

                        {divisionType === "GUDANG" && (
                          <TableCell className="text-sm">
                            <div className="space-y-1">
                              <div className="text-orange-600">
                                Pakai:{" "}
                                {(entry as any).pemakaianAmount
                                  ? `${(entry as any).pemakaianAmount} unit`
                                  : "-"}
                              </div>
                              <div className="text-purple-600">
                                Stok:{" "}
                                {(entry as any).stokAkhir
                                  ? `${(entry as any).stokAkhir} unit`
                                  : "-"}
                              </div>
                              {/* ✅ NEW: Show status if both values exist */}
                              {(entry as any).pemakaianAmount &&
                                (entry as any).stokAkhir && (
                                  <div className="text-gray-500 text-xs">
                                    Status:{" "}
                                    {(entry as any).stokAkhir >= 100
                                      ? "✅ Aman"
                                      : "⚠️ Rendah"}
                                  </div>
                                )}
                            </div>
                          </TableCell>
                        )}

                        {/* ✅ NEW: HRD specific column */}
                        {divisionType === "HRD" && (
                          <TableCell className="text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3 text-blue-500" />
                                <span className="text-blue-600">
                                  Status:{" "}
                                  {(entry as any).attendanceStatus ||
                                    "Belum dicatat"}
                                </span>
                              </div>
                              {(entry as any).overtimeHours && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-purple-500" />
                                  <span className="text-purple-600">
                                    Lembur: {(entry as any).overtimeHours} jam
                                  </span>
                                </div>
                              )}
                              {/* ✅ Show shift info if available */}
                              {(entry as any).shift && (
                                <div className="text-gray-500 text-xs">
                                  Shift: {(entry as any).shift}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}

                        <TableCell className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {entries.length === 0
                  ? `Belum ada transaksi yang tercatat untuk divisi ${divisionType}`
                  : "Tidak ada transaksi yang sesuai dengan filter"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientErrorBoundary>
  );
}
