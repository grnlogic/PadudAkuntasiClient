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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Download,
  DollarSign,
} from "lucide-react";

interface LaporanProduksi {
  id: number;
  tanggal_laporan: string;
  account_id: number;
  product_code: string;
  product_name: string;
  hasil_produksi: string;
  barang_gagal: string;
  stock_barang_jadi: string;
  hp_barang_jadi: string;
  keterangan_kendala: string;
  created_by: string;
  created_at: string;
}

interface LaporanGudang {
  id: number;
  tanggal_laporan: string;
  account_id: number;
  account_code: string;
  account_name: string;
  barang_masuk: string;
  pemakaian: string;
  stok_akhir: string;
  keterangan: string;
  created_by: string;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function MonitoringProduksiPage() {
  const [activeTab, setActiveTab] = useState("produksi");
  const [loading, setLoading] = useState(true);

  // Produksi State
  const [dataProduksi, setDataProduksi] = useState<LaporanProduksi[]>([]);
  const [paginationProduksi, setPaginationProduksi] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    total_pages: 0,
  });
  const [searchProduksi, setSearchProduksi] = useState("");
  const [tanggalStartProduksi, setTanggalStartProduksi] = useState("");
  const [tanggalEndProduksi, setTanggalEndProduksi] = useState("");
  const [currentPageProduksi, setCurrentPageProduksi] = useState(1);
  const [limitProduksi, setLimitProduksi] = useState(50);

  // Gudang State
  const [dataGudang, setDataGudang] = useState<LaporanGudang[]>([]);
  const [paginationGudang, setPaginationGudang] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    total_pages: 0,
  });
  const [searchGudang, setSearchGudang] = useState("");
  const [tanggalStartGudang, setTanggalStartGudang] = useState("");
  const [tanggalEndGudang, setTanggalEndGudang] = useState("");
  const [currentPageGudang, setCurrentPageGudang] = useState(1);
  const [limitGudang, setLimitGudang] = useState(50);

  // Metrics
  const [metricsProduksi, setMetricsProduksi] = useState({
    totalHasilProduksi: 0,
    totalBarangGagal: 0,
    totalStockBarangJadi: 0,
    totalHPP: 0,
    totalLaporan: 0,
  });

  const [metricsGudang, setMetricsGudang] = useState({
    totalBarangMasuk: 0,
    totalPemakaian: 0,
    avgStokAkhir: 0,
    stokRendah: 0,
    totalLaporan: 0,
  });

  // Initial fetch on mount
  // Fetch Produksi Data
  useEffect(() => {
    if (activeTab === "produksi") {
      fetchProduksiData();
    }
  }, [
    activeTab,
    currentPageProduksi,
    limitProduksi,
    tanggalStartProduksi,
    tanggalEndProduksi,
  ]);

  // Fetch Gudang Data
  useEffect(() => {
    if (activeTab === "persediaan") {
      fetchGudangData();
    }
  }, [
    activeTab,
    currentPageGudang,
    limitGudang,
    tanggalStartGudang,
    tanggalEndGudang,
  ]);

  const fetchProduksiData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      
      // Debug: Check user info
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("👤 Current user:", user);
        console.log("👤 Username:", user.username, "Role:", user.role);
      }

      const params = new URLSearchParams({
        page: currentPageProduksi.toString(),
        limit: limitProduksi.toString(),
      });

      if (tanggalStartProduksi)
        params.append("tanggal_start", tanggalStartProduksi);
      if (tanggalEndProduksi) params.append("tanggal_end", tanggalEndProduksi);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/laporan-produksi?${params}`;
      console.log("🔍 Fetching produksi data:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("✅ Produksi response:", result);

      if (result.success) {
        setDataProduksi(result.data || []);
        setPaginationProduksi(
          result.pagination || {
            total: 0,
            page: 1,
            limit: 50,
            total_pages: 0,
          }
        );

        // Calculate metrics
        const totalHasilProduksi =
          result.data?.reduce(
            (sum: number, item: LaporanProduksi) =>
              sum + parseFloat(item.hasil_produksi || "0"),
            0
          ) || 0;
        const totalBarangGagal =
          result.data?.reduce(
            (sum: number, item: LaporanProduksi) =>
              sum + parseFloat(item.barang_gagal || "0"),
            0
          ) || 0;
        const totalStockBarangJadi =
          result.data?.reduce(
            (sum: number, item: LaporanProduksi) =>
              sum + parseFloat(item.stock_barang_jadi || "0"),
            0
          ) || 0;
        const totalHPP =
          result.data?.reduce(
            (sum: number, item: LaporanProduksi) =>
              sum + parseFloat(item.hp_barang_jadi || "0"),
            0
          ) || 0;

        setMetricsProduksi({
          totalHasilProduksi,
          totalBarangGagal,
          totalStockBarangJadi,
          totalHPP,
          totalLaporan: result.pagination?.total || 0,
        });
      } else {
        console.error("❌ API Error:", result.message || result.error);
        setDataProduksi([]);
      }
    } catch (error) {
      console.error("❌ Error fetching produksi data:", error);
      setDataProduksi([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGudangData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const params = new URLSearchParams({
        page: currentPageGudang.toString(),
        limit: limitGudang.toString(),
      });

      if (tanggalStartGudang) params.append("tanggal_dari", tanggalStartGudang);
      if (tanggalEndGudang) params.append("tanggal_sampai", tanggalEndGudang);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/laporan-gudang?${params}`;
      console.log("🔍 Fetching gudang data:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("✅ Gudang response:", result);

      if (result.data) {
        setDataGudang(result.data || []);
        setPaginationGudang(
          result.pagination || {
            total: 0,
            page: 1,
            limit: 50,
            total_pages: 0,
          }
        );

        // Calculate metrics
        const totalBarangMasuk =
          result.data?.reduce(
            (sum: number, item: LaporanGudang) =>
              sum + parseFloat(item.barang_masuk || "0"),
            0
          ) || 0;
        const totalPemakaian =
          result.data?.reduce(
            (sum: number, item: LaporanGudang) =>
              sum + parseFloat(item.pemakaian || "0"),
            0
          ) || 0;
        const avgStokAkhir =
          result.data?.length > 0
            ? result.data.reduce(
                (sum: number, item: LaporanGudang) =>
                  sum + parseFloat(item.stok_akhir || "0"),
                0
              ) / result.data.length
            : 0;
        const stokRendah =
          result.data?.filter(
            (item: LaporanGudang) => parseFloat(item.stok_akhir || "0") < 100
          ).length || 0;

        setMetricsGudang({
          totalBarangMasuk,
          totalPemakaian,
          avgStokAkhir,
          stokRendah,
          totalLaporan: result.pagination?.total || 0,
        });
      } else {
        console.error("❌ API Error:", result.message || result.error);
        setDataGudang([]);
      }
    } catch (error) {
      console.error("❌ Error fetching gudang data:", error);
      setDataGudang([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProduksi = () => {
    setCurrentPageProduksi(1);
    fetchProduksiData();
  };

  const handleResetProduksi = () => {
    setSearchProduksi("");
    setTanggalStartProduksi("");
    setTanggalEndProduksi("");
    setCurrentPageProduksi(1);
    setLimitProduksi(50);
  };

  const handleSearchGudang = () => {
    setCurrentPageGudang(1);
    fetchGudangData();
  };

  const handleResetGudang = () => {
    setSearchGudang("");
    setTanggalStartGudang("");
    setTanggalEndGudang("");
    setCurrentPageGudang(1);
    setLimitGudang(50);
  };

  const handleExportProduksi = () => {
    const headers = [
      "Tanggal",
      "Produk",
      "Kode",
      "Hasil Produksi",
      "Barang Gagal",
      "Stock",
      "HPP",
      "Kendala",
      "Dibuat Oleh",
    ];

    const csvData = dataProduksi.map((item) => [
      new Date(item.tanggal_laporan).toLocaleDateString("id-ID"),
      item.product_name,
      item.product_code,
      item.hasil_produksi,
      item.barang_gagal,
      item.stock_barang_jadi,
      item.hp_barang_jadi,
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
    link.download = `monitoring-produksi-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const handleExportGudang = () => {
    const headers = [
      "Tanggal",
      "Barang",
      "Kode",
      "Barang Masuk",
      "Pemakaian",
      "Stok Akhir",
      "Status",
      "Keterangan",
      "Dibuat Oleh",
    ];

    const csvData = dataGudang.map((item) => {
      const stokAkhir = parseFloat(item.stok_akhir || "0");
      return [
        new Date(item.tanggal_laporan).toLocaleDateString("id-ID"),
        item.account_name,
        item.account_code,
        item.barang_masuk,
        item.pemakaian,
        item.stok_akhir,
        stokAkhir < 100 ? "Stok Rendah" : "Stok Aman",
        item.keterangan || "-",
        item.created_by,
      ];
    });

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `monitoring-gudang-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);

  // Client-side search filter for produksi
  const filteredProduksi = dataProduksi.filter((item) => {
    if (!searchProduksi) return true;
    const search = searchProduksi.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(search) ||
      item.product_code?.toLowerCase().includes(search) ||
      item.keterangan_kendala?.toLowerCase().includes(search)
    );
  });

  // Client-side search filter for gudang
  const filteredGudang = dataGudang.filter((item) => {
    if (!searchGudang) return true;
    const search = searchGudang.toLowerCase();
    return (
      item.account_name?.toLowerCase().includes(search) ||
      item.account_code?.toLowerCase().includes(search) ||
      item.keterangan?.toLowerCase().includes(search)
    );
  });

  if (loading && dataProduksi.length === 0 && dataGudang.length === 0) {
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
          Monitoring Produksi & Gudang
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor laporan produksi dan persediaan gudang
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="produksi">
            <Package className="h-4 w-4 mr-2" />
            Laporan Produksi
          </TabsTrigger>
          <TabsTrigger value="persediaan">
            <Warehouse className="h-4 w-4 mr-2" />
            Laporan Persediaan
          </TabsTrigger>
        </TabsList>

        {/* TAB PRODUKSI */}
        <TabsContent value="produksi" className="space-y-6">
          {/* Metrics Cards - Produksi */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Laporan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsProduksi.totalLaporan}
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
                    <p className="text-sm text-gray-600">Hasil Produksi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metricsProduksi.totalHasilProduksi)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
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
                    <p className="text-sm text-gray-600">Barang Gagal</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metricsProduksi.totalBarangGagal)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stock Barang Jadi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metricsProduksi.totalStockBarangJadi)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total HPP</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(metricsProduksi.totalHPP)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters - Produksi */}
          <Card>
            <CardHeader>
              <CardTitle>Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari produk, kendala..."
                    value={searchProduksi}
                    onChange={(e) => setSearchProduksi(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={tanggalStartProduksi}
                    onChange={(e) => setTanggalStartProduksi(e.target.value)}
                    className="pl-10"
                    placeholder="Tanggal Mulai"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={tanggalEndProduksi}
                    onChange={(e) => setTanggalEndProduksi(e.target.value)}
                    className="pl-10"
                    placeholder="Tanggal Akhir"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearchProduksi} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Cari
                  </Button>
                  <Button onClick={handleResetProduksi} variant="outline">
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table - Produksi */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data Laporan Produksi</CardTitle>
                <CardDescription>
                  Menampilkan {filteredProduksi.length} dari{" "}
                  {paginationProduksi.total} data | Halaman{" "}
                  {paginationProduksi.page} dari{" "}
                  {paginationProduksi.total_pages}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value={limitProduksi.toString()}
                  onValueChange={(val) => {
                    setLimitProduksi(Number(val));
                    setCurrentPageProduksi(1);
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
                <Button onClick={handleExportProduksi} variant="outline">
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
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">
                        Hasil Produksi
                      </TableHead>
                      <TableHead className="text-right">Barang Gagal</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">HPP</TableHead>
                      <TableHead>Kendala</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProduksi.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Tidak ada data ditemukan</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProduksi.map((item, index) => {
                        const rowNumber =
                          (paginationProduksi.page - 1) *
                            paginationProduksi.limit +
                          index +
                          1;
                        const hasilProduksi = parseFloat(
                          item.hasil_produksi || "0"
                        );
                        const barangGagal = parseFloat(
                          item.barang_gagal || "0"
                        );
                        const gagalRate =
                          hasilProduksi > 0
                            ? (barangGagal / hasilProduksi) * 100
                            : 0;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {rowNumber}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                item.tanggal_laporan
                              ).toLocaleDateString("id-ID")}
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
                              <div className="text-green-600 font-medium">
                                {formatNumber(hasilProduksi)}
                              </div>
                              <div className="text-xs text-gray-500">unit</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-red-600 font-medium">
                                {formatNumber(barangGagal)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {gagalRate.toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(
                                parseFloat(item.stock_barang_jadi || "0")
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                parseFloat(item.hp_barang_jadi || "0")
                              )}
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
              {paginationProduksi.total > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan{" "}
                    {(paginationProduksi.page - 1) * paginationProduksi.limit +
                      1}{" "}
                    -{" "}
                    {Math.min(
                      paginationProduksi.page * paginationProduksi.limit,
                      paginationProduksi.total
                    )}{" "}
                    dari {paginationProduksi.total} data
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPageProduksi((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={paginationProduksi.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm font-medium">
                        Halaman {paginationProduksi.page} dari{" "}
                        {paginationProduksi.total_pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPageProduksi((prev) =>
                          Math.min(prev + 1, paginationProduksi.total_pages)
                        )
                      }
                      disabled={
                        paginationProduksi.page ===
                        paginationProduksi.total_pages
                      }
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PERSEDIAAN/GUDANG */}
        <TabsContent value="persediaan" className="space-y-6">
          {/* Metrics Cards - Gudang */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Laporan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsGudang.totalLaporan}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Warehouse className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Barang Masuk</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metricsGudang.totalBarangMasuk)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
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
                    <p className="text-sm text-gray-600">Total Pemakaian</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metricsGudang.totalPemakaian)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rata-rata Stok</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metricsGudang.avgStokAkhir)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stok Rendah</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metricsGudang.stokRendah}
                    </p>
                    <p className="text-xs text-gray-500">item</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters - Gudang */}
          <Card>
            <CardHeader>
              <CardTitle>Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari barang, keterangan..."
                    value={searchGudang}
                    onChange={(e) => setSearchGudang(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={tanggalStartGudang}
                    onChange={(e) => setTanggalStartGudang(e.target.value)}
                    className="pl-10"
                    placeholder="Tanggal Mulai"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={tanggalEndGudang}
                    onChange={(e) => setTanggalEndGudang(e.target.value)}
                    className="pl-10"
                    placeholder="Tanggal Akhir"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearchGudang} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Cari
                  </Button>
                  <Button onClick={handleResetGudang} variant="outline">
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table - Gudang */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data Laporan Persediaan Gudang</CardTitle>
                <CardDescription>
                  Menampilkan {filteredGudang.length} dari{" "}
                  {paginationGudang.total} data | Halaman{" "}
                  {paginationGudang.page} dari {paginationGudang.total_pages}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value={limitGudang.toString()}
                  onValueChange={(val) => {
                    setLimitGudang(Number(val));
                    setCurrentPageGudang(1);
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
                <Button onClick={handleExportGudang} variant="outline">
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
                      <TableHead>Barang</TableHead>
                      <TableHead className="text-right">Barang Masuk</TableHead>
                      <TableHead className="text-right">Pemakaian</TableHead>
                      <TableHead className="text-right">Stok Akhir</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGudang.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="text-gray-500">
                            <Warehouse className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Tidak ada data ditemukan</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGudang.map((item, index) => {
                        const rowNumber =
                          (paginationGudang.page - 1) * paginationGudang.limit +
                          index +
                          1;
                        const stokAkhir = parseFloat(item.stok_akhir || "0");

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {rowNumber}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                item.tanggal_laporan
                              ).toLocaleDateString("id-ID")}
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
                            <TableCell className="text-right">
                              <div className="text-green-600 font-medium">
                                {formatNumber(
                                  parseFloat(item.barang_masuk || "0")
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-orange-600 font-medium">
                                {formatNumber(
                                  parseFloat(item.pemakaian || "0")
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-purple-600 font-medium">
                                {formatNumber(stokAkhir)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  stokAkhir < 100
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {stokAkhir < 100 ? "Stok Rendah" : "Stok Aman"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {item.keterangan || "-"}
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
              {paginationGudang.total > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan{" "}
                    {(paginationGudang.page - 1) * paginationGudang.limit + 1} -{" "}
                    {Math.min(
                      paginationGudang.page * paginationGudang.limit,
                      paginationGudang.total
                    )}{" "}
                    dari {paginationGudang.total} data
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPageGudang((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={paginationGudang.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm font-medium">
                        Halaman {paginationGudang.page} dari{" "}
                        {paginationGudang.total_pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPageGudang((prev) =>
                          Math.min(prev + 1, paginationGudang.total_pages)
                        )
                      }
                      disabled={
                        paginationGudang.page === paginationGudang.total_pages
                      }
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
