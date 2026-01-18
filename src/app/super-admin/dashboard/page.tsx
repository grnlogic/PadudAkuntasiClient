"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// Import the correct auth function or use localStorage directly
// If your auth module exports a different function, adjust accordingly
// For now, using localStorage directly as a common pattern
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

interface DivisionStat {
  division: string;
  totalEntries: number;
  todayEntries: number;
  totalAmount: number;
  lastActivity: string | null;
}

interface EntryData {
  id: number;
  tanggal_laporan: string;
  account_code: string;
  account_name: string;
  division: string;
  transaction_type: string;
  nilai: number;
  description: string;
  created_by: string;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function DashboardPage() {
  // Data states
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [divisionStats, setDivisionStats] = useState<DivisionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination & Filter states
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    total_pages: 0,
  });
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limitPerPage, setLimitPerPage] = useState(50);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    totalTransaksi: 0,
    activeDivisions: 0,
  });

  useEffect(() => {
    loadData();
  }, [currentPage, limitPerPage, selectedDivision, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.error("Token tidak ditemukan");
        return;
      }

      // Build query parameters dengan pagination
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limitPerPage.toString(),
        sort_by: "tanggal_laporan",
        sort_order: "DESC",
      });

      if (selectedDate) {
        params.append("tanggal_dari", selectedDate);
        params.append("tanggal_sampai", selectedDate);
      }

      if (selectedDivision !== "all") {
        // Ambil division_id dari nama divisi
        const divisionMap: { [key: string]: number } = {
          Keuangan: 1,
          Produksi: 2,
          Penjualan: 3,
          Pembelian: 4,
          HRD: 5,
        };
        const divisionId = divisionMap[selectedDivision];
        if (divisionId) {
          params.append("division_id", divisionId.toString());
        }
      }

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/entri-harian?${params}`;
      console.log("🔍 Fetching dashboard data:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("✅ Dashboard response:", result);

      if (result.success && result.data) {
        setEntries(result.data);
        setPagination(result.pagination);

        // Calculate summary stats dari data yang di-fetch
        calculateSummaryStats(result.data);
      }

      // Load division stats (summary saja, tidak perlu semua data)
      await loadDivisionStats();
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDivisionStats = async () => {
    try {
      const token = getToken();

      // Fetch accounts untuk mendapatkan division info
      const accountsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/accounts?limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const accountsResult = await accountsResponse.json();
      const accounts = accountsResult.data || [];

      // Group by division
      const divisions = [
        ...new Set(accounts.map((a: any) => a.division?.name).filter(Boolean)),
      ];

      // Untuk setiap divisi, ambil summary stats (count saja, tidak ambil semua data)
      const stats = await Promise.all(
        divisions.map(async (division: any) => {
          const divisionAccounts = accounts.filter(
            (a: any) => a.division?.name === division
          );
          const accountIds = divisionAccounts.map((acc: any) => acc.id);

          if (accountIds.length === 0) {
            return {
              division,
              totalEntries: 0,
              todayEntries: 0,
              totalAmount: 0,
              lastActivity: null,
            };
          }

          // Query count untuk divisi ini (tanpa limit)
          const params = new URLSearchParams({
            division_id: divisionAccounts[0].division_id.toString(),
            limit: "1", // Ambil 1 saja untuk dapat pagination info
          });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/entri-harian?${params}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const result = await response.json();
          const totalEntries = result.pagination?.total || 0;

          // Query untuk hari ini
          const today = new Date().toISOString().split("T")[0];
          const todayParams = new URLSearchParams({
            division_id: divisionAccounts[0].division_id.toString(),
            tanggal_dari: today,
            tanggal_sampai: today,
            limit: "1",
          });

          const todayResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/entri-harian?${todayParams}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const todayResult = await todayResponse.json();
          const todayEntries = todayResult.pagination?.total || 0;

          // Ambil entry terakhir untuk last activity
          const lastEntry = result.data?.[0];

          return {
            division,
            totalEntries,
            todayEntries,
            totalAmount: 0, // Bisa dihitung jika perlu
            lastActivity: lastEntry?.created_at || null,
          };
        })
      );

      setDivisionStats(stats);
    } catch (error) {
      console.error("❌ Error loading division stats:", error);
    }
  };

  const calculateSummaryStats = (data: EntryData[]) => {
    const penerimaan = data
      .filter((e) => e.transaction_type === "PENERIMAAN")
      .reduce((sum, e) => sum + Math.abs(e.nilai || 0), 0);

    const pengeluaran = data
      .filter((e) => e.transaction_type === "PENGELUARAN")
      .reduce((sum, e) => sum + Math.abs(e.nilai || 0), 0);

    const uniqueDivisions = new Set(data.map((e) => e.division).filter(Boolean))
      .size;

    setSummaryStats({
      totalPenerimaan: penerimaan,
      totalPengeluaran: pengeluaran,
      totalTransaksi: data.length,
      activeDivisions: uniqueDivisions,
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadData();
  };

  const handleReset = () => {
    setSelectedDivision("all");
    setSelectedDate("");
    setSearchTerm("");
    setCurrentPage(1);
    setLimitPerPage(50);
  };

  const handleExport = () => {
    const headers = [
      "Tanggal",
      "Divisi",
      "Kode Akun",
      "Nama Akun",
      "Tipe",
      "Nominal",
      "Keterangan",
      "Dibuat Oleh",
    ];

    const csvData = filteredEntries.map((entry) => [
      new Date(entry.tanggal_laporan).toLocaleDateString("id-ID"),
      entry.division || "-",
      entry.account_code,
      entry.account_name,
      entry.transaction_type || "-",
      entry.nilai,
      entry.description || "-",
      entry.created_by,
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDivisionColor = (division: string) => {
    const colors: { [key: string]: string } = {
      Keuangan: "bg-blue-100 text-blue-800",
      Produksi: "bg-yellow-100 text-yellow-800",
      Penjualan: "bg-green-100 text-green-800",
      Pembelian: "bg-purple-100 text-purple-800",
      HRD: "bg-pink-100 text-pink-800",
    };
    return colors[division] || "bg-gray-100 text-gray-800";
  };

  // Client-side search filter (untuk data yang sudah di-fetch)
  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      entry.account_name?.toLowerCase().includes(search) ||
      entry.account_code?.toLowerCase().includes(search) ||
      entry.description?.toLowerCase().includes(search)
    );
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Pemantauan
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor seluruh aktivitas sistem dari semua divisi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Transaksi
                </p>
                <p className="text-2xl font-bold">{pagination.total || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Dari semua divisi</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Penerimaan
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summaryStats.totalPenerimaan)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Halaman ini</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Pengeluaran
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summaryStats.totalPengeluaran)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Halaman ini</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Divisi Aktif
                </p>
                <p className="text-2xl font-bold">{divisionStats.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total divisi</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Division Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {divisionStats.map((stat) => (
          <Card key={stat.division}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Badge className={getDivisionColor(stat.division)}>
                  {stat.division}
                </Badge>
                <div>
                  <p className="text-2xl font-bold">{stat.todayEntries}</p>
                  <p className="text-xs text-gray-500">entri hari ini</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Total: {stat.totalEntries} entri
                  </p>
                  {stat.lastActivity && (
                    <p className="text-xs text-gray-500">
                      Terakhir:{" "}
                      {new Date(stat.lastActivity).toLocaleTimeString("id-ID")}
                    </p>
                  )}
                </div>
                {stat.todayEntries === 0 && (
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Input
                placeholder="Cari akun, keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={selectedDivision}
              onValueChange={setSelectedDivision}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi</SelectItem>
                <SelectItem value="Keuangan">Keuangan</SelectItem>
                <SelectItem value="Produksi">Produksi</SelectItem>
                <SelectItem value="Penjualan">Penjualan</SelectItem>
                <SelectItem value="Pembelian">Pembelian</SelectItem>
                <SelectItem value="HRD">HRD</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={limitPerPage.toString()}
              onValueChange={(val) => {
                setLimitPerPage(parseInt(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per halaman</SelectItem>
                <SelectItem value="50">50 per halaman</SelectItem>
                <SelectItem value="100">100 per halaman</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset} className="w-full">
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas Detail</CardTitle>
          <CardDescription>
            Menampilkan {filteredEntries.length} dari {pagination.total} total
            aktivitas | Halaman {pagination.page} dari {pagination.total_pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(entry.tanggal_laporan).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleTimeString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDivisionColor(entry.division)}>
                        {entry.division || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {entry.account_code}
                        </span>
                        <span className="text-xs text-gray-600">
                          {entry.account_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || "-"}
                    </TableCell>
                    <TableCell>
                      {entry.transaction_type ? (
                        <Badge
                          variant={
                            entry.transaction_type === "PENERIMAAN"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {entry.transaction_type}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span
                        className={
                          entry.transaction_type === "PENERIMAAN"
                            ? "text-green-600"
                            : entry.transaction_type === "PENGELUARAN"
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {formatCurrency(Math.abs(entry.nilai || 0))}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {entry.created_by}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data yang sesuai dengan filter
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                dari {pagination.total} entri
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.total_pages))].map(
                    (_, idx) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= pagination.total_pages - 2) {
                        pageNum = pagination.total_pages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Dashboard Pemantauan Real-time
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Dashboard ini menggunakan pagination server-side untuk performa
                optimal. Data statistik divisi diambil secara efisien tanpa
                memuat seluruh data. Filter dan pencarian bekerja dengan cepat
                untuk membantu Anda menemukan informasi yang dibutuhkan.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">
                  ✅ Server-side Pagination
                </Badge>
                <Badge variant="outline" className="bg-white">
                  ✅ Efficient Data Loading
                </Badge>
                <Badge variant="outline" className="bg-white">
                  ✅ Real-time Monitoring
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
