"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// Types
interface CashflowData {
  total_penerimaan: string;
  total_pengeluaran: string;
  net_cashflow: string;
  total_transaksi: string;
}

interface PiutangSummary {
  tipe_transaksi: string;
  jumlah_transaksi: string;
  total_nominal: string;
}

interface UtangSummary {
  tipe_transaksi: string;
  jumlah_transaksi: string;
  total_nominal: string;
}

interface SaldoPerAccount {
  account_code: string;
  account_name: string;
  total_penerimaan: string;
  total_pengeluaran: string;
  net_amount: string;
}

interface TrenData {
  tanggal: string;
  kas: string;
  piutang: string;
  utang: string;
}

export default function KeuanganReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null);
  const [piutangData, setPiutangData] = useState<PiutangSummary[]>([]);
  const [utangData, setUtangData] = useState<UtangSummary[]>([]);
  const [saldoPerAccount, setSaldoPerAccount] = useState<SaldoPerAccount[]>([]);
  const [trenData, setTrenData] = useState<TrenData[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const fetchKeuanganData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token)
        throw new Error("Token tidak ditemukan. Silakan login kembali.");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

      // Fetch all data in parallel
      const [cashflowRes, piutangRes, utangRes, saldoRes, trenRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/v1/keuangan-saldo/cashflow`, { headers }),
          fetch(`${API_BASE}/api/v1/piutang/summary`, { headers }),
          fetch(`${API_BASE}/api/v1/utang/summary`, { headers }),
          fetch(`${API_BASE}/api/v1/keuangan-saldo/per-account`, { headers }),
          fetch(`${API_BASE}/api/v1/keuangan-saldo/tren`, { headers }),
        ]);

      // Check for errors
      if (
        !cashflowRes.ok ||
        !piutangRes.ok ||
        !utangRes.ok ||
        !saldoRes.ok ||
        !trenRes.ok
      ) {
        throw new Error("Gagal mengambil data dari server");
      }

      const [cashflow, piutang, utang, saldo, tren] = await Promise.all([
        cashflowRes.json(),
        piutangRes.json(),
        utangRes.json(),
        saldoRes.json(),
        trenRes.json(),
      ]);

      if (cashflow.success) setCashflowData(cashflow.data);
      if (piutang.success) setPiutangData(piutang.data);
      if (utang.success) setUtangData(utang.data);
      if (saldo.success) setSaldoPerAccount(saldo.data);
      if (tren.success) setTrenData(tren.data);
    } catch (error) {
      console.error("Error fetching keuangan data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeuanganData();
  }, []);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}M`;
    } else if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(1)}rb`;
    }
    return formatCurrency(value);
  };

  // Calculate totals
  const totalPiutang = piutangData.reduce(
    (sum, item) =>
      item.tipe_transaksi === "SALDO_AKHIR_PIUTANG"
        ? parseFloat(item.total_nominal)
        : sum,
    0
  );
  const totalUtang = utangData.reduce(
    (sum, item) =>
      item.tipe_transaksi === "SALDO_AKHIR_UTANG"
        ? parseFloat(item.total_nominal)
        : sum,
    0
  );

  const netCashflow = cashflowData ? parseFloat(cashflowData.net_cashflow) : 0;

  // Top 5 accounts by net amount
  const topAccounts = [...saldoPerAccount]
    .sort(
      (a, b) =>
        Math.abs(parseFloat(b.net_amount)) - Math.abs(parseFloat(a.net_amount))
    )
    .slice(0, 5);

  // Prepare chart data
  const piutangChartData = piutangData.map((item) => ({
    name: item.tipe_transaksi
      .replace(/_/g, " ")
      .replace("PIUTANG ", "")
      .replace("SALDO AKHIR ", ""),
    value: parseFloat(item.total_nominal),
    count: parseInt(item.jumlah_transaksi),
  }));

  const utangChartData = utangData.map((item) => ({
    name: item.tipe_transaksi
      .replace(/_/g, " ")
      .replace("UTANG ", "")
      .replace("SALDO AKHIR ", ""),
    value: parseFloat(item.total_nominal),
    count: parseInt(item.jumlah_transaksi),
  }));

  const cashflowChartData = [
    {
      name: "Penerimaan",
      amount: cashflowData ? parseFloat(cashflowData.total_penerimaan) : 0,
      fill: "#10b981",
    },
    {
      name: "Pengeluaran",
      amount: cashflowData ? parseFloat(cashflowData.total_pengeluaran) : 0,
      fill: "#ef4444",
    },
  ];

  const topAccountsChartData = topAccounts.map((acc) => ({
    name: acc.account_code,
    penerimaan: parseFloat(acc.total_penerimaan),
    pengeluaran: parseFloat(acc.total_pengeluaran),
    netAmount: parseFloat(acc.net_amount),
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const UTANG_COLORS = ["#f97316", "#ef4444", "#a855f7"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat data keuangan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gagal Memuat Data
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchKeuanganData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-gray-600 mt-1">
            Dashboard ringkasan keuangan dan analisis
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchKeuanganData}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net Cashflow */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">
              Net Cashflow
            </CardTitle>
            <Wallet className="h-5 w-5 text-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(netCashflow)}
            </div>
            <p className="text-xs text-blue-100 mt-1">
              {cashflowData?.total_transaksi || 0} transaksi
            </p>
            <div className="mt-2 flex items-center gap-1">
              {netCashflow >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-300" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-300" />
              )}
              <span className="text-sm">
                {netCashflow >= 0 ? "Surplus" : "Defisit"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Penerimaan */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-100">
              Total Penerimaan
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashflowData
                ? formatCurrency(cashflowData.total_penerimaan)
                : "Rp 0"}
            </div>
            <p className="text-xs text-green-100 mt-1">Kas masuk</p>
          </CardContent>
        </Card>

        {/* Total Pengeluaran */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-100">
              Total Pengeluaran
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashflowData
                ? formatCurrency(cashflowData.total_pengeluaran)
                : "Rp 0"}
            </div>
            <p className="text-xs text-red-100 mt-1">Kas keluar</p>
          </CardContent>
        </Card>

        {/* Rasio Keuangan */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">
              Rasio Piutang/Utang
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUtang > 0
                ? ((totalPiutang / totalUtang) * 100).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-purple-100 mt-1">Piutang vs Utang</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Informasi KAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saldo Kas Saat Ini */}
        <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-100">
              Saldo Kas Saat Ini
            </CardTitle>
            <Wallet className="h-5 w-5 text-cyan-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cashflowData
                ? formatCurrency(cashflowData.net_cashflow)
                : "Rp 0"}
            </div>
            <p className="text-xs text-cyan-100 mt-1">Posisi kas terkini</p>
            {cashflowData && (
              <div className="mt-3 pt-3 border-t border-cyan-400">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-100">Kas Masuk:</span>
                  <span className="font-semibold">
                    {formatCurrency(cashflowData.total_penerimaan)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-100">Kas Keluar:</span>
                  <span className="font-semibold">
                    {formatCurrency(cashflowData.total_pengeluaran)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kas Ratio */}
        <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-teal-100">
              Cash Ratio
            </CardTitle>
            <Activity className="h-5 w-5 text-teal-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalUtang > 0 && cashflowData
                ? (
                    (parseFloat(cashflowData.net_cashflow) / totalUtang) *
                    100
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-teal-100 mt-1">Kas / Total Utang</p>
            {cashflowData && totalUtang > 0 && (
              <div className="mt-3">
                <div className="w-full bg-teal-700 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          (parseFloat(cashflowData.net_cashflow) / totalUtang) *
                            100,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-teal-100 mt-2">
                  {parseFloat(cashflowData.net_cashflow) > totalUtang
                    ? "Kas mencukupi untuk melunasi utang"
                    : parseFloat(cashflowData.net_cashflow) > 0
                    ? "Kas positif namun perlu tambahan untuk utang"
                    : "Kas defisit, perlu perhatian"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operating Cash Flow Efficiency */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">
              Efisiensi Kas Operasional
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-indigo-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cashflowData && parseFloat(cashflowData.total_penerimaan) > 0
                ? (
                    ((parseFloat(cashflowData.total_penerimaan) -
                      parseFloat(cashflowData.total_pengeluaran)) /
                      parseFloat(cashflowData.total_penerimaan)) *
                    100
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-indigo-100 mt-1">Net Cash Margin</p>
            {cashflowData && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  {parseFloat(cashflowData.net_cashflow) >= 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-300" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-300" />
                  )}
                  <span className="text-xs text-indigo-100">
                    {parseFloat(cashflowData.net_cashflow) >= 0
                      ? "Cashflow Positif"
                      : "Cashflow Negatif"}
                  </span>
                </div>
                <p className="text-xs text-indigo-100">
                  Selisih:{" "}
                  <span className="font-semibold">
                    {formatCurrency(
                      Math.abs(parseFloat(cashflowData.net_cashflow))
                    )}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Piutang Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Distribusi Piutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {piutangChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={piutangChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {piutangChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {piutangChartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada data piutang</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utang Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-orange-600" />
              Distribusi Utang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {utangChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={utangChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {utangChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={UTANG_COLORS[index % UTANG_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {utangChartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              UTANG_COLORS[index % UTANG_COLORS.length],
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada data utang</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Analisis Cashflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cashflowData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashflowChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                  }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {cashflowChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data cashflow</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium mb-1">
                Penerimaan
              </p>
              <p className="text-xl font-bold text-green-600">
                {cashflowData
                  ? formatCurrency(cashflowData.total_penerimaan)
                  : "Rp 0"}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-1">
                Pengeluaran
              </p>
              <p className="text-xl font-bold text-red-600">
                {cashflowData
                  ? formatCurrency(cashflowData.total_pengeluaran)
                  : "Rp 0"}
              </p>
            </div>
            <div
              className={`text-center p-4 rounded-lg ${
                netCashflow >= 0 ? "bg-blue-50" : "bg-orange-50"
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  netCashflow >= 0 ? "text-blue-700" : "text-orange-700"
                }`}
              >
                Net Cashflow
              </p>
              <p
                className={`text-xl font-bold ${
                  netCashflow >= 0 ? "text-blue-600" : "text-orange-600"
                }`}
              >
                {formatCurrency(netCashflow)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Kas per Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cyan-600" />
            Breakdown Kas per Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saldoPerAccount.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={saldoPerAccount
                    .filter(
                      (acc) =>
                        acc.account_name.toLowerCase().includes("kas") ||
                        acc.account_name.toLowerCase().includes("bank") ||
                        acc.account_code.startsWith("1-1")
                    )
                    .map((acc) => ({
                      nama_akun: acc.account_name,
                      kode_akun: acc.account_code,
                      saldo: parseFloat(acc.net_amount),
                    }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nama_akun" type="category" width={110} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="saldo" name="Saldo">
                    {saldoPerAccount
                      .filter(
                        (acc) =>
                          acc.account_name.toLowerCase().includes("kas") ||
                          acc.account_name.toLowerCase().includes("bank") ||
                          acc.account_code.startsWith("1-1")
                      )
                      .map((acc, index) => {
                        const saldoValue = parseFloat(acc.net_amount);
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              saldoValue >= 0
                                ? `hsl(${180 + index * 30}, 70%, 50%)`
                                : "#ef4444"
                            }
                          />
                        );
                      })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Detail Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Kode
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Nama Akun
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {saldoPerAccount
                      .filter(
                        (acc) =>
                          acc.account_name.toLowerCase().includes("kas") ||
                          acc.account_name.toLowerCase().includes("bank") ||
                          acc.account_code.startsWith("1-1")
                      )
                      .map((acc, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-2 text-gray-600">
                            {acc.account_code}
                          </td>
                          <td className="px-4 py-2 text-gray-800">
                            {acc.account_name}
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-semibold ${
                              parseFloat(acc.net_amount) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(parseFloat(acc.net_amount))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-cyan-50">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-right font-bold text-cyan-900"
                      >
                        Total Kas & Bank:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-cyan-900">
                        {formatCurrency(
                          saldoPerAccount
                            .filter(
                              (acc) =>
                                acc.account_name
                                  .toLowerCase()
                                  .includes("kas") ||
                                acc.account_name
                                  .toLowerCase()
                                  .includes("bank") ||
                                acc.account_code.startsWith("1-1")
                            )
                            .reduce(
                              (sum, acc) => sum + parseFloat(acc.net_amount),
                              0
                            )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data kas</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tren Keuangan Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Tren Keuangan (Kas, Piutang, Utang)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trenData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trenData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="tanggal"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrencyShort(value)}
                  />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    }}
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="kas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Kas"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="piutang"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Piutang"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="utang"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Utang"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    Kas Terkini
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {trenData.length > 0
                      ? formatCurrency(trenData[trenData.length - 1].kas)
                      : "Rp 0"}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-1">
                    Piutang Terkini
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {trenData.length > 0
                      ? formatCurrency(trenData[trenData.length - 1].piutang)
                      : "Rp 0"}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-1">
                    Utang Terkini
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {trenData.length > 0
                      ? formatCurrency(trenData[trenData.length - 1].utang)
                      : "Rp 0"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data tren</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Piutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalPiutang)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {piutangData.reduce(
                (sum, item) => sum + parseInt(item.jumlah_transaksi),
                0
              )}{" "}
              total transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Utang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalUtang)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {utangData.reduce(
                (sum, item) => sum + parseInt(item.jumlah_transaksi),
                0
              )}{" "}
              total transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Selisih Piutang-Utang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalPiutang - totalUtang >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(totalPiutang - totalUtang)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalPiutang - totalUtang >= 0
                ? "Aset lebih"
                : "Liabilitas lebih"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert if cashflow negative */}
      {netCashflow < 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">
                Perhatian: Cashflow Negatif
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Net cashflow saat ini defisit sebesar{" "}
                <strong>{formatCurrency(Math.abs(netCashflow))}</strong>.
                Pertimbangkan untuk mengurangi pengeluaran atau meningkatkan
                penerimaan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
