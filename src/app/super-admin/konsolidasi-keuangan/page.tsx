"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { getToken } from "@/lib/data";
import { toastError, toastSuccess } from "@/lib/toast-utils";

// ✅ Mapping perusahaan berdasarkan database
const COMPANIES = {
  1: { id: 1, name: "PT Padud Jaya Putera", code: "PJP", color: "bg-blue-500" },
  2: { id: 2, name: "PT Sunarya Putera", code: "SP", color: "bg-green-500" },
  3: { id: 3, name: "PT Prima", code: "PRIMA", color: "bg-purple-500" },
  4: {
    id: 4,
    name: "Divisi Blending",
    code: "BLENDING",
    color: "bg-orange-500",
  },
  5: { id: 5, name: "Holding Company", code: "HOLDING", color: "bg-red-500" },
};

interface KeuanganData {
  perusahaanId: number;
  perusahaanName: string;
  kas: {
    penerimaan: number;
    pengeluaran: number;
    saldoAkhir: number;
  };
  piutang: {
    baru: number;
    tertagih: number;
    macet: number;
  };
  utang: {
    baru: number;
    dibayar: number;
  };
}

export default function KonsolidasiKeuanganPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [keuanganData, setKeuanganData] = useState<KeuanganData[]>([]);
  const [accountsData, setAccountsData] = useState<any[]>([]);

  // ✅ NEW: Mode tampilkan semua data
  const [showAllData, setShowAllData] = useState(false);

  // ✅ NEW: Detail data untuk tabel lengkap
  const [detailData, setDetailData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<
    number | null
  >(null);
  const itemsPerPage = 50;

  // ✅ Fetch accounts untuk mapping perusahaan_id
  const fetchAccounts = async () => {
    try {
      const token = getToken();
      if (!token) return [];

      const response = await fetch("http://localhost:7070/api/v1/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    }
  };

  // ✅ Fetch data keuangan dari 3 sumber
  const fetchKeuanganData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toastError.custom("Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      console.log("🔄 Fetching konsolidasi keuangan for date:", selectedDate);
      console.log("📊 Mode: ", showAllData ? "SEMUA DATA" : "PER TANGGAL");

      // Fetch accounts dulu untuk mapping
      const accounts = await fetchAccounts();
      setAccountsData(accounts);

      // Filter kas accounts (account yang namanya mengandung 'kas')
      const kasAccountIds = accounts
        .filter((acc: any) => {
          const name =
            acc.account_name?.toLowerCase() ||
            acc.accountName?.toLowerCase() ||
            "";
          return (
            name.includes("kas") &&
            !name.includes("piutang") &&
            !name.includes("utang")
          );
        })
        .map((acc: any) => acc.id);

      console.log("💰 KAS Account IDs:", kasAccountIds);

      // ✅ Build URL dengan atau tanpa filter tanggal
      // IMPORTANT: Tambahkan limit=999999 untuk mengambil semua data (bypass pagination)
      const entriesUrl = showAllData
        ? `http://localhost:7070/api/v1/entri-harian?limit=999999`
        : `http://localhost:7070/api/v1/entri-harian?tanggal=${selectedDate}&limit=999999`;

      const piutangUrl = showAllData
        ? `http://localhost:7070/api/v1/piutang?limit=999999`
        : `http://localhost:7070/api/v1/piutang?tanggal_dari=${selectedDate}&tanggal_sampai=${selectedDate}&limit=999999`;

      const utangUrl = showAllData
        ? `http://localhost:7070/api/v1/utang?limit=999999`
        : `http://localhost:7070/api/v1/utang?tanggal_dari=${selectedDate}&tanggal_sampai=${selectedDate}&limit=999999`;

      // Parallel fetch dari 3 endpoint
      const [entriesResponse, piutangResponse, utangResponse] =
        await Promise.all([
          fetch(entriesUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(piutangUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(utangUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      let entriesData: any[] = [];
      let piutangData: any[] = [];
      let utangData: any[] = [];

      if (entriesResponse.ok) {
        const result = await entriesResponse.json();
        entriesData = result.data || [];
        console.log("📊 Entri Harian:", entriesData.length, "records");
      }

      if (piutangResponse.ok) {
        const result = await piutangResponse.json();
        piutangData = result.data || [];
        console.log("📊 Piutang:", piutangData.length, "records");
      }

      if (utangResponse.ok) {
        const result = await utangResponse.json();
        utangData = result.data || [];
        console.log("📊 Utang:", utangData.length, "records");
      }

      // ✅ Process data per perusahaan
      const dataPerPerusahaan: { [key: number]: KeuanganData } = {};

      // Initialize data untuk setiap perusahaan
      Object.values(COMPANIES).forEach((company) => {
        dataPerPerusahaan[company.id] = {
          perusahaanId: company.id,
          perusahaanName: company.name,
          kas: { penerimaan: 0, pengeluaran: 0, saldoAkhir: 0 },
          piutang: { baru: 0, tertagih: 0, macet: 0 },
          utang: { baru: 0, dibayar: 0 },
        };
      });

      // ✅ Process KAS data dari entri_harian
      entriesData.forEach((entry: any) => {
        // Get perusahaan_id dari account
        const account = accounts.find(
          (acc: any) => acc.id === entry.account_id
        );
        const perusahaanId = account?.perusahaan_id || account?.perusahaanId;

        if (!perusahaanId || !kasAccountIds.includes(entry.account_id)) return;

        const data = dataPerPerusahaan[perusahaanId];
        if (!data) return;

        const nilai = Number(entry.nilai) || 0;
        const transactionType =
          entry.transaction_type || entry.transactionType || "";

        if (transactionType === "PENERIMAAN") {
          data.kas.penerimaan += nilai;
        } else if (transactionType === "PENGELUARAN") {
          data.kas.pengeluaran += nilai;
        } else if (transactionType === "SALDO_AKHIR") {
          const saldoValue = Number(entry.saldo_akhir || entry.nilai) || 0;
          data.kas.saldoAkhir += saldoValue;
        }
      });

      // ✅ Process PIUTANG data
      piutangData.forEach((entry: any) => {
        // Get perusahaan_id dari entry atau dari account
        let perusahaanId = entry.perusahaan_id;

        if (!perusahaanId) {
          const account = accounts.find(
            (acc: any) => acc.id === entry.account_id
          );
          perusahaanId = account?.perusahaan_id || account?.perusahaanId;
        }

        if (!perusahaanId) return;

        const data = dataPerPerusahaan[perusahaanId];
        if (!data) return;

        const nominal = Number(entry.nominal) || 0;
        const tipeTransaksi =
          entry.tipe_transaksi || entry.jenis_transaksi || "";

        if (tipeTransaksi === "PIUTANG_BARU") {
          data.piutang.baru += nominal;
        } else if (
          tipeTransaksi === "PIUTANG_TERTAGIH" ||
          tipeTransaksi === "PEMBAYARAN_PIUTANG"
        ) {
          data.piutang.tertagih += nominal;
        } else if (tipeTransaksi === "PIUTANG_MACET") {
          data.piutang.macet += nominal;
        }
      });

      // ✅ Process UTANG data
      utangData.forEach((entry: any) => {
        // Get perusahaan_id dari entry atau dari account
        let perusahaanId = entry.perusahaan_id;

        if (!perusahaanId) {
          const account = accounts.find(
            (acc: any) => acc.id === entry.account_id
          );
          perusahaanId = account?.perusahaan_id || account?.perusahaanId;
        }

        if (!perusahaanId) return;

        const data = dataPerPerusahaan[perusahaanId];
        if (!data) return;

        const nominal = Number(entry.nominal) || 0;
        const tipeTransaksi =
          entry.tipe_transaksi || entry.jenis_transaksi || "";

        if (tipeTransaksi === "UTANG_BARU") {
          data.utang.baru += nominal;
        } else if (
          tipeTransaksi === "UTANG_DIBAYAR" ||
          tipeTransaksi === "PEMBAYARAN_UTANG"
        ) {
          data.utang.dibayar += nominal;
        }
      });

      const result = Object.values(dataPerPerusahaan);
      setKeuanganData(result);

      // ✅ NEW: Proses detail data untuk tabel lengkap
      const allDetailData: any[] = [];

      // Add KAS entries
      // Data structure from entri_harian API:
      // - tanggal_laporan (date)
      // - transaction_type (PENERIMAAN/PENGELUARAN/SALDO_AKHIR)
      // - nilai (nominal amount)
      // - saldo_akhir (ending balance)
      // - perusahaan_id (from join with accounts)
      // - account_name (from join with accounts)
      // - description (description field)
      entriesData.forEach((entry: any) => {
        if (kasAccountIds.includes(entry.account_id)) {
          allDetailData.push({
            type: "KAS",
            tanggal: entry.tanggal_laporan, // Field dari entri_harian table
            perusahaan_id: entry.perusahaan_id, // Sudah ada dari JOIN dengan accounts
            perusahaan_name:
              COMPANIES[entry.perusahaan_id as keyof typeof COMPANIES]?.name ||
              "Unknown",
            account_name: entry.account_name, // Sudah ada dari JOIN
            tipe_transaksi: entry.transaction_type, // Field dari entri_harian
            nominal: Number(entry.nilai) || 0, // Field nilai dari entri_harian
            saldo_akhir: Number(entry.saldo_akhir) || 0, // Field saldo_akhir dari entri_harian
            keterangan: entry.description || "-", // Field description dari entri_harian
          });
        }
      });

      // Add PIUTANG entries
      piutangData.forEach((entry: any) => {
        let perusahaanId = entry.perusahaan_id;
        if (!perusahaanId) {
          const account = accounts.find(
            (acc: any) => acc.id === entry.account_id
          );
          perusahaanId = account?.perusahaan_id;
        }

        allDetailData.push({
          type: "PIUTANG",
          tanggal: entry.tanggal_transaksi,
          perusahaan_id: perusahaanId,
          perusahaan_name:
            COMPANIES[perusahaanId as keyof typeof COMPANIES]?.name ||
            "Unknown",
          account_name: entry.account_name || "-",
          tipe_transaksi: entry.tipe_transaksi,
          nominal: Number(entry.nominal) || 0,
          saldo_akhir: null,
          keterangan: entry.keterangan || "-",
        });
      });

      // Add UTANG entries
      utangData.forEach((entry: any) => {
        let perusahaanId = entry.perusahaan_id;
        if (!perusahaanId) {
          const account = accounts.find(
            (acc: any) => acc.id === entry.account_id
          );
          perusahaanId = account?.perusahaan_id;
        }

        allDetailData.push({
          type: "UTANG",
          tanggal: entry.tanggal_transaksi,
          perusahaan_id: perusahaanId,
          perusahaan_name:
            COMPANIES[perusahaanId as keyof typeof COMPANIES]?.name ||
            "Unknown",
          account_name: entry.account_name || "-",
          tipe_transaksi: entry.tipe_transaksi,
          nominal: Number(entry.nominal) || 0,
          saldo_akhir: null,
          keterangan: entry.keterangan || "-",
        });
      });

      // Sort by date descending
      allDetailData.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );

      setDetailData(allDetailData);
      setTotalPages(Math.ceil(allDetailData.length / itemsPerPage));
      setCurrentPage(1); // Reset to first page

      console.log("✅ Konsolidasi selesai:", result);
      toastSuccess.custom("Data konsolidasi berhasil dimuat");
    } catch (error) {
      console.error("❌ Error fetching konsolidasi:", error);
      toastError.custom("Gagal memuat data konsolidasi");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate total konsolidasi
  const calculateTotal = () => {
    return keuanganData.reduce(
      (total, data) => ({
        kas: {
          penerimaan: total.kas.penerimaan + data.kas.penerimaan,
          pengeluaran: total.kas.pengeluaran + data.kas.pengeluaran,
          saldoAkhir: total.kas.saldoAkhir + data.kas.saldoAkhir,
        },
        piutang: {
          baru: total.piutang.baru + data.piutang.baru,
          tertagih: total.piutang.tertagih + data.piutang.tertagih,
          macet: total.piutang.macet + data.piutang.macet,
        },
        utang: {
          baru: total.utang.baru + data.utang.baru,
          dibayar: total.utang.dibayar + data.utang.dibayar,
        },
      }),
      {
        kas: { penerimaan: 0, pengeluaran: 0, saldoAkhir: 0 },
        piutang: { baru: 0, tertagih: 0, macet: 0 },
        utang: { baru: 0, dibayar: 0 },
      }
    );
  };

  const totalKonsolidasi = calculateTotal();

  // ✅ Auto load on mount
  useEffect(() => {
    fetchKeuanganData();
  }, []);

  // ✅ Export to Excel/CSV
  const handleExport = () => {
    const headers = [
      "Perusahaan",
      "Kas Penerimaan",
      "Kas Pengeluaran",
      "Kas Saldo Akhir",
      "Piutang Baru",
      "Piutang Tertagih",
      "Kas Saldo Akhir",
      "Piutang Baru",
      "Piutang Tertagih",
      "Piutang Macet",
      "Utang Baru",
      "Utang Dibayar",
    ];

    const rows = keuanganData.map((data) => [
      data.perusahaanName,
      data.kas.penerimaan,
      data.kas.pengeluaran,
      data.kas.saldoAkhir,
      data.piutang.baru,
      data.piutang.tertagih,
      data.piutang.macet,
      data.utang.baru,
      data.utang.dibayar,
    ]);

    // Add total row
    rows.push([
      "TOTAL KONSOLIDASI",
      totalKonsolidasi.kas.penerimaan,
      totalKonsolidasi.kas.pengeluaran,
      totalKonsolidasi.kas.saldoAkhir,
      totalKonsolidasi.piutang.baru,
      totalKonsolidasi.piutang.tertagih,
      totalKonsolidasi.piutang.macet,
      totalKonsolidasi.utang.baru,
      totalKonsolidasi.utang.dibayar,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `konsolidasi-keuangan-${selectedDate}.csv`;
    a.click();

    toastSuccess.custom("Data berhasil diexport");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Konsolidasi Keuangan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ringkasan keuangan seluruh perusahaan
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
                disabled={showAllData}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showAll"
                checked={showAllData}
                onChange={(e) => setShowAllData(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="showAll" className="cursor-pointer text-sm">
                Tampilkan Semua Data (All Time)
              </Label>
            </div>
            <Button
              onClick={fetchKeuanganData}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Total Konsolidasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KAS Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <DollarSign className="w-5 h-5" />
              Total KAS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Penerimaan
              </span>
              <NumericFormat
                value={totalKonsolidasi.kas.penerimaan}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold text-green-600"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Pengeluaran
              </span>
              <NumericFormat
                value={totalKonsolidasi.kas.pengeluaran}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold text-red-600"
              />
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900 dark:text-white">
                  Saldo Akhir
                </span>
                <NumericFormat
                  value={totalKonsolidasi.kas.saldoAkhir}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  className="font-bold text-lg text-blue-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIUTANG Card */}
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <TrendingUp className="w-5 h-5" />
              Total PIUTANG
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Piutang Baru
              </span>
              <NumericFormat
                value={totalKonsolidasi.piutang.baru}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tertagih
              </span>
              <NumericFormat
                value={totalKonsolidasi.piutang.tertagih}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold text-green-600"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Macet
              </span>
              <NumericFormat
                value={totalKonsolidasi.piutang.macet}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold text-red-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* UTANG Card */}
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <TrendingDown className="w-5 h-5" />
              Total UTANG
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Utang Baru
              </span>
              <NumericFormat
                value={totalKonsolidasi.utang.baru}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Dibayar
              </span>
              <NumericFormat
                value={totalKonsolidasi.utang.dibayar}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                className="font-semibold text-green-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Per Perusahaan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Detail Per Perusahaan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Perusahaan</TableHead>
                  <TableHead className="text-center font-bold" colSpan={3}>
                    KAS
                  </TableHead>
                  <TableHead className="text-center font-bold" colSpan={3}>
                    PIUTANG
                  </TableHead>
                  <TableHead className="text-center font-bold" colSpan={2}>
                    UTANG
                  </TableHead>
                </TableRow>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead></TableHead>
                  <TableHead className="text-right">Penerimaan</TableHead>
                  <TableHead className="text-right">Pengeluaran</TableHead>
                  <TableHead className="text-right">Saldo Akhir</TableHead>
                  <TableHead className="text-right">Baru</TableHead>
                  <TableHead className="text-right">Tertagih</TableHead>
                  <TableHead className="text-right">Macet</TableHead>
                  <TableHead className="text-right">Baru</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keuanganData.map((data) => {
                  const company =
                    COMPANIES[data.perusahaanId as keyof typeof COMPANIES];
                  return (
                    <TableRow key={data.perusahaanId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${company?.color}`}
                          />
                          <div>
                            <div className="font-semibold">
                              {data.perusahaanName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {company?.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {/* KAS */}
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.kas.penerimaan}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.kas.pengeluaran}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <NumericFormat
                          value={data.kas.saldoAkhir}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm text-blue-600"
                        />
                      </TableCell>
                      {/* PIUTANG */}
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.piutang.baru}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.piutang.tertagih}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.piutang.macet}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                      {/* UTANG */}
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.utang.baru}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumericFormat
                          value={data.utang.dibayar}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="Rp "
                          className="text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Total Row */}
                <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <TableCell>TOTAL KONSOLIDASI</TableCell>
                  {/* KAS */}
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.kas.penerimaan}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.kas.pengeluaran}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  <TableCell className="text-right text-blue-600">
                    <NumericFormat
                      value={totalKonsolidasi.kas.saldoAkhir}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  {/* PIUTANG */}
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.piutang.baru}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.piutang.tertagih}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.piutang.macet}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  {/* UTANG */}
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.utang.baru}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <NumericFormat
                      value={totalKonsolidasi.utang.dibayar}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Memuat data konsolidasi...</p>
            </div>
          )}

          {!loading && keuanganData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada data untuk tanggal yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ NEW: Tabel Detail Keseluruhan Transaksi */}
      {detailData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Detail Transaksi Keseluruhan ({detailData.length} records)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Filter Perusahaan:</Label>
                <select
                  value={selectedCompanyFilter || ""}
                  onChange={(e) =>
                    setSelectedCompanyFilter(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="">Semua Perusahaan</option>
                  {Object.values(COMPANIES).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>Akun</TableHead>
                    <TableHead>Tipe Transaksi</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-right">Saldo Akhir</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailData
                    .filter((item) =>
                      selectedCompanyFilter
                        ? item.perusahaan_id === selectedCompanyFilter
                        : true
                    )
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((item, index) => {
                      const company =
                        COMPANIES[item.perusahaan_id as keyof typeof COMPANIES];
                      const globalIndex =
                        (currentPage - 1) * itemsPerPage + index + 1;

                      return (
                        <TableRow
                          key={globalIndex}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <TableCell className="text-gray-500 text-sm">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(item.tanggal).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.type === "KAS"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : item.type === "PIUTANG"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                              }`}
                            >
                              {item.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${company?.color}`}
                              />
                              <span className="text-sm font-medium">
                                {company?.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {item.account_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.tipe_transaksi}
                          </TableCell>
                          <TableCell className="text-right">
                            <NumericFormat
                              value={item.nominal}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="Rp "
                              className="text-sm font-medium"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {item.saldo_akhir !== null ? (
                              <NumericFormat
                                value={item.saldo_akhir}
                                displayType="text"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="Rp "
                                className="text-sm text-blue-600 font-medium"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm max-w-[250px] truncate">
                            {item.keterangan}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages} (Total{" "}
                  {
                    detailData.filter((item) =>
                      selectedCompanyFilter
                        ? item.perusahaan_id === selectedCompanyFilter
                        : true
                    ).length
                  }{" "}
                  transaksi)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Footer */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Informasi Konsolidasi
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {showAllData ? (
                  <>
                    Data konsolidasi menampilkan <strong>SEMUA DATA</strong>{" "}
                    dari seluruh bulan dan tahun yang ada di database. Data
                    ditampilkan apa adanya tanpa perhitungan tambahan. Termasuk
                    data KAS, PIUTANG, dan UTANG dari 5 perusahaan: PT Padud
                    Jaya Putera, PT Sunarya Putera, PT Prima, Divisi Blending,
                    dan Holding Company.
                  </>
                ) : (
                  <>
                    Data konsolidasi keuangan menampilkan data mentah dari
                    database untuk tanggal <strong>{selectedDate}</strong>. Data
                    ditampilkan apa adanya tanpa perhitungan tambahan. Termasuk
                    data KAS, PIUTANG, dan UTANG dari 5 perusahaan: PT Padud
                    Jaya Putera, PT Sunarya Putera, PT Prima, Divisi Blending,
                    dan Holding Company.
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
