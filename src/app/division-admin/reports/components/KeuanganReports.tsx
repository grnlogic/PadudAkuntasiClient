"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Receipt,
  Calendar,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEntriHarianByDate, getUtangTransaksi } from "@/lib/data";

// Helper function untuk format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface KeuanganSummary {
  totalPenerimaan: number;
  totalPengeluaran: number;
  totalSaldoAkhir: number;
  totalPiutangBaru: number;
  totalPiutangTertagih: number;
  totalPiutangMacet: number;
  totalUtangBaru: number;
  totalUtangDibayar: number;
  saldoKasBersih: number;
}

export default function KeuanganReports() {
  const [summary, setSummary] = useState<KeuanganSummary>({
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    totalSaldoAkhir: 0,
    totalPiutangBaru: 0,
    totalPiutangTertagih: 0,
    totalPiutangMacet: 0,
    totalUtangBaru: 0,
    totalUtangDibayar: 0,
    saldoKasBersih: 0,
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const user = getCurrentUser();

  useEffect(() => {
    loadKeuanganData();
  }, [selectedDate]);

  const loadKeuanganData = async () => {
    setLoading(true);
    try {
      if (user?.division?.id) {
        const [entriesResponse, utangResponse] = await Promise.all([
          getEntriHarianByDate(selectedDate),
          getUtangTransaksi(),
        ]);

        // Handle direct array response from getEntriHarianByDate
        if (Array.isArray(entriesResponse)) {
          calculateKeuanganSummary(entriesResponse);
          setRecentTransactions(entriesResponse.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Error loading keuangan data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKeuanganSummary = (entries: any[]) => {
    const newSummary: KeuanganSummary = {
      totalPenerimaan: 0,
      totalPengeluaran: 0,
      totalSaldoAkhir: 0,
      totalPiutangBaru: 0,
      totalPiutangTertagih: 0,
      totalPiutangMacet: 0,
      totalUtangBaru: 0,
      totalUtangDibayar: 0,
      saldoKasBersih: 0,
    };

    entries.forEach((entry: any) => {
      const nominal = Number(entry.nilai || 0);

      if (entry.transactionType === "PENERIMAAN") {
        newSummary.totalPenerimaan += nominal;
      } else if (entry.transactionType === "PENGELUARAN") {
        newSummary.totalPengeluaran += nominal;
      } else if (entry.transactionType === "SALDO_AKHIR") {
        newSummary.totalSaldoAkhir += nominal;
      }

      if (entry.piutangType === "PIUTANG_BARU") {
        newSummary.totalPiutangBaru += nominal;
      } else if (entry.piutangType === "PIUTANG_TERTAGIH") {
        newSummary.totalPiutangTertagih += nominal;
      } else if (entry.piutangType === "PIUTANG_MACET") {
        newSummary.totalPiutangMacet += nominal;
      }

      if (entry.utangType === "UTANG_BARU") {
        newSummary.totalUtangBaru += nominal;
      } else if (entry.utangType === "UTANG_DIBAYAR") {
        newSummary.totalUtangDibayar += nominal;
      }
    });

    newSummary.saldoKasBersih =
      newSummary.totalPenerimaan - newSummary.totalPengeluaran;
    setSummary(newSummary);
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log("Exporting Keuangan report to PDF...");
  };

  const refreshData = () => {
    loadKeuanganData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Keuangan
            </h1>
            <p className="text-gray-600">
              Monitoring transaksi kas, piutang, dan utang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  Total Penerimaan
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalPenerimaan)}
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
                <p className="text-red-100 text-sm font-medium">
                  Total Pengeluaran
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalPengeluaran)}
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
                  Saldo Kas Bersih
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.saldoKasBersih)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Saldo Akhir
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalSaldoAkhir)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Piutang & Utang Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Ringkasan Piutang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  Piutang Baru
                </p>
                <p className="text-xl font-bold text-blue-800">
                  {formatCurrency(summary.totalPiutangBaru)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Tertagih</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(summary.totalPiutangTertagih)}
                </p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Piutang Macet</p>
              <p className="text-xl font-bold text-red-800">
                {formatCurrency(summary.totalPiutangMacet)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Ringkasan Utang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">
                  Utang Baru
                </p>
                <p className="text-xl font-bold text-orange-800">
                  {formatCurrency(summary.totalUtangBaru)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Dibayar</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(summary.totalUtangDibayar)}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">Saldo Utang</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(
                  summary.totalUtangBaru - summary.totalUtangDibayar
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            📋 Transaksi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.account?.accountName || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.keterangan ||
                          transaction.transactionType ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(transaction.nilai || 0)}
                    </p>
                    <Badge
                      variant={
                        transaction.transactionType === "PENERIMAAN"
                          ? "default"
                          : transaction.transactionType === "PENGELUARAN"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {transaction.transactionType || "N/A"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada transaksi untuk tanggal yang dipilih</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Buat Entri Baru</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">Laporan Bulanan</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              <span className="text-sm">Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
