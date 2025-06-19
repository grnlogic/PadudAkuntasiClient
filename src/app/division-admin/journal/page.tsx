"use client";

import { useState, useEffect } from "react";
import { Calendar, BookOpen, Plus, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge"; // ✅ Add this import
import { getCurrentUser } from "@/lib/auth";
import {
  getAccountsByDivision,
  getEntriHarianByDate,
  saveEntriHarianBatch,
  deleteEntriHarian,
  type Account,
  type EntriHarian,
} from "@/lib/data";
import { Label } from "@/components/ui/label";

interface JournalRow {
  id: string;
  accountId: string;
  keterangan: string;
  nominal: string; // For NOMINAL accounts (Rupiah)
  kuantitas: string; // For KUANTITAS accounts (Unit/Jumlah)
}

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingEntries, setExistingEntries] = useState<EntriHarian[]>([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const user = getCurrentUser();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Form rows untuk input multiple entries
  const [journalRows, setJournalRows] = useState<JournalRow[]>([
    { id: "1", accountId: "", keterangan: "", nominal: "", kuantitas: "" },
  ]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // ✅ Monitor journalRows changes
  useEffect(() => {
    console.log("journalRows updated:", journalRows);
  }, [journalRows]);

  // ✅ Monitor accounts changes
  useEffect(() => {
    console.log("accounts updated:", accounts);
  }, [accounts]);

  const loadData = async () => {
    if (user?.division?.id) {
      // Load accounts dari "rak" divisi
      const accountsData = await getAccountsByDivision(user.division.id);
      setAccounts(accountsData);

      // Load existing entries untuk tanggal yang dipilih
      const entriesData = await getEntriHarianByDate(selectedDate);
      const accountIds = accountsData.map((acc) => acc.id);
      const divisionEntries = entriesData.filter((entry) =>
        accountIds.includes(entry.accountId)
      );
      setExistingEntries(divisionEntries);
    }
  };

  const addNewRow = () => {
    const newRow: JournalRow = {
      id: Date.now().toString(),
      accountId: "",
      keterangan: "",
      nominal: "",
      kuantitas: "",
    };
    setJournalRows([...journalRows, newRow]);
  };

  const removeRow = (rowId: string) => {
    if (journalRows.length > 1) {
      setJournalRows(journalRows.filter((row) => row.id !== rowId));
    }
  };

  const updateRow = (rowId: string, field: keyof JournalRow, value: string) => {
    console.log("updateRow called:", { rowId, field, value });

    setJournalRows((prevRows) => {
      console.log("Previous rows:", prevRows); // ✅ Debug log

      const newRows = prevRows.map((row) => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [field]: value };
          console.log("Updating row:", row, "to:", updatedRow); // ✅ Debug log
          return updatedRow;
        }
        return row;
      });

      console.log("New rows:", newRows); // ✅ Debug log
      return newRows;
    });
  };

  const getAccountDisplay = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return "Akun tidak ditemukan";
    return `${account.accountCode} - ${account.accountName}`;
  };

  const getSelectedAccount = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId);
  };

  const getInputValue = (row: JournalRow) => {
    const account = getSelectedAccount(row.accountId);
    if (!account) return "";

    return account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
  };

  const formatDisplayValue = (value: string, valueType: string) => {
    if (!value || Number.parseFloat(value) === 0) return "-";

    const numValue = Number.parseFloat(value);

    if (valueType === "NOMINAL") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(numValue);
    } else {
      return `${numValue.toLocaleString("id-ID")} unit`;
    }
  };

  const saveJournalEntries = async () => {
    // Filter rows yang sudah diisi
    const validRows = journalRows.filter((row) => {
      const account = getSelectedAccount(row.accountId);
      if (!account) return false;

      const value =
        account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;
      return row.accountId && value && Number.parseFloat(value) > 0;
    });

    if (validRows.length === 0) {
      setError("Tidak ada entri yang valid untuk disimpan");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Convert ke format EntriHarian
    const entriesToSave = validRows.map((row) => {
      const account = getSelectedAccount(row.accountId)!;
      const value =
        account.valueType === "NOMINAL" ? row.nominal : row.kuantitas;

      return {
        accountId: row.accountId,
        date: selectedDate,
        tanggal: selectedDate,
        nilai: Number.parseFloat(value),
        description: row.keterangan || "",
        createdBy: user?.username || "",
      };
    });

    try {
      const saved = await saveEntriHarianBatch(entriesToSave);
      loadData();

      // Reset form
      setJournalRows([
        {
          id: "1",
          accountId: "",
          keterangan: "",
          nominal: "",
          kuantitas: "",
        },
      ]);

      setSuccess(
        `✅ ${saved.length} entri berhasil disimpan untuk tanggal ${new Date(
          selectedDate
        ).toLocaleDateString("id-ID")}!`
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Gagal menyimpan entri jurnal");
      setTimeout(() => setError(""), 3000);
    }
  };

  const removeExistingEntry = async (id: string) => {
    if (confirm("Hapus entri ini?")) {
      if (await deleteEntriHarian(id)) {
        loadData();
        setSuccess("Entri berhasil dihapus");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Gagal menghapus entri");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Jurnal {user?.division?.name}
          </h1>
          <p className="text-gray-600 mt-2">Tambah Baru Data Jurnal</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date(selectedDate).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="date">Tgl Jurnal:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Journal Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Form Input Jurnal Harian
          </CardTitle>
          <CardDescription>
            Pilih akun dari rak divisi, tambahkan keterangan, dan masukkan nilai
            sesuai tipe akun (Rupiah atau Unit)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-600 border-b pb-2">
              <div className="col-span-2">Tgl Jurnal</div>
              <div className="col-span-4">Akun</div>
              <div className="col-span-3">Keterangan</div>
              <div className="col-span-2">Nilai</div>
              <div className="col-span-1">Aksi</div>
            </div>

            {/* Journal Rows */}
            {journalRows.map((row) => {
              const selectedAccount = getSelectedAccount(row.accountId);

              return (
                <div
                  key={row.id}
                  className="grid grid-cols-12 gap-4 items-center"
                >
                  {/* Tanggal */}
                  <div className="col-span-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      disabled
                      className="bg-gray-50 text-sm"
                    />
                  </div>

                  {/* Akun Dropdown */}
                  <div className="col-span-4">
                    <Select
                      value={row.accountId}
                      onValueChange={(value) => {
                        console.log("onValueChange triggered with:", value);
                        if (value && value !== "no-accounts") {
                          updateRow(row.id, "accountId", value);
                          updateRow(row.id, "nominal", "");
                          updateRow(row.id, "kuantitas", "");
                        }
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Pilih akun dari rak...">
                          {/* ✅ Custom display untuk selected value */}
                          {row.accountId
                            ? (() => {
                                const selectedAccount = getSelectedAccount(
                                  row.accountId
                                );
                                return selectedAccount ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-blue-600">
                                      {selectedAccount.accountCode}
                                    </span>
                                    <span className="text-sm">
                                      {selectedAccount.accountName}
                                    </span>
                                    <Badge
                                      className={`text-xs ${
                                        selectedAccount.valueType === "NOMINAL"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {selectedAccount.valueType === "NOMINAL"
                                        ? "Rp"
                                        : "Unit"}
                                    </Badge>
                                  </div>
                                ) : (
                                  "Akun tidak ditemukan"
                                );
                              })()
                            : "Pilih akun dari rak..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.length > 0 ? (
                          accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-blue-600">
                                  {account.accountCode}
                                </span>
                                <span className="text-sm">
                                  {account.accountName}
                                </span>
                                <Badge
                                  className={`text-xs ${
                                    account.valueType === "NOMINAL"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {account.valueType === "NOMINAL"
                                    ? "Rp"
                                    : "Unit"}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-accounts" disabled>
                            Tidak ada akun tersedia
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Keterangan */}
                  <div className="col-span-3">
                    <Input
                      placeholder="Keterangan..."
                      value={row.keterangan}
                      onChange={(e) =>
                        updateRow(row.id, "keterangan", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>

                  {/* Nilai Input - Dinamis berdasarkan tipe akun */}
                  <div className="col-span-2">
                    {selectedAccount ? (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder={
                            selectedAccount.valueType === "NOMINAL"
                              ? "0"
                              : "0 unit"
                          }
                          value={
                            selectedAccount.valueType === "NOMINAL"
                              ? row.nominal
                              : row.kuantitas
                          }
                          onChange={(e) => {
                            const field =
                              selectedAccount.valueType === "NOMINAL"
                                ? "nominal"
                                : "kuantitas";
                            updateRow(row.id, field, e.target.value);
                          }}
                          className="text-right text-sm"
                        />
                        <div className="text-xs text-gray-500 text-center">
                          {selectedAccount.valueType === "NOMINAL"
                            ? "💰 Rupiah"
                            : "📦 Unit/Jumlah"}
                        </div>
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="Pilih akun dulu"
                        disabled
                        className="text-right text-sm bg-gray-50"
                      />
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRow(row.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={journalRows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={addNewRow}
                className="bg-gray-50 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                ADD TRANSACTION
              </Button>

              <Button
                onClick={saveJournalEntries}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                SAVE
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Entries - Updated Display */}
      {existingEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Entri Tersimpan -{" "}
              {new Date(selectedDate).toLocaleDateString("id-ID")}
            </CardTitle>
            <CardDescription>
              {existingEntries.length} entri tercatat untuk divisi{" "}
              {user?.division?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kode Akun</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingEntries.map((entry) => {
                    const account = accounts.find(
                      (acc) => acc.id === entry.accountId
                    );
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-blue-600">
                          {account?.accountCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {account?.accountName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              account?.valueType === "NOMINAL"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {account?.valueType === "NOMINAL"
                              ? "💰 Rp"
                              : "📦 Unit"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.description || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDisplayValue(
                            entry.nilai.toString(),
                            account?.valueType || "NOMINAL"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeExistingEntry(entry.id)}
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

            {/* Summary - Updated */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-blue-600">
                    Total Nominal (Rupiah)
                  </p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatDisplayValue(
                      existingEntries
                        .filter((entry) => {
                          const acc = accounts.find(
                            (a) => a.id === entry.accountId
                          );
                          return acc?.valueType === "NOMINAL";
                        })
                        .reduce((sum, entry) => sum + entry.nilai, 0)
                        .toString(),
                      "NOMINAL"
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-green-600">
                    Total Kuantitas (Unit)
                  </p>
                  <p className="text-xl font-bold text-green-800">
                    {formatDisplayValue(
                      existingEntries
                        .filter((entry) => {
                          const acc = accounts.find(
                            (a) => a.id === entry.accountId
                          );
                          return acc?.valueType === "KUANTITAS";
                        })
                        .reduce((sum, entry) => sum + entry.nilai, 0)
                        .toString(),
                      "KUANTITAS"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info untuk akun kosong */}
      {accounts.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-yellow-900">
                Rak Akun Masih Kosong
              </h3>
              <p className="text-yellow-800 text-sm mt-2">
                Belum ada akun di rak divisi {user?.division?.name}. Silakan
                tambahkan akun terlebih dahulu di menu "Rak Akun Divisi".
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
