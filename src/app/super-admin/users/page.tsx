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
import { Search, Edit, Trash2, UserPlus } from "lucide-react";
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
  getUsers,
  saveUser,
  updateUser,
  deleteUser,
  DIVISIONS,
  type AppUser,
} from "@/lib/data";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "" as "super-admin" | "division-admin" | "",
    division: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDivision =
      filterDivision === "all" || user.division?.id === filterDivision;
    return matchesSearch && matchesDivision;
  });

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getDivisionColor = (division: string) => {
    const colors: { [key: string]: string } = {
      "KEUANGAN & ADMINISTRASI": "bg-blue-100 text-blue-800",
      PRODUKSI: "bg-yellow-100 text-yellow-800",
      "PEMASARAN & PENJUALAN": "bg-green-100 text-green-800",
      "DISTRIBUSI & GUDANG": "bg-purple-100 text-purple-800",
      HRD: "bg-orange-100 text-orange-800",
    };
    return colors[division] || "bg-gray-100 text-gray-800";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.role) {
      setError("Nama, email, dan role harus diisi");
      return;
    }

    if (formData.role === "division-admin" && !formData.division) {
      setError("Pilih divisi untuk Admin Divisi");
      return;
    }

    const roleMapping = {
      "super-admin": "SUPER_ADMIN" as const,
      "division-admin": "ADMIN_DIVISI" as const,
    };

    const selectedDivision =
      formData.role === "division-admin"
        ? DIVISIONS.find((d) => getDivisionId(d) === formData.division)
        : undefined;

    try {
      if (editingUser) {
        // Update existing user
        updateUser(editingUser.id, {
          username: formData.email,
          role: roleMapping[formData.role],
          division:
            typeof selectedDivision === "object" ? selectedDivision : undefined,
        });
        setSuccess("User berhasil diperbarui");
      } else {
        // Create new user
        saveUser({
          username: formData.email,
          password: formData.password,
          role: roleMapping[formData.role],
          division:
            typeof selectedDivision === "object" ? selectedDivision : undefined,
          status: "active",
        });
        setSuccess("User berhasil ditambahkan");
      }

      loadUsers();
      resetForm();
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan user");
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    const roleMapping = {
      SUPER_ADMIN: "super-admin" as const,
      ADMIN_DIVISI: "division-admin" as const,
    };
    setFormData({
      name: user.username,
      email: user.username,
      role: roleMapping[user.role],
      division: user.division ? getDivisionId(user.division) : "",
      password: "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      if (await deleteUser(id)) {
        loadUsers();
        setSuccess("User berhasil dihapus");
      } else {
        setError("Gagal menghapus user");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "" as "super-admin" | "division-admin" | "",
      division: "",
      password: "",
    });
    setEditingUser(null);
    setShowAddForm(false);
    setError("");
  };

  // Helper function to check if division is an object with id and name
  const isDivisionObject = (
    division: any
  ): division is { id: string; name: string } => {
    return (
      division &&
      typeof division === "object" &&
      "id" in division &&
      "name" in division
    );
  };

  // Helper function to get division id
  const getDivisionId = (division: any): string => {
    return isDivisionObject(division) ? division.id : division;
  };

  // Helper function to get division name
  const getDivisionName = (division: any): string => {
    return isDivisionObject(division) ? division.name : division;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Pengguna
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola akun pengguna dan hak akses sistem
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          TAMBAH PENGGUNA
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
                  placeholder="Cari berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterDivision} onValueChange={setFilterDivision}>
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {Array.isArray(DIVISIONS) &&
                    DIVISIONS.map((division) => (
                      <SelectItem
                        key={getDivisionId(division)}
                        value={getDivisionId(division)}
                      >
                        {getDivisionName(division)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Total {filteredUsers.length} pengguna ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : "Admin Divisi"}
                    </TableCell>
                    <TableCell>
                      {user.division ? (
                        <Badge className={getDivisionColor(user.division.name)}>
                          {user.division.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status === "active" ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString("id-ID")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(user.id)}
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

      {/* Add/Edit User Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </CardTitle>
              <CardDescription>
                {editingUser
                  ? "Perbarui informasi pengguna"
                  : "Buat akun pengguna baru dalam sistem"}
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
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "super-admin" | "division-admin") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super-admin">Super Admin</SelectItem>
                      <SelectItem value="division-admin">
                        Admin Divisi
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "division-admin" && (
                  <div>
                    <Label htmlFor="division">Divisi</Label>
                    <Select
                      value={formData.division}
                      onValueChange={(value) =>
                        setFormData({ ...formData, division: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih divisi" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(DIVISIONS) &&
                          DIVISIONS.map((division) => (
                            <SelectItem
                              key={getDivisionId(division)}
                              value={getDivisionId(division)}
                            >
                              {getDivisionName(division)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingUser ? "Perbarui" : "Simpan"}
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
