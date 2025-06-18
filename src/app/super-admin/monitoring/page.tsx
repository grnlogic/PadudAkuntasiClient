"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Download, Filter, TrendingUp, AlertTriangle } from "lucide-react";
import { getUsers, getEntriHarian, getAccounts } from "@/lib/data";

export default function MonitoringPage() {
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionStats, setDivisionStats] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterData();
  }, [allEntries, selectedDivision, selectedDate, searchTerm]);

  const loadAllData = async () => {
    const entries = await getEntriHarian();
    const users = await getUsers();
    const accounts = await getAccounts();

    // Add user info to entries
    const entriesWithUsers = entries.map((entry: any) => {
      const user = users.find((u: any) => u.id === entry.createdBy);
      const account = accounts.find((a: any) => a.id === entry.accountId);
      return {
        ...entry,
        userEmail: user?.username || "Unknown",
        userName: user?.username || "Unknown",
        accountCode: account?.accountCode || "",
        accountName: account?.accountName || "",
        division: account?.division?.name || "",
      };
    });

    setAllEntries(entriesWithUsers);

    // Calculate division statistics
    const divisions = [
      ...new Set(accounts.map((a: any) => a.division?.name).filter(Boolean)),
    ];
    const stats = divisions.map((division: any) => {
      const divisionAccounts = accounts.filter(
        (a: any) => a.division?.name === division
      );
      const accountIds = divisionAccounts.map((acc: any) => acc.id);
      const divisionEntries = entries.filter((e: any) =>
        accountIds.includes(e.accountId)
      );
      const today = new Date().toISOString().split("T")[0];
      const todayEntries = divisionEntries.filter(
        (e: any) => e.reportDate === today
      );

      return {
        division,
        totalEntries: divisionEntries.length,
        todayEntries: todayEntries.length,
        totalAmount: divisionEntries.reduce(
          (sum: number, e: any) => sum + Math.abs(e.nilai),
          0
        ),
        lastActivity:
          divisionEntries.length > 0
            ? divisionEntries[divisionEntries.length - 1].createdAt
            : null,
      };
    });

    setDivisionStats(stats);
  };

  const filterData = () => {
    let filtered = allEntries;

    if (selectedDivision !== "all") {
      filtered = filtered.filter(
        (entry: any) => entry.division === selectedDivision
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(
        (entry: any) => entry.reportDate === selectedDate
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (entry: any) =>
          entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by creation time (most recent first)
    filtered.sort(
      (a: any, b: any) =>
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

  const getDivisionColor = (division: string) => {
    const colors: { [key: string]: string } = {
      Keuangan: "bg-blue-100 text-blue-800",
      Produksi: "bg-yellow-100 text-yellow-800",
      Penjualan: "bg-green-100 text-green-800",
      Pembelian: "bg-purple-100 text-purple-800",
    };
    return colors[division] || "bg-gray-100 text-gray-800";
  };

  const exportData = () => {
    const csvContent = [
      [
        "Tanggal",
        "Waktu",
        "Divisi",
        "Kode Akun",
        "Nama Akun",
        "Keterangan",
        "Tipe",
        "Nominal",
        "Operator",
        "Email",
      ],
      ...filteredEntries.map((entry) => [
        entry.tanggal_laporan,
        new Date(entry.createdAt).toLocaleTimeString("id-ID"),
        entry.division,
        entry.accountCode,
        entry.accountName,
        entry.description,
        entry.type,
        entry.nilai,
        entry.userName,
        entry.userEmail,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pemantauan Menyeluruh
          </h1>
          <p className="text-gray-600 mt-2">
            Pantau seluruh aktivitas dari semua divisi secara detail
          </p>
        </div>
        <Button
          onClick={exportData}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Division Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {divisionStats.map((stat) => (
          <Card key={stat.division}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={getDivisionColor(stat.division)}>
                    {stat.division}
                  </Badge>
                  <div className="mt-2">
                    <p className="text-2xl font-bold">{stat.todayEntries}</p>
                    <p className="text-xs text-gray-500">entri hari ini</p>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">
                      Total: {stat.totalEntries} entri
                    </p>
                    <p className="text-xs text-gray-500">
                      Aktivitas terakhir:{" "}
                      {stat.lastActivity
                        ? new Date(stat.lastActivity).toLocaleString("id-ID")
                        : "Tidak ada aktivitas"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {stat.todayEntries === 0 ? (
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monitoring Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Filter Pemantauan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Cari Aktivitas</label>
              <Input
                placeholder="Cari transaksi, akun, atau keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
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
                  <SelectItem value="Keuangan">Keuangan</SelectItem>
                  <SelectItem value="Produksi">Produksi</SelectItem>
                  <SelectItem value="Penjualan">Penjualan</SelectItem>
                  <SelectItem value="Pembelian">Pembelian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Filter Tanggal</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDivision("all");
                  setSelectedDate("");
                  setSearchTerm("");
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas Detail</CardTitle>
          <CardDescription>
            Menampilkan {filteredEntries.length} dari {allEntries.length} total
            aktivitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(entry.reportDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleTimeString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDivisionColor(entry.division)}>
                        {entry.division}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {entry.userName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.userEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div>
                        <div className="font-medium">{entry.accountCode}</div>
                        <div className="text-gray-500 text-xs">
                          {entry.accountName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={entry.description}>
                        {entry.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          entry.type === "Debet"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(entry.nilai)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Tercatat
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada aktivitas yang sesuai dengan filter
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
