"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Factory,
  TrendingUp,
  AlertTriangle,
  Package,
  Settings,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLaporanProduksi } from "@/lib/data";

// Helper function untuk format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface ProduksiSummary {
  totalHasilProduksi: number;
  totalBarangGagal: number;
  totalStockBarangJadi: number;
  totalHpBarangJadi: number;
  efisiensiProduksi: number;
  jumlahLaporan: number;
  statusProduksi: string;
}

export default function ProduksiReports() {
  const [summary, setSummary] = useState<ProduksiSummary>({
    totalHasilProduksi: 0,
    totalBarangGagal: 0,
    totalStockBarangJadi: 0,
    totalHpBarangJadi: 0,
    efisiensiProduksi: 0,
    jumlahLaporan: 0,
    statusProduksi: "Normal",
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [laporanProduksi, setLaporanProduksi] = useState<any[]>([]);

  const user = getCurrentUser();

  useEffect(() => {
    loadProduksiData();
  }, [selectedDate]);

  const loadProduksiData = async () => {
    setLoading(true);
    try {
      const produksiResponse = await getLaporanProduksi();

      if (Array.isArray(produksiResponse)) {
        // Filter data untuk tanggal yang dipilih
        const filteredData = produksiResponse.filter((item: any) => {
          const itemDate = new Date(item.tanggalLaporan || item.createdAt)
            .toISOString()
            .split("T")[0];
          return itemDate === selectedDate;
        });

        setLaporanProduksi(filteredData);
        calculateProduksiSummary(filteredData);
      }
    } catch (error) {
      console.error("Error loading produksi data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProduksiSummary = (data: any[]) => {
    const newSummary: ProduksiSummary = {
      totalHasilProduksi: 0,
      totalBarangGagal: 0,
      totalStockBarangJadi: 0,
      totalHpBarangJadi: 0,
      efisiensiProduksi: 0,
      jumlahLaporan: data.length,
      statusProduksi: "Normal",
    };

    data.forEach((item: any) => {
      newSummary.totalHasilProduksi += Number(
        item.hasilProduksi || item.hasil_produksi || 0
      );
      newSummary.totalBarangGagal += Number(
        item.barangGagal || item.barang_gagal || 0
      );
      newSummary.totalStockBarangJadi += Number(
        item.stockBarangJadi || item.stock_barang_jadi || 0
      );
      newSummary.totalHpBarangJadi += Number(
        item.hpBarangJadi || item.hp_barang_jadi || 0
      );
    });

    // Calculate efficiency (percentage of good products)
    const totalProduksi =
      newSummary.totalHasilProduksi + newSummary.totalBarangGagal;
    newSummary.efisiensiProduksi =
      totalProduksi > 0
        ? (newSummary.totalHasilProduksi / totalProduksi) * 100
        : 0;

    // Determine production status
    if (newSummary.efisiensiProduksi >= 95) {
      newSummary.statusProduksi = "Excellent";
    } else if (newSummary.efisiensiProduksi >= 85) {
      newSummary.statusProduksi = "Good";
    } else if (newSummary.efisiensiProduksi >= 75) {
      newSummary.statusProduksi = "Fair";
    } else {
      newSummary.statusProduksi = "Needs Attention";
    }

    setSummary(newSummary);
  };

  const exportToPDF = () => {
  };

  const refreshData = () => {
    loadProduksiData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "text-green-600 bg-green-100";
      case "Good":
        return "text-blue-600 bg-blue-100";
      case "Fair":
        return "text-yellow-600 bg-yellow-100";
      case "Needs Attention":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
            <Factory className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Produksi
            </h1>
            <p className="text-gray-600">
              Monitoring hasil produksi, efisiensi, dan kualitas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
        <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Hasil Produksi
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalHasilProduksi.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-400 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Barang Gagal</p>
                <p className="text-2xl font-bold">
                  {summary.totalBarangGagal.toLocaleString()}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Efisiensi</p>
                <p className="text-2xl font-bold">
                  {summary.efisiensiProduksi.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Stock Barang Jadi
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalStockBarangJadi.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Status Produksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status Hari Ini:</span>
              <Badge className={getStatusColor(summary.statusProduksi)}>
                {summary.statusProduksi}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">
                Tingkat Efisiensi
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      summary.efisiensiProduksi >= 95
                        ? "bg-green-500"
                        : summary.efisiensiProduksi >= 85
                        ? "bg-blue-500"
                        : summary.efisiensiProduksi >= 75
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(summary.efisiensiProduksi, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {summary.efisiensiProduksi.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">
                  HP Barang Jadi
                </p>
                <p className="text-lg font-bold text-orange-800">
                  {formatCurrency(summary.totalHpBarangJadi)}
                </p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">Laporan</p>
                <p className="text-lg font-bold text-indigo-800">
                  {summary.jumlahLaporan}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              🎯 Target & Rekomendasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Target Efisiensi
              </h4>
              <p className="text-sm text-blue-800">
                Tingkatkan efisiensi produksi hingga mencapai minimal 95% untuk
                performa optimal.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Peringatan</h4>
              <p className="text-sm text-yellow-800">
                {summary.efisiensiProduksi < 75
                  ? "Efisiensi produksi rendah. Perlu investigasi segera!"
                  : summary.totalBarangGagal > summary.totalHasilProduksi * 0.1
                  ? "Tingkat barang gagal tinggi. Periksa kualitas bahan baku."
                  : "Produksi berjalan dengan baik. Pertahankan kualitas."}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Rekomendasi</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Monitor kualitas bahan baku secara berkala</li>
                <li>• Maintenance mesin produksi sesuai jadwal</li>
                <li>• Training operator untuk meningkatkan skill</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            🏭 Detail Produksi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : laporanProduksi.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Produk
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Hasil Produksi
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Barang Gagal
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Stock
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      HP
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Efisiensi
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Kendala
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {laporanProduksi.map((item, index) => {
                    const hasilProduksi = Number(
                      item.hasilProduksi || item.hasil_produksi || 0
                    );
                    const barangGagal = Number(
                      item.barangGagal || item.barang_gagal || 0
                    );
                    const efisiensi =
                      hasilProduksi + barangGagal > 0
                        ? (hasilProduksi / (hasilProduksi + barangGagal)) * 100
                        : 0;

                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.account?.accountName || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.account?.accountCode || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-green-600 font-semibold">
                            {hasilProduksi.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-red-600 font-semibold">
                            {barangGagal.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          {Number(
                            item.stockBarangJadi || item.stock_barang_jadi || 0
                          ).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          {formatCurrency(
                            Number(
                              item.hpBarangJadi || item.hp_barang_jadi || 0
                            )
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge
                            variant={
                              efisiensi >= 95
                                ? "default"
                                : efisiensi >= 85
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {efisiensi.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {item.keteranganKendala ||
                              item.keterangan_kendala ||
                              "-"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada data produksi untuk tanggal yang dipilih</p>
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
              <span className="text-sm">Input Produksi</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">Maintenance</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm">Analisis Trend</span>
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
