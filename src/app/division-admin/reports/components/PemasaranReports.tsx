"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  Users,
  ShoppingCart,
  BarChart3,
  Star,
  Award,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLaporanPenjualanProduk, getSalespeople } from "@/lib/data";

// Helper function untuk format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface PemasaranSummary {
  totalTarget: number;
  totalRealisasi: number;
  totalRetur: number;
  jumlahSales: number;
  pencapaianRate: number;
  topProduct: string;
  topSales: string;
}

export default function PemasaranReports() {
  const [summary, setSummary] = useState<PemasaranSummary>({
    totalTarget: 0,
    totalRealisasi: 0,
    totalRetur: 0,
    jumlahSales: 0,
    pencapaianRate: 0,
    topProduct: "",
    topSales: "",
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [laporanProduk, setLaporanProduk] = useState<any[]>([]);
  const [salespeople, setSalespeoplelist] = useState<any[]>([]);

  const user = getCurrentUser();

  useEffect(() => {
    loadPemasaranData();
  }, [selectedDate]);

  const loadPemasaranData = async () => {
    setLoading(true);
    try {
      const [produkResponse, salesResponse] = await Promise.all([
        getLaporanPenjualanProduk(),
        getSalespeople(),
      ]);

      if (Array.isArray(produkResponse)) {
        // Filter data untuk tanggal yang dipilih
        const filteredData = produkResponse.filter((item: any) => {
          const itemDate = new Date(item.tanggalLaporan || item.createdAt)
            .toISOString()
            .split("T")[0];
          return itemDate === selectedDate;
        });

        setLaporanProduk(filteredData);
        calculatePemasaranSummary(filteredData);
      }

      if (Array.isArray(salesResponse)) {
        setSalespeoplelist(salesResponse);
      }
    } catch (error) {
      console.error("Error loading pemasaran data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePemasaranSummary = (data: any[]) => {
    const newSummary: PemasaranSummary = {
      totalTarget: 0,
      totalRealisasi: 0,
      totalRetur: 0,
      jumlahSales: 0,
      pencapaianRate: 0,
      topProduct: "",
      topSales: "",
    };

    // Group by product to find top performing product
    const productPerformance: { [key: string]: number } = {};
    const salesPerformance: { [key: string]: number } = {};

    data.forEach((item: any) => {
      const target = Number(item.targetKuantitas || 0);
      const realisasi = Number(item.realisasiKuantitas || 0);
      const retur = Number(item.returPenjualan || 0);

      newSummary.totalTarget += target;
      newSummary.totalRealisasi += realisasi;
      newSummary.totalRetur += retur;

      // Track product performance
      const productName = item.productAccount?.accountName || "Unknown";
      productPerformance[productName] =
        (productPerformance[productName] || 0) + realisasi;

      // Track sales performance
      const salesName = item.salesperson?.name || "Unknown";
      salesPerformance[salesName] =
        (salesPerformance[salesName] || 0) + realisasi;
    });

    newSummary.jumlahSales = salespeople.length;
    newSummary.pencapaianRate =
      newSummary.totalTarget > 0
        ? (newSummary.totalRealisasi / newSummary.totalTarget) * 100
        : 0;

    // Find top product and sales
    newSummary.topProduct = Object.keys(productPerformance).reduce(
      (a, b) => (productPerformance[a] > productPerformance[b] ? a : b),
      "N/A"
    );

    newSummary.topSales = Object.keys(salesPerformance).reduce(
      (a, b) => (salesPerformance[a] > salesPerformance[b] ? a : b),
      "N/A"
    );

    setSummary(newSummary);
  };

  const exportToPDF = () => {
    console.log("Exporting Pemasaran report to PDF...");
  };

  const refreshData = () => {
    loadPemasaranData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Pemasaran & Penjualan
            </h1>
            <p className="text-gray-600">
              Monitoring target, realisasi, dan performa penjualan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Total Target
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalTarget.toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Total Realisasi
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalRealisasi.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Pencapaian
                </p>
                <p className="text-2xl font-bold">
                  {summary.pencapaianRate.toFixed(1)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-400 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Total Retur
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalRetur.toLocaleString()}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              🏆 Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">
                Produk Terlaris
              </p>
              <p className="text-xl font-bold text-yellow-800">
                {summary.topProduct || "Belum ada data"}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">
                Sales Terbaik
              </p>
              <p className="text-xl font-bold text-green-800">
                {summary.topSales || "Belum ada data"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Ringkasan Tim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  Jumlah Sales
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {summary.jumlahSales}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">
                  Laporan Hari Ini
                </p>
                <p className="text-2xl font-bold text-purple-800">
                  {laporanProduk.length}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">
                Status Pencapaian
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      summary.pencapaianRate >= 100
                        ? "bg-green-500"
                        : summary.pencapaianRate >= 75
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(summary.pencapaianRate, 100)}%`,
                    }}
                  ></div>
                </div>
                <Badge
                  variant={
                    summary.pencapaianRate >= 100
                      ? "default"
                      : summary.pencapaianRate >= 75
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {summary.pencapaianRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            📈 Performa Produk Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : laporanProduk.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Produk
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Target
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Realisasi
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Pencapaian
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Retur
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {laporanProduk.map((item, index) => {
                    const target = Number(item.targetKuantitas || 0);
                    const realisasi = Number(item.realisasiKuantitas || 0);
                    const pencapaian =
                      target > 0 ? (realisasi / target) * 100 : 0;

                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.productAccount?.accountName || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.productAccount?.accountCode || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          {target.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          {realisasi.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge
                            variant={
                              pencapaian >= 100
                                ? "default"
                                : pencapaian >= 75
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {pencapaian.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          {Number(item.returPenjualan || 0).toLocaleString()}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="outline">
                            {item.salesperson?.name || "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada data penjualan untuk tanggal yang dipilih</p>
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
              <span className="text-sm">Input Penjualan</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Kelola Sales</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Star className="h-5 w-5" />
              <span className="text-sm">Ranking Sales</span>
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
