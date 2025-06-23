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
  BookOpen,
  Users,
  TrendingUp,
  Eye,
  Filter,
  Calendar,
} from "lucide-react";
import { getAccounts, getUsers, getEntriHarian } from "@/lib/data";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeUsers: 0,
    todayTransactions: 0,
    totalDivisions: 0,
  });

  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [startDate, setStartDate] = useState("2025-06-19"); // Tanggal awal
  const [endDate, setEndDate] = useState("2025-06-20"); // Tanggal akhir

  // Separate state for applied filters
  const [appliedStartDate, setAppliedStartDate] = useState("2025-06-19");
  const [appliedEndDate, setAppliedEndDate] = useState("2025-06-20");
  const [appliedDivision, setAppliedDivision] = useState("all");

  useEffect(() => {
    loadMonitoringData();
  }, [appliedStartDate, appliedEndDate, appliedDivision]);

  const loadMonitoringData = async () => {
    try {
      console.log("=== SUPER ADMIN: Loading monitoring data ===");
      console.log("Applied filters:", {
        appliedStartDate,
        appliedEndDate,
        appliedDivision,
      });

      const accounts = await getAccounts();
      const users = await getUsers();
      const entries = await getEntriHarian();

      console.log("Raw accounts data:", accounts);
      console.log("Raw users data:", users);
      console.log("Raw entries data:", entries);

      setAccounts(accounts);

      // Calculate stats
      const divisions = [
        ...new Set(users.map((u) => u.division?.id).filter(Boolean)),
      ];

      // ✅ IMPROVED: Filter by date range instead of single date
      const rangeEntries = entries.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        let entryDateOnly = null;

        if (entryDate) {
          entryDateOnly = entryDate.includes("T")
            ? entryDate.split("T")[0]
            : entryDate;
        }

        if (!entryDateOnly) return false;

        const startDateOnly = startDate.includes("T")
          ? startDate.split("T")[0]
          : startDate;
        const endDateOnly = endDate.includes("T")
          ? endDate.split("T")[0]
          : endDate;

        const isInRange =
          entryDateOnly >= startDateOnly && entryDateOnly <= endDateOnly;
        console.log(
          `Entry ${entry.id}: date='${entryDateOnly}' in range [${startDateOnly} - ${endDateOnly}] → match=${isInRange}`
        );
        return isInRange;
      });

      console.log(
        "✅ Matched entries for range",
        `${startDate} - ${endDate}`,
        ":",
        rangeEntries.length,
        rangeEntries
      );

      setStats({
        totalAccounts: accounts.length,
        activeUsers: users.filter((u) => u.status === "active").length,
        todayTransactions: rangeEntries.length,
        totalDivisions: divisions.length,
      });

      // Filter entries by division and date range
      let filteredEntries = entries.filter((entry) => {
        const entryDate = entry.tanggal || entry.date;
        let entryDateOnly = null;

        if (entryDate) {
          entryDateOnly = entryDate.includes("T")
            ? entryDate.split("T")[0]
            : entryDate;
        }

        if (!entryDateOnly) return false;

        const startDateOnly = startDate.includes("T")
          ? startDate.split("T")[0]
          : startDate;
        const endDateOnly = endDate.includes("T")
          ? endDate.split("T")[0]
          : endDate;

        return entryDateOnly >= startDateOnly && entryDateOnly <= endDateOnly;
      });

      console.log(
        "📅 Entries filtered by date range:",
        filteredEntries.length,
        filteredEntries
      );

      if (appliedDivision !== "all") {
        const divisionAccounts = accounts.filter((acc) => {
          const accDivisionId = acc.division?.id?.toString();
          console.log(
            `Account ${acc.id} division: ${accDivisionId}, comparing with selected: ${appliedDivision}`
          );
          return accDivisionId === appliedDivision;
        });

        const accountIds = divisionAccounts.map((acc) => acc.id);
        console.log("🏢 Division accounts:", divisionAccounts);
        console.log("📋 Account IDs to filter:", accountIds);

        filteredEntries = filteredEntries.filter((entry) => {
          const entryAccountId = entry.accountId.toString();
          const belongs = accountIds.some(
            (id) => id.toString() === entryAccountId
          );
          console.log(
            `Entry ${entry.id} accountId ${entryAccountId} belongs to division:`,
            belongs
          );
          return belongs;
        });

        console.log(
          "🏢 Entries filtered by division:",
          filteredEntries.length,
          filteredEntries
        );
      }

      // Enhanced entries with better error handling
      const enrichedEntries = filteredEntries.map((entry, index) => {
        console.log(
          `🔄 Processing entry ${index + 1}/${filteredEntries.length}:`,
          entry
        );

        const account = accounts.find((acc) => {
          const match = acc.id.toString() === entry.accountId.toString();
          if (match) {
            console.log(
              `✅ Found matching account for entry ${entry.id}:`,
              acc
            );
          }
          return match;
        });

        if (!account) {
          console.warn(
            `❌ Account not found for entry ${entry.id} with accountId ${entry.accountId}`
          );
          return {
            ...entry,
            account_code: "N/A",
            account_name: "Account Not Found",
            division_name: "N/A",
            value_type: "NOMINAL",
            created_by: entry.createdBy || "system",
          };
        }

        const enriched = {
          ...entry,
          account_code: account.accountCode || "N/A",
          account_name: account.accountName || "N/A",
          division_name: account.division?.name || "N/A",
          value_type: account.valueType || "NOMINAL",
          created_by: entry.createdBy || "system",
        };

        console.log(`✅ Successfully enriched entry ${entry.id}:`, enriched);
        return enriched;
      });

      // Sort by creation time (most recent first)
      enrichedEntries.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      console.log(
        "📊 FINAL ENRICHED ENTRIES:",
        enrichedEntries.length,
        enrichedEntries
      );
      console.log("🔄 Setting recent entries state...");

      setRecentEntries(enrichedEntries.slice(0, 20));

      // Verify what was actually set
      setTimeout(() => {
        console.log(
          "🔍 Verification - recentEntries state should now be:",
          enrichedEntries.slice(0, 20)
        );
      }, 100);
    } catch (error) {
      console.error("❌ Error loading monitoring data:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDivisionColor = (divisionName: string) => {
    const colors: { [key: string]: string } = {
      "KEUANGAN & ADMINISTRASI": "bg-blue-100 text-blue-800",
      "PEMASARAN & PENJUALAN": "bg-green-100 text-green-800",
      PRODUKSI: "bg-yellow-100 text-yellow-800",
      "BLENDING": "bg-purple-100 text-purple-800",
      HRD: "bg-orange-100 text-orange-800",
    };
    return colors[divisionName] || "bg-gray-100 text-gray-800";
  };

  // ✅ FIXED: Get unique divisions with better logging
  const getAvailableDivisions = () => {
    if (!accounts || accounts.length === 0) {
      console.log("No accounts available for divisions");
      return [];
    }

    const divisions = accounts
      .filter((acc) => {
        const hasValidDivision =
          acc.division && acc.division.id && acc.division.name;
        if (!hasValidDivision) {
          console.log("Account with invalid division:", acc);
        }
        return hasValidDivision;
      })
      .map((acc) => ({
        id: acc.division.id.toString(),
        name: acc.division.name,
      }));

    // Remove duplicates by id
    const uniqueDivisions = divisions.filter(
      (div, index, self) => index === self.findIndex((d) => d.id === div.id)
    );

    console.log("Available divisions:", uniqueDivisions);
    return uniqueDivisions;
  };

  // ✅ Dynamic title for period stats
  const getPeriodTitle = () => {
    if (startDate === endDate) {
      return `Entri ${new Date(startDate).toLocaleDateString("id-ID")}`;
    }
    return `Entri ${new Date(startDate).toLocaleDateString(
      "id-ID"
    )} - ${new Date(endDate).toLocaleDateString("id-ID")}`;
  };

  const statsData = [
    {
      title: "Total Akun",
      value: stats.totalAccounts.toString(),
      description: "Akun dari semua divisi",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Admin Aktif",
      value: stats.activeUsers.toString(),
      description: "Operator divisi",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: getPeriodTitle(),
      value: stats.todayTransactions.toString(),
      description: "Transaksi tercatat",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Total Divisi",
      value: stats.totalDivisions.toString(),
      description: "Divisi operasional",
      icon: Eye,
      color: "text-orange-600",
    },
  ];

  // ✅ Function to apply filters
  const applyFilters = () => {
    console.log("Applying filters:", { startDate, endDate, selectedDivision });
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedDivision(selectedDivision);
  };

  // ✅ Function to reset all filters
  const resetFilters = () => {
    setStartDate("2025-06-19");
    setEndDate("2025-06-20");
    setSelectedDivision("all");
    setAppliedStartDate("2025-06-19");
    setAppliedEndDate("2025-06-20");
    setAppliedDivision("all");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Menara Kontrol - Dashboard Pemantauan
        </h1>
        <p className="text-gray-600 mt-2">
          Pantau seluruh aktivitas dari semua divisi secara real-time
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monitoring Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pemantauan Real-Time
          </CardTitle>
          <CardDescription>Filter dan pantau aktivitas divisi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Tanggal Awal</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Filter Divisi</label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger className="mt-1">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {getAvailableDivisions().map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <Button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tampilkan Data
              </Button>
            </div>
          </div>
          {/* ✅ Quick action buttons */}
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("All Data button clicked - before:", {
                  startDate,
                  endDate,
                  selectedDivision,
                });
                setStartDate("2025-06-19");
                setEndDate("2025-06-20");
                setSelectedDivision("all");
                console.log("All Data button clicked - after setting states");
              }}
              className="hover:bg-gray-50"
            >
              All Data
            </Button>
            {/* Show filter status ONLY when user changes from defaults */}
            {(startDate !== "2025-06-19" ||
              endDate !== "2025-06-20" ||
              selectedDivision !== "all") && (
              <span className="text-sm text-blue-600 ml-2">
                📊 Filter:
                {startDate === endDate
                  ? new Date(startDate).toLocaleDateString("id-ID")
                  : `${new Date(startDate).toLocaleDateString(
                      "id-ID"
                    )} - ${new Date(endDate).toLocaleDateString("id-ID")}`}
                {selectedDivision !== "all" &&
                  ` | ${
                    getAvailableDivisions().find(
                      (d) => d.id === selectedDivision
                    )?.name || "Divisi"
                  }`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Aktivitas Entri Harian -{" "}
            {startDate === endDate
              ? new Date(startDate).toLocaleDateString("id-ID")
              : `${new Date(startDate).toLocaleDateString(
                  "id-ID"
                )} s/d ${new Date(endDate).toLocaleDateString("id-ID")}`}
          </CardTitle>
          <CardDescription>
            Menampilkan {recentEntries.length} entri
            {selectedDivision !== "all"
              ? ` dari divisi yang dipilih`
              : " dari semua divisi"}
            {/* ✅ ADD: Helpful hint if no data */}
            {recentEntries.length === 0 && (
              <span className="text-yellow-600 ml-2">
                • Coba ubah tanggal ke 19 Juni 2025 untuk melihat data yang
                tersedia
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries &&
                Array.isArray(recentEntries) &&
                recentEntries.length > 0 ? (
                  recentEntries.map((entry, index) => {
                    console.log(
                      `Rendering table row ${index + 1} for entry:`,
                      entry
                    );

                    return (
                      <TableRow key={entry.id || `entry-${index}`}>
                        <TableCell className="text-sm">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getDivisionColor(
                              entry.division_name || "N/A"
                            )}
                          >
                            {entry.division_name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div>
                            <div className="font-medium">
                              {entry.account_code || "N/A"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {entry.account_name || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              entry.value_type === "NOMINAL"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {entry.value_type === "NOMINAL"
                              ? "💰 Nominal"
                              : "📦 Kuantitas"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.value_type === "NOMINAL"
                            ? formatCurrency(entry.nilai || 0)
                            : `${(entry.nilai || 0).toLocaleString(
                                "id-ID"
                              )} unit`}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {entry.created_by || "system"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="space-y-2">
                        <div>
                          Tidak ada entri untuk tanggal dan divisi yang dipilih
                        </div>
                        <div className="text-xs text-gray-400">
                          Debug: recentEntries.length ={" "}
                          {recentEntries?.length || 0}
                        </div>
                        <div className="text-xs text-gray-400">
                          Debug: Array.isArray ={" "}
                          {Array.isArray(recentEntries) ? "true" : "false"}
                        </div>
                        {/* ✅ ADD: Helpful suggestion */}
                        <div className="text-sm text-blue-600 mt-4">
                          💡 Tip: Klik tombol "19 Jun (Ada Data)" di atas untuk
                          melihat transaksi yang tersedia
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Mode Darurat</CardTitle>
          <CardDescription>
            Aksi cepat untuk situasi darurat atau perbaikan sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Backup Darurat
            </Button>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Reset Sesi User
            </Button>
            <Button
              variant="outline"
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              Maintenance Mode
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Gunakan hanya dalam keadaan darurat atau untuk perbaikan sistem
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
