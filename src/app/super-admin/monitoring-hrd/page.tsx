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
  Users,
  UserCheck,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Download,
  AlertCircle,
} from "lucide-react";

interface HrdEntry {
  id: number;
  tanggal_laporan: string;
  account_id: number;
  account_code: string;
  account_name: string;
  attendance_status: string;
  absent_count: number;
  shift: string;
  keterangan_kendala: string;
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

export default function MonitoringHrdPage() {
  const [data, setData] = useState<HrdEntry[]>([]);
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
  const [attendanceStatus, setAttendanceStatus] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limitPerPage, setLimitPerPage] = useState(50);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalEntries: 0,
    totalHadir: 0,
    totalTidakHadir: 0,
    attendanceRate: 0,
  });

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [
    currentPage,
    limitPerPage,
    tanggalStart,
    tanggalEnd,
    attendanceStatus,
    selectedShift,
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limitPerPage.toString(),
      });

      if (tanggalStart) params.append("tanggal_dari", tanggalStart);
      if (tanggalEnd) params.append("tanggal_sampai", tanggalEnd);
      if (attendanceStatus && attendanceStatus !== "all") {
        params.append("attendance_status", attendanceStatus);
      }
      if (selectedShift && selectedShift !== "all") {
        params.append("shift", selectedShift);
      }

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/hrd?${params}`;
      console.log("🔍 Fetching HRD data:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("✅ HRD response:", result);

      if (result.success && result.data) {
        setData(result.data || []);
        setPagination(
          result.pagination || {
            total: 0,
            page: 1,
            limit: 50,
            total_pages: 0,
          }
        );

        // Calculate metrics
        const totalEntries = result.pagination?.total || 0;
        const totalHadir =
          result.data?.filter(
            (item: HrdEntry) => item.attendance_status === "HADIR"
          ).length || 0;
        const totalTidakHadir =
          result.data?.filter(
            (item: HrdEntry) => item.attendance_status === "TIDAK_HADIR"
          ).length || 0;
        const attendanceRate =
          result.data?.length > 0 ? (totalHadir / result.data.length) * 100 : 0;

        setMetrics({
          totalEntries,
          totalHadir,
          totalTidakHadir,
          attendanceRate,
        });
      } else {
        console.error("❌ API Error:", result.message || result.error);
        setData([]);
      }
    } catch (error) {
      console.error("❌ Error fetching HRD data:", error);
      setData([]);
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
    setAttendanceStatus("all");
    setSelectedShift("all");
    setCurrentPage(1);
    setLimitPerPage(50);
  };

  const handleExport = () => {
    const headers = [
      "Tanggal",
      "Kategori Karyawan",
      "Kode",
      "Status Kehadiran",
      "Jumlah",
      "Shift",
      "Keterangan",
      "Dibuat Oleh",
    ];

    const csvData = data.map((item) => [
      new Date(item.tanggal_laporan).toLocaleDateString("id-ID"),
      item.account_name,
      item.account_code,
      item.attendance_status,
      item.absent_count,
      item.shift || "-",
      item.keterangan_kendala || "-",
      item.created_by,
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `monitoring-hrd-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const getAttendanceBadge = (status: string) => {
    const badgeMap: Record<string, { label: string; className: string }> = {
      HADIR: { label: "Hadir", className: "bg-green-100 text-green-800" },
      TIDAK_HADIR: {
        label: "Tidak Hadir",
        className: "bg-red-100 text-red-800",
      },
      SAKIT: { label: "Sakit", className: "bg-yellow-100 text-yellow-800" },
      IZIN: { label: "Izin", className: "bg-blue-100 text-blue-800" },
    };
    const badge = badgeMap[status] || {
      label: status || "Unknown",
      className: "bg-gray-100 text-gray-800",
    };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  // Client-side search filter
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.account_name?.toLowerCase().includes(search) ||
      item.account_code?.toLowerCase().includes(search) ||
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
        <h1 className="text-3xl font-bold text-gray-900">Monitoring HRD</h1>
        <p className="text-gray-600 mt-2">
          Monitor data kehadiran dan absensi karyawan
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Data</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalEntries}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hadir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalHadir}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tidak Hadir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalTidakHadir}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.attendanceRate.toFixed(1)}%
                </p>
              </div>
              <div
                className={`h-12 w-12 ${
                  metrics.attendanceRate >= 90
                    ? "bg-green-100"
                    : metrics.attendanceRate >= 80
                    ? "bg-yellow-100"
                    : "bg-red-100"
                } rounded-lg flex items-center justify-center`}
              >
                <Clock
                  className={`h-6 w-6 ${
                    metrics.attendanceRate >= 90
                      ? "text-green-600"
                      : metrics.attendanceRate >= 80
                      ? "text-yellow-600"
                      : "text-red-600"
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
                placeholder="Cari karyawan, keterangan..."
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
              value={attendanceStatus}
              onValueChange={setAttendanceStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status Kehadiran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="HADIR">Hadir</SelectItem>
                <SelectItem value="TIDAK_HADIR">Tidak Hadir</SelectItem>
                <SelectItem value="SAKIT">Sakit</SelectItem>
                <SelectItem value="IZIN">Izin</SelectItem>
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
            <CardTitle>Data Kehadiran Karyawan</CardTitle>
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
                  <TableHead>Kategori Karyawan</TableHead>
                  <TableHead className="text-center">
                    Status Kehadiran
                  </TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada data ditemukan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => {
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
                          <div>
                            <div className="font-medium">
                              {item.account_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.account_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getAttendanceBadge(item.attendance_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{item.absent_count}</div>
                          <div className="text-xs text-gray-500">orang</div>
                        </TableCell>
                        <TableCell>
                          {item.shift ? (
                            <Badge variant="outline">{item.shift}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {item.keterangan_kendala ? (
                              <div className="flex items-start gap-1">
                                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600">
                                  {item.keterangan_kendala}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
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
