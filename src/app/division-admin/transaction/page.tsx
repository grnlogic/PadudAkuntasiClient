"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye } from "lucide-react";
import { getEntriHarian, type EntriHarian } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getAccountsByDivision, type Account } from "@/lib/data";

export default function TransactionPage() {
  const [entries, setEntries] = useState<EntriHarian[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntriHarian[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, filterType, filterDate]);

  const loadEntries = async () => {
    console.log("=== TRANSACTION PAGE: Loading entries ===");
    console.log("User division:", user?.division);

    if (!user?.division?.id) {
      console.log("No user division found");
      return;
    }

    try {
      // ✅ Load accounts dari divisi user dulu
      const accountsData = await getAccountsByDivision(user.division.id);
      console.log("Loaded accounts for division:", accountsData);
      setAccounts(accountsData);

      // ✅ Load ALL entries, kemudian filter by division
      const allEntries = await getEntriHarian();
      console.log("All entries from API:", allEntries);

      // ✅ Filter entries yang belong to current division
      const accountIds = accountsData.map((acc: Account) => acc.id);
      console.log("Account IDs for current division:", accountIds);

      const divisionEntries = allEntries.filter((entry) => {
        const belongs = accountIds.includes(entry.accountId);
        console.log(
          `Entry ${entry.id} (accountId: ${entry.accountId}) belongs to division:`,
          belongs
        );
        return belongs;
      });

      console.log("Filtered division entries:", divisionEntries);
      setEntries(divisionEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((entry) => {
        const account = accounts.find(
          (acc: Account) => acc.id === entry.accountId
        );
        return (
          account &&
          (account.accountName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            account.accountCode
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (entry.description &&
              entry.description.toLowerCase().includes(searchTerm.toLowerCase())))
        );
      });
    }

    // Date filter - ✅ FIXED: Use correct field name
    if (filterDate) {
      filtered = filtered.filter((entry) => {
        // Handle both possible date field names
        const entryDate = entry.tanggal || entry.date;
        return entryDate === filterDate;
      });
    }

    // Sort by creation time (most recent first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredEntries(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalAmount = () => {
    return filteredEntries.reduce((sum, entry) => sum + entry.nilai, 0);
  };

  const getTotalDebet = () => {
    return filteredEntries.reduce(
      (sum, entry) => sum + (entry.nilai > 0 ? entry.nilai : 0),
      0
    );
  };

  const getTotalKredit = () => {
    return filteredEntries.reduce(
      (sum, entry) => sum + (entry.nilai < 0 ? Math.abs(entry.nilai) : 0),
      0
    );
  };

  // ✅ FIXED: Use correct date field
  const todayEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.tanggal || entry.date);
    const today = new Date();
    return (
      entryDate.getDate() === today.getDate() &&
      entryDate.getMonth() === today.getMonth() &&
      entryDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-gray-600 mt-2">
          Lihat semua transaksi divisi {user?.division?.name}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="Debet">Debet</SelectItem>
                  <SelectItem value="Kredit">Kredit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Filter tanggal"
              />
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterDate("");
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-bold">{filteredEntries.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Debet</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(getTotalDebet())}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Kredit</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(getTotalKredit())}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Selisih</p>
              <p
                className={`text-xl font-bold ${
                  getTotalDebet() === getTotalKredit()
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {formatCurrency(Math.abs(getTotalDebet() - getTotalKredit()))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            {filteredEntries.length} entri ditemukan dari {entries.length} total
            entri divisi {user?.division?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Waktu Input</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const account = accounts.find(
                    (acc: Account) => acc.id === entry.accountId
                  );

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {/* ✅ FIXED: Use correct date field */}
                        {new Date(entry.tanggal || entry.date).toLocaleDateString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div>
                          <div className="font-medium">
                            {account?.accountCode || "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {account?.accountName || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {account?.valueType === "NOMINAL"
                            ? "💰 Nominal"
                            : "📦 Kuantitas"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {account?.valueType === "NOMINAL"
                          ? formatCurrency(entry.nilai)
                          : `${entry.nilai.toLocaleString("id-ID")} unit`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {entries.length === 0
                ? "Belum ada transaksi yang tercatat untuk divisi ini"
                : "Tidak ada transaksi yang sesuai dengan filter"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
