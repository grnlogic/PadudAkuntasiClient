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
  Users,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SearchFilter } from "../../shared/components/SearchFilter";
import { DateFilter } from "../../shared/components/DateFilter";
import { MetricsGrid, type Metric } from "../../shared/components/MetricCard";
import { useTransactionData } from "../../shared/hooks/useTransactionData";
import type { EntriHarian } from "@/lib/data";

interface HrdTransactionProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const ITEMS_PER_PAGE = 20;

export default function HrdTransaction({
  selectedDate,
  onDateChange,
}: HrdTransactionProps) {
  const { accounts, entries, loading } = useTransactionData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredEntries, setFilteredEntries] = useState<EntriHarian[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filterOptions = [
    { value: "HADIR", label: "Hadir", icon: Users, color: "text-green-600" },
    {
      value: "TIDAK_HADIR",
      label: "Tidak Hadir",
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      value: "SAKIT",
      label: "Sakit",
      icon: AlertCircle,
      color: "text-yellow-600",
    },
    { value: "IZIN", label: "Izin", icon: Clock, color: "text-blue-600" },
  ];

  useEffect(() => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter((entry) =>
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(
        (e) => (e as any).attendanceStatus === filterType
      );
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

  const totalKaryawan = filteredEntries.length;
  const hadirCount = filteredEntries.filter(
    (e) => (e as any).attendanceStatus === "HADIR"
  ).length;
  const attendanceRate =
    totalKaryawan > 0 ? (hadirCount / totalKaryawan) * 100 : 0;
  const totalOvertimeHours = filteredEntries.reduce(
    (sum, e) => sum + Number((e as any).overtimeHours || 0),
    0
  );

  const metrics: Metric[] = [
    {
      label: "Total Karyawan",
      value: totalKaryawan,
      type: "number",
      color: "text-blue-600",
    },
    {
      label: "Tingkat Kehadiran",
      value: attendanceRate,
      type: "percentage",
      color:
        attendanceRate >= 90
          ? "text-green-600"
          : attendanceRate >= 80
          ? "text-yellow-600"
          : "text-red-600",
    },
    {
      label: "Total Jam Lembur",
      value: totalOvertimeHours,
      type: "hours",
      color: "text-purple-600",
    },
  ];

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

  const getAttendanceBadge = (status: string) => {
    const badgeMap: Record<string, { label: string; className: string }> = {
      HADIR: { label: "Hadir", className: "bg-green-100 text-green-800" },
      TIDAK_HADIR: {
        label: "Tidak Hadir",
        className: "bg-red-100 text-red-800",
      },
      SAKIT: { label: "Sakit", className: "bg-yellow-100 text-yellow-800" },
      IZIN: { label: "Izin", className: "bg-blue-100 text-blue-800" },
    };
    const badge = badgeMap[status] || {
      label: "Unknown",
      className: "bg-gray-100 text-gray-800",
    };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

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
          <CardTitle>Daftar Transaksi HRD</CardTitle>
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
                <TableHead>Karyawan</TableHead>
                <TableHead>Status Kehadiran</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry, index) => {
                const rowNumber = startIndex + index + 1;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{rowNumber}</TableCell>
                    <TableCell>
                      {new Date(entry.tanggal || entry.date).toLocaleDateString(
                        "id-ID"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {(entry as any).accountName || entry.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(entry as any).accountCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAttendanceBadge(
                        (entry as any).attendanceStatus || "UNKNOWN"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        {(entry as any).shift && (
                          <div className="text-blue-600">
                            Shift: {(entry as any).shift}
                          </div>
                        )}
                        {(entry as any).overtimeHours && (
                          <div className="text-purple-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Lembur: {(entry as any).overtimeHours} jam
                          </div>
                        )}
                        {(entry as any).keteranganKendala && (
                          <div className="text-orange-600 text-xs">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {(entry as any).keteranganKendala}
                          </div>
                        )}
                        {(entry as any).absentCount > 0 &&
                          (entry as any).attendanceStatus === "HADIR" && (
                            <div className="text-green-600 text-xs">
                              <Users className="h-3 w-3 inline mr-1" />
                              Jumlah: {(entry as any).absentCount} orang
                            </div>
                          )}
                      </div>
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
