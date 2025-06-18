"use client";

import type React from "react";

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
import { Plus, Search, Edit, Trash2, Filter } from "lucide-react";
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
  getAccounts,
  saveAccount,
  updateAccount,
  deleteAccount,
  generateAccountCode,
  type Account,
} from "@/lib/data";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    valueType: "" as "NOMINAL" | "KUANTITAS" | "",
    balance: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const data = await getAccounts();
    setAccounts(data);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.valueType) {
      setError("Nama akun dan tipe harus diisi");
      return;
    }

    try {
      if (editingAccount) {
        // Update existing account
        updateAccount(editingAccount.id, {
          accountName: formData.name,
          valueType: formData.valueType,
        });
        setSuccess("Akun berhasil diperbarui");
      } else {
        // Create new account
        const code = generateAccountCode(formData.valueType);
        saveAccount({
          accountCode: code,
          accountName: formData.name,
          valueType: formData.valueType,
          division: {
            id: "super-admin",
            name: "SUPER_ADMIN",
          },
          status: "active",
          createdBy: "super-admin",
        });
        setSuccess("Akun berhasil ditambahkan");
      }

      loadAccounts();
      resetForm();
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan akun");
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.accountName,
      valueType: account.valueType,
      balance: 0,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus akun ini?")) {
      if (await deleteAccount(id)) {
        loadAccounts();
        setSuccess("Akun berhasil dihapus");
      } else {
        setError("Gagal menghapus akun");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      valueType: "" as "NOMINAL" | "KUANTITAS" | "",
      balance: 0,
    });
    setEditingAccount(null);
    setShowAddForm(false);
    setError("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Daftar Akun (Chart of Accounts)
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola semua akun dalam sistem akuntansi
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          TAMBAH DATA BARU
        </Button>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama atau kode akun..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
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
          <CardTitle>Daftar Akun</CardTitle>
          <CardDescription>
            Total {filteredAccounts.length} akun ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Saldo Nominal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono">
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
                    <TableCell className="font-medium">
                      {formatCurrency((account as any).balance || 0)}
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
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Account Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
              </CardTitle>
              <CardDescription>
                {editingAccount
                  ? "Perbarui informasi akun"
                  : "Buat akun baru dalam sistem"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="name">Nama Akun</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama akun"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipe Akun</Label>
                  <Select
                    value={formData.valueType}
                    onValueChange={(value: "NOMINAL" | "KUANTITAS") =>
                      setFormData({ ...formData, valueType: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih tipe akun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOMINAL">Nominal</SelectItem>
                      <SelectItem value="KUANTITAS">Kuantitas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="balance">Saldo Awal</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="0"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balance: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>

                {!editingAccount && (
                  <div>
                    <Label>Kode Akun</Label>
                    <Input
                      placeholder={
                        formData.valueType
                          ? `${generateAccountCode(
                              formData.valueType
                            )} (otomatis)`
                          : "Pilih tipe terlebih dahulu"
                      }
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Kode akan dibuat otomatis berdasarkan tipe
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingAccount ? "Perbarui" : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={resetForm}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
