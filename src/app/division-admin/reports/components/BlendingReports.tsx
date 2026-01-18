"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Warehouse,
  TrendingUp,
  TrendingDown,
  Package2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLaporanGudang } from "@/lib/data";
import { toastError } from "@/lib/toast-utils";

interface BlendingSummary {
  totalStokAwal: number;
  totalPemakaian: number;
  totalStokAkhir: number;
  efficiencyRate: number;
  jumlahLaporan: number;
  stockTurnover: number;
  statusInventory: string;
}

export default function BlendingReports() {
  const [summary, setSummary] = useState<BlendingSummary>({
    totalStokAwal: 0,
    totalPemakaian: 0,
    totalStokAkhir: 0,
    efficiencyRate: 0,
    jumlahLaporan: 0,
    stockTurnover: 0,
    statusInventory: "Normal",
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [laporanBlending, setLaporanBlending] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadBlendingData();
  }, [selectedDate]);

  const loadBlendingData = async () => {
    setLoading(true);
    try {
      // ✅ Fetch with larger limit to ensure we get user's data
      const blendingResponse = await getLaporanGudang({ limit: 1000 });

      if (Array.isArray(blendingResponse)) {
        // Filter data untuk tanggal yang dipilih
        const filteredData = blendingResponse.filter((item: any) => {
          const itemDate = new Date(item.tanggalLaporan || item.createdAt)
            .toISOString()
            .split("T")[0];
          return itemDate === selectedDate;
        });

        setLaporanBlending(filteredData);
        calculateBlendingSummary(filteredData);
        generateAlerts(filteredData);
      }
    } catch (error) {
      console.error("Error loading blending data:", error);
      toastError.custom("Gagal memuat data blending");
    } finally {
      setLoading(false);
    }
  };

  const calculateBlendingSummary = (data: any[]) => {
    const newSummary: BlendingSummary = {
      totalStokAwal: 0,
      totalPemakaian: 0,
      totalStokAkhir: 0,
      efficiencyRate: 0,
      jumlahLaporan: data.length,
      stockTurnover: 0,
      statusInventory: "Normal",
    };

    data.forEach((item: any) => {
      newSummary.totalStokAwal += Number(
        item.stokAwal ||
          item.stok_awal ||
          item.barangMasuk ||
          item.barang_masuk ||
          0
      );
      newSummary.totalPemakaian += Number(item.pemakaian || 0);
      newSummary.totalStokAkhir += Number(
        item.stokAkhir || item.stok_akhir || 0
      );
    });

    // Calculate efficiency rate
    newSummary.efficiencyRate =
      newSummary.totalStokAwal > 0
        ? ((newSummary.totalStokAwal - newSummary.totalStokAkhir) /
            newSummary.totalStokAwal) *
          100
        : 0;

    // Calculate stock turnover
    newSummary.stockTurnover =
      newSummary.totalStokAkhir > 0
        ? newSummary.totalPemakaian / newSummary.totalStokAkhir
        : 0;

    // Determine inventory status
    if (newSummary.efficiencyRate >= 80 && newSummary.stockTurnover >= 1.5) {
      newSummary.statusInventory = "Optimal";
    } else if (
      newSummary.efficiencyRate >= 60 &&
      newSummary.stockTurnover >= 1.0
    ) {
      newSummary.statusInventory = "Good";
    } else if (newSummary.efficiencyRate >= 40) {
      newSummary.statusInventory = "Fair";
    } else {
      newSummary.statusInventory = "Needs Review";
    }

    setSummary(newSummary);
  };

  const generateAlerts = (data: any[]) => {
    const newAlerts: any[] = [];

    data.forEach((item: any) => {
      const stokAkhir = Number(item.stokAkhir || item.stok_akhir || 0);
      const pemakaian = Number(item.pemakaian || 0);
      const accountName = item.account?.accountName || "Unknown Item";

      // Low stock alert
      if (stokAkhir < pemakaian * 0.5) {
        newAlerts.push({
          type: "warning",
          message: `Stock rendah: ${accountName}`,
          detail: `Sisa: ${stokAkhir}, Pemakaian: ${pemakaian}`,
        });
      }

      // Overstock alert
      if (stokAkhir > pemakaian * 10 && pemakaian > 0) {
        newAlerts.push({
          type: "info",
          message: `Potensi overstock: ${accountName}`,
          detail: `Sisa: ${stokAkhir}, Rasio: ${(stokAkhir/pemakaian).toFixed(1)}x`,
        });
      }

      // Zero movement alert
      if (pemakaian === 0 && stokAkhir > 0) {
        newAlerts.push({
          type: "error",
          message: `Tidak ada pergerakan: ${accountName}`,
          detail: `Stock diam: ${stokAkhir}`,
        });
      }
    });

    setAlerts(newAlerts.slice(0, 5));
  };

  const refreshData = () => {
    loadBlendingData();
  };

  // Helper for status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Optimal": return "default"; // green-ish usually
      case "Good": return "secondary"; // blue-ish
      case "Fair": return "outline"; // yellow-ish warning
      case "Needs Review": return "destructive"; // red
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Laporan Persediaan</h2>
          <p className="text-muted-foreground">
            Monitoring stok, pemakaian, dan analisis efisiensi gudang.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok Awal</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStokAwal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unit barang masuk</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemakaian</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPemakaian.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unit barang keluar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Akhir</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStokAkhir.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unit sisa di gudang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efisiensi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.efficiencyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-medium">{summary.statusInventory}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Data Table */}
        <Card className="col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Rincian Per Item</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Memuat data...
              </div>
            ) : laporanBlending.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-dashed border-2 rounded-md">
                <Warehouse className="h-8 w-8 mb-2 opacity-50" />
                <p>Belum ada data untuk tanggal ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="text-right">Stok Awal</TableHead>
                    <TableHead className="text-right">Pemakaian</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laporanBlending.map((item) => {
                     const stokAkhir = Number(item.stokAkhir || item.stok_akhir || 0);
                     const pemakaian = Number(item.pemakaian || 0);
                     const ratio = pemakaian > 0 ? stokAkhir / pemakaian : 0;
                     
                     let status = "Normal";
                     let statusVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

                     if (stokAkhir < pemakaian * 0.5) {
                        status = "Low";
                        statusVariant = "destructive";
                     } else if (pemakaian === 0 && stokAkhir > 0) {
                        status = "Stagnant";
                        statusVariant = "secondary";
                     } else if (stokAkhir > pemakaian * 5) {
                        status = "High";
                        statusVariant = "default";
                     }

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.account?.accountName || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{item.account?.accountCode}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(item.stokAwal || item.stok_awal || item.barangMasuk || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {pemakaian.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {stokAkhir.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusVariant} className="text-xs">
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Alerts / Notifications */}
        <Card className="col-span-3 lg:col-span-2">
          <CardHeader>
            <CardTitle>Notifikasi Penting</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
               <div className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada notifikasi penting.
               </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                    {alert.type === 'error' || alert.type === 'warning' ? (
                       <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    ) : (
                       <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
