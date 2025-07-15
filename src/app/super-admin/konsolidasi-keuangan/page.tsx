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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building,
  Calculator,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  getEntriHarian,
  getAccounts,
  getKonsolidasiKeuanganByDate,
} from "@/lib/data";
import { Input } from "@/components/ui/input";

interface KonsolidasiData {
  tanggal: string;
  perusahaan: string;
  penerimaan: number;
  pengeluaran: number;
  saldoAkhir: number;
  totalTransaksi: number;
}

interface PerusahaanSummary {
  nama: string;
  totalPenerimaan: number;
  totalPengeluaran: number;
  totalSaldoAkhir: number;
  totalTransaksi: number;
}

export default function KonsolidasiKeuangan() {
  const [konsolidasiData, setKonsolidasiData] = useState<KonsolidasiData[]>([]);
  const [perusahaanSummary, setPerusahaanSummary] = useState<
    PerusahaanSummary[]
  >([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedPerusahaan, setSelectedPerusahaan] = useState("all");
  const [loading, setLoading] = useState(false);
  const [totalKeseluruhan, setTotalKeseluruhan] = useState({
    penerimaan: 0,
    pengeluaran: 0,
    saldoAkhir: 0,
    totalTransaksi: 0,
  });
  // ✅ ADD: State for detailed breakdown
  const [detailedBreakdown, setDetailedBreakdown] = useState<any[]>([]);
  const [operatorSummary, setOperatorSummary] = useState<any[]>([]);
  // Tambahkan state accounts
  const [accounts, setAccounts] = useState<any[]>([]);

  // Daftar perusahaan yang akan dikonsolidasi
  const daftarPerusahaan = [
    { id: "pjp", nama: "PT. Padudjaya Putera" },
    { id: "prima", nama: "PT. Prima" },
    { id: "sp", nama: "PT. SP" },
    { id: "blending", nama: "PT. Blending" },
    { id: "holding", nama: "PT. Holding" },
  ];

  const loadKonsolidasiData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data entri harian & akun
      const entries = await getEntriHarian();
      const accounts = await getAccounts();
      setAccounts(accounts);

      // 2. Filter entri sesuai tanggal (format YYYY-MM-DD)
      const filteredEntries = entries.filter((entry) => {
        const entryDate = (entry.tanggal || entry.date || "").slice(0, 10);
        return entryDate === selectedDate;
      });

      // 3. Agregasi per perusahaan
      const konsolidasiMap = new Map<string, KonsolidasiData>();
      filteredEntries.forEach((entry) => {
        // Cari akun terkait
        const account = accounts.find(
          (acc) => acc.id?.toString() === entry.accountId?.toString()
        );
        // Mapping perusahaan
        let perusahaan = "PT. Padudjaya Putera"; // Default fallback
        if (account) {
          const accountCode = (account.accountCode || "").toLowerCase();
          const divisionName = (account.division?.name || "").toLowerCase();
          if (
            accountCode.includes("pjp") ||
            divisionName.includes("pjp") ||
            accountCode.startsWith("1-")
          )
            perusahaan = "PT. Padudjaya Putera";
          else if (
            accountCode.includes("prima") ||
            divisionName.includes("prima") ||
            accountCode.startsWith("2-")
          )
            perusahaan = "PT. Prima";
          else if (
            accountCode.includes("sp") ||
            divisionName.includes("sp") ||
            accountCode.startsWith("3-")
          )
            perusahaan = "PT. SP";
          else if (
            accountCode.includes("blending") ||
            divisionName.includes("blending") ||
            accountCode.startsWith("4-")
          )
            perusahaan = "PT. Blending";
          else if (
            accountCode.includes("holding") ||
            divisionName.includes("holding") ||
            accountCode.startsWith("5-")
          )
            perusahaan = "PT. Holding";
        }
        // Filter by selected company
        if (selectedPerusahaan !== "all") {
          const selectedCompany = daftarPerusahaan.find(
            (p) => p.id === selectedPerusahaan
          );
          if (selectedCompany && perusahaan !== selectedCompany.nama) return;
        }
        // Siapkan data perusahaan jika belum ada
        if (!konsolidasiMap.has(perusahaan)) {
          konsolidasiMap.set(perusahaan, {
            tanggal: selectedDate,
            perusahaan,
            penerimaan: 0,
            pengeluaran: 0,
            saldoAkhir: 0,
            totalTransaksi: 0,
          });
        }
        const companyData = konsolidasiMap.get(perusahaan)!;
        const nilai = Number(entry.nilai) || 0;
        // Mapping transactionType robust
        let transactionType = entry.transactionType || "";
        if (!transactionType) {
          if (nilai > 0) transactionType = "PENERIMAAN";
          else if (nilai < 0) transactionType = "PENGELUARAN";
        }
        // Agregasi
        if (transactionType === "PENERIMAAN")
          companyData.penerimaan += Math.abs(nilai);
        else if (transactionType === "PENGELUARAN")
          companyData.pengeluaran += Math.abs(nilai);
        else if (transactionType === "SALDO_AKHIR")
          companyData.saldoAkhir = Number(entry.saldoAkhir ?? nilai);
        companyData.totalTransaksi += 1;
      });
      // 4. Simpan hasil ke state
      setKonsolidasiData(Array.from(konsolidasiMap.values()));
      // 5. Breakdown detail untuk tabel
      const breakdown = filteredEntries.map((entry) => {
        const account = accounts.find(
          (acc) => acc.id?.toString() === entry.accountId?.toString()
        );
        let perusahaan = "PT. Padudjaya Putera";
        if (account) {
          const accountCode = (account.accountCode || "").toLowerCase();
          const divisionName = (account.division?.name || "").toLowerCase();
          if (
            accountCode.includes("pjp") ||
            divisionName.includes("pjp") ||
            accountCode.startsWith("1-")
          )
            perusahaan = "PT. Padudjaya Putera";
          else if (
            accountCode.includes("prima") ||
            divisionName.includes("prima") ||
            accountCode.startsWith("2-")
          )
            perusahaan = "PT. Prima";
          else if (
            accountCode.includes("sp") ||
            divisionName.includes("sp") ||
            accountCode.startsWith("3-")
          )
            perusahaan = "PT. SP";
          else if (
            accountCode.includes("blending") ||
            divisionName.includes("blending") ||
            accountCode.startsWith("4-")
          )
            perusahaan = "PT. Blending";
          else if (
            accountCode.includes("holding") ||
            divisionName.includes("holding") ||
            accountCode.startsWith("5-")
          )
            perusahaan = "PT. Holding";
        }
        const isSaldoAkhir = (entry.transactionType || "") === "SALDO_AKHIR";
        return {
          id: entry.id,
          tanggal: entry.tanggal || entry.date,
          perusahaan,
          accountId: account?.id || entry.accountId || "N/A",
          accountCode: account?.accountCode || "N/A",
          accountName: account?.accountName || "N/A",
          nilai: Number(entry.nilai) || 0,
          saldoAkhir: isSaldoAkhir
            ? Number(entry.saldoAkhir ?? entry.nilai) || 0
            : undefined,
          transactionType: entry.transactionType || "",
          description: entry.description || "",
          createdBy: entry.createdBy || "system",
        };
      });
      setDetailedBreakdown(breakdown);

      // 6. Summary per perusahaan
      const summaries = daftarPerusahaan.map((perusahaan) => {
        const companyData = konsolidasiMap.get(perusahaan.nama);
        return {
          nama: perusahaan.nama,
          totalPenerimaan: companyData?.penerimaan || 0,
          totalPengeluaran: companyData?.pengeluaran || 0,
          totalSaldoAkhir: companyData?.saldoAkhir || 0,
          totalTransaksi: companyData?.totalTransaksi || 0,
        };
      });
      setPerusahaanSummary(summaries);

      // 7. Group by operator (summary per operator dari breakdown/detail)
      const operatorMap = new Map<string, any>();
      // Untuk saldo akhir: simpan array entry SALDO_AKHIR per operator
      // const saldoAkhirMap = new Map<string, any[]>(); // <-- tidak perlu lagi
      breakdown.forEach((entry) => {
        const operator = (entry.createdBy || "unknown").toLowerCase();
        if (operator.includes("hrd")) return; // skip operator HRD
        if (!operatorMap.has(operator)) {
          operatorMap.set(operator, {
            operator,
            penerimaan: 0,
            pengeluaran: 0,
            saldoAkhir: 0,
            totalTransaksi: 0,
          });
        }
        const op = operatorMap.get(operator);
        const nilai = Number(entry.nilai) || 0;
        let transactionType = entry.transactionType || "";
        if (!transactionType) {
          if (nilai > 0) transactionType = "PENERIMAAN";
          else if (nilai < 0) transactionType = "PENGELUARAN";
        }
        if (transactionType === "PENERIMAAN") op.penerimaan += Math.abs(nilai);
        else if (transactionType === "PENGELUARAN")
          op.pengeluaran += Math.abs(nilai);
        // Tidak perlu lagi menampung saldoAkhirMap
        op.totalTransaksi += 1;
      });
      // Setelah loop, jumlahkan semua saldoAkhir untuk setiap operator dari breakdown
      for (const [operator, op] of operatorMap.entries()) {
        // Ambil semua entry SALDO_AKHIR milik operator ini dari breakdown
        const saldoAkhirEntries = breakdown.filter(
          (entry) =>
            (entry.createdBy || "unknown").toLowerCase() === operator &&
            (entry.transactionType || "").toUpperCase() === "SALDO_AKHIR"
        );
        // Jumlahkan semua saldoAkhir
        op.saldoAkhir = saldoAkhirEntries.reduce(
          (sum, entry) => sum + (Number(entry.saldoAkhir ?? entry.nilai) || 0),
          0
        );
      }
      const operatorArray = Array.from(operatorMap.values());
      setOperatorSummary(operatorArray);

      // 8. Total keseluruhan
      // Jumlahkan seluruh saldo akhir pada tanggal yang dipilih
      const saldoAkhirEntries = breakdown.filter(
        (e) => (e.transactionType || "").toUpperCase() === "SALDO_AKHIR"
      );
      const totalSaldoAkhir = saldoAkhirEntries.reduce(
        (acc, entry) => acc + (Number(entry?.saldoAkhir ?? entry?.nilai) || 0),
        0
      );
      const total = operatorArray.reduce(
        (acc, op) => {
          acc.penerimaan += op.penerimaan;
          acc.pengeluaran += op.pengeluaran;
          acc.totalTransaksi += op.totalTransaksi;
          return acc;
        },
        {
          operator: "Total",
          penerimaan: 0,
          pengeluaran: 0,
          saldoAkhir: 0,
          totalTransaksi: 0,
        }
      );
      total.saldoAkhir = totalSaldoAkhir;
      setTotalKeseluruhan(total);
    } catch (error) {
      console.error("❌ Error loading konsolidasi data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKonsolidasiData();
  }, [selectedDate, selectedPerusahaan]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = () => {
    if (konsolidasiData.length === 0) return;

    const header = [
      "Tanggal",
      "Perusahaan",
      "Penerimaan",
      "Pengeluaran",
      "Saldo Akhir",
      "Total Transaksi",
    ];
    const csv = [
      header.join(","),
      ...konsolidasiData.map((row) =>
        [
          row.tanggal,
          row.perusahaan,
          row.penerimaan,
          row.pengeluaran,
          row.saldoAkhir,
          row.totalTransaksi,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `konsolidasi_keuangan_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper function for division color
  const getDivisionColor = (divisionName: string) => {
    if (divisionName.toLowerCase().includes("pjp"))
      return "bg-blue-100 text-blue-800";
    if (divisionName.toLowerCase().includes("prima"))
      return "bg-purple-100 text-purple-800";
    if (divisionName.toLowerCase().includes("sp"))
      return "bg-green-100 text-green-800";
    if (divisionName.toLowerCase().includes("blending"))
      return "bg-yellow-100 text-yellow-800";
    if (divisionName.toLowerCase().includes("holding"))
      return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  // Komponen Tabel Konsolidasi Keuangan (identik dashboard, filter keuangan, mapping data asli)
  function TabelKonsolidasiKeuangan({
    entries,
    accounts,
  }: {
    entries: any[];
    accounts: any[];
  }) {
    // Filter hanya operator keuangan
    const keuanganEntries = entries.filter((entry) =>
      (entry.createdBy || "").toLowerCase().includes("keuangan")
    );
    console.log(
      "📝 TabelKonsolidasiKeuangan - keuanganEntries:",
      keuanganEntries
    );

    // Perhitungan total
    const total = keuanganEntries.reduce(
      (acc, entry) => {
        const nilai = Number(entry.nilai) || 0;
        if (
          (entry.transactionType || "").toUpperCase() === "PENERIMAAN" ||
          nilai > 0
        )
          acc.penerimaan += Math.abs(nilai);
        else if (
          (entry.transactionType || "").toUpperCase() === "PENGELUARAN" ||
          nilai < 0
        )
          acc.pengeluaran += Math.abs(nilai);
        else if ((entry.transactionType || "").toUpperCase() === "SALDO_AKHIR")
          acc.saldoAkhir += nilai;
        acc.totalTransaksi += 1;
        return acc;
      },
      { penerimaan: 0, pengeluaran: 0, saldoAkhir: 0, totalTransaksi: 0 }
    );

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead>Akun</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Info Tambahan</TableHead>
              <TableHead>Operator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keuanganEntries.length > 0 ? (
              keuanganEntries.map((entry, index) => {
                // Mapping akun dan divisi
                const account = accounts.find(
                  (acc) =>
                    (acc?.id != null &&
                      entry?.accountId != null &&
                      acc.id.toString() === entry.accountId.toString()) ||
                    (acc.accountCode &&
                      entry.accountCode &&
                      acc.accountCode === entry.accountCode)
                );

                const divisionName = account?.division?.name || "N/A";
                const accountCode = account?.accountCode || "N/A";
                const accountName = account?.accountName || "N/A";
                const valueType = account?.valueType || "NOMINAL";
                // Perbaikan: jika transactionType SALDO_AKHIR, gunakan saldoAkhir
                const nominalValue =
                  entry.transactionType === "SALDO_AKHIR"
                    ? entry.saldoAkhir ?? entry.nilai
                    : entry.nilai;
                return (
                  <TableRow key={entry.id || `entry-${index}`}>
                    <TableCell className="text-sm">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getDivisionColor(divisionName)}>
                        {divisionName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div>
                        <div className="font-medium">{accountCode}</div>
                        <div className="text-gray-500 text-xs">
                          {accountName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          valueType === "NOMINAL"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {valueType === "NOMINAL"
                          ? "💰 Nominal"
                          : "📦 Kuantitas"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(nominalValue || 0)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {/* Info tambahan, sama persis dashboard */}
                      {(() => {
                        const divisionName =
                          account?.division?.name?.toLowerCase() || "";
                        // Keuangan: Show transaction type and amount
                        if (divisionName.includes("keuangan")) {
                          const transactionType = entry.transactionType;
                          const saldoAkhir = entry.saldoAkhir ?? entry.nilai;
                          if (transactionType === "SALDO_AKHIR" && saldoAkhir) {
                            return (
                              <div className="text-sm flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800">
                                  SALDO AKHIR
                                </Badge>
                              </div>
                            );
                          }
                          if (
                            transactionType &&
                            transactionType !== "NOMINAL"
                          ) {
                            return (
                              <Badge
                                className={
                                  transactionType === "PENERIMAAN"
                                    ? "bg-green-100 text-green-800"
                                    : transactionType === "PENGELUARAN"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-purple-100 text-purple-800"
                                }
                              >
                                {transactionType}
                              </Badge>
                            );
                          }
                        }
                        return "-";
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {entry.createdBy || "system"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  Tidak ada entri keuangan untuk tanggal dan filter yang dipilih
                </TableCell>
              </TableRow>
            )}
            {/* Baris total keseluruhan */}
            <TableRow className="bg-gray-50 font-bold">
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-green-600">
                {formatCurrency(total.penerimaan)}
              </TableCell>
              <TableCell className="text-red-600">
                {formatCurrency(total.pengeluaran)}
              </TableCell>
              <TableCell className="text-blue-600">
                {formatCurrency(total.saldoAkhir)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Konsolidasi Keuangan
          </h1>
          <p className="text-gray-600 mt-2">
            Total kas per perusahaan per hari
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadKonsolidasiData}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            disabled={konsolidasiData.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Filter Konsolidasi
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
            <div className="flex-1">
              <label className="text-sm font-medium">Perusahaan</label>
              <Select
                value={selectedPerusahaan}
                onValueChange={setSelectedPerusahaan}
              >
                <SelectTrigger className="mt-1">
                  <Building className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Perusahaan</SelectItem>
                  {daftarPerusahaan.map((perusahaan) => (
                    <SelectItem key={perusahaan.id} value={perusahaan.id}>
                      {perusahaan.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Penerimaan
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalKeseluruhan.penerimaan)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Seluruh perusahaan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pengeluaran
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalKeseluruhan.pengeluaran)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Seluruh perusahaan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Saldo Akhir
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalKeseluruhan.saldoAkhir)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Seluruh perusahaan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transaksi
            </CardTitle>
            <Calculator className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalKeseluruhan.totalTransaksi}
            </div>
            <p className="text-xs text-gray-500 mt-1">Seluruh perusahaan</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Per Operator</CardTitle>
          <CardDescription>
            Total kas per operator untuk tanggal{" "}
            {new Date(selectedDate).toLocaleDateString("id-ID")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Penerimaan</TableHead>
                  <TableHead>Pengeluaran</TableHead>
                  <TableHead>Saldo Akhir</TableHead>
                  <TableHead>Total Transaksi</TableHead>
                  <TableHead>Net Cash Flow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operatorSummary.map((op, idx) => {
                  const netCashFlow = op.penerimaan - op.pengeluaran;
                  return (
                    <TableRow key={op.operator}>
                      <TableCell className="font-medium">
                        {op.operator}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(op.penerimaan)}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatCurrency(op.pengeluaran)}
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {formatCurrency(op.saldoAkhir)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{op.totalTransaksi}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            netCashFlow >= 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {formatCurrency(netCashFlow)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Baris total keseluruhan */}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(totalKeseluruhan.penerimaan)}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {formatCurrency(totalKeseluruhan.pengeluaran)}
                  </TableCell>
                  <TableCell className="text-blue-600">
                    {formatCurrency(totalKeseluruhan.saldoAkhir)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {totalKeseluruhan.totalTransaksi}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        totalKeseluruhan.penerimaan -
                          totalKeseluruhan.pengeluaran >=
                        0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {formatCurrency(
                        totalKeseluruhan.penerimaan -
                          totalKeseluruhan.pengeluaran
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Transaksi Konsolidasi</CardTitle>
          <CardDescription>
            Detail transaksi per perusahaan untuk tanggal{" "}
            {new Date(selectedDate).toLocaleDateString("id-ID")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Memuat data konsolidasi...</p>
            </div>
          ) : konsolidasiData.length > 0 ? (
            <TabelKonsolidasiKeuangan
              entries={detailedBreakdown}
              accounts={accounts}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Tidak ada data konsolidasi untuk tanggal yang dipilih</p>
              <p className="text-sm mt-2">
                Coba pilih tanggal lain atau periksa data entri harian
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
