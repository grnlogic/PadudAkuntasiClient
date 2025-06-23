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
  saveUserWithDTO, // Import function yang benar
  updateUser,
  deleteUser,
  type AppUser,
} from "@/lib/data";

//alert state

// Updated DIVISIONS dengan mapping ID yang benar
const DIVISIONS = [
  { id: "1", name: "DIVISI KEUANGAN & ADMINISTRASI" },
  { id: "2", name: "DIVISI PEMASARAN & PENJUALAN" },
  { id: "3", name: "DIVISI PRODUKSI" },
  { id: "10", name: "DIVISI BLENDING" },
  { id: "5", name: "DIVISI HRD" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
const [showAlert, setShowAlert] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
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
    try {
      console.log("Loading users...");
      const data = await getUsers();
      console.log("Users loaded:", data);
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Gagal memuat data pengguna");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const userDivisionId =
      user.division?.id ||
      (typeof user.division === "string" ? user.division : null);
    const matchesDivision =
      filterDivision === "all" || userDivisionId === filterDivision;

    return matchesSearch && matchesDivision;
  });

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getDivisionColor = (division: string) => {
    const colors: { [key: string]: string } = {
      "DIVISI KEUANGAN & ADMINISTRASI": "bg-blue-100 text-blue-800",
      "DIVISI PRODUKSI": "bg-yellow-100 text-yellow-800",
      "DIVISI PEMASARAN & PENJUALAN": "bg-green-100 text-green-800",
      "DIVISI BLENDING": "bg-purple-100 text-purple-800",
      "DIVISI HRD": "bg-orange-100 text-orange-800",
    };
    return colors[division] || "bg-gray-100 text-gray-800";
  };

  const getDivisionById = (id: string) => {
    return DIVISIONS.find((div) => div.id === id);
  };

  const getUserDivisionDisplay = (user: AppUser) => {
    if (
      user.division &&
      typeof user.division === "object" &&
      user.division.name
    ) {
      return {
        id: user.division.id,
        name: user.division.name,
      };
    }

    if (user.division && typeof user.division === "string") {
      const divisionObj = getDivisionById(user.division);
      if (divisionObj) {
        return divisionObj;
      }
    }

    if (user.role === "ADMIN_DIVISI") {
      return {
        id: "unknown",
        name: "Divisi Tidak Ditemukan",
      };
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("=== FORM DEBUG: Form data ===", {
      ...formData,
      password: formData.password ? "[HIDDEN]" : "EMPTY",
    });

    // Validation
    if (!formData.name || !formData.username || !formData.role) {
      setError("Semua field wajib diisi");
      return;
    }

    if (!formData.password && !editingUser) {
      setError("Password wajib diisi untuk user baru");
      return;
    }

    // Validate division for division-admin
    if (formData.role === "division-admin" && !formData.division) {
      setError("Divisi wajib dipilih untuk Admin Divisi");
      return;
    }

    // Fix role mapping
    const backendRole =
      formData.role === "division-admin" ? "ADMIN_DIVISI" : "SUPER_ADMIN";

    // Get division ID as number for backend
    const divisionId =
      formData.role === "division-admin" && formData.division
        ? parseInt(formData.division)
        : null;

    console.log("=== DEBUG: Division ID ===", divisionId);

    // Use the correct DTO format untuk backend
    const createRequest = {
      username: formData.username,
      password: formData.password,
      role: backendRole,
      divisionId: divisionId, // Backend expects divisionId as number or null
    };

    console.log("=== DEBUG: Sending create request ===", {
      ...createRequest,
      password: createRequest.password ? "[HIDDEN]" : "EMPTY",
    });

    if (editingUser) {
      // Update logic later
      console.log("Update functionality not implemented yet");
    } else {
      // Create new user using the correct function
      saveUserWithDTO(createRequest)
        .then((savedUser) => {
          console.log("=== DEBUG: User saved successfully ===", savedUser);
          setSuccess("User berhasil ditambahkan");
          resetForm();
          loadUsers();
        })
        .catch((err) => {
          console.error("Error saving user:", err);
          setError("Gagal menambahkan user: " + err.message);
        });
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    const roleMapping = {
      SUPER_ADMIN: "super-admin" as const,
      ADMIN_DIVISI: "division-admin" as const,
    };

    const userDivision = getUserDivisionDisplay(user);

    setFormData({
      name: user.username,
      username: user.username,
      role: roleMapping[user.role],
      division: userDivision ? userDivision.id : "",
      password: "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        const deleted = await deleteUser(id);
        if (deleted) {
          setSuccess("User berhasil dihapus");
          loadUsers();
        } else {
          setError("Gagal menghapus user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        setError("Gagal menghapus user");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      role: "" as "super-admin" | "division-admin" | "",
      division: "",
      password: "",
    });
    setEditingUser(null);
    setShowAddForm(false);
    setError("");
    setSuccess("");
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

      {success && showAlert && (
  <Alert className="border-green-200 bg-green-50 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-green-600">
        {/* Ikon sukses */}
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 7.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L10 12.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      </span>
      <AlertDescription className="text-green-800">{success}</AlertDescription>
    </div>
    <button onClick={() => setShowAlert(false)} className="ml-4 text-green-600 hover:text-green-800">
      &times;
    </button>
  </Alert>
)}
{error && showAlert && (
  <Alert variant="destructive" className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-red-600">
        {/* Ikon error */}
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 112 0 1 1 0 01-2 0zm.293-7.707a1 1 0 011.414 0l.293.293.293-.293a1 1 0 111.414 1.414l-.293.293.293.293a1 1 0 01-1.414 1.414l-.293-.293-.293.293a1 1 0 01-1.414-1.414l.293-.293-.293-.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </span>
      <AlertDescription>{error}</AlertDescription>
    </div>
    <button onClick={() => setShowAlert(false)} className="ml-4 text-red-600 hover:text-red-800">
      &times;
    </button>
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
                  placeholder="Cari berdasarkan username..."
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
                  {DIVISIONS.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
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
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const userDivision = getUserDivisionDisplay(user);

                  return (
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
                        {userDivision ? (
                          <Badge
                            className={
                              userDivision.id === "unknown"
                                ? "bg-red-100 text-red-800"
                                : getDivisionColor(userDivision.name)
                            }
                          >
                            {userDivision.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(user.status || "inactive")}
                        >
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
                          {user.role !== "SUPER_ADMIN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
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
                        <SelectValue placeholder="Pilih Divisi" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIVISIONS.map((division) => (
                          <SelectItem key={division.id} value={division.id}>
                            {division.name}
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
