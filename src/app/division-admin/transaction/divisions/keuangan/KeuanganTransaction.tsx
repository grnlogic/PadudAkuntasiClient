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
import { Eye, RefreshCw } from "lucide-react";
import { MetricsGrid, type Metric } from "../../shared/components/MetricCard";
import { useTransactionData } from "../../shared/hooks/useTransactionData";
import type { EntriHarian } from "@/lib/data";

interface KeuanganTransactionProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function KeuanganTransaction({
  selectedDate,
  onDateChange,
}: KeuanganTransactionProps) {
  const { user, accounts, entries, loading, refetch } = useTransactionData();
  const [allTransactions, setAllTransactions] = useState<EntriHarian[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Transform dan combine semua data (KAS + PIUTANG + UTANG)
  useEffect(() => {
    console.log("📊 [KeuanganTransaction] Loading all transactions:", {
      total: entries.length,
      sample: entries.slice(0, 3),
    });

    // Tidak ada filter, ambil semua data
    const transformedEntries = entries.map((entry) => {
      const transformed = { ...entry };

      // Pastikan ada transactionType untuk semua entry
      if (!transformed.transactionType) {
        const kasEntry = entry as any;

        // Deteksi tipe transaksi dari data KAS
        if (kasEntry.saldoAkhir !== undefined && kasEntry.saldoAkhir !== null) {
          transformed.transactionType = "SALDO_AKHIR";
          transformed.nilai = Number(kasEntry.saldoAkhir);
        } else if (Number(kasEntry.penerimaan || 0) > 0) {
          transformed.transactionType = "PENERIMAAN";
          transformed.nilai = Number(kasEntry.penerimaan);
        } else if (Number(kasEntry.pengeluaran || 0) > 0) {
          transformed.transactionType = "PENGELUARAN";
          transformed.nilai = Number(kasEntry.pengeluaran);
        }
      }

      return transformed;
    });

    // Sort by date (terbaru dulu)
    const sorted = transformedEntries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("✅ [KeuanganTransaction] Transformed data:", {
      total: sorted.length,
      breakdown: {
        kas: sorted.filter((e) =>
          ["PENERIMAAN", "PENGELUARAN", "SALDO_AKHIR"].includes(
            (e as any).transactionType
          )
        ).length,
        piutang: sorted.filter((e) =>
          ((e as any).transactionType || "").includes("PIUTANG")
        ).length,
        utang: sorted.filter((e) =>
          ((e as any).transactionType || "").includes("UTANG")
        ).length,
      },
    });

    setAllTransactions(sorted);
  }, [entries]);

  // Pagination
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = allTransactions.slice(startIndex, endIndex);

  const getAccountInfo = (accountId: string) => {
    if (accountId === "PIUTANG") {
      return {
        id: "PIUTANG",
        accountCode: "PIUTANG",
        accountName: "Piutang Usaha",
        valueType: "NOMINAL" as const,
      };
    }
    if (accountId === "UTANG") {
      return {
        id: "UTANG",
        accountCode: "UTANG",
        accountName: "Utang Usaha",
        valueType: "NOMINAL" as const,
      };
    }
    return accounts.find((acc) => acc.id === accountId);
  };

  // Calculate metrics untuk dashboard
  const metrics: Metric[] = [
    {
      label: "Total Penerimaan Kas",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "PENERIMAAN")
        .reduce((sum, e) => sum + Number(e.nilai || 0), 0),
      type: "currency",
      color: "text-green-600",
    },
    {
      label: "Total Pengeluaran Kas",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "PENGELUARAN")
        .reduce((sum, e) => sum + Number(e.nilai || 0), 0),
      type: "currency",
      color: "text-red-600",
    },
    {
      label: "Saldo Kas Akhir",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "SALDO_AKHIR")
        .reduce(
          (sum, e) => sum + Number((e as any).saldoAkhir ?? e.nilai ?? 0),
          0
        ),
      type: "currency",
      color: "text-blue-600",
    },
    {
      label: "Total Piutang Baru",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "PIUTANG_BARU")
        .reduce((sum, e) => sum + Number(e.nilai || 0), 0),
      type: "currency",
      color: "text-blue-600",
    },
    {
      label: "Total Piutang Tertagih",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "PIUTANG_TERTAGIH")
        .reduce((sum, e) => sum + Number(e.nilai || 0), 0),
      type: "currency",
      color: "text-green-600",
    },
    {
      label: "Total Utang Baru",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "UTANG_BARU")
        .reduce((sum, e) => sum + Number(e.nilai || 0), 0),
      type: "currency",
      color: "text-red-600",
    },
    {
      label: "Total Utang Dibayar",
      value: allTransactions
        .filter((e) => (e as any).transactionType === "UTANG_DIBAYAR")
        .reduce((sum, e) => sum + Number(e.nilai || 0), 0),
      type: "currency",
      color: "text-green-600",
    },
    {
      label: "Total Transaksi",
      value: allTransactions.length,
      type: "number",
      color: "text-purple-600",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTransactionBadge = (entry: EntriHarian) => {
    const transactionType = (entry as any).transactionType;

    const badgeMap: Record<string, { label: string; className: string }> = {
      // KAS
      PENERIMAAN: {
        label: "Kas Masuk",
        className: "bg-green-100 text-green-800 font-medium",
      },
      PENGELUARAN: {
        label: "Kas Keluar",
        className: "bg-red-100 text-red-800 font-medium",
      },
      SALDO_AKHIR: {
        label: "Saldo Kas",
        className: "bg-blue-100 text-blue-800 font-medium",
      },
      // PIUTANG
      PIUTANG_BARU: {
        label: "Piutang Baru",
        className: "bg-sky-100 text-sky-800 font-medium",
      },
      PIUTANG_TERTAGIH: {
        label: "Piutang Tertagih",
        className: "bg-emerald-100 text-emerald-800 font-medium",
      },
      PIUTANG_MACET: {
        label: "Piutang Macet",
        className: "bg-orange-100 text-orange-800 font-medium",
      },
      SALDO_AKHIR_PIUTANG: {
        label: "Saldo Piutang",
        className: "bg-indigo-100 text-indigo-800 font-medium",
      },
      // UTANG
      UTANG_BARU: {
        label: "Utang Baru",
        className: "bg-rose-100 text-rose-800 font-medium",
      },
      UTANG_DIBAYAR: {
        label: "Utang Dibayar",
        className: "bg-teal-100 text-teal-800 font-medium",
      },
      SALDO_AKHIR_UTANG: {
        label: "Saldo Utang",
        className: "bg-violet-100 text-violet-800 font-medium",
      },
    };

    const badge = badgeMap[transactionType] || {
      label: transactionType || "Unknown",
      className: "bg-gray-100 text-gray-800",
    };

    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getKategoriLabel = (transactionType: string) => {
    if (
      ["PENERIMAAN", "PENGELUARAN", "SALDO_AKHIR"].includes(transactionType)
    ) {
      return "KAS";
    }
    if (transactionType.includes("PIUTANG")) {
      return "PIUTANG";
    }
    if (transactionType.includes("UTANG")) {
      return "UTANG";
    }
    return "LAINNYA";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Memuat data transaksi keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Transaksi Keuangan</CardTitle>
              <CardDescription className="mt-1">
                Semua transaksi Kas, Piutang, dan Utang dalam satu tampilan
              </CardDescription>
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Dashboard */}
      <MetricsGrid
        metrics={metrics}
        totalTransactions={allTransactions.length}
      />

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Transaksi</CardTitle>
          <CardDescription>
            Menampilkan {startIndex + 1}-
            {Math.min(endIndex, allTransactions.length)} dari{" "}
            {allTransactions.length} total transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Tanggal</TableHead>
                  <TableHead className="w-[120px]">Kategori</TableHead>
                  <TableHead className="w-[150px]">Tipe Transaksi</TableHead>
                  <TableHead className="w-[200px]">Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right w-[150px]">Nilai</TableHead>
                  <TableHead className="w-[100px]">Dibuat Oleh</TableHead>
                  <TableHead className="text-right w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      Belum ada transaksi yang tercatat untuk divisi Keuangan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEntries.map((entry) => {
                    const account = getAccountInfo(entry.accountId);
                    const transactionType =
                      (entry as any).transactionType || "";
                    const kategori = getKategoriLabel(transactionType);

                    return (
                      <TableRow key={`${entry.id}-${entry.createdAt}`}>
                        <TableCell className="font-medium">
                          {new Date(
                            entry.tanggal || entry.date
                          ).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              kategori === "KAS"
                                ? "border-blue-300 text-blue-700"
                                : kategori === "PIUTANG"
                                ? "border-green-300 text-green-700"
                                : "border-red-300 text-red-700"
                            }
                          >
                            {kategori}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTransactionBadge(entry)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          <div>
                            <div className="font-medium text-gray-900">
                              {account?.accountCode || "N/A"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {account?.accountName || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {entry.description || entry.keterangan || "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {transactionType === "SALDO_AKHIR"
                            ? formatCurrency(
                                Number(
                                  (entry as any).saldoAkhir ?? entry.nilai ?? 0
                                )
                              )
                            : formatCurrency(Number(entry.nilai || 0))}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {entry.createdBy || "System"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {allTransactions.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
