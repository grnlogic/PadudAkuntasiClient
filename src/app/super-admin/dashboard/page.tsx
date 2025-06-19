"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Users, TrendingUp, Eye, Filter, Calendar } from "lucide-react"
import { getAccounts, getUsers, getEntriHarian } from "@/lib/data"

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeUsers: 0,
    todayTransactions: 0,
    totalDivisions: 0,
  })

  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [selectedDivision, setSelectedDivision] = useState("all")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    loadMonitoringData()
  }, [selectedDivision, selectedDate])

  // Update the loadMonitoringData function
  const loadMonitoringData = async () => {
    const accounts = await getAccounts()
    const users = await getUsers()
    const entries = await getEntriHarian() // Changed from getJournalEntries

    // Calculate stats - update field references
    const divisions = [...new Set(users.map((u) => u.division?.id).filter(Boolean))]
    const todayEntries = entries.filter((entry) => entry.date === selectedDate) // Use correct property name

    setStats({
      totalAccounts: accounts.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      todayTransactions: todayEntries.length,
      totalDivisions: divisions.length,
    })

    // Filter recent entries by division and date
    let filteredEntries = entries.filter((entry) => entry.date === selectedDate) // Use correct property name

    if (selectedDivision !== "all") {
      // Filter by division through accounts
      const divisionAccounts = accounts.filter((acc) => acc.division.id === selectedDivision)
      const accountIds = divisionAccounts.map((acc) => acc.id)
      filteredEntries = filteredEntries.filter((entry) => accountIds.includes(entry.accountId))
    }

    // Sort by creation time (most recent first)
    filteredEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setRecentEntries(filteredEntries.slice(0, 20)) // Show latest 20 entries
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getDivisionColor = (division: string) => {
    const colors: { [key: string]: string } = {
      Keuangan: "bg-blue-100 text-blue-800",
      Produksi: "bg-yellow-100 text-yellow-800",
      Penjualan: "bg-green-100 text-green-800",
      Pembelian: "bg-purple-100 text-purple-800",
    }
    return colors[division] || "bg-gray-100 text-gray-800"
  }

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
      title: "Entri Hari Ini",
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
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Menara Kontrol - Dashboard Pemantauan</h1>
        <p className="text-gray-600 mt-2">Pantau seluruh aktivitas dari semua divisi secara real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
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
              <label className="text-sm font-medium">Tanggal Pemantauan</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Filter Divisi</label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
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
          </div>
        </CardContent>
      </Card>

      {/* Real-time Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Entri Harian - {new Date(selectedDate).toLocaleDateString("id-ID")}</CardTitle>
          <CardDescription>
            Menampilkan {recentEntries.length} entri
            {selectedDivision !== "all" ? ` dari divisi ${selectedDivision}` : " dari semua divisi"}
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
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {new Date(entry.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getDivisionColor(entry.division_id)}>{entry.division_id}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div>
                        <div className="font-medium">{entry.account_code}</div>
                        <div className="text-gray-500 text-xs">{entry.account_name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>
                      <Badge
                        className={entry.type === "Debet" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(entry.amount)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{entry.created_by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {recentEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">Tidak ada entri untuk tanggal dan divisi yang dipilih</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Mode Darurat</CardTitle>
          <CardDescription>Aksi cepat untuk situasi darurat atau perbaikan sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              Backup Darurat
            </Button>
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
              Reset Sesi User
            </Button>
            <Button variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
              Maintenance Mode
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Gunakan hanya dalam keadaan darurat atau untuk perbaikan sistem
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
