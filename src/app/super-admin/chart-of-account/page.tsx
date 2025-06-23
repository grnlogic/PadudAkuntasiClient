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

  // Fungsi untuk generate kode akun dengan format angka
  const generateAccountCode = (
    valueType: string,
    divisionId: string
  ): string => {
    const divisionPrefixes: { [key: string]: string } = {
      "1": "1", // KEUANGAN & ADMINISTRASI
      "2": "2", // PEMASARAN & PENJUALAN
      "3": "3", // PRODUKSI
      "10": "10", // BLENDING
      "5": "5", // HRD
    };

    const typePrefixes: { [key: string]: string } = {
      NOMINAL: "0",
      KUANTITAS: "1",
    };

    const divisionPrefix = divisionPrefixes[divisionId] || "9";
    const typePrefix = typePrefixes[valueType] || "0";

    // Generate 3 digit angka berdasarkan timestamp
    const timestamp = Date.now().toString();
    const uniqueNumber = timestamp.slice(-3);

    return `${divisionPrefix}${typePrefix}${uniqueNumber}`;
  };

  // Fungsi untuk auto-generate kode saat tipe atau divisi berubah
  const handleTypeOrDivisionChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-generate kode jika belum ada dan kedua field sudah diisi
    if (
      newFormData.valueType &&
      newFormData.divisionId &&
      !formData.accountCode
    ) {
      newFormData.accountCode = generateAccountCode(
        newFormData.valueType,
        newFormData.divisionId
      );
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("=== FORM DEBUG: Form data ===", formData);

    // Validasi input yang lebih ketat
    if (!formData.accountCode?.trim()) {
      setError("Kode akun wajib diisi");
      return;
    }
    if (!formData.name?.trim()) {
      setError("Nama akun wajib diisi");
      return;
    }
    if (!formData.valueType) {
      setError("Tipe nilai wajib dipilih");
      return;
    }
    if (!formData.divisionId) {
      setError("Divisi wajib dipilih");
      return;
    }

    // Validasi format kode akun - harus diawali dengan angka
    const codePattern = /^\d/; // Harus diawali dengan angka
    if (!codePattern.test(formData.accountCode.trim())) {
      setError(
        "Kode akun harus diawali dengan angka (contoh: 1-001, 2-KAS, 3001, dll)"
      );
      return;
    }

    // Validasi minimal 3 karakter
    if (formData.accountCode.trim().length < 3) {
      setError("Kode akun minimal 3 karakter");
      return;
    }

    // Cek duplikasi kode akun (kecuali saat edit)
    const existingAccount = accounts.find(
      (acc) =>
        acc.accountCode === formData.accountCode.trim() &&
        (!editingAccount || acc.id !== editingAccount.id)
    );

    if (existingAccount) {
      setError(
        `Kode akun ${formData.accountCode} sudah digunakan. Silakan gunakan kode lain.`
      );
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
        accountCode: formData.accountCode.trim(),
        accountName: formData.name.trim(),
        valueType: formData.valueType,
        division: {
          id: formData.divisionId,
          name: selectedDivision.name,
        },
        status: "active" as const,
        createdBy: "current-user",
      };

      console.log("=== FORM DEBUG: Account data to save ===", accountData);

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
        setSuccess("Akun berhasil diperbarui");
      } else {
        await saveAccount(accountData);
        setSuccess("Akun berhasil ditambahkan");
      }

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
        console.error("Error deleting account:", err);

        // Handle specific constraint violation error
        if (err.message?.includes("masih digunakan dalam entri harian")) {
          setError(
            "❌ Tidak dapat menghapus akun ini karena masih digunakan dalam entri harian. " +
              "Silakan hapus terlebih dahulu semua entri harian yang menggunakan akun ini, " +
              "atau nonaktifkan akun instead of menghapusnya."
          );
        } else {
          setError(err.message || "Gagal menghapus akun");
        }
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
                {/* Kode Akun - Input Manual dengan validasi */}
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
                    placeholder="Contoh: 1-001, 2-KAS, 3-PROD-001, 8-001"
                    required
                  />
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      ✓ Harus diawali dengan angka (minimal 3 karakter)
                    </p>
                    <p className="text-xs text-gray-400">
                      Contoh format: 1-001, 2-KAS-001, 3-PROD-100, 8-001
                    </p>
                  </div>

                  {/* Real-time validation feedback */}
                  {formData.accountCode && (
                    <div className="mt-1">
                      {!/^\d/.test(formData.accountCode) ? (
                        <p className="text-xs text-red-500">
                          ❌ Harus diawali dengan angka
                        </p>
                      ) : formData.accountCode.length < 3 ? (
                        <p className="text-xs text-yellow-500">
                          ⚠️ Minimal 3 karakter
                        </p>
                      ) : accounts.some(
                          (acc) =>
                            acc.accountCode === formData.accountCode &&
                            (!editingAccount || acc.id !== editingAccount.id)
                        ) ? (
                        <p className="text-xs text-red-500">
                          ❌ Kode sudah digunakan
                        </p>
                      ) : (
                        <p className="text-xs text-green-500">
                          ✅ Format kode valid
                        </p>
                      )}
                    </div>
                  )}
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

                {/* Contoh Format Kode Akun */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Contoh Format Kode Akun:
                  </h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>
                      • <span className="font-mono">1-001</span> - Kas
                    </div>
                    <div>
                      • <span className="font-mono">2-KAS-001</span> - Kas
                      Divisi
                    </div>
                    <div>
                      • <span className="font-mono">3-PROD-100</span> - Produksi
                    </div>
                    <div>
                      • <span className="font-mono">8-001</span> - Tunjangan
                    </div>
                    <div>
                      • <span className="font-mono">5301</span> - Biaya
                      Operasional
                    </div>
                  </div>
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
                    disabled={
                      !formData.accountCode ||
                      !/^\d/.test(formData.accountCode) ||
                      formData.accountCode.length < 3 ||
                      accounts.some(
                        (acc) =>
                          acc.accountCode === formData.accountCode &&
                          (!editingAccount || acc.id !== editingAccount.id)
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              Total {accounts.length} akun dari database |{" "}
              {filteredAccounts.length} akun setelah filter
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
                    Divisi
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
                {/* Tampilkan semua accounts tanpa filter sementara untuk debug */}
                {accounts.map((account, index) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.accountCode || (
                        <span className="text-red-500 italic">Kosong</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.accountName || (
                        <span className="text-red-500 italic">Kosong</span>
                      )}
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
                      {account.division.name}
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

          {accounts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">
                Tidak ada data akun yang ditemukan.
              </div>
              <p className="text-sm">
                Silakan tambah akun baru atau periksa koneksi API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
