"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getLaporanProduksi } from "@/lib/data";
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react";

export default function MonitoringProduksiPage() {
  const [tanggal, setTanggal] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Summary states
  const [totalHasil, setTotalHasil] = useState(0);
  const [totalHPP, setTotalHPP] = useState(0);
  const [totalOperator, setTotalOperator] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Ambil semua data
        const all = await getLaporanProduksi();
        console.log("ALL DATA:", all);
        // Filter per tanggal
        const filtered = all.filter((item: any) => {
          const tgl =
            item.tanggalLaporan || item.tanggal_laporan || item.createdAt;
          if (!tgl) return false;
          // Normalisasi ke format YYYY-MM-DD agar lebih aman
          const tglNorm = new Date(tgl).toISOString().slice(0, 10);
          return tglNorm === tanggal;
        });
        // Filter hanya user produksi
        const produksiData = filtered.filter((item: any) => {
          const username = (
            item.createdBy?.username ||
            item.createdBy ||
            ""
          ).toLowerCase();
          return username.includes("produksi");
        });
        setData(produksiData);
        // Hitung summary
        setTotalHasil(
          produksiData.reduce(
            (sum, item) => sum + (Number(item.hasilProduksi) || 0),
            0
          )
        );
        setTotalHPP(
          produksiData.reduce(
            (sum, item) => sum + (Number(item.hpBarangJadi) || 0),
            0
          )
        );
        setTotalOperator(
          new Set(
            produksiData.map(
              (item) => item.createdBy?.username || item.createdBy || "-"
            )
          ).size
        );
        setTotalTransaksi(produksiData.length);
      } catch (e) {
        setData([]);
        setTotalHasil(0);
        setTotalHPP(0);
        setTotalOperator(0);
        setTotalTransaksi(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [tanggal]);

  const formatNumber = (n: number) => n.toLocaleString("id-ID");
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Monitoring Produksi Harian
          </h1>
          <p className="text-gray-600">
            Pantau hasil produksi seluruh operator per hari
          </p>
        </div>
        <div>
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-48"
          />
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Hasil Produksi
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(totalHasil)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Seluruh operator</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total HPP
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalHPP)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Seluruh operator</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Operator
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalOperator}
            </div>
            <p className="text-xs text-gray-500 mt-1">User produksi aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transaksi
            </CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalTransaksi}
            </div>
            <p className="text-xs text-gray-500 mt-1">Laporan produksi</p>
          </CardContent>
        </Card>
      </div>
      {/* Tabel Data */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Laporan Produksi</CardTitle>
          <CardDescription>
            Data laporan produksi untuk tanggal{" "}
            {new Date(tanggal).toLocaleDateString("id-ID")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Jenis Barang / COA Akun</TableHead>
                  <TableHead>Hasil Produksi</TableHead>
                  <TableHead>HPP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Tidak ada data untuk tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell>
                        {item.createdBy?.username || item.createdBy || "-"}
                      </TableCell>
                      <TableCell>
                        {item.account?.accountName || item.accountName || "-"}
                      </TableCell>
                      <TableCell>
                        {formatNumber(item.hasilProduksi ?? 0)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.hpBarangJadi ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
