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
import {
  Eye,
  Target,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SearchFilter } from "../../shared/components/SearchFilter";
import { DateFilter } from "../../shared/components/DateFilter";
import { MetricsGrid, type Metric } from "../../shared/components/MetricCard";
import { useTransactionData } from "../../shared/hooks/useTransactionData";
import type { EntriHarian } from "@/lib/data";

interface PemasaranTransactionProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const ITEMS_PER_PAGE = 20;

export default function PemasaranTransaction({
  selectedDate,
  onDateChange,
}: PemasaranTransactionProps) {
  const { accounts, entries, loading } = useTransactionData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredEntries, setFilteredEntries] = useState<EntriHarian[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filterOptions = [
    {
      value: "SALES",
      label: "Laporan Sales",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      value: "PRODUK",
      label: "Laporan Produk",
      icon: DollarSign,
      color: "text-green-600",
    },
  ];

  useEffect(() => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter((entry) =>
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType === "SALES") {
      filtered = filtered.filter((e) => e.id.startsWith("sales-"));
    } else if (filterType === "PRODUK") {
      filtered = filtered.filter((e) => e.id.startsWith("produk-"));
    }

    if (selectedDate) {
      filtered = filtered.filter((entry) => {
        const entryDate = (entry.tanggal || entry.date || "").split("T")[0];
        return entryDate === selectedDate;
      });
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setFilteredEntries(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [entries, searchTerm, filterType, selectedDate]);

  const totalTarget = filteredEntries.reduce(
    (sum, e) => sum + Number((e as any).targetAmount || 0),
    0
  );
  const totalRealisasi = filteredEntries.reduce(
    (sum, e) => sum + Number((e as any).realisasiAmount || 0),
    0
  );
  const achievementRate =
    totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const metrics: Metric[] = [
    {
      label: "Total Target",
      value: totalTarget,
      type: "currency",
      color: "text-blue-600",
    },
    {
      label: "Total Realisasi",
      value: totalRealisasi,
      type: "currency",
      color: "text-green-600",
    },
    {
      label: "Achievement Rate",
      value: achievementRate,
      type: "percentage",
      color: achievementRate >= 100 ? "text-green-600" : "text-orange-600",
    },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterOptions={filterOptions}
              />
            </div>
            <DateFilter filterDate={selectedDate} onDateChange={onDateChange} />
          </div>
        </CardContent>
      </Card>

      <MetricsGrid
        metrics={metrics}
        totalTransactions={filteredEntries.length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi Pemasaran</CardTitle>
          <CardDescription>
            {filteredEntries.length} entri ditemukan | Halaman {currentPage}{" "}
            dari {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Target vs Realisasi</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry, index) => {
                const target = Number((entry as any).targetAmount || 0);
                const realisasi = Number((entry as any).realisasiAmount || 0);
                const achievement = target > 0 ? (realisasi / target) * 100 : 0;
                const rowNumber = startIndex + index + 1;

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{rowNumber}</TableCell>
                    <TableCell>
                      {new Date(entry.tanggal || entry.date).toLocaleDateString(
                        "id-ID"
                      )}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="text-blue-600">
                          Target: {formatCurrency(target)}
                        </div>
                        <div className="text-green-600">
                          Realisasi: {formatCurrency(realisasi)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          achievement >= 100
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        {achievement.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data transaksi
            </div>
          )}

          {/* Pagination Controls */}
          {filteredEntries.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredEntries.length)} dari{" "}
                {filteredEntries.length} entri
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm font-medium">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
