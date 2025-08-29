"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEntriHarianByDate } from "@/lib/data";

interface HRDSummary {
  totalKaryawan: number;
  hadirCount: number;
  tidakHadirCount: number;
  sakitCount: number;
  izinCount: number;
  lemburCount: number;
  attendanceRate: number;
  jumlahLaporan: number;
}

export default function HRDReports() {
  const [summary, setSummary] = useState<HRDSummary>({
    totalKaryawan: 0,
    hadirCount: 0,
    tidakHadirCount: 0,
    sakitCount: 0,
    izinCount: 0,
    lemburCount: 0,
    attendanceRate: 0,
    jumlahLaporan: 0,
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [hrdEntries, setHrdEntries] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const user = getCurrentUser();

  useEffect(() => {
    loadHRDData();
  }, [selectedDate]);

  const loadHRDData = async () => {
    setLoading(true);
    try {
      const entriesResponse = await getEntriHarianByDate(selectedDate);

      if (Array.isArray(entriesResponse)) {
        // Filter data HRD
        const hrdData = entriesResponse.filter(
          (entry: any) =>
            entry.attendanceStatus || entry.absentCount || entry.shift
        );

        setHrdEntries(hrdData);
        calculateHRDSummary(hrdData);

        // Group data by employee for attendance tracking
        const groupedData = groupByEmployee(hrdData);
        setAttendanceData(groupedData);
      }
    } catch (error) {
      console.error("Error loading HRD data:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupByEmployee = (data: any[]) => {
    const grouped: { [key: string]: any } = {};

    data.forEach((entry: any) => {
      const employeeName = entry.account?.accountName || "Unknown Employee";
      if (!grouped[employeeName]) {
        grouped[employeeName] = {
          name: employeeName,
          accountCode: entry.account?.accountCode || "",
          attendanceStatus: entry.attendanceStatus,
          absentCount: Number(entry.absentCount || 0),
          shift: entry.shift,
          keterangan: entry.keterangan || "",
        };
      }
    });

    return Object.values(grouped);
  };

  const calculateHRDSummary = (data: any[]) => {
    const newSummary: HRDSummary = {
      totalKaryawan: 0,
      hadirCount: 0,
      tidakHadirCount: 0,
      sakitCount: 0,
      izinCount: 0,
      lemburCount: 0,
      attendanceRate: 0,
      jumlahLaporan: data.length,
    };

    // Group by employee to avoid counting duplicates
    const employees = new Set();

    data.forEach((entry: any) => {
      const employeeKey = entry.account?.accountName || "unknown";
      employees.add(employeeKey);

      if (entry.attendanceStatus === "HADIR") {
        newSummary.hadirCount++;
      } else if (entry.attendanceStatus === "TIDAK_HADIR") {
        newSummary.tidakHadirCount++;
      } else if (entry.attendanceStatus === "SAKIT") {
        newSummary.sakitCount++;
      } else if (entry.attendanceStatus === "IZIN") {
        newSummary.izinCount++;
      }

      if (entry.shift === "LEMBUR") {
        newSummary.lemburCount++;
      }
    });

    newSummary.totalKaryawan = employees.size;
    newSummary.attendanceRate =
      newSummary.totalKaryawan > 0
        ? (newSummary.hadirCount / newSummary.totalKaryawan) * 100
        : 0;

    setSummary(newSummary);
  };

  const exportToPDF = () => {
    console.log("Exporting HRD report to PDF...");
  };

  const refreshData = () => {
    loadHRDData();
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "HADIR":
        return "text-green-600 bg-green-100";
      case "TIDAK_HADIR":
        return "text-red-600 bg-red-100";
      case "SAKIT":
        return "text-yellow-600 bg-yellow-100";
      case "IZIN":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case "REGULER":
        return "text-blue-600 bg-blue-100";
      case "LEMBUR":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard HRD & Absensi
            </h1>
            <p className="text-gray-600">
              Monitoring kehadiran, izin, dan performa karyawan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Karyawan
                </p>
                <p className="text-2xl font-bold">{summary.totalKaryawan}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Hadir</p>
                <p className="text-2xl font-bold">{summary.hadirCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-400 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Tidak Hadir</p>
                <p className="text-2xl font-bold">{summary.tidakHadirCount}</p>
              </div>
              <UserX className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Tingkat Kehadiran
                </p>
                <p className="text-2xl font-bold">
                  {summary.attendanceRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Breakdown Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600 font-medium">
                    Sakit
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-800">
                  {summary.sakitCount}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">
                    Izin
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-800">
                  {summary.izinCount}
                </p>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">
                  Lembur
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-800">
                {summary.lemburCount}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">
                Progress Kehadiran
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      summary.attendanceRate >= 95
                        ? "bg-green-500"
                        : summary.attendanceRate >= 85
                        ? "bg-blue-500"
                        : summary.attendanceRate >= 75
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(summary.attendanceRate, 100)}%`,
                    }}
                  ></div>
                </div>
                <Badge
                  variant={
                    summary.attendanceRate >= 95
                      ? "default"
                      : summary.attendanceRate >= 85
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {summary.attendanceRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📈 Insights & Rekomendasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Performa Hari Ini
              </h4>
              <p className="text-sm text-green-800">
                {summary.attendanceRate >= 95
                  ? "Tingkat kehadiran sangat baik! Tim bekerja dengan optimal."
                  : summary.attendanceRate >= 85
                  ? "Tingkat kehadiran baik. Pertahankan konsistensi."
                  : summary.attendanceRate >= 75
                  ? "Tingkat kehadiran cukup. Perlu peningkatan motivasi."
                  : "Tingkat kehadiran rendah. Perlu tindakan segera."}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Statistik</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700">Laporan: </span>
                  <span className="font-semibold">{summary.jumlahLaporan}</span>
                </div>
                <div>
                  <span className="text-blue-700">Lembur: </span>
                  <span className="font-semibold">{summary.lemburCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Rekomendasi</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Follow up karyawan yang sering absen</li>
                <li>• Review kebijakan waktu kerja dan lembur</li>
                <li>• Implementasi program wellness karyawan</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            👥 Detail Kehadiran Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Karyawan
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Status Kehadiran
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Shift
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Jumlah Absen
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((employee, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {employee.accountCode}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge
                          className={getAttendanceColor(
                            employee.attendanceStatus
                          )}
                        >
                          {employee.attendanceStatus || "N/A"}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge
                          variant="outline"
                          className={getShiftColor(employee.shift)}
                        >
                          {employee.shift || "N/A"}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`font-semibold ${
                            employee.absentCount > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {employee.absentCount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {employee.keterangan || "-"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada data kehadiran untuk tanggal yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            ⚡ Aksi Cepat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Input Absensi</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Award className="h-5 w-5" />
              <span className="text-sm">Evaluasi Kinerja</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Alert Absen</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              <span className="text-sm">Export Laporan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
