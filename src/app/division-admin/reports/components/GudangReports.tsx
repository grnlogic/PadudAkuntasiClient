"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Warehouse,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Truck,
  Calendar,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEntriHarianByDate } from "@/lib/data";

interface GudangSummary {
  totalStokMasuk: number;
  totalStokKeluar: number;
  totalStokAkhir: number;
  itemsManaged: number;
  warehouseUtilization: number;
  stockAccuracy: number;
  jumlahLaporan: number;
}

export default function GudangReports() {
  const [summary, setSummary] = useState<GudangSummary>({
    totalStokMasuk: 0,
    totalStokKeluar: 0,
    totalStokAkhir: 0,
    itemsManaged: 0,
    warehouseUtilization: 0,
    stockAccuracy: 0,
    jumlahLaporan: 0,
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [gudangEntries, setGudangEntries] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);

  const user = getCurrentUser();

  useEffect(() => {
    loadGudangData();
  }, [selectedDate]);

  const loadGudangData = async () => {
    setLoading(true);
    try {
      const entriesResponse = await getEntriHarianByDate(selectedDate);

      if (Array.isArray(entriesResponse)) {
        // Filter data gudang - entries with stock-related fields
        const gudangData = entriesResponse.filter(
          (entry: any) =>
            entry.pemakaianAmount ||
            entry.stokAkhir ||
            entry.account?.accountName?.toLowerCase().includes("stok")
        );

        setGudangEntries(gudangData);
        calculateGudangSummary(gudangData);
        generateStockAlerts(gudangData);
      }
    } catch (error) {
      console.error("Error loading gudang data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGudangSummary = (data: any[]) => {
    const newSummary: GudangSummary = {
      totalStokMasuk: 0,
      totalStokKeluar: 0,
      totalStokAkhir: 0,
      itemsManaged: 0,
      warehouseUtilization: 0,
      stockAccuracy: 95, // Default assumption
      jumlahLaporan: data.length,
    };

    const uniqueItems = new Set();

    data.forEach((entry: any) => {
      // Count unique items
      if (entry.account?.accountName) {
        uniqueItems.add(entry.account.accountName);
      }

      // Calculate stock movements
      const pemakaian = Number(entry.pemakaianAmount || 0);
      const stokAkhir = Number(entry.stokAkhir || 0);
      const nilai = Number(entry.nilai || 0);

      newSummary.totalStokKeluar += pemakaian;
      newSummary.totalStokAkhir += stokAkhir;

      // Estimate stock in based on current levels
      newSummary.totalStokMasuk += nilai; // Using nilai as proxy for incoming stock
    });

    newSummary.itemsManaged = uniqueItems.size;

    // Calculate warehouse utilization (estimated)
    const maxCapacity = newSummary.itemsManaged * 1000; // Assume 1000 units per item capacity
    newSummary.warehouseUtilization =
      maxCapacity > 0 ? (newSummary.totalStokAkhir / maxCapacity) * 100 : 0;

    setSummary(newSummary);
  };

  const generateStockAlerts = (data: any[]) => {
    const alerts: any[] = [];

    data.forEach((entry: any) => {
      const stokAkhir = Number(entry.stokAkhir || 0);
      const pemakaian = Number(entry.pemakaianAmount || 0);
      const itemName = entry.account?.accountName || "Unknown Item";

      // Low stock alert
      if (stokAkhir < pemakaian * 2 && pemakaian > 0) {
        alerts.push({
          type: "warning",
          level: "Low Stock",
          item: itemName,
          current: stokAkhir,
          recommended: pemakaian * 5,
          message: `Stock ${itemName} mendekati batas minimum`,
        });
      }

      // Zero stock alert
      if (stokAkhir === 0) {
        alerts.push({
          type: "error",
          level: "Out of Stock",
          item: itemName,
          current: 0,
          recommended: pemakaian * 3,
          message: `${itemName} habis!`,
        });
      }

      // Overstock alert
      if (stokAkhir > pemakaian * 20 && pemakaian > 0) {
        alerts.push({
          type: "info",
          level: "Overstock",
          item: itemName,
          current: stokAkhir,
          recommended: pemakaian * 10,
          message: `${itemName} berlebih, pertimbangkan redistribusi`,
        });
      }
    });

    setStockAlerts(alerts.slice(0, 5)); // Limit to 5 most critical alerts
  };

  const exportToPDF = () => {
  };

  const refreshData = () => {
    loadGudangData();
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600 bg-red-100 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "info":
        return "text-blue-600 bg-blue-100 border-blue-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
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
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full">
            <Warehouse className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Gudang & Warehouse
            </h1>
            <p className="text-gray-600">
              Monitoring stok, pergerakan barang, dan efisiensi gudang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <p className="text-green-100 text-sm font-medium">Stok Masuk</p>
                <p className="text-2xl font-bold">
                  {summary.totalStokMasuk.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-400 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Stok Keluar</p>
                <p className="text-2xl font-bold">
                  {summary.totalStokKeluar.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Stok Saat Ini
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalStokAkhir.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Items Dikelola
                </p>
                <p className="text-2xl font-bold">{summary.itemsManaged}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Metrics Gudang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium mb-2">
                Utilisasi Gudang
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-indigo-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      summary.warehouseUtilization >= 80
                        ? "bg-red-500"
                        : summary.warehouseUtilization >= 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(summary.warehouseUtilization, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-indigo-800">
                  {summary.warehouseUtilization.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium mb-2">
                Akurasi Stok
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-green-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-500"
                    style={{
                      width: `${Math.min(summary.stockAccuracy, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-green-800">
                  {summary.stockAccuracy.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Laporan</p>
                <p className="text-lg font-bold text-blue-800">
                  {summary.jumlahLaporan}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Net Flow</p>
                <p className="text-lg font-bold text-orange-800">
                  {(
                    summary.totalStokMasuk - summary.totalStokKeluar
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              🚨 Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockAlerts.length > 0 ? (
              <div className="space-y-3">
                {stockAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getAlertColor(
                      alert.type
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{alert.item}</p>
                          <Badge variant="outline" className="text-xs">
                            {alert.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {alert.message}
                        </p>
                        <div className="flex justify-between text-xs">
                          <span>Saat ini: {alert.current}</span>
                          <span>Direkomendasikan: {alert.recommended}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">Semua stok dalam kondisi normal</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            📦 Pergerakan Stok Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : gudangEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Keluar
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Stok Akhir
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Turnover
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gudangEntries.map((entry, index) => {
                    const keluar = Number(entry.pemakaianAmount || 0);
                    const stokAkhir = Number(entry.stokAkhir || 0);
                    const turnover = stokAkhir > 0 ? keluar / stokAkhir : 0;

                    let status = "Normal";
                    let statusColor = "secondary";

                    if (stokAkhir === 0) {
                      status = "Empty";
                      statusColor = "destructive";
                    } else if (stokAkhir < keluar * 2) {
                      status = "Low";
                      statusColor = "destructive";
                    } else if (turnover >= 0.5) {
                      status = "Active";
                      statusColor = "default";
                    } else if (turnover < 0.1) {
                      status = "Slow";
                      statusColor = "secondary";
                    }

                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {entry.account?.accountName || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {entry.account?.accountCode || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-red-600 font-semibold">
                            {keluar.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-blue-600 font-semibold">
                            {stokAkhir.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant={statusColor as any}>{status}</Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-purple-600 font-medium">
                            {turnover.toFixed(2)}x
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {entry.keterangan || "-"}
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
              <p>Belum ada data pergerakan stok untuk tanggal yang dipilih</p>
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
              <span className="text-sm">Input Stok</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              <span className="text-sm">Cari Item</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Truck className="h-5 w-5" />
              <span className="text-sm">Shipping</span>
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
