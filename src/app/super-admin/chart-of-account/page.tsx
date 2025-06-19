"use client";

import { useState, useEffect } from "react";
import {
  Account,
  Division,
  getAccounts,
  getDivisions,
  saveAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/data";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    accountCode: "",
    name: "",
    valueType: "" as "NOMINAL" | "KUANTITAS" | "",
    divisionId: "",
    balance: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAccounts();
    loadDivisions();
  }, []);

  const loadAccounts = async () => {
    console.log("=== COMPONENT DEBUG: Loading accounts ===");
    try {
      const data = await getAccounts();
      console.log("=== COMPONENT DEBUG: Received accounts data ===", data);
      setAccounts(data);
    } catch (error) {
      console.error("=== COMPONENT DEBUG: Error loading accounts ===", error);
      setError("Gagal memuat data akun");
    }
  };

  const loadDivisions = async () => {
    const data = await getDivisions();
    setDivisions(data);
  };

  const filteredAccounts = accounts.filter((account) => {
    const accountName = account.accountName || "";
    const accountCode = account.accountCode || "";
    const valueType = account.valueType || "";

    const matchesSearch =
      accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accountCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || valueType === filterType;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi input
    if (
      !formData.accountCode ||
      !formData.name ||
      !formData.valueType ||
      !formData.divisionId
    ) {
      setError("Semua field wajib diisi");
      return;
    }

    // Validasi format kode akun (opsional - bisa disesuaikan dengan kebutuhan)
    if (formData.accountCode.length < 3) {
      setError("Kode akun minimal 3 karakter");
      return;
    }

    // Cek duplikasi kode akun (kecuali saat edit)
    const existingAccount = accounts.find(
      (acc) =>
        acc.accountCode === formData.accountCode &&
        (!editingAccount || acc.id !== editingAccount.id)
    );

    if (existingAccount) {
      setError("Kode akun sudah digunakan. Silakan gunakan kode lain.");
      return;
    }

    try {
      const selectedDivision = divisions.find(
        (d) => d.id === formData.divisionId
      );
      if (!selectedDivision) {
        setError("Divisi tidak valid");
        return;
      }

      const accountData = {
        accountCode: formData.accountCode,
        accountName: formData.name,
        valueType: formData.valueType,
        division: {
          id: formData.divisionId,
          name: selectedDivision.name,
        },
        status: "active" as const,
        createdBy: "current-user",
      };

      if (editingAccount) {
        // Update existing account
        await updateAccount(editingAccount.id, accountData);
        setSuccess("Akun berhasil diperbarui");
      } else {
        // Create new account
        await saveAccount(accountData);
        setSuccess("Akun berhasil ditambahkan");
      }

      // Reset form dan reload data
      resetForm();
      loadAccounts();
    } catch (err: any) {
      console.error("Error saving account:", err);
      setError(err.message || "Gagal menyimpan akun");
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      accountCode: account.accountCode,
      name: account.accountName,
      valueType: account.valueType,
      divisionId: account.division.id,
      balance: 0,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus akun ini?")) {
      try {
        await deleteAccount(id);
        setSuccess("Akun berhasil dihapus");
        loadAccounts();
      } catch (err: any) {
        setError(err.message || "Gagal menghapus akun");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      accountCode: "",
      name: "",
      valueType: "",
      divisionId: "",
      balance: 0,
    });
    setEditingAccount(null);
    setShowAddForm(false);
    setError("");
    setSuccess("");
  };

  return (
    // Tambahkan container dengan proper padding dan margin
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Daftar Akun (Chart of Accounts)
            </h1>
            <p className="text-gray-600">
              Kelola semua akun dalam sistem akuntansi
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            + TAMBAH DATA BARU
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Kode Akun - Input Manual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Akun *
                  </label>
                  <input
                    type="text"
                    value={formData.accountCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountCode: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: KAS-001, PROD-100, dll"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan kode unik untuk akun (minimal 3 karakter)
                  </p>
                </div>

                {/* Nama Akun */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Akun *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nama akun"
                    required
                  />
                </div>

                {/* Tipe Nilai */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Nilai *
                  </label>
                  <select
                    value={formData.valueType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valueType: e.target.value as "NOMINAL" | "KUANTITAS",
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Tipe</option>
                    <option value="NOMINAL">NOMINAL (Rupiah)</option>
                    <option value="KUANTITAS">KUANTITAS (Unit/Satuan)</option>
                  </select>
                </div>

                {/* Divisi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Divisi *
                  </label>
                  <select
                    value={formData.divisionId}
                    onChange={(e) =>
                      setFormData({ ...formData, divisionId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Divisi</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingAccount ? "Perbarui" : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau kode akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="all">Semua Tipe</option>
            <option value="NOMINAL">NOMINAL</option>
            <option value="KUANTITAS">KUANTITAS</option>
          </select>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Akun</h2>
            <p className="text-sm text-gray-600">
              Total {filteredAccounts.length} akun ditemukan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Akun
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Akun
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Nominal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account, index) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.accountCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                          account.valueType
                        )}`}
                      >
                        {account.valueType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp 0
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-800 transition-colors font-medium"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">
                Tidak ada data akun yang ditemukan.
              </div>
              <p className="text-sm">
                Silakan tambah akun baru atau ubah filter pencarian.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
