"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Users,
  TrendingUp,
  Download,
  RefreshCw,
  Package,
} from "lucide-react";
import {
  getSalespeople,
  getLaporanPenjualanProduk,
  getAccounts,
} from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MonitoringPemasaran() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [salespeople, setSalespeople] = useState<any[]>([]);
  const [produkList, setProdukList] = useState<any[]>([]);
  const [laporanProduk, setLaporanProduk] = useState<any[]>([]);
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalTarget: 0,
    totalRealisasi: 0,
    totalRetur: 0,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ambil data sales, produk, dan laporan penjualan produk
      const [sales, allAccounts, laporan] = await Promise.all([
        getSalespeople(),
        getAccounts(),
        getLaporanPenjualanProduk(),
      ]);
      setSalespeople(sales);
      // Filter produk: valueType KUANTITAS atau nama mengandung 'produk'
      const produk = (allAccounts || []).filter(
        (acc) =>
          acc.valueType === "KUANTITAS" ||
          (acc.accountName && acc.accountName.toLowerCase().includes("produk"))
      );
      setProdukList(produk);
      // Filter laporan sesuai tanggal
      const filteredLaporan = (laporan || []).filter((item: any) => {
        const tgl =
          item.tanggalLaporan || item.tanggal_laporan || item.createdAt;
        if (!tgl) return false;
        return new Date(tgl).toISOString().slice(0, 10) === selectedDate;
      });
      setLaporanProduk(filteredLaporan);
      // Gabungkan data untuk tabel
      const rows: any[] = [];
      let totalTarget = 0;
      let totalRealisasi = 0;
      let totalRetur = 0;

      // 1. Mapping utama: data laporan produk yang match dengan salespeople
      sales.forEach((salesman: any) => {
        // Ambil semua laporan produk untuk sales ini
        const salesLaporan = filteredLaporan.filter(
          (lp: any) =>
            lp.salespersonId === salesman.id || lp.salesUserId === salesman.id
        );
        produk.forEach((produkItem: any) => {
          // Cari laporan produk untuk sales & produk ini
          const laporan = salesLaporan.find(
            (lp: any) =>
              lp.productAccountId === produkItem.id ||
              lp.productAccountId === produkItem.productAccountId
          );
          if (laporan) {
            // Gunakan fallback untuk nama field, dengan casting agar tidak error TS
            const target = Number(
              laporan.targetKuantitas ?? (laporan as any)?.target_kuantitas ?? 0
            );
            const realisasi = Number(
              laporan.realisasiKuantitas ??
                (laporan as any)?.realisasi_kuantitas ??
                0
            );
            const retur = Number(
              (laporan as any)?.returPenjualan ??
                (laporan as any)?.retur_penjualan ??
                0
            );
            const kendala =
              laporan.keteranganKendala ??
              (laporan as any)?.keterangan_kendala ??
              "-";
            totalTarget += target;
            totalRealisasi += realisasi;
            totalRetur += retur;
            rows.push({
              sales: salesman.nama || salesman.username,
              produk: produkItem.accountName || produkItem.namaAccount,
              target,
              realisasi,
              retur,
              kendala,
            });
          }
        });
      });

      // 2. Tambahkan data laporan produk yang tidak match dengan salespeople (agar semua data muncul)
      filteredLaporan.forEach((laporan: any) => {
        const alreadyExists = rows.some(
          (row) =>
            row.target ===
              Number(
                laporan.targetKuantitas ??
                  (laporan as any)?.target_kuantitas ??
                  0
              ) &&
            row.realisasi ===
              Number(
                laporan.realisasiKuantitas ??
                  (laporan as any)?.realisasi_kuantitas ??
                  0
              ) &&
            row.kendala ===
              (laporan.keteranganKendala ??
                (laporan as any)?.keterangan_kendala ??
                "-")
        );
        if (!alreadyExists) {
          const target2 = Number(
            laporan.targetKuantitas ?? (laporan as any)?.target_kuantitas ?? 0
          );
          const realisasi2 = Number(
            laporan.realisasiKuantitas ??
              (laporan as any)?.realisasi_kuantitas ??
              0
          );
          const retur2 = Number(
            (laporan as any)?.returPenjualan ??
              (laporan as any)?.retur_penjualan ??
              0
          );
          const kendala2 =
            laporan.keteranganKendala ??
            (laporan as any)?.keterangan_kendala ??
            "-";
          totalTarget += target2;
          totalRealisasi += realisasi2;
          totalRetur += retur2;
          rows.push({
            sales:
              laporan.namaSalesperson ||
              laporan.nama_salesperson ||
              laporan.nama ||
              "-",
            produk:
              laporan.namaAccount ||
              laporan.nama_account ||
              laporan.produk ||
              "-",
            target: target2,
            realisasi: realisasi2,
            retur: retur2,
            kendala: kendala2,
          });
        }
      });
      setTableRows(rows);
      setSummary({ totalTarget, totalRealisasi, totalRetur });
    } catch (err) {
      setTableRows([]);
      setSummary({ totalTarget: 0, totalRealisasi: 0, totalRetur: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n: number) => n.toLocaleString("id-ID");

  const handleExport = () => {
    if (tableRows.length === 0) return;
    const header = [
      "Sales",
      "Barang",
      "Target",
      "Realisasi",
      "Retur",
      "Kendala",
    ];
    const csv = [
      header.join(","),
      ...tableRows.map((row) =>
        [
          row.sales,
          row.produk,
          row.target,
          row.realisasi,
          row.retur,
          row.kendala,
        ].join(",")
      ),
      [
        "TOTAL",
        "",
        summary.totalTarget,
        summary.totalRealisasi,
        summary.totalRetur,
        "",
      ].join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring_pemasaran_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            Monitoring Pemasaran
          </h1>
          <p className="text-gray-600 mt-2">
            Rekap penjualan produk per sales, per hari
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={tableRows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      {/* Filter tanggal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Tanggal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Tanggal</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Ringkasan Penjualan Produk Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-semibold text-blue-800">Total Target</div>
              <div className="text-2xl font-bold text-blue-900 mt-2">
                {formatNumber(summary.totalTarget)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="font-semibold text-green-800">
                Total Realisasi
              </div>
              <div className="text-2xl font-bold text-green-900 mt-2">
                {formatNumber(summary.totalRealisasi)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabel utama */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Penjualan Produk per Sales</CardTitle>
          <CardDescription>
            Data penjualan produk oleh setiap sales pada tanggal{" "}
            {new Date(selectedDate).toLocaleDateString("id-ID")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Memuat data pemasaran...</p>
            </div>
          ) : tableRows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Realisasi</TableHead>
                    <TableHead>Kendala</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.sales}</TableCell>
                      <TableCell>{row.produk}</TableCell>
                      <TableCell>{formatNumber(row.target)}</TableCell>
                      <TableCell>{formatNumber(row.realisasi)}</TableCell>
                      <TableCell>{row.kendala}</TableCell>
                    </TableRow>
                  ))}
                  {/* Summary row */}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-green-600">
                      {formatNumber(summary.totalTarget)}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {formatNumber(summary.totalRealisasi)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Tidak ada data pemasaran untuk tanggal yang dipilih</p>
              <p className="text-sm mt-2">
                Coba pilih tanggal lain atau periksa data penjualan produk
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
