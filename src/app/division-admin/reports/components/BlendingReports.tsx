"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Warehouse,
  TrendingUp,
  TrendingDown,
  Package2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Boxes,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLaporanGudang } from "@/lib/data";

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

  const user = getCurrentUser();

  useEffect(() => {
    loadBlendingData();
  }, [selectedDate]);

  const loadBlendingData = async () => {
    setLoading(true);
    try {
      const blendingResponse = await getLaporanGudang();

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

    // Calculate efficiency rate (how well inventory is managed)
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
          message: `Stock rendah untuk ${accountName}`,
          detail: `Stock: ${stokAkhir}, Pemakaian: ${pemakaian}`,
        });
      }

      // Overstock alert
      if (stokAkhir > pemakaian * 10 && pemakaian > 0) {
        newAlerts.push({
          type: "info",
          message: `Potensi overstock untuk ${accountName}`,
          detail: `Stock: ${stokAkhir}, Pemakaian: ${pemakaian}`,
        });
      }

      // Zero movement alert
      if (pemakaian === 0 && stokAkhir > 0) {
        newAlerts.push({
          type: "error",
          message: `Tidak ada pergerakan untuk ${accountName}`,
          detail: `Stock tersedia: ${stokAkhir}`,
        });
      }
    });

    setAlerts(newAlerts.slice(0, 5)); // Limit to 5 alerts
  };

  const exportToPDF = () => {
    console.log("Exporting Blending report to PDF...");
  };

  const refreshData = () => {
    loadBlendingData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Optimal":
        return "text-green-600 bg-green-100";
      case "Good":
        return "text-blue-600 bg-blue-100";
      case "Fair":
        return "text-yellow-600 bg-yellow-100";
      case "Needs Review":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
            <Warehouse className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Blending & Persediaan
            </h1>
            <p className="text-gray-600">
              Monitoring stok bahan baku, pemakaian, dan efisiensi inventory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  Total Stok Awal
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalStokAwal.toLocaleString()}
                </p>
              </div>
              <Package2 className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-400 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Total Pemakaian
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalPemakaian.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Stok Akhir</p>
                <p className="text-2xl font-bold">
                  {summary.totalStokAkhir.toLocaleString()}
                </p>
              </div>
              <Boxes className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Efficiency Rate
                </p>
                <p className="text-2xl font-bold">
                  {summary.efficiencyRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Status Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status Hari Ini:</span>
              <Badge className={getStatusColor(summary.statusInventory)}>
                {summary.statusInventory}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">
                Stock Turnover Ratio
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      summary.stockTurnover >= 2
                        ? "bg-green-500"
                        : summary.stockTurnover >= 1.5
                        ? "bg-blue-500"
                        : summary.stockTurnover >= 1
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(summary.stockTurnover * 25, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {summary.stockTurnover.toFixed(2)}x
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">Laporan</p>
                <p className="text-lg font-bold text-indigo-800">
                  {summary.jumlahLaporan}
                </p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg">
                <p className="text-sm text-cyan-600 font-medium">
                  Items Tracked
                </p>
                <p className="text-lg font-bold text-cyan-800">
                  {laporanBlending.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              🚨 Alert & Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.type === "warning"
                        ? "bg-yellow-50 border-yellow-200"
                        : alert.type === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">Tidak ada alert untuk hari ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            📦 Detail Inventory Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : laporanBlending.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Bahan Baku
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Stok Awal
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Pemakaian
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Stok Akhir
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Turnover
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {laporanBlending.map((item, index) => {
                    const stokAwal = Number(
                      item.stokAwal ||
                        item.stok_awal ||
                        item.barangMasuk ||
                        item.barang_masuk ||
                        0
                    );
                    const pemakaian = Number(item.pemakaian || 0);
                    const stokAkhir = Number(
                      item.stokAkhir || item.stok_akhir || 0
                    );
                    const turnover = stokAkhir > 0 ? pemakaian / stokAkhir : 0;

                    let status = "Normal";
                    let statusColor = "secondary";

                    if (stokAkhir < pemakaian * 0.5) {
                      status = "Low Stock";
                      statusColor = "destructive";
                    } else if (stokAkhir > pemakaian * 10 && pemakaian > 0) {
                      status = "Overstock";
                      statusColor = "secondary";
                    } else if (pemakaian === 0 && stokAkhir > 0) {
                      status = "No Movement";
                      statusColor = "destructive";
                    } else if (turnover >= 1.5) {
                      status = "Optimal";
                      statusColor = "default";
                    }

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
                          <span className="text-blue-600 font-semibold">
                            {stokAwal.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-orange-600 font-semibold">
                            {pemakaian.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-green-600 font-semibold">
                            {stokAkhir.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-purple-600 font-medium">
                            {turnover.toFixed(2)}x
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant={statusColor as any}>{status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {item.keterangan ||
                              item.kondisiGudang ||
                              item.kondisi_gudang ||
                              item.keteranganGudang ||
                              item.keterangan_gudang ||
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
              <Warehouse className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada data inventory untuk tanggal yang dipilih</p>
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
              <span className="text-sm">Input Inventory</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">Stock Alert</span>
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
