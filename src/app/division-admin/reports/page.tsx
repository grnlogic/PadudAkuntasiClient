"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { getEntriHarian, type EntriHarian } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getAccountsByDivision, type Account } from "@/lib/data";

export default function ReportsPage() {
  const [entries, setEntries] = useState<EntriHarian[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState<any[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  // ✅ FIXED: Generate report whenever data changes
  useEffect(() => {
    console.log("=== REPORTS: useEffect triggered ===");
    console.log("Entries length:", entries.length);
    console.log("Accounts length:", accounts.length);
    console.log("Report type:", reportType);
    console.log("Selected month:", selectedMonth);

    // ✅ ALWAYS generate report when accounts and entries are loaded, regardless of length
    if (accounts.length > 0) {
      console.log("Calling generateReport...");
      generateReport();
    } else {
      console.log("Not generating report - no accounts loaded");
    }
  }, [entries, accounts, reportType, selectedMonth]);

  const loadData = async () => {
    console.log("=== REPORTS: Loading data ===");
    console.log("User division:", user?.division);

    if (!user?.division?.id) {
      console.log("No user division found");
      return;
    }

    try {
      // ✅ Load accounts first
      const accountsData = await getAccountsByDivision(user.division.id);
      console.log("Loaded accounts for reports:", accountsData);
      setAccounts(accountsData);

      // ✅ Load all entries
      const allEntries = await getEntriHarian();
      console.log("All entries for reports:", allEntries);

      // ✅ Filter entries by division
      const accountIds = accountsData.map((acc) => acc.id);
      console.log("Account IDs for division:", accountIds);

      const divisionEntries = allEntries.filter((entry) => {
        const belongs = accountIds.includes(entry.accountId);
        console.log(
          `Entry ${entry.id} (accountId: ${entry.accountId}) belongs to division:`,
          belongs
        );
        return belongs;
      });

      console.log("Division entries for reports:", divisionEntries);
      setEntries(divisionEntries);
    } catch (error) {
      console.error("Error loading reports data:", error);
    }
  };

  // ✅ COMPLETELY REWRITTEN: generateReport function
  const generateReport = () => {
    console.log("=== REPORTS: Generating report START ===");
    console.log("Raw entries:", entries);
    console.log("Raw accounts:", accounts);
    console.log("Report type:", reportType);
    console.log("Selected month:", selectedMonth);

    // ✅ Start with ALL entries (don't filter first)
    let filtered = [...entries];
    console.log("Starting with entries:", filtered);

    // ✅ Apply date filter based on report type
    if (reportType === "monthly") {
      console.log("Applying monthly filter for:", selectedMonth);
      filtered = entries.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        console.log(
          "Checking entry date:",
          entryDate,
          "against month:",
          selectedMonth
        );

        if (!entryDate) {
          console.log("Entry has no date, excluding");
          return false;
        }

        const belongs = entryDate.startsWith(selectedMonth);
        console.log(
          `Entry ${entry.id} (date: ${entryDate}) belongs to ${selectedMonth}:`,
          belongs
        );
        return belongs;
      });
    } else if (reportType === "yearly") {
      const year = selectedMonth.split("-")[0];
      console.log("Applying yearly filter for:", year);
      filtered = entries.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        if (!entryDate) return false;
        const belongs = entryDate.startsWith(year);
        console.log(
          `Entry ${entry.id} (date: ${entryDate}) belongs to year ${year}:`,
          belongs
        );
        return belongs;
      });
    }
    // For "all", use all entries

    console.log("Filtered entries after date filter:", filtered);

    // ✅ If no entries after filter, still create empty report structure
    if (filtered.length === 0) {
      console.log(
        "No entries after filtering, creating empty report for all accounts"
      );
      const emptyReport = accounts.map((account) => ({
        accountCode: account.accountCode,
        accountName: account.accountName,
        debet: 0,
        kredit: 0,
        transactions: 0,
      }));
      console.log("Empty report structure:", emptyReport);
      setReportData(emptyReport);
      return;
    }

    // ✅ Group entries by account
    const grouped: { [key: string]: any } = {};

    // ✅ Initialize all accounts with zero values
    accounts.forEach((account) => {
      const key = `${account.accountCode}-${account.accountName}`;
      grouped[key] = {
        accountCode: account.accountCode,
        accountName: account.accountName,
        debet: 0,
        kredit: 0,
        transactions: 0,
      };
    });

    console.log("Initialized grouped structure:", grouped);

    // ✅ Process filtered entries
    filtered.forEach((entry, index) => {
      console.log(`Processing entry ${index + 1}:`, entry);

      // Find account from loaded accounts
      const account = accounts.find((a) => a.id === entry.accountId);

      if (!account) {
        console.log(
          `❌ Account not found for entry ${entry.id} with accountId ${entry.accountId}`
        );
        return;
      }

      console.log(`✅ Found account for entry ${entry.id}:`, account);

      const key = `${account.accountCode}-${account.accountName}`;

      // ✅ Add to existing group (should already exist from initialization)
      if (grouped[key]) {
        const nilai = Number(entry.nilai) || 0;
        grouped[key].debet += nilai;
        grouped[key].transactions += 1;

        console.log(`Updated group ${key}:`, {
          previousDebet: grouped[key].debet - nilai,
          addedNilai: nilai,
          newDebet: grouped[key].debet,
          newTransactions: grouped[key].transactions,
        });
      } else {
        console.log(`❌ Group ${key} not found in initialized structure`);
      }
    });

    const reportArray = Object.values(grouped);
    console.log("=== REPORTS: Final grouped data ===", reportArray);

    setReportData(reportArray);
    console.log("=== REPORTS: Report data set ===");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalDebet = () => {
    return reportData.reduce((sum, item) => sum + item.debet, 0);
  };

  const getTotalKredit = () => {
    return reportData.reduce((sum, item) => sum + item.kredit, 0);
  };

  const getTotalTransactions = () => {
    return reportData.reduce((sum, item) => sum + item.transactions, 0);
  };

  // ✅ FIXED: Force regenerate report manually
  const handleGenerateReport = () => {
    console.log("=== MANUAL: Generate Report clicked ===");
    console.log("Current state:", {
      entries: entries.length,
      accounts: accounts.length,
      reportType,
      selectedMonth,
    });
    generateReport();
  };

  const exportReport = () => {
    const csvContent = [
      [
        "Kode Akun",
        "Nama Akun",
        "Total Debet",
        "Total Kredit",
        "Saldo",
        "Jumlah Transaksi",
      ],
      ...reportData.map((item) => [
        item.accountCode,
        item.accountName,
        item.debet,
        item.kredit,
        item.debet - item.kredit,
        item.transactions,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${user?.division?.name}-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-gray-600 mt-2">
            Laporan transaksi {user?.division?.name}
          </p>
        </div>
        <Button
          onClick={exportReport}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Report Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Jenis Laporan</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                  <SelectItem value="all">Semua Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "monthly" && (
              <div>
                <label className="text-sm font-medium">Bulan</label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex items-end">
              <Button
                onClick={handleGenerateReport}
                variant="outline"
                className="w-full"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Generate Laporan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold">{getTotalTransactions()}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Debet</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(getTotalDebet())}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Kredit</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(getTotalKredit())}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Bersih</p>
                <p
                  className={`text-xl font-bold ${
                    getTotalDebet() >= getTotalKredit()
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(getTotalDebet() - getTotalKredit())}
                </p>
              </div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  getTotalDebet() >= getTotalKredit()
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                {getTotalDebet() >= getTotalKredit() ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Per Akun</CardTitle>
          <CardDescription>
            Ringkasan transaksi berdasarkan akun untuk periode{" "}
            {reportType === "monthly" ? selectedMonth : "semua data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Total Debet</TableHead>
                  <TableHead>Total Kredit</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Jumlah Transaksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((item, index) => {
                    const balance = item.debet - item.kredit;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {item.accountCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.accountName}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(item.debet)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(item.kredit)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              balance >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(Math.abs(balance))}
                          </span>
                          <Badge
                            variant="outline"
                            className={`ml-2 ${
                              balance >= 0
                                ? "border-green-200 text-green-700"
                                : "border-red-200 text-red-700"
                            }`}
                          >
                            {balance >= 0 ? "Debet" : "Kredit"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.transactions}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      Tidak ada data untuk ditampilkan. Debug info di atas untuk
                      troubleshooting.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
