"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  Package,
  Target,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getSalespeopleByDivision,
  createLaporanPenjualanProduk,
  getLaporanPenjualanProduk,
  updateLaporanPenjualanProduk,
  deleteLaporanPenjualanProduk,
  saveLaporanPenjualanProduk,
  getProductAccounts,
  deleteSalesperson,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { createSalesperson } from "@/lib/api";
import { toastSuccess, toastError, toastWarning } from "@/lib/toast-utils";

// ✅ Product Entry Interface
interface ProductEntry {
  id?: string;
  productAccountId?: number;
  idBarang: string;
  namaBarang: string;
  targetKuantitas: number;
  realisasiKuantitas: number;
  satuanBarang: string;
  keterangan?: string;
}

// ✅ Laporan Entry Interface
interface LaporanEntry {
  id?: string;
  tanggalLaporan: string;
  idSalesperson: string;
  namaSalesperson: string;
  divisiSalesperson: string;
  products: ProductEntry[];
  totalTarget: number;
  totalRealisasi: number;
  totalPenjualan: number;
  keteranganKendala?: string;
  status: "draft" | "submitted";
}

export default function LaporanPenjualanWizard() {
  // ✅ Helper functions dari backup
  const filterDataForToday = (data: any[]) => {
    const today = new Date().toISOString().split("T")[0];
    return data.filter((laporan: any) => {
      const laporanDate = laporan.tanggalLaporan || laporan.createdAt;
      if (!laporanDate) return false;

      // Normalisasi tanggal ke format YYYY-MM-DD
      const normalizedDate = new Date(laporanDate).toISOString().split("T")[0];
      const normalizedToday = new Date(today).toISOString().split("T")[0];

      return normalizedDate === normalizedToday;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ State Management
  const [step, setStep] = useState<1 | 2>(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Form State
  const [formData, setFormData] = useState<LaporanEntry>({
    tanggalLaporan: new Date().toISOString().split("T")[0],
    idSalesperson: "",
    namaSalesperson: "",
    divisiSalesperson: "",
    products: [],
    totalTarget: 0,
    totalRealisasi: 0,
    totalPenjualan: 0,
    keteranganKendala: "",
    status: "draft",
  });

  // ✅ Data State
  const [salespeople, setSalespeople] = useState<any[]>([]);
  const [laporanList, setLaporanList] = useState<any[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);
  const [productList, setProductList] = useState<any[]>([]);

  // ✅ NEW: State untuk management salesperson
  const [showSalespersonManagement, setShowSalespersonManagement] =
    useState(false);
  const [newSalespersonName, setNewSalespersonName] = useState("");
  const [addingSales, setAddingSales] = useState(false);
  const [deletingSalesperson, setDeletingSalesperson] = useState<number | null>(
    null
  );
  const [deletingLaporanProduk, setDeletingLaporanProduk] = useState<
    number | null
  >(null);

  // ✅ User data
  const user = getCurrentUser();

  // ✅ Product Form State
  const [productForm, setProductForm] = useState<ProductEntry>({
    idBarang: "",
    namaBarang: "",
    targetKuantitas: 0,
    realisasiKuantitas: 0,
    satuanBarang: "PCS",
    keterangan: "",
  });

  // ✅ Load Initial Data
  useEffect(() => {
    loadSalespeople();
    loadLaporanList();
    loadProductList();
  }, []);

  const loadSalespeople = async () => {
    try {
      setLoading(true);
      const divisionId = user?.division?.id
        ? parseInt(user.division.id)
        : undefined;

      if (divisionId) {
        const salesList = await getSalespeopleByDivision(divisionId);

        setSalespeople(salesList);
      } else {
        console.log("🚫 No valid division found, clearing salespeople list");
        setSalespeople([]);
        toastError.custom("Error: Tidak dapat mengambil data divisi pengguna");
      }
    } catch (error) {
      console.error("Error loading salespeople:", error);
      toastError.custom("Gagal memuat data salesperson");
    } finally {
      setLoading(false);
    }
  };

  const loadLaporanList = async () => {
    try {
      const data = await getLaporanPenjualanProduk();
      console.log("📊 Raw data from API:", data);

      // Filter data untuk hari ini saja menggunakan helper function
      const filteredData = filterDataForToday(data);
      console.log("📅 Filtered data for today:", filteredData);

      setLaporanList(filteredData);
    } catch (error) {
      console.error("Error loading laporan list:", error);
    }
  };

  const loadProductList = async () => {
    try {
      const divisionId = user?.division?.id
        ? parseInt(user.division.id)
        : undefined;

      if (divisionId) {
        const list = await getProductAccounts(divisionId);
        setProductList(
          list.map((product) => ({
            ...product,
            accountCode:
              product.account_code ||
              product.accountCode ||
              product?.kodeAkun ||
              product?.code ||
              "N/A",
            accountName:
              product.account_name ||
              product.accountName ||
              product?.namaAkun ||
              product?.name ||
              "N/A",
          }))
        );
      } else {
        console.error("❌ No valid divisionId found, cannot fetch products");
        setProductList([]);
        toastError.custom("Error: Tidak dapat mengambil data divisi pengguna");
      }
    } catch (error) {
      console.error("Error loading product list:", error);
      toastError.custom("Gagal memuat data produk");
    }
  };

  // ✅ Form Handlers
  const handleSalespersonChange = (value: string) => {
    const selected = salespeople.find((s) => s.id === parseInt(value));
    if (selected) {
      setSelectedSalesperson(selected);
      setFormData((prev) => ({
        ...prev,
        idSalesperson: value,
        namaSalesperson: selected.nama,
        divisiSalesperson: selected.namaDivisi,
      }));
    }
  };

  const updateProductForm = (field: keyof ProductEntry, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const addProductEntry = () => {
    if (!productForm.namaBarang.trim()) {
      toast.error("Nama barang harus diisi");
      return;
    }

    const newProduct: ProductEntry = {
      ...productForm,
      id: Date.now().toString(), // Temporary ID
    };

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));

    // Reset form
    setProductForm({
      idBarang: "",
      namaBarang: "",
      targetKuantitas: 0,
      realisasiKuantitas: 0,
      satuanBarang: "PCS",
      keterangan: "",
    });

    toast.success("Produk berhasil ditambahkan");
  };

  const removeProductEntry = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
    toast.success("Produk berhasil dihapus");
  };

  const updateProductEntry = (index: number, updatedProduct: ProductEntry) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((product, i) =>
        i === index ? updatedProduct : product
      ),
    }));
  };

  // ✅ Calculate Summary
  const calculateSummary = () => {
    const totalTarget = formData.products.reduce(
      (sum, p) => sum + p.targetKuantitas,
      0
    );
    const totalRealisasi = formData.products.reduce(
      (sum, p) => sum + p.realisasiKuantitas,
      0
    );
    // No total sales calculation in backup version
    const totalPenjualan = 0;

    return { totalTarget, totalRealisasi, totalPenjualan };
  };

  // ✅ Step Navigation
  const goToStep2 = () => {
    if (!formData.idSalesperson) {
      toast.error("Pilih salesperson terlebih dahulu");
      return;
    }
    setStep(2);
  };

  const goToStep1 = () => {
    setStep(1);
  };

  // ✅ Save Functions
  const saveDraft = async () => {
    try {
      setSaving(true);

      // Save each product entry separately
      if (isEditMode && editingId && formData.products.length === 1) {
        // Edit mode: update existing record
        const product = formData.products[0];
        const dataToSave = {
          tanggal_laporan: formData.tanggalLaporan,
          salesperson_id: parseInt(formData.idSalesperson),
          product_account_id: product.productAccountId,
          target_kuantitas: product.targetKuantitas,
          realisasi_kuantitas: product.realisasiKuantitas,
          keterangan_kendala: product.keterangan || null,
        };
        await updateLaporanPenjualanProduk(editingId, dataToSave);
      } else {
        // Create mode: create new records
        for (const product of formData.products) {
          const dataToSave = {
            tanggal_laporan: formData.tanggalLaporan,
            salesperson_id: parseInt(formData.idSalesperson),
            product_account_id: product.productAccountId,
            target_kuantitas: product.targetKuantitas,
            realisasi_kuantitas: product.realisasiKuantitas,
            keterangan_kendala: product.keterangan || null,
          };
          await createLaporanPenjualanProduk(dataToSave);
        }
      }

      toast.success(
        isEditMode ? "Draft berhasil diperbarui" : "Draft berhasil disimpan"
      );

      await loadLaporanList();
      resetForm();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Gagal menyimpan draft");
    } finally {
      setSaving(false);
    }
  };

  const submitFinal = async () => {
    try {
      setSaving(true);

      if (formData.products.length === 0) {
        toast.error("Minimal harus ada 1 produk");
        return;
      }

      // Submit each product entry separately
      if (isEditMode && editingId && formData.products.length === 1) {
        // Edit mode: update existing record
        const product = formData.products[0];
        const dataToSave = {
          tanggal_laporan: formData.tanggalLaporan,
          salesperson_id: parseInt(formData.idSalesperson),
          product_account_id: product.productAccountId,
          target_kuantitas: product.targetKuantitas,
          realisasi_kuantitas: product.realisasiKuantitas,
          keterangan_kendala: product.keterangan || null,
        };
        await updateLaporanPenjualanProduk(editingId, dataToSave);
      } else {
        // Create mode: create new records
        for (const product of formData.products) {
          const dataToSave = {
            tanggal_laporan: formData.tanggalLaporan,
            salesperson_id: parseInt(formData.idSalesperson),
            product_account_id: product.productAccountId,
            target_kuantitas: product.targetKuantitas,
            realisasi_kuantitas: product.realisasiKuantitas,
            keterangan_kendala: product.keterangan || null,
          };
          await createLaporanPenjualanProduk(dataToSave);
        }
      }

      toast.success(
        isEditMode
          ? "Laporan berhasil diperbarui dan disubmit"
          : "Laporan berhasil disubmit"
      );

      await loadLaporanList();
      resetForm();
    } catch (error) {
      console.error("Error submitting laporan:", error);
      toast.error("Gagal submit laporan");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Utility Functions
  const resetForm = () => {
    setFormData({
      tanggalLaporan: new Date().toISOString().split("T")[0],
      idSalesperson: "",
      namaSalesperson: "",
      divisiSalesperson: "",
      products: [],
      totalTarget: 0,
      totalRealisasi: 0,
      totalPenjualan: 0,
      keteranganKendala: "",
      status: "draft",
    });
    setSelectedSalesperson(null);
    setStep(1);
    setIsEditMode(false);
    setEditingId(null);
  };

  const editLaporan = (laporan: any) => {
    // Convert single product record to products array format
    const productEntry: ProductEntry = {
      id: laporan.id?.toString(),
      productAccountId: laporan.productAccountId,
      idBarang: laporan.productAccountId?.toString() || "",
      namaBarang: laporan.namaAccount,
      targetKuantitas: parseInt(laporan.targetKuantitas) || 0,
      realisasiKuantitas: parseInt(laporan.realisasiKuantitas) || 0,
      satuanBarang: "PCS",
      keterangan: laporan.keteranganKendala || "",
    };

    setFormData({
      tanggalLaporan: laporan.tanggalLaporan,
      idSalesperson: laporan.salespersonId?.toString() || "",
      namaSalesperson: laporan.namaSalesperson,
      divisiSalesperson: "DIVISI PEMASARAN & PENJUALAN",
      products: [productEntry],
      totalTarget: parseInt(laporan.targetKuantitas) || 0,
      totalRealisasi: parseInt(laporan.realisasiKuantitas) || 0,
      totalPenjualan: 0, // No price in product version
      keteranganKendala: laporan.keteranganKendala || "",
      status: "draft", // Always edit as draft
    });

    const selected = salespeople.find(
      (s) => s.id === parseInt(laporan.salespersonId)
    );
    setSelectedSalesperson(selected);
    setIsEditMode(true);
    setEditingId(laporan.id);
    setStep(2);
  };

  // ✅ NEW: Fungsi untuk delete salesperson
  const handleDeleteSalesperson = async (
    salespersonId: number,
    salespersonName: string
  ) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus salesperson "${salespersonName}"?`
      )
    ) {
      return;
    }

    setDeletingSalesperson(salespersonId);
    try {
      await deleteSalesperson(salespersonId);
      toastSuccess.custom(`Salesperson "${salespersonName}" berhasil dihapus!`);

      // ✅ FIXED: Refresh salespeople list berdasarkan division user
      const divisionId = user?.division?.id
        ? parseInt(user.division.id)
        : undefined;
      if (divisionId) {
        const updatedSales = await getSalespeopleByDivision(divisionId);
        setSalespeople(updatedSales);
      } else {
        setSalespeople([]);
      }

      // If currently selected salesperson was deleted, reset selection
      if (selectedSalesperson && selectedSalesperson.id === salespersonId) {
        setSelectedSalesperson(null);
      }
    } catch (error: any) {
      toastError.custom(error.message || "Gagal menghapus salesperson");
    } finally {
      setDeletingSalesperson(null);
    }
  };

  // ✅ NEW: Fungsi untuk delete laporan penjualan produk
  const handleDeleteLaporanProduk = async (
    laporanId: number,
    laporanInfo: string
  ) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus laporan penjualan produk "${laporanInfo}"?`
      )
    ) {
      return;
    }

    setDeletingLaporanProduk(laporanId);
    try {
      await deleteLaporanPenjualanProduk(laporanId);
      toastSuccess.custom(`Laporan penjualan produk berhasil dihapus!`);

      // ✅ FIXED: Refresh laporan produk data
      await loadLaporanList();
    } catch (error: any) {
      toastError.custom(
        error.message || "Gagal menghapus laporan penjualan produk"
      );
    } finally {
      setDeletingLaporanProduk(null);
    }
  };

  const deleteLaporan = async (id: string) => {
    await handleDeleteLaporanProduk(parseInt(id), "Laporan ini");
  };

  // ✅ NEW: Create salesperson function dari backup
  const handleCreateSalesperson = async () => {
    if (!newSalespersonName.trim()) {
      toastError.custom("Nama salesperson harus diisi");
      return;
    }

    setAddingSales(true);
    try {
      const divisionId = user?.division?.id
        ? parseInt(user.division.id)
        : undefined;
      if (!divisionId) {
        toastError.custom("Error: Tidak dapat mengambil data divisi pengguna");
        return;
      }

      const newSales = await createSalesperson(
        newSalespersonName.trim(),
        parseInt(user?.perusahaan_id?.toString() || "1"), // ✅ FIXED: Use user's company ID
        divisionId
      );

      setSalespeople([...salespeople, newSales]);
      setNewSalespersonName("");
      toastSuccess.custom("Salesperson berhasil ditambahkan!");
    } catch (error: any) {
      toastError.custom("Gagal menambah salesperson: " + error.message);
    } finally {
      setAddingSales(false);
    }
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Laporan Penjualan Produk
              {isEditMode && <Badge variant="outline">Edit Mode</Badge>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={step === 1 ? "default" : "secondary"}>
                1. Pilih Salesperson
              </Badge>
              <Badge variant={step === 2 ? "default" : "secondary"}>
                2. Entry Produk
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: Salesperson Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Pilih Salesperson
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tanggal">Tanggal Laporan</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggalLaporan}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tanggalLaporan: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="salesperson">Salesperson</Label>
                <Select
                  value={formData.idSalesperson}
                  onValueChange={handleSalespersonChange}
                  disabled={loading || salespeople.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loading
                          ? "Loading salespeople..."
                          : salespeople.length === 0
                          ? "No salespeople available"
                          : "Pilih salesperson..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {salespeople
                      .filter((person) => person && person.id)
                      .map((person) => (
                        <SelectItem
                          key={person.id}
                          value={person.id.toString()}
                        >
                          {person.nama} - {person.status || "AKTIF"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSalesperson && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Nama</Label>
                      <p className="font-medium">{selectedSalesperson.nama}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Divisi</Label>
                      <p className="font-medium">
                        {selectedSalesperson.namaDivisi}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <Badge variant="outline">
                        {selectedSalesperson.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ NEW: Management Salesperson Section dari backup */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Management Salesperson
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowSalespersonManagement(!showSalespersonManagement)
                    }
                  >
                    {showSalespersonManagement ? "Sembunyikan" : "Kelola"}
                  </Button>
                </div>
              </CardHeader>
              {showSalespersonManagement && (
                <CardContent>
                  {/* Add New Salesperson */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-blue-800 font-medium mb-2 block">
                      Tambah Salesperson Baru
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nama salesperson baru"
                        value={newSalespersonName}
                        onChange={(e) => setNewSalespersonName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSalespersonName.trim()) {
                            handleCreateSalesperson();
                          }
                        }}
                      />
                      <Button
                        onClick={handleCreateSalesperson}
                        disabled={!newSalespersonName.trim() || addingSales}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {addingSales ? "Menambah..." : "Tambah"}
                      </Button>
                    </div>
                  </div>

                  {/* Existing Salespeople List */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Daftar Salesperson
                    </Label>
                    {salespeople.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        Belum ada salesperson terdaftar
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {salespeople.map((sp) => (
                          <div
                            key={sp.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                          >
                            <div>
                              <p className="font-medium text-sm">{sp.nama}</p>
                              <p className="text-xs text-gray-500">
                                {sp.namaDivisi}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDeleteSalesperson(sp.id, sp.nama)
                              }
                              disabled={deletingSalesperson === sp.id}
                            >
                              {deletingSalesperson === sp.id ? (
                                "Menghapus..."
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="flex justify-end gap-2">
              <Button onClick={goToStep2} disabled={!formData.idSalesperson}>
                Lanjut ke Entry Produk
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product Entry */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Back Navigation & Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" onClick={goToStep1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {formData.namaSalesperson}
                  </span>{" "}
                  - {formData.tanggalLaporan}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {summary.totalTarget}
                    </div>
                    <div className="text-sm text-gray-600">Total Target</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {summary.totalRealisasi}
                    </div>
                    <div className="text-sm text-gray-600">Total Realisasi</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {formData.products.length}
                    </div>
                    <div className="text-sm text-gray-600">Jumlah Produk</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Product Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Tambah Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productSelect">Pilih Produk</Label>
                  <Select
                    value={productForm.productAccountId?.toString() || ""}
                    onValueChange={(value) => {
                      const selectedProduct = productList.find(
                        (p) => p.id.toString() === value
                      );
                      if (selectedProduct) {
                        updateProductForm(
                          "productAccountId",
                          selectedProduct.id
                        );
                        updateProductForm(
                          "namaBarang",
                          selectedProduct.accountName
                        );
                        updateProductForm(
                          "idBarang",
                          selectedProduct.accountCode || ""
                        );
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productList.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
                          {product.accountCode} - {product.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="keterangan">
                    Keterangan Kendala (opsional)
                  </Label>
                  <Input
                    id="keterangan"
                    value={productForm.keterangan}
                    onChange={(e) =>
                      updateProductForm("keterangan", e.target.value)
                    }
                    placeholder="Keterangan kendala..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetKuantitas">Target Kuantitas</Label>
                  <Input
                    id="targetKuantitas"
                    type="number"
                    value={
                      productForm.targetKuantitas === 0
                        ? ""
                        : productForm.targetKuantitas
                    }
                    onChange={(e) =>
                      updateProductForm(
                        "targetKuantitas",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="realisasiKuantitas">
                    Realisasi Kuantitas
                  </Label>
                  <Input
                    id="realisasiKuantitas"
                    type="number"
                    value={
                      productForm.realisasiKuantitas === 0
                        ? ""
                        : productForm.realisasiKuantitas
                    }
                    onChange={(e) =>
                      updateProductForm(
                        "realisasiKuantitas",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="keterangan">
                  Keterangan Kendala (Optional)
                </Label>
                <Textarea
                  id="keterangan"
                  value={productForm.keterangan}
                  onChange={(e) =>
                    updateProductForm("keterangan", e.target.value)
                  }
                  placeholder="Jelaskan kendala penjualan produk ini..."
                  rows={2}
                />
              </div>

              <Button
                onClick={addProductEntry}
                disabled={!productForm.namaBarang.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </CardContent>
          </Card>

          {/* Product List */}
          {formData.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Daftar Produk ({formData.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.products.map((product, index) => (
                    <Card
                      key={product.id || index}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                            <div>
                              <Label className="text-gray-600">
                                Nama Produk
                              </Label>
                              <p className="font-medium">
                                {product.namaBarang}
                              </p>
                              <p className="text-sm text-gray-500">
                                ID: {product.idBarang}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-600">
                                Target vs Realisasi
                              </Label>
                              <p className="font-medium">
                                {product.realisasiKuantitas} /{" "}
                                {product.targetKuantitas} {product.satuanBarang}
                              </p>
                              <p className="text-sm text-gray-500">
                                {product.targetKuantitas > 0
                                  ? `${(
                                      (product.realisasiKuantitas /
                                        product.targetKuantitas) *
                                      100
                                    ).toFixed(1)}%`
                                  : "0%"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeProductEntry(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {product.keterangan && (
                          <div className="mt-3 pt-3 border-t">
                            <Label className="text-gray-600">Keterangan</Label>
                            <p className="text-sm">{product.keterangan}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={saveDraft} disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Draft"}
                </Button>
                <Button
                  onClick={submitFinal}
                  disabled={saving || formData.products.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? "Submitting..." : "Submit Laporan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Laporan List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {laporanList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada laporan untuk hari ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {laporanList.map((laporan) => (
                <Card
                  key={laporan.id}
                  className="border-l-4 border-l-green-500"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {laporan.namaSalesperson}
                          </h4>
                          <Badge
                            variant={
                              laporan.status === "submitted"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {laporan.status === "submitted"
                              ? "Submitted"
                              : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {laporan.namaAccount} • Target:{" "}
                          {laporan.targetKuantitas} • Realisasi:{" "}
                          {laporan.realisasiKuantitas}
                        </p>
                        <p className="text-xs text-gray-500">
                          {laporan.tanggalLaporan}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editLaporan(laporan)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteLaporan(laporan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
