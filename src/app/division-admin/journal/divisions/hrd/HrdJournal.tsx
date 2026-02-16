"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toastSuccess, toastError, toastPromise } from "@/lib/toast-utils";
import { downloadEnhancedPDF, previewEnhancedPDF } from "@/lib/enhanced-pdf";
import {
  getAccountsByDivision,
  getEntriHarianByDate,
  saveEntriHarianBatch,
  deleteEntriHarian,
  type Account,
  type EntriHarian,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

interface HrdJournalProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

interface HrdRow {
  id: string;
  accountId: string;
  attendanceStatus: "HADIR" | "TIDAK_HADIR" | "SAKIT" | "IZIN" | "";
  absentCount: string;
  shift: "REGULER" | "LEMBUR" | "";
  keteranganKendala: string;
}

export default function HrdJournal({
  selectedDate,
  onDateChange,
}: HrdJournalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingEntries, setExistingEntries] = useState<EntriHarian[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<HrdRow[]>([
    {
      id: "1",
      accountId: "",
      attendanceStatus: "",
      absentCount: "",
      shift: "",
      keteranganKendala: "",
    },
  ]);

  const user = getCurrentUser();
  const divisionId = user?.division_id || user?.division?.id;

  // Opsi urutan: kategori, status, shift
  type SortOption = "kategori" | "status" | "shift";
  const [sortBy, setSortBy] = useState<SortOption>("kategori");

  const getSortedEntries = (entries: EntriHarian[]): EntriHarian[] => {
    const sorted = [...entries];
    const getAccountName = (accId: string) => {
      const acc = accounts.find((a) => a.id === accId);
      return acc ? `${acc.accountCode} - ${acc.accountName}` : "";
    };

    if (sortBy === "kategori") {
      sorted.sort((a, b) => {
        const nameA = getAccountName(a.accountId);
        const nameB = getAccountName(b.accountId);
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === "status") {
      const statusOrder = { HADIR: 0, TIDAK_HADIR: 1, SAKIT: 2, IZIN: 3 };
      sorted.sort((a, b) => {
        const statusA = (a as any).attendanceStatus || "";
        const statusB = (b as any).attendanceStatus || "";
        const orderA = statusOrder[statusA as keyof typeof statusOrder] ?? 4;
        const orderB = statusOrder[statusB as keyof typeof statusOrder] ?? 4;
        if (orderA !== orderB) return orderA - orderB;
        return getAccountName(a.accountId).localeCompare(
          getAccountName(b.accountId)
        );
      });
    } else if (sortBy === "shift") {
      sorted.sort((a, b) => {
        const shiftA = (a as any).shift || "";
        const shiftB = (b as any).shift || "";
        const orderA = shiftA === "REGULER" ? 0 : shiftA === "LEMBUR" ? 1 : 2;
        const orderB = shiftB === "REGULER" ? 0 : shiftB === "LEMBUR" ? 1 : 2;
        if (orderA !== orderB) return orderA - orderB;
        return getAccountName(a.accountId).localeCompare(
          getAccountName(b.accountId)
        );
      });
    }
    return sorted;
  };

  const sortedEntries = getSortedEntries(existingEntries);

  useEffect(() => {
    loadData();
  }, [selectedDate, divisionId]);

  const loadData = async () => {
    if (!divisionId) return;

    try {
      setLoading(true);

      const [accountsData, entriesData] = await Promise.all([
        getAccountsByDivision(divisionId.toString()),
        getEntriHarianByDate(selectedDate),
      ]);

      setAccounts(accountsData);

      // Filter entries untuk divisi HRD
      const accountIds = accountsData.map((acc) => acc.id);
      const hrdEntries = entriesData.filter((entry: any) => {
        if (!accountIds.includes(entry.accountId)) return false;

        const entryDate = entry.tanggal || entry.date || entry.createdAt;
        if (!entryDate) return false;

        const dateStr = entryDate.toString();
        const normalizedDate = dateStr.split("T")[0];
        return normalizedDate === selectedDate;
      });

      setExistingEntries(hrdEntries);
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading HRD data:", error);
      toastError.custom(error.message || "Gagal memuat data");
      setLoading(false);
    }
  };

  const addNewRow = () => {
    const newRow: HrdRow = {
      id: Date.now().toString(),
      accountId: "",
      attendanceStatus: "",
      absentCount: "",
      shift: "",
      keteranganKendala: "",
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== rowId));
    }
  };

  const updateRow = (rowId: string, field: keyof HrdRow, value: string) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  // Handle Download PDF (gunakan urutan yang sama seperti tabel)
  const handleDownloadPDF = () => {
    const pdfData = {
      date: selectedDate,
      divisionName: "HRD",
      entries: sortedEntries,
      accounts: accounts,
    };
    downloadEnhancedPDF(pdfData);
  };

  // Handle Preview PDF (gunakan urutan yang sama seperti tabel)
  const handlePreviewPDF = () => {
    const pdfData = {
      date: selectedDate,
      divisionName: "HRD",
      entries: sortedEntries,
      accounts: accounts,
    };
    previewEnhancedPDF(pdfData);
  };

  const saveEntries = async () => {
    if (!selectedDate) {
      toastError.custom("Pilih tanggal terlebih dahulu");
      return;
    }

    // Validasi entries
    const validEntries = rows
      .filter((row) => {
        if (!row.accountId) return false;
        return (
          row.attendanceStatus ||
          row.absentCount ||
          row.shift ||
          row.keteranganKendala
        );
      })
      .map((row) => ({
        accountId: parseInt(row.accountId),
        tanggal_laporan: selectedDate,
        nilai: Number(row.absentCount) || 0,
        description: row.keteranganKendala || "",
        attendance_status: row.attendanceStatus || "",
        absent_count: Number(row.absentCount) || 0,
        shift: row.shift || "",
        keterangan_kendala: row.keteranganKendala || "",
      }));

    if (validEntries.length === 0) {
      toastError.custom("Tidak ada data valid untuk disimpan");
      return;
    }

    try {
      await toastPromise.save(
        saveEntriHarianBatch(validEntries as any),
        "data kehadiran"
      );

      // Reset form
      setRows([
        {
          id: Date.now().toString(),
          accountId: "",
          attendanceStatus: "",
          absentCount: "",
          shift: "",
          keteranganKendala: "",
        },
      ]);

      loadData();
    } catch (error) {
      console.error("Error saving HRD entries:", error);
      toastError.custom("Gagal menyimpan data");
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Hapus entri kehadiran ini?")) return;

    try {
      await toastPromise.delete(deleteEntriHarian(id), "entri kehadiran");
      loadData();
    } catch (error) {
      toastError.custom("Gagal menghapus entri");
    }
  };

  const getAccountDisplay = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return "⚠️ Account tidak ditemukan";
    return `${account.accountCode} - ${account.accountName}`;
  };

  // Hitung summary
  const getSummary = () => {
    let totalKaryawan = 0;
    let hadirCount = 0;
    let tidakHadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let lemburCount = 0;

    existingEntries.forEach((entry) => {
      const absentCount = Number((entry as any).absentCount) || 0;
      totalKaryawan += absentCount;

      const status = (entry as any).attendanceStatus;
      const shift = (entry as any).shift;

      if (status === "HADIR") hadirCount += absentCount;
      else if (status === "TIDAK_HADIR") tidakHadirCount += absentCount;
      else if (status === "SAKIT") sakitCount += absentCount;
      else if (status === "IZIN") izinCount += absentCount;

      if (shift === "LEMBUR") lemburCount += absentCount;
    });

    const attendanceRate =
      totalKaryawan > 0 ? ((hadirCount / totalKaryawan) * 100).toFixed(1) : "0";

    return {
      totalKaryawan,
      hadirCount,
      tidakHadirCount,
      sakitCount,
      izinCount,
      lemburCount,
      attendanceRate,
    };
  };

  const summary = getSummary();

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Ringkasan Kehadiran - {selectedDate}
          </CardTitle>
          <CardDescription>
            Data kehadiran dan shift karyawan hari ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-sm font-semibold text-indigo-800">
                Total Karyawan
              </div>
              <div className="text-2xl font-bold text-indigo-900 mt-1">
                {summary.totalKaryawan}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-semibold text-green-800">Hadir</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {summary.hadirCount}
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm font-semibold text-red-800">
                Tidak Hadir
              </div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {summary.tidakHadirCount}
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-800">
                Tingkat Kehadiran
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {summary.attendanceRate}%
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm font-semibold text-orange-800">Sakit</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">
                {summary.sakitCount}
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm font-semibold text-yellow-800">Izin</div>
              <div className="text-2xl font-bold text-yellow-900 mt-1">
                {summary.izinCount}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm font-semibold text-purple-800">
                Lembur
              </div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {summary.lemburCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Form Input Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="p-4 border rounded-lg bg-indigo-50/50 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-indigo-900">
                  Entri #{idx + 1}
                </h4>
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account */}
                <div>
                  <Label>Kategori Karyawan</Label>
                  <Select
                    value={row.accountId}
                    onValueChange={(value) =>
                      updateRow(row.id, "accountId", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {getAccountDisplay(account.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attendance Status */}
                <div>
                  <Label>Status Kehadiran</Label>
                  <Select
                    value={row.attendanceStatus}
                    onValueChange={(value) =>
                      updateRow(row.id, "attendanceStatus", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HADIR">✅ Hadir</SelectItem>
                      <SelectItem value="TIDAK_HADIR">
                        ❌ Tidak Hadir
                      </SelectItem>
                      <SelectItem value="SAKIT">🤒 Sakit</SelectItem>
                      <SelectItem value="IZIN">📝 Izin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Absent Count */}
                <div>
                  <Label>Jumlah Karyawan</Label>
                  <NumericFormat
                    value={row.absentCount}
                    thousandSeparator="."
                    decimalSeparator=","
                    allowNegative={false}
                    onValueChange={(values: { value: string }) =>
                      updateRow(row.id, "absentCount", values.value)
                    }
                    className="mt-1 w-full"
                    placeholder="0"
                    customInput={Input}
                  />
                </div>

                {/* Shift */}
                <div>
                  <Label>Shift Kerja</Label>
                  <Select
                    value={row.shift}
                    onValueChange={(value) => updateRow(row.id, "shift", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih shift..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULER">
                        🌅 Reguler (07:00-15:00)
                      </SelectItem>
                      <SelectItem value="LEMBUR">
                        ⏰ Lembur (15:00-20:00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <Label>Keterangan Kendala (Opsional)</Label>
                <textarea
                  value={row.keteranganKendala}
                  onChange={(e) =>
                    updateRow(row.id, "keteranganKendala", e.target.value)
                  }
                  placeholder="Tuliskan kendala kehadiran jika ada..."
                  className="mt-1 w-full border rounded p-2 min-h-[80px]"
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              onClick={addNewRow}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Baris
            </Button>
            <Button
              onClick={saveEntries}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              Simpan Data
            </Button>
            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              disabled={existingEntries.length === 0}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={existingEntries.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Data Kehadiran Tersimpan</CardTitle>
              <CardDescription>
                {existingEntries.length} entri kehadiran untuk tanggal{" "}
                {selectedDate}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-hrd" className="text-sm whitespace-nowrap">
                Urutkan berdasarkan:
              </Label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger id="sort-hrd" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kategori">Kategori (A–Z)</SelectItem>
                  <SelectItem value="status">Status Kehadiran</SelectItem>
                  <SelectItem value="shift">Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {existingEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Belum ada data kehadiran untuk tanggal ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Dibuat Oleh</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry) => {
                    const hrdEntry = entry as any;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {getAccountDisplay(entry.accountId)}
                        </TableCell>
                        <TableCell>
                          {hrdEntry.attendanceStatus === "HADIR" && (
                            <Badge className="bg-green-100 text-green-800">
                              ✅ Hadir
                            </Badge>
                          )}
                          {hrdEntry.attendanceStatus === "TIDAK_HADIR" && (
                            <Badge className="bg-red-100 text-red-800">
                              ❌ Tidak Hadir
                            </Badge>
                          )}
                          {hrdEntry.attendanceStatus === "SAKIT" && (
                            <Badge className="bg-orange-100 text-orange-800">
                              🤒 Sakit
                            </Badge>
                          )}
                          {hrdEntry.attendanceStatus === "IZIN" && (
                            <Badge className="bg-blue-100 text-blue-800">
                              📝 Izin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {hrdEntry.absentCount || 0}
                        </TableCell>
                        <TableCell>
                          {hrdEntry.shift === "REGULER" && (
                            <Badge variant="outline">🌅 Reguler</Badge>
                          )}
                          {hrdEntry.shift === "LEMBUR" && (
                            <Badge variant="outline">⏰ Lembur</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {hrdEntry.keteranganKendala ||
                            entry.description ||
                            "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {entry.createdBy}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
