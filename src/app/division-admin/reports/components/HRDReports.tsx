"use client";

import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Heart,
  FileText,
  TrendingUp,
  Award,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getCurrentUser } from "@/lib/auth";
import { toastError, toastSuccess } from "@/lib/toast-utils";
import { hrdAPI } from "@/lib/api";

interface HRDSummary {
  total_entri: number;
  total_karyawan: number;
  hadir: number;
  tidak_hadir: number;
  sakit: number;
  izin: number;
  shift_reguler: number;
  shift_lembur: number;
  attendance_rate: string;
}

interface StatusData {
  attendance_status: string;
  jumlah_entri: number;
  total_karyawan: number;
}

interface ShiftData {
  shift: string;
  jumlah_entri: number;
  total_karyawan: number;
}

interface DailyTrend {
  id: number;
  tanggal_laporan: string;
  account_code: string;
  account_name: string;
  attendance_status: string;
  shift: string;
  total_karyawan: number;
  hadir: number;
  tidak_hadir: number;
  sakit: number;
  izin: number;
  created_at: string;
}

interface AccountData {
  account_code: string;
  account_name: string;
  jumlah_entri: number;
  total_karyawan: number;
}

interface HRDStatistics {
  periode: {
    dari: string;
    sampai: string;
  };
  summary: HRDSummary;
  by_status: StatusData[];
  by_shift: ShiftData[];
  daily_trend: DailyTrend[];
  by_account: AccountData[];
}

const COLORS = {
  hadir: "#22c55e",
  tidak_hadir: "#ef4444",
  sakit: "#f97316",
  izin: "#3b82f6",
  reguler: "#8b5cf6",
  lembur: "#eab308",
};

export default function HRDReports() {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<HRDStatistics | null>(null);
  const [dateRange, setDateRange] = useState({
    dari: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    sampai: new Date().toISOString().split("T")[0],
  });

  const user = getCurrentUser();

  useEffect(() => {
    loadHRDStatistics();
  }, [dateRange]);

  const loadHRDStatistics = async () => {
    setLoading(true);
    try {
      const response = await hrdAPI.getStatisticsWithParams(
        dateRange.dari,
        dateRange.sampai
      );

      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        throw new Error(
          response.message || response.error || "Gagal memuat data"
        );
      }
    } catch (error: any) {
      console.error("Error loading HRD statistics:", error);
      toastError.custom(error.message || "Gagal memuat statistik HRD");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadHRDStatistics();
    toastSuccess.custom("Data berhasil diperbarui");
  };

  const handleExportPDF = () => {
    toastSuccess.custom("Fitur export PDF akan segera hadir");
  };

  // Prepare data untuk charts
  const getAttendanceChartData = () => {
    if (!statistics) return [];
    const { summary } = statistics;
    return [
      { name: "Hadir", value: Number(summary.hadir), color: COLORS.hadir },
      {
        name: "Tidak Hadir",
        value: Number(summary.tidak_hadir),
        color: COLORS.tidak_hadir,
      },
      { name: "Sakit", value: Number(summary.sakit), color: COLORS.sakit },
      { name: "Izin", value: Number(summary.izin), color: COLORS.izin },
    ].filter((item) => item.value > 0);
  };

  const getShiftChartData = () => {
    if (!statistics) return [];
    const { summary } = statistics;
    return [
      {
        name: "Reguler",
        value: Number(summary.shift_reguler),
        color: COLORS.reguler,
      },
      {
        name: "Lembur",
        value: Number(summary.shift_lembur),
        color: COLORS.lembur,
      },
    ].filter((item) => item.value > 0);
  };

  const getTrendChartData = () => {
    if (!statistics?.daily_trend) return [];
    return statistics.daily_trend.map((item, index) => {
      const entryNumber = index + 1;
      const totalEntries = statistics.daily_trend.length;
      return {
        index: entryNumber,
        label: `#${entryNumber}`,
        tooltip: `Entry #${entryNumber}\n${new Date(item.tanggal_laporan).toLocaleDateString("id-ID")}\n${item.account_name}\n${item.attendance_status}`,
        tanggal: new Date(item.tanggal_laporan).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        kategori: item.account_name,
        status: item.attendance_status,
        Hadir: Number(item.hadir),
        "Tidak Hadir": Number(item.tidak_hadir),
        Sakit: Number(item.sakit),
        Izin: Number(item.izin),
        Total: Number(item.total_karyawan),
      };
    });
  };

  if (loading && !statistics) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const summary = statistics?.summary || {
    total_entri: 0,
    total_karyawan: 0,
    hadir: 0,
    tidak_hadir: 0,
    sakit: 0,
    izin: 0,
    shift_reguler: 0,
    shift_lembur: 0,
    attendance_rate: "0",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard HRD & Absensi
            </h1>
            <p className="text-gray-600 mt-1">
              Monitoring kehadiran, shift, dan performa karyawan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dari">Dari Tanggal</Label>
              <Input
                id="dari"
                type="date"
                value={dateRange.dari}
                onChange={(e) =>
                  setDateRange({ ...dateRange, dari: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="sampai">Sampai Tanggal</Label>
              <Input
                id="sampai"
                type="date"
                value={dateRange.sampai}
                onChange={(e) =>
                  setDateRange({ ...dateRange, sampai: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <Button onClick={loadHRDStatistics} disabled={loading}>
              <Calendar className="h-4 w-4 mr-2" />
              Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Karyawan
                </p>
                <p className="text-4xl font-bold">{summary.total_karyawan}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {summary.total_entri} laporan
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Hadir</p>
                <p className="text-4xl font-bold">{summary.hadir}</p>
                <p className="text-green-100 text-xs mt-1">
                  {summary.attendance_rate}% kehadiran
                </p>
              </div>
              <UserCheck className="h-12 w-12 text-green-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">
                  Tidak Hadir
                </p>
                <p className="text-4xl font-bold">{summary.tidak_hadir}</p>
                <p className="text-red-100 text-xs mt-1">Total absensi</p>
              </div>
              <UserX className="h-12 w-12 text-red-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Tingkat Kehadiran
                </p>
                <p className="text-4xl font-bold">{summary.attendance_rate}%</p>
                <p className="text-purple-100 text-xs mt-1">
                  Rata-rata periode
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-200 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Heart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sakit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.sakit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Izin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.izin}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shift Reguler</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.shift_reguler}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shift Lembur</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.shift_lembur}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Attendance & Shift Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Distribusi Status Kehadiran
            </CardTitle>
            <CardDescription>
              Breakdown status kehadiran karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getAttendanceChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getAttendanceChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getAttendanceChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>Belum ada data kehadiran</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shift Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Distribusi Shift Kerja
            </CardTitle>
            <CardDescription>
              Perbandingan shift reguler vs lembur
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getShiftChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getShiftChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Jumlah Karyawan">
                    {getShiftChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>Belum ada data shift</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Tren Kehadiran (200 Data Terakhir)
          </CardTitle>
          <CardDescription>
            Grafik rolling 200 entry terakhir - Data baru masuk, data lama keluar. Scroll ke kanan untuk melihat data terbaru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getTrendChartData().length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div style={{ width: Math.max(getTrendChartData().length * 20, 800), minWidth: '100%' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getTrendChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="index"
                      label={{ value: 'Entry Number', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 10 }}
                      interval={getTrendChartData().length > 50 ? Math.floor(getTrendChartData().length / 50) : 0}
                    />
                    <YAxis label={{ value: 'Jumlah Karyawan', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                              <p className="font-semibold text-sm mb-1">Entry #{data.index}</p>
                              <p className="text-xs text-gray-600">{data.tanggal}</p>
                              <p className="text-xs text-gray-600 mb-2">{data.kategori} - {data.status}</p>
                              {payload.map((entry, index) => (
                                entry.dataKey !== 'index' && entry.value > 0 && (
                                  <p key={index} className="text-xs" style={{ color: entry.color }}>
                                    {entry.name}: {entry.value}
                                  </p>
                                )
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                <Line
                  type="monotone"
                  dataKey="Hadir"
                  stroke={COLORS.hadir}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tidak Hadir"
                  stroke={COLORS.tidak_hadir}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Sakit"
                  stroke={COLORS.sakit}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Izin"
                  stroke={COLORS.izin}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Total"
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Belum ada data tren harian</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tables Row: Status & Account Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown per Status</CardTitle>
            <CardDescription>
              Detail kehadiran berdasarkan status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statistics?.by_status && statistics.by_status.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Entri</TableHead>
                    <TableHead className="text-right">Total Karyawan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.by_status.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge
                          className={
                            item.attendance_status === "HADIR"
                              ? "bg-green-100 text-green-800"
                              : item.attendance_status === "TIDAK_HADIR"
                              ? "bg-red-100 text-red-800"
                              : item.attendance_status === "SAKIT"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {item.attendance_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.jumlah_entri}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.total_karyawan}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Belum ada data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Account Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown per Kategori</CardTitle>
            <CardDescription>
              Detail kehadiran berdasarkan kategori karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statistics?.by_account && statistics.by_account.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Entri</TableHead>
                      <TableHead className="text-right">
                        Total Karyawan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.by_account.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">
                              {item.account_code}
                            </span>
                            <span className="text-sm">{item.account_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.jumlah_entri}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.total_karyawan}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Belum ada data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Insights & Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                📊 Performa Kehadiran
              </h4>
              <p className="text-sm text-green-800">
                {parseFloat(summary.attendance_rate) >= 95
                  ? "Excellent! Tingkat kehadiran sangat tinggi. Tim bekerja dengan optimal."
                  : parseFloat(summary.attendance_rate) >= 85
                  ? "Bagus! Tingkat kehadiran baik. Pertahankan konsistensi."
                  : parseFloat(summary.attendance_rate) >= 75
                  ? "Cukup baik. Masih ada ruang untuk peningkatan motivasi."
                  : "Perlu perhatian khusus. Tingkat kehadiran perlu ditingkatkan."}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                💡 Statistik Utama
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  • Total Laporan: <strong>{summary.total_entri}</strong>
                </p>
                <p>
                  • Karyawan Sakit:{" "}
                  <strong>
                    {summary.sakit} (
                    {summary.total_karyawan > 0
                      ? (
                          (summary.sakit / summary.total_karyawan) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </strong>
                </p>
                <p>
                  • Shift Lembur:{" "}
                  <strong>
                    {summary.shift_lembur} (
                    {summary.total_karyawan > 0
                      ? (
                          (summary.shift_lembur / summary.total_karyawan) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </strong>
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">
                ⚠️ Area Perhatian
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                {summary.sakit > summary.total_karyawan * 0.1 && (
                  <li>
                    • Tingkat sakit cukup tinggi, pertimbangkan program
                    kesehatan
                  </li>
                )}
                {summary.shift_lembur > summary.total_karyawan * 0.3 && (
                  <li>• Lembur cukup tinggi, evaluasi beban kerja</li>
                )}
                {summary.tidak_hadir > summary.total_karyawan * 0.05 && (
                  <li>• Follow up karyawan yang sering tidak hadir</li>
                )}
                {summary.sakit <= summary.total_karyawan * 0.1 &&
                  summary.shift_lembur <= summary.total_karyawan * 0.3 &&
                  summary.tidak_hadir <= summary.total_karyawan * 0.05 && (
                    <li>• Tidak ada area yang memerlukan perhatian khusus</li>
                  )}
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">
                🎯 Rekomendasi Aksi
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Implementasi sistem reward untuk kehadiran konsisten</li>
                <li>• Review kebijakan shift dan kompensasi lembur</li>
                <li>• Program wellness untuk menurunkan tingkat sakit</li>
                <li>• Monitoring rutin karyawan dengan absensi rendah</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
