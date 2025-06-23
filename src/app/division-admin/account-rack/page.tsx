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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Archive,
  Plus,
  Search,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  getAccountsByDivision,
  saveAccount,
  updateAccount,
  deleteAccount,
  getEntriHarian,
  type Account,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

export default function AccountRackPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const user = getCurrentUser();

  const [newAccount, setNewAccount] = useState({
    accountCode: "", // Format: 5-001, 3-002, dll
    accountName: "",
    valueType: "" as "NOMINAL" | "KUANTITAS" | "",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    if (user?.division?.id) {
      const divisionAccounts = await getAccountsByDivision(user.division.id);
      setAccounts(divisionAccounts);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" || account.valueType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      NOMINAL: "bg-blue-100 text-blue-800",
      KUANTITAS: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getAccountUsage = async (accountId: string) => {
    const entries = await getEntriHarian();
    const usage = entries.filter((entry: any) => entry.accountId === accountId);
    return usage.length;
  };

  const generateSuggestedCode = () => {
    // ✅ Mapping division name ke ID yang benar
    const divisionCodeMap: { [key: string]: string } = {
      "KEUANGAN & ADMINISTRASI": "1",
      "PEMASARAN & PENJUALAN": "2",
      PRODUKSI: "3",
      "BLENDING": "4",
      HRD: "5",
    };

    const divisionCode =
      divisionCodeMap[user?.division?.name || ""] || user?.division?.id || "1";

    const existingCodes = accounts
      .map((acc) => acc.accountCode)
      .filter((code) => code.startsWith(`${divisionCode}-`))
      .map((code) => Number.parseInt(code.split("-")[1]) || 0);

    const nextNumber =
      existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    return `${divisionCode}-${nextNumber.toString().padStart(3, "0")}`;
  };

  const handleCreateAccount = async () => {
    if (
      !newAccount.accountCode ||
      !newAccount.accountName ||
      !newAccount.valueType
    ) {
      setError("Semua field harus diisi");
      return;
    }

    // Validasi format kode akun (harus format: angka-angka)
    const codePattern = /^\d+-\d{3}$/;
    if (!codePattern.test(newAccount.accountCode)) {
      setError("Format kode akun harus: angka-angka (contoh: 5-001, 3-002)");
      return;
    }

    if (!user?.division) {
      setError("Divisi tidak ditemukan");
      return;
    }

    try {
      await saveAccount({
        accountCode: newAccount.accountCode,
        accountName: newAccount.accountName,
        valueType: newAccount.valueType,
        division: user.division,
        status: "active",
        createdBy: user.username,
      });

      await loadAccounts();
      setNewAccount({
        accountCode: "",
        accountName: "",
        valueType: "" as "NOMINAL" | "KUANTITAS" | "",
      });
      setShowCreateForm(false);
      setSuccess(
        `✅ Akun baru "${newAccount.accountName}" dengan kode "${newAccount.accountCode}" berhasil ditambahkan ke rak divisi!`
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Gagal membuat akun baru");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setNewAccount({
      accountCode: account.accountCode,
      accountName: account.accountName,
      valueType: account.valueType,
    });
    setShowCreateForm(true);
  };

  const handleUpdate = async () => {
    if (
      !editingAccount ||
      !newAccount.accountCode ||
      !newAccount.accountName ||
      !newAccount.valueType
    ) {
      setError("Semua field harus diisi");
      return;
    }

    // Validasi format kode akun
    const codePattern = /^\d+-\d{3}$/;
    if (!codePattern.test(newAccount.accountCode)) {
      setError("Format kode akun harus: angka-angka (contoh: 5-001, 3-002)");
      return;
    }

    try {
      await updateAccount(editingAccount.id, {
        accountCode: newAccount.accountCode,
        accountName: newAccount.accountName,
        valueType: newAccount.valueType,
      });

      await loadAccounts();
      setNewAccount({
        accountCode: "",
        accountName: "",
        valueType: "" as "NOMINAL" | "KUANTITAS" | "",
      });
      setEditingAccount(null);
      setShowCreateForm(false);
      setSuccess("Akun berhasil diperbarui");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui akun");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDelete = async (account: Account) => {
    const usage = await getAccountUsage(account.id);
    if (usage > 0) {
      setError(
        `❌ Akun "${account.accountName}" tidak dapat dihapus karena sudah digunakan dalam ${usage} entri laporan harian`
      );
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (
      confirm(
        `Apakah Anda yakin ingin menghapus akun "${account.accountName}" (${account.accountCode}) dari rak divisi?`
      )
    ) {
      if (await deleteAccount(account.id)) {
        loadAccounts();
        setSuccess("🗑️ Akun berhasil dihapus dari rak");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Gagal menghapus akun");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const resetForm = () => {
    setNewAccount({
      accountCode: "",
      accountName: "",
      valueType: "" as "NOMINAL" | "KUANTITAS" | "",
    });
    setEditingAccount(null);
    setShowCreateForm(false);
    setError("");
  };

  const getAccountStats = () => {
    const totalAccounts = filteredAccounts.length;
    const activeAccounts = filteredAccounts.filter(
      (acc) => acc.status === "active"
    ).length;
    const nominalAccounts = filteredAccounts.filter(
      (acc) => acc.valueType === "NOMINAL"
    ).length;

    return { totalAccounts, activeAccounts, nominalAccounts };
  };

  const stats = getAccountStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="h-8 w-8 text-blue-600" />
            Manajemen Akun COA - {user?.division?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola "rak" akun untuk laporan harian divisi Anda. Setiap akun yang
            dibuat akan muncul di formulir laporan harian.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          TAMBAH AKUN BARU KE RAK
        </Button>
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

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Cara Kerja "Rak" Akun COA
              </h3>
              <p className="text-blue-800 text-sm mt-1">
                Setiap akun yang Anda buat di sini akan otomatis muncul di
                formulir "Input Laporan Harian". Anda tinggal mengisi nilainya
                tanpa perlu mengetik ulang nama akun.
              </p>
              <p className="text-blue-700 text-xs mt-2">
                💡 <strong>Tips:</strong> Gunakan kode seperti{" "}
                {generateSuggestedCode()} untuk akun berikutnya
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Akun di Rak</p>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Akun Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeAccounts}
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
                <p className="text-sm text-gray-600">Akun Nominal</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.nominalAccounts}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari akun berdasarkan nama atau kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="NOMINAL">Nominal</SelectItem>
                  <SelectItem value="KUANTITAS">Kuantitas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun di Rak Divisi</CardTitle>
          <CardDescription>
            {filteredAccounts.length} akun tersedia untuk laporan harian divisi{" "}
            {user?.division?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tipe Nilai</TableHead>
                  <TableHead>Penggunaan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => {
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono font-medium text-blue-600">
                        {account.accountCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.accountName}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(account.valueType)}>
                          {account.valueType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Loading...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            account.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {account.status === "active"
                            ? "Aktif"
                            : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {account.createdBy}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(account)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada akun di rak divisi {user?.division?.name}. Tambahkan
              akun pertama untuk memulai!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Account Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingAccount
                  ? "Edit Akun di Rak"
                  : "Tambah Akun Baru ke Rak"}
              </CardTitle>
              <CardDescription>
                {editingAccount
                  ? "Perbarui informasi akun"
                  : `Buat akun baru untuk laporan harian divisi ${user?.division?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountCode">Kode Akun</Label>
                  <Input
                    id="accountCode"
                    placeholder={`Contoh: ${generateSuggestedCode()}`}
                    value={newAccount.accountCode}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accountCode: e.target.value,
                      })
                    }
                    className="mt-1 font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: angka-angka (contoh: {generateSuggestedCode()},
                    5-001, 3-002)
                  </p>
                </div>

                <div>
                  <Label htmlFor="accountName">Nama Akun</Label>
                  <Input
                    id="accountName"
                    placeholder="Contoh: Hasil Produksi Roti, Kas Operasional Harian"
                    value={newAccount.accountName}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accountName: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nama ini akan muncul di formulir laporan harian
                  </p>
                </div>

                <div>
                  <Label htmlFor="valueType">Tipe Nilai</Label>
                  <Select
                    value={newAccount.valueType}
                    onValueChange={(value: "NOMINAL" | "KUANTITAS") =>
                      setNewAccount({ ...newAccount, valueType: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih tipe nilai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOMINAL">NOMINAL (Rupiah)</SelectItem>
                      <SelectItem value="KUANTITAS">
                        KUANTITAS (Unit/Jumlah)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    NOMINAL untuk nilai uang, KUANTITAS untuk jumlah barang/unit
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={
                      editingAccount ? handleUpdate : handleCreateAccount
                    }
                    className="flex-1"
                  >
                    {editingAccount ? "Perbarui" : "Tambah ke Rak"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetForm}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
