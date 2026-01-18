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
  TrendingDown,
  Activity,
  Package,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLaporanPenjualanProduk, getSalespeople } from "@/lib/data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

// Helper function untuk format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

interface PemasaranSummary {
  totalTarget: number;
  totalRealisasi: number;
  jumlahSales: number;
  pencapaianRate: number;
  topProduct: string;
  topSales: string;
  totalLaporan: number;
  avgPencapaian: number;
}

interface SalesPerformance {
  name: string;
  target: number;
  realisasi: number;
  pencapaian: number;
  jumlahLaporan: number;
}

interface ProductPerformance {
  name: string;
  target: number;
  realisasi: number;
  pencapaian: number;
  selisih: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function PemasaranReports() {
  const [summary, setSummary] = useState<PemasaranSummary>({
    totalTarget: 0,
    totalRealisasi: 0,
    jumlahSales: 0,
    pencapaianRate: 0,
    topProduct: "",
    topSales: "",
    totalLaporan: 0,
    avgPencapaian: 0,
  });

  const [selectedDate, setSelectedDate] = useState(
    "2025-09-18" // Default ke tanggal yang ada datanya
  );
  const [dateRange, setDateRange] = useState({
    start: "2025-09-01",
    end: "2025-09-30",
  });
  const [loading, setLoading] = useState(false);
  const [laporanProduk, setLaporanProduk] = useState<any[]>([]);
  const [salespeople, setSalespeoplelist] = useState<any[]>([]);
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance[]>(
    []
  );
  const [productPerformance, setProductPerformance] = useState<
    ProductPerformance[]
  >([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const user = getCurrentUser();

  useEffect(() => {
    loadPemasaranData();
  }, [selectedDate]);

  useEffect(() => {
    loadTrendData();
  }, [dateRange]);

  const loadPemasaranData = async () => {
    setLoading(true);
    try {
      const [produkResponse, salesResponse] = await Promise.all([
        getLaporanPenjualanProduk(),
        getSalespeople(),
      ]);

      console.log("📊 Raw produkResponse:", produkResponse);
      console.log("👥 salesResponse:", salesResponse);

      if (Array.isArray(produkResponse)) {
        // Filter data untuk tanggal yang dipilih
        const filteredData = produkResponse.filter((item: any) => {
          const itemDate = new Date(
            item.tanggalLaporan || item.tanggal_laporan || item.createdAt
          )
            .toISOString()
            .split("T")[0];
          return itemDate === selectedDate;
        });

        console.log("✅ Filtered data for", selectedDate, ":", filteredData);
        setLaporanProduk(filteredData);
        calculatePemasaranSummary(filteredData, salesResponse);
      }

      if (Array.isArray(salesResponse)) {
        setSalespeoplelist(salesResponse);
      }
    } catch (error) {
      console.error("Error loading pemasaran data:", error);
      toast.error("Gagal memuat data pemasaran");
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async () => {
    try {
      const allData = await getLaporanPenjualanProduk();

      if (Array.isArray(allData)) {
        // Filter data dalam range
        const filteredData = allData.filter((item: any) => {
          const itemDate = new Date(
            item.tanggalLaporan || item.tanggal_laporan || item.createdAt
          )
            .toISOString()
            .split("T")[0];
          return itemDate >= dateRange.start && itemDate <= dateRange.end;
        });

        // Group by date
        const dateMap: any = {};
        filteredData.forEach((item: any) => {
          const date = new Date(
            item.tanggalLaporan || item.tanggal_laporan || item.createdAt
          )
            .toISOString()
            .split("T")[0];

          if (!dateMap[date]) {
            dateMap[date] = { date, target: 0, realisasi: 0 };
          }

          // ✅ FIX: Support both camelCase and snake_case
          dateMap[date].target += Number(
            item.targetKuantitas || item.target_kuantitas || 0
          );
          dateMap[date].realisasi += Number(
            item.realisasiKuantitas || item.realisasi_kuantitas || 0
          );
        });

        const trend = Object.values(dateMap).sort((a: any, b: any) =>
          a.date.localeCompare(b.date)
        );

        setTrendData(trend);
      }
    } catch (error) {
      console.error("Error loading trend data:", error);
    }
  };

  const calculatePemasaranSummary = (data: any[], salesList: any[]) => {
    const newSummary: PemasaranSummary = {
      totalTarget: 0,
      totalRealisasi: 0,
      jumlahSales: salesList.length,
      pencapaianRate: 0,
      topProduct: "",
      topSales: "",
      totalLaporan: data.length,
      avgPencapaian: 0,
    };

    // Group by product to find top performing product
    const productPerformanceMap: { [key: string]: ProductPerformance } = {};
    const salesPerformanceMap: { [key: string]: SalesPerformance } = {};

    data.forEach((item: any) => {
      // ✅ FIX: Support both camelCase and snake_case from backend
      const target = Number(item.targetKuantitas || item.target_kuantitas || 0);
      const realisasi = Number(
        item.realisasiKuantitas || item.realisasi_kuantitas || 0
      );

      newSummary.totalTarget += target;
      newSummary.totalRealisasi += realisasi;

      // Track product performance - support multiple field name formats
      const productName =
        item.namaAccount ||
        item.product_name ||
        item.productAccount?.accountName ||
        "Unknown";
      if (!productPerformanceMap[productName]) {
        productPerformanceMap[productName] = {
          name: productName,
          target: 0,
          realisasi: 0,
          pencapaian: 0,
          selisih: 0,
        };
      }
      productPerformanceMap[productName].target += target;
      productPerformanceMap[productName].realisasi += realisasi;

      // Track sales performance - support multiple field name formats
      const salesName =
        item.namaSalesperson ||
        item.salesperson_nama ||
        item.salesperson?.name ||
        "Unknown";
      if (!salesPerformanceMap[salesName]) {
        salesPerformanceMap[salesName] = {
          name: salesName,
          target: 0,
          realisasi: 0,
          pencapaian: 0,
          jumlahLaporan: 0,
        };
      }
      salesPerformanceMap[salesName].target += target;
      salesPerformanceMap[salesName].realisasi += realisasi;
      salesPerformanceMap[salesName].jumlahLaporan += 1;
    });

    // Calculate percentages
    Object.values(productPerformanceMap).forEach((product) => {
      product.pencapaian =
        product.target > 0 ? (product.realisasi / product.target) * 100 : 0;
      product.selisih = product.realisasi - product.target;
    });

    Object.values(salesPerformanceMap).forEach((sales) => {
      sales.pencapaian =
        sales.target > 0 ? (sales.realisasi / sales.target) * 100 : 0;
    });

    // Set performance data
    const sortedProducts = Object.values(productPerformanceMap).sort(
      (a, b) => b.realisasi - a.realisasi
    );
    const sortedSales = Object.values(salesPerformanceMap).sort(
      (a, b) => b.realisasi - a.realisasi
    );

    setProductPerformance(sortedProducts);
    setSalesPerformance(sortedSales);

    newSummary.pencapaianRate =
      newSummary.totalTarget > 0
        ? (newSummary.totalRealisasi / newSummary.totalTarget) * 100
        : 0;

    // Calculate average pencapaian
    const totalPencapaian = sortedSales.reduce(
      (sum, s) => sum + s.pencapaian,
      0
    );
    newSummary.avgPencapaian =
      sortedSales.length > 0 ? totalPencapaian / sortedSales.length : 0;

    // Find top performers
    newSummary.topProduct = sortedProducts[0]?.name || "N/A";
    newSummary.topSales = sortedSales[0]?.name || "N/A";

    setSummary(newSummary);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Laporan Pemasaran & Penjualan", 14, 20);

      // Date
      doc.setFontSize(12);
      doc.text(
        `Tanggal: ${new Date(selectedDate).toLocaleDateString("id-ID")}`,
        14,
        30
      );

      // Summary
      doc.setFontSize(14);
      doc.text("Ringkasan", 14, 45);
      doc.setFontSize(10);
      doc.text(`Total Target: ${formatNumber(summary.totalTarget)}`, 14, 55);
      doc.text(
        `Total Realisasi: ${formatNumber(summary.totalRealisasi)}`,
        14,
        62
      );
      doc.text(`Pencapaian: ${summary.pencapaianRate.toFixed(2)}%`, 14, 69);
      doc.text(`Jumlah Sales: ${summary.jumlahSales}`, 14, 76);
      doc.text(`Top Sales: ${summary.topSales}`, 14, 83);
      doc.text(`Top Product: ${summary.topProduct}`, 14, 90);

      doc.save(`laporan-pemasaran-${selectedDate}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Gagal mengekspor PDF");
    }
  };

  const refreshData = () => {
    loadPemasaranData();
    loadTrendData();
    toast.success("Data berhasil di-refresh");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Pemasaran & Penjualan
            </h1>
            <p className="text-gray-600">
              Analisis performa penjualan dan target realisasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportToPDF}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Target
                </p>
                <p className="text-3xl font-bold">
                  {formatNumber(summary.totalTarget)}
                </p>
                <p className="text-blue-100 text-xs mt-1">
                  {summary.totalLaporan} laporan
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">
                  Total Realisasi
                </p>
                <p className="text-3xl font-bold">
                  {formatNumber(summary.totalRealisasi)}
                </p>
                <p className="text-green-100 text-xs mt-1">
                  {summary.totalTarget > 0
                    ? `${(
                        (summary.totalRealisasi / summary.totalTarget) *
                        100
                      ).toFixed(1)}% dari target`
                    : "0% dari target"}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Pencapaian
                </p>
                <p className="text-3xl font-bold">
                  {summary.pencapaianRate.toFixed(1)}%
                </p>
                <p className="text-purple-100 text-xs mt-1">
                  Avg: {summary.avgPencapaian.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">
                  Tim Sales
                </p>
                <p className="text-3xl font-bold">{summary.jumlahSales}</p>
                <p className="text-orange-100 text-xs mt-1">
                  Salesperson aktif
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance Chart */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Performa Sales Top 10
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesPerformance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatNumber(value)}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="target"
                  fill="#3b82f6"
                  name="Target"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="realisasi"
                  fill="#10b981"
                  name="Realisasi"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Distribusi Produk Top 6
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productPerformance.slice(0, 6) as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="realisasi"
                >
                  {productPerformance.slice(0, 6).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Trend Target vs Realisasi
            </CardTitle>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="px-2 py-1 text-sm border border-gray-300 rounded-md"
              />
              <span className="text-gray-500 py-1">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="px-2 py-1 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  })
                }
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: any) => formatNumber(value)}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("id-ID")
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTarget)"
                name="Target"
              />
              <Area
                type="monotone"
                dataKey="realisasi"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRealisasi)"
                name="Realisasi"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 font-medium mb-1">
                  🏆 Produk Terlaris
                </p>
                <p className="text-xl font-bold text-yellow-900">
                  {summary.topProduct}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {formatNumber(productPerformance[0]?.realisasi || 0)} unit
                  terjual
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">
                  ⭐ Sales Terbaik
                </p>
                <p className="text-xl font-bold text-green-900">
                  {summary.topSales}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Pencapaian: {salesPerformance[0]?.pencapaian.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Ranking Sales
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {salesPerformance.slice(0, 10).map((sales, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {sales.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sales.jumlahLaporan} laporan
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        sales.pencapaian >= 100
                          ? "default"
                          : sales.pencapaian >= 75
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {sales.pencapaian.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Statistik Tim
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Jumlah Sales Aktif
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {summary.jumlahSales}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Total Laporan Hari Ini
                  </span>
                  <span className="text-xl font-bold text-purple-600">
                    {summary.totalLaporan}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    Pencapaian Target
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {summary.pencapaianRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
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
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-700 mb-2">
                  Selisih Target vs Realisasi
                </p>
                <div className="flex items-center gap-2">
                  {summary.totalRealisasi >= summary.totalTarget ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      summary.totalRealisasi >= summary.totalTarget
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {summary.totalRealisasi >= summary.totalTarget ? "+" : ""}
                    {formatNumber(summary.totalRealisasi - summary.totalTarget)}
                  </span>
                  <span className="text-sm text-gray-600">unit</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Performa Produk Detail
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
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
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                      Produk
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                      Target
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                      Realisasi
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                      Pencapaian
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                      Selisih
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                      Sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {laporanProduk.map((item, index) => {
                    // ✅ FIX: Support both camelCase and snake_case
                    const target = Number(
                      item.targetKuantitas || item.target_kuantitas || 0
                    );
                    const realisasi = Number(
                      item.realisasiKuantitas || item.realisasi_kuantitas || 0
                    );
                    const pencapaian =
                      target > 0 ? (realisasi / target) * 100 : 0;
                    const selisih = realisasi - target;

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {item.namaAccount || item.product_name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.productCode || item.product_code || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          {formatNumber(target)}
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-medium text-gray-900">
                          {formatNumber(realisasi)}
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
                        <td
                          className={`text-right py-3 px-4 text-sm font-medium ${
                            selisih >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {selisih >= 0 ? "+" : ""}
                          {formatNumber(selisih)}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {item.namaSalesperson ||
                              item.salesperson_nama ||
                              "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Belum ada data penjualan</p>
              <p className="text-sm">
                untuk tanggal{" "}
                {new Date(selectedDate).toLocaleDateString("id-ID")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
