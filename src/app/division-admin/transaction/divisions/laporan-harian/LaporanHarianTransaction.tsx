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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Package,
  TrendingUp,
  Warehouse,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SearchFilter } from "../../shared/components/SearchFilter";
import { DateFilter } from "../../shared/components/DateFilter";
import { MetricsGrid, type Metric } from "../../shared/components/MetricCard";

interface LaporanProduksi {
  id: number;
  tanggal_laporan: string;
  account_id: number;
  hasil_produksi: string;
  barang_gagal: string;
  stock_barang_jadi: string;
  hp_barang_jadi: string;
  keterangan_kendala: string;
  created_by_user_id: number;
  created_at: string;
  product_code: string;
  product_name: string;
  created_by: string;
}

interface LaporanGudang {
  id: number;
  tanggal_laporan: string;
  account_id: number;
  barang_masuk: string;
  pemakaian: string;
  stok_akhir: string;
  keterangan: string;
  created_by_user_id: number;
  created_at: string;
  account_code: string;
  account_name: string;
  created_by: string;
}

interface LaporanHarianTransactionProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function LaporanHarianTransaction({
  selectedDate,
  onDateChange,
}: LaporanHarianTransactionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [laporanProduksi, setLaporanProduksi] = useState<LaporanProduksi[]>([]);
  const [laporanGudang, setLaporanGudang] = useState<LaporanGudang[]>([]);
  const [activeTab, setActiveTab] = useState("produksi");
  const [currentPageProduksi, setCurrentPageProduksi] = useState(1);
  const [currentPageGudang, setCurrentPageGudang] = useState(1);
  const itemsPerPage = 20;

  const produksiFilterOptions = [
    {
      value: "all",
      label: "Semua",
      icon: Package,
      color: "text-gray-600",
    },
    {
      value: "PRODUKSI",
      label: "Produksi",
      icon: Package,
      color: "text-blue-600",
    },
    { value: "HPP", label: "HPP", icon: TrendingUp, color: "text-orange-600" },
  ];

  const persediaanFilterOptions = [
    {
      value: "all",
      label: "Semua",
      icon: Warehouse,
      color: "text-gray-600",
    },
    {
      value: "BARANG_MASUK",
      label: "Barang Masuk",
      icon: Package,
      color: "text-blue-600",
    },
    {
      value: "PEMAKAIAN",
      label: "Pemakaian",
      icon: TrendingDown,
      color: "text-orange-600",
    },
    { value: "STOK", label: "Stok", icon: Warehouse, color: "text-purple-600" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("No auth token found");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch laporan produksi
      const produksiRes = await fetch(
        "http://localhost:7070/api/v1/laporan-produksi?limit=1000",
        { headers }
      );
      const produksiData = await produksiRes.json();

      // Fetch laporan gudang
      const gudangRes = await fetch(
        "http://localhost:7070/api/v1/laporan-gudang?limit=5000",
        { headers }
      );
      const gudangData = await gudangRes.json();

      setLaporanProduksi(produksiData.data || []);
      setLaporanGudang(gudangData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProduksi = laporanProduksi.filter((entry) => {
    let matches = true;

    if (searchTerm) {
      matches =
        matches &&
        (entry.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.keterangan_kendala
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()));
    }

    if (selectedDate) {
      const entryDate = entry.tanggal_laporan.split("T")[0];
      matches = matches && entryDate === selectedDate;
    }

    return matches;
  });

  const filteredGudang = laporanGudang.filter((entry) => {
    let matches = true;

    if (searchTerm) {
      matches =
        matches &&
        (entry.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedDate) {
      const entryDate = entry.tanggal_laporan.split("T")[0];
      matches = matches && entryDate === selectedDate;
    }

    return matches;
  });

  // Pagination untuk Produksi
  const totalPagesProduksi = Math.ceil(filteredProduksi.length / itemsPerPage);
  const startIndexProduksi = (currentPageProduksi - 1) * itemsPerPage;
  const endIndexProduksi = startIndexProduksi + itemsPerPage;
  const paginatedProduksi = filteredProduksi.slice(
    startIndexProduksi,
    endIndexProduksi
  );

  // Pagination untuk Gudang
  const totalPagesGudang = Math.ceil(filteredGudang.length / itemsPerPage);
  const startIndexGudang = (currentPageGudang - 1) * itemsPerPage;
  const endIndexGudang = startIndexGudang + itemsPerPage;
  const paginatedGudang = filteredGudang.slice(
    startIndexGudang,
    endIndexGudang
  );

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPageProduksi(1);
    setCurrentPageGudang(1);
  }, [searchTerm, selectedDate]);

  // Metrics untuk Produksi
  const totalHasilProduksi = filteredProduksi.reduce(
    (sum, e) => sum + parseFloat(e.hasil_produksi || "0"),
    0
  );
  const totalBarangGagal = filteredProduksi.reduce(
    (sum, e) => sum + parseFloat(e.barang_gagal || "0"),
    0
  );
  const totalStockBarangJadi = filteredProduksi.reduce(
    (sum, e) => sum + parseFloat(e.stock_barang_jadi || "0"),
    0
  );
  const totalHPP = filteredProduksi.reduce(
    (sum, e) => sum + parseFloat(e.hp_barang_jadi || "0"),
    0
  );

  const produksiMetrics: Metric[] = [
    {
      label: "Total Hasil Produksi",
      value: totalHasilProduksi,
      type: "unit",
      color: "text-blue-600",
    },
    {
      label: "Total Barang Gagal",
      value: totalBarangGagal,
      type: "unit",
      color: "text-red-600",
    },
    {
      label: "Total Stock Barang Jadi",
      value: totalStockBarangJadi,
      type: "unit",
      color: "text-green-600",
    },
    {
      label: "Total HPP",
      value: totalHPP,
      type: "currency",
      color: "text-orange-600",
    },
  ];

  // Metrics untuk Persediaan
  const totalBarangMasuk = filteredGudang.reduce(
    (sum, e) => sum + parseFloat(e.barang_masuk || "0"),
    0
  );
  const totalPemakaian = filteredGudang.reduce(
    (sum, e) => sum + parseFloat(e.pemakaian || "0"),
    0
  );
  const avgStokAkhir =
    filteredGudang.length > 0
      ? filteredGudang.reduce(
          (sum, e) => sum + parseFloat(e.stok_akhir || "0"),
          0
        ) / filteredGudang.length
      : 0;

  const persediaanMetrics: Metric[] = [
    {
      label: "Total Barang Masuk",
      value: totalBarangMasuk,
      type: "unit",
      color: "text-blue-600",
    },
    {
      label: "Total Pemakaian",
      value: totalPemakaian,
      type: "unit",
      color: "text-orange-600",
    },
    {
      label: "Rata-rata Stok",
      value: avgStokAkhir,
      type: "unit",
      color: "text-green-600",
    },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterOptions={
                  activeTab === "produksi"
                    ? produksiFilterOptions
                    : persediaanFilterOptions
                }
              />
            </div>
            <DateFilter filterDate={selectedDate} onDateChange={onDateChange} />
          </div>
        </CardContent>
      </Card>

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

        <TabsContent value="produksi" className="space-y-6">
          <MetricsGrid
            metrics={produksiMetrics}
            totalTransactions={filteredProduksi.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>Daftar Transaksi Produksi</CardTitle>
              <CardDescription>
                {filteredProduksi.length} entri ditemukan - Halaman{" "}
                {currentPageProduksi} dari {totalPagesProduksi}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Detail Produksi</TableHead>
                    <TableHead>HPP</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProduksi.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.tanggal_laporan).toLocaleDateString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {entry.product_name}
                          </div>
                          <div className="text-gray-500">
                            {entry.product_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="text-blue-600">
                            Hasil:{" "}
                            {parseFloat(
                              entry.hasil_produksi || "0"
                            ).toLocaleString()}{" "}
                            unit
                          </div>
                          <div className="text-red-600">
                            Gagal:{" "}
                            {parseFloat(
                              entry.barang_gagal || "0"
                            ).toLocaleString()}{" "}
                            unit
                          </div>
                          <div className="text-green-600">
                            Stok:{" "}
                            {parseFloat(
                              entry.stock_barang_jadi || "0"
                            ).toLocaleString()}{" "}
                            unit
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(
                          parseFloat(entry.hp_barang_jadi || "0")
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.keterangan_kendala || "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProduksi.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data transaksi produksi
                </div>
              )}

              {/* Pagination Controls */}
              {totalPagesProduksi > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan {startIndexProduksi + 1} -{" "}
                    {Math.min(endIndexProduksi, filteredProduksi.length)} dari{" "}
                    {filteredProduksi.length} data
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPageProduksi((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPageProduksi === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPagesProduksi) },
                        (_, i) => {
                          let pageNum;
                          if (totalPagesProduksi <= 5) {
                            pageNum = i + 1;
                          } else if (currentPageProduksi <= 3) {
                            pageNum = i + 1;
                          } else if (
                            currentPageProduksi >=
                            totalPagesProduksi - 2
                          ) {
                            pageNum = totalPagesProduksi - 4 + i;
                          } else {
                            pageNum = currentPageProduksi - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPageProduksi === pageNum
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPageProduksi(pageNum)}
                              className="w-10"
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
                      onClick={() =>
                        setCurrentPageProduksi((prev) =>
                          Math.min(totalPagesProduksi, prev + 1)
                        )
                      }
                      disabled={currentPageProduksi === totalPagesProduksi}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="persediaan" className="space-y-6">
          <MetricsGrid
            metrics={persediaanMetrics}
            totalTransactions={filteredGudang.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>Daftar Transaksi Persediaan</CardTitle>
              <CardDescription>
                {filteredGudang.length} entri ditemukan - Halaman{" "}
                {currentPageGudang} dari {totalPagesGudang}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Detail Persediaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGudang.map((entry) => {
                    const stokAkhir = parseFloat(entry.stok_akhir || "0");
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.tanggal_laporan).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {entry.account_name}
                            </div>
                            <div className="text-gray-500">
                              {entry.account_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="space-y-1">
                            <div className="text-blue-600">
                              Masuk:{" "}
                              {parseFloat(
                                entry.barang_masuk || "0"
                              ).toLocaleString()}{" "}
                              unit
                            </div>
                            <div className="text-orange-600">
                              Pakai:{" "}
                              {parseFloat(
                                entry.pemakaian || "0"
                              ).toLocaleString()}{" "}
                              unit
                            </div>
                            <div className="text-purple-600">
                              Stok: {stokAkhir.toLocaleString()} unit
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {entry.keterangan || "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredGudang.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data transaksi persediaan
                </div>
              )}

              {/* Pagination Controls */}
              {totalPagesGudang > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan {startIndexGudang + 1} -{" "}
                    {Math.min(endIndexGudang, filteredGudang.length)} dari{" "}
                    {filteredGudang.length} data
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPageGudang((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPageGudang === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPagesGudang) },
                        (_, i) => {
                          let pageNum;
                          if (totalPagesGudang <= 5) {
                            pageNum = i + 1;
                          } else if (currentPageGudang <= 3) {
                            pageNum = i + 1;
                          } else if (
                            currentPageGudang >=
                            totalPagesGudang - 2
                          ) {
                            pageNum = totalPagesGudang - 4 + i;
                          } else {
                            pageNum = currentPageGudang - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPageGudang === pageNum
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPageGudang(pageNum)}
                              className="w-10"
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
                      onClick={() =>
                        setCurrentPageGudang((prev) =>
                          Math.min(totalPagesGudang, prev + 1)
                        )
                      }
                      disabled={currentPageGudang === totalPagesGudang}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4" />
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
