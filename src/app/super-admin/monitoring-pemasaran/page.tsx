"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Users,
  Package,
  Target,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Download,
} from "lucide-react";

interface LaporanPenjualan {
  id: number;
  tanggal_laporan: string;
  salesperson_id: number;
  salesperson_nama: string;
  product_account_id: number;
  product_code: string;
  product_name: string;
  target_kuantitas: number;
  realisasi_kuantitas: number;
  keterangan_kendala: string;
  created_by: string;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function MonitoringPemasaranPage() {
  const [data, setData] = useState<LaporanPenjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    total_pages: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [tanggalStart, setTanggalStart] = useState("");
  const [tanggalEnd, setTanggalEnd] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limitPerPage, setLimitPerPage] = useState(50);

  // Salespeople untuk filter
  const [salespeople, setSalespeople] = useState<
    { id: number; nama: string }[]
  >([]);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalTarget: 0,
    totalRealisasi: 0,
    achievementRate: 0,
    totalLaporan: 0,
  });

  // Fetch salespeople list
  useEffect(() => {
    fetchSalespeople();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [
    currentPage,
    limitPerPage,
    tanggalStart,
    tanggalEnd,
    selectedSalesperson,
  ]);

  const fetchSalespeople = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/salespeople`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success && result.data) {
        setSalespeople(result.data);
      }
    } catch (error) {
      console.error("Error fetching salespeople:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limitPerPage.toString(),
      });

      if (tanggalStart) params.append("tanggal_start", tanggalStart);
      if (tanggalEnd) params.append("tanggal_end", tanggalEnd);
      if (selectedSalesperson && selectedSalesperson !== "all") {
        params.append("salesperson_id", selectedSalesperson);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/laporan-penjualan?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setPagination(
          result.pagination || {
            total: 0,
            page: currentPage,
            limit: limitPerPage,
            total_pages: 0,
          }
        );

        // Calculate metrics
        const totalTarget =
          result.data?.reduce(
            (sum: number, item: LaporanPenjualan) =>
              sum + Number(item.target_kuantitas || 0),
            0
          ) || 0;
        const totalRealisasi =
          result.data?.reduce(
            (sum: number, item: LaporanPenjualan) =>
              sum + Number(item.realisasi_kuantitas || 0),
            0
          ) || 0;

        setMetrics({
          totalTarget,
          totalRealisasi,
          achievementRate:
            totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0,
          totalLaporan: result.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleReset = () => {
    setSearchTerm("");
    setTanggalStart("");
    setTanggalEnd("");
    setSelectedSalesperson("all");
    setCurrentPage(1);
    setLimitPerPage(50);
  };

  const handleExport = () => {
    // Convert data to CSV
    const headers = [
      "Tanggal",
      "Salesperson",
      "Produk",
      "Target",
      "Realisasi",
      "Achievement %",
      "Kendala",
    ];

    const csvData = data.map((item) => {
      const achievement =
        item.target_kuantitas > 0
          ? ((item.realisasi_kuantitas / item.target_kuantitas) * 100).toFixed(
              1
            )
          : "0";
      return [
        new Date(item.tanggal_laporan).toLocaleDateString("id-ID"),
        item.salesperson_nama,
        `${item.product_code} - ${item.product_name}`,
        item.target_kuantitas,
        item.realisasi_kuantitas,
        achievement,
        item.keterangan_kendala || "-",
      ];
    });

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `monitoring-pemasaran-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

  // Client-side search filter
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.salesperson_nama?.toLowerCase().includes(search) ||
      item.product_name?.toLowerCase().includes(search) ||
      item.product_code?.toLowerCase().includes(search) ||
      item.keterangan_kendala?.toLowerCase().includes(search)
    );
  });

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Monitoring Pemasaran
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor performa penjualan dan analisis pencapaian target
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalLaporan}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Target</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalTarget)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Realisasi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalRealisasi)}
                </p>
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
                <p className="text-sm text-gray-600">Achievement Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.achievementRate.toFixed(1)}%
                </p>
              </div>
              <div
                className={`h-12 w-12 ${
                  metrics.achievementRate >= 100
                    ? "bg-green-100"
                    : "bg-orange-100"
                } rounded-lg flex items-center justify-center`}
              >
                <Users
                  className={`h-6 w-6 ${
                    metrics.achievementRate >= 100
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari salesperson, produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={tanggalStart}
                onChange={(e) => setTanggalStart(e.target.value)}
                className="pl-10"
                placeholder="Tanggal Mulai"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={tanggalEnd}
                onChange={(e) => setTanggalEnd(e.target.value)}
                className="pl-10"
                placeholder="Tanggal Akhir"
              />
            </div>

            <Select
              value={selectedSalesperson}
              onValueChange={setSelectedSalesperson}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Salesperson</SelectItem>
                {salespeople.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id.toString()}>
                    {sp.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Data Laporan Penjualan</CardTitle>
            <CardDescription>
              Menampilkan {filteredData.length} dari {pagination.total} data |
              Halaman {pagination.page} dari {pagination.total_pages}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={limitPerPage.toString()}
              onValueChange={(val) => {
                setLimitPerPage(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 / halaman</SelectItem>
                <SelectItem value="50">50 / halaman</SelectItem>
                <SelectItem value="100">100 / halaman</SelectItem>
                <SelectItem value="200">200 / halaman</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Realisasi</TableHead>
                  <TableHead className="text-center">Achievement</TableHead>
                  <TableHead>Kendala</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada data ditemukan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => {
                    const achievement =
                      item.target_kuantitas > 0
                        ? (item.realisasi_kuantitas / item.target_kuantitas) *
                          100
                        : 0;
                    const rowNumber =
                      (pagination.page - 1) * pagination.limit + index + 1;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {rowNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(item.tanggal_laporan).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {item.salesperson_nama}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.product_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.target_kuantitas)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.realisasi_kuantitas)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              achievement >= 100
                                ? "bg-green-100 text-green-800"
                                : achievement >= 75
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {achievement.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {item.keterangan_kendala || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {item.created_by}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                dari {pagination.total} data
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm font-medium">
                    Halaman {pagination.page} dari {pagination.total_pages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.total_pages)
                    )
                  }
                  disabled={pagination.page === pagination.total_pages}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
