import React, { useState, useEffect } from "react";
import {
  getPerusahaan,
  getSalespeople,
  getProductAccounts,
  saveLaporanPenjualanProduk,
  getLaporanPenjualanProduk,
  getSalespeopleByPerusahaan,
  getAccountsByDivision,
  getEntriHarianByDate,
  getLaporanPenjualanSales,
} from "@/lib/data";
import { createSalesperson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { getCurrentUser } from "@/lib/auth";
import { Plus, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LaporanPenjualanWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [perusahaanList, setPerusahaanList] = useState<any[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [laporanProduk, setLaporanProduk] = useState<any[]>([]);

  const [selectedPerusahaan, setSelectedPerusahaan] = useState<any>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);
  // Interface untuk multi baris entri
  interface ProductEntry {
    id: string;
    productAccountId: string;
    targetKuantitas: string;
    realisasiKuantitas: string;
    keteranganKendala: string;
  }

  // State untuk multi baris entri
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([
    {
      id: "1",
      productAccountId: "",
      targetKuantitas: "",
      realisasiKuantitas: "",
      keteranganKendala: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [newSalespersonName, setNewSalespersonName] = useState("");
  const [addingSales, setAddingSales] = useState(false);

  // ✅ Helper function untuk filter data berdasarkan tanggal hari ini
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

  useEffect(() => {
    getPerusahaan().then(setPerusahaanList);
    // ✅ FIXED: Filter laporan produk berdasarkan tanggal hari ini
    getLaporanPenjualanProduk().then((data) => {
      console.log("🔍 LAPORAN PENJUALAN WIZARD - Received data:", data);

      // Filter data untuk hari ini saja menggunakan helper function
      const filteredData = filterDataForToday(data);

      console.log("🔍 LAPORAN PENJUALAN WIZARD - Filtered data for today:", {
        total: data.length,
        filtered: filteredData.length,
        today: new Date().toISOString().split("T")[0],
      });

      setLaporanProduk(filteredData);
    });
    getSalespeople().then(setSalesList);
  }, []);

  useEffect(() => {
    if (selectedPerusahaan && selectedPerusahaan.id) {
      getSalespeopleByPerusahaan(selectedPerusahaan.id).then(setSalesList);
    } else {
      setSalesList([]);
    }
  }, [selectedPerusahaan]);

  useEffect(() => {
    if (selectedPerusahaan) {
      const user = getCurrentUser();
      const divisionId = user?.division?.id
        ? parseInt(user.division.id)
        : undefined;

      console.log("🔍 DEBUG - Fetching products for division:", divisionId);
      console.log("👤 Current user:", user);

      if (divisionId) {
        getProductAccounts(divisionId).then((list) => {
          console.log("📦 Products fetched:", list);
          setProductList(list);
        });
      } else {
        console.error("❌ No valid divisionId found, cannot fetch products");
        setProductList([]);
        toastError.custom("Error: Tidak dapat mengambil data divisi pengguna");
      }
    } else {
      setProductList([]);
    }
    setStep(1);
  }, [selectedPerusahaan]);

  const handleNext = () => {
    if (step === 1 && !selectedPerusahaan) {
      toastError.validation("Pilih perusahaan terlebih dahulu");
      return;
    }
    if (step === 2 && !selectedSalesperson) {
      toastError.validation("Pilih salesperson terlebih dahulu");
      return;
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as any) : prev));
  };

  const handlePrev = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));

  // Fungsi untuk menambah baris entri baru
  const addProductEntry = () => {
    const newEntry: ProductEntry = {
      id: Date.now().toString(),
      productAccountId: "",
      targetKuantitas: "",
      realisasiKuantitas: "",
      keteranganKendala: "",
    };
    setProductEntries([...productEntries, newEntry]);
  };

  // Fungsi untuk menghapus baris entri
  const removeProductEntry = (id: string) => {
    if (productEntries.length > 1) {
      setProductEntries(productEntries.filter((entry) => entry.id !== id));
    }
  };

  // Fungsi untuk update baris entri
  const updateProductEntry = (
    id: string,
    field: keyof ProductEntry,
    value: string
  ) => {
    setProductEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Fungsi untuk mendapatkan produk berdasarkan ID
  const getProductById = (productId: string) => {
    return productList.find((product) => product.id.toString() === productId);
  };

  const handleSubmit = async () => {
    if (!selectedPerusahaan || !selectedSalesperson) {
      toastError.validation("Pilih perusahaan dan salesperson terlebih dahulu");
      return;
    }

    // Validasi entri yang valid
    const validEntries = productEntries.filter((entry) => {
      return (
        entry.productAccountId &&
        entry.targetKuantitas &&
        entry.realisasiKuantitas &&
        Number(entry.targetKuantitas) > 0 &&
        Number(entry.realisasiKuantitas) > 0
      );
    });

    if (validEntries.length === 0) {
      toastError.validation("Tidak ada entri yang valid untuk disimpan");
      return;
    }

    setLoading(true);
    try {
      // Simpan semua entri valid
      for (const entry of validEntries) {
        const product = getProductById(entry.productAccountId);
        if (!product) continue;

        await saveLaporanPenjualanProduk({
          tanggalLaporan: new Date().toISOString().slice(0, 10),
          perusahaanId: selectedPerusahaan.id,
          namaPerusahaan: selectedPerusahaan.nama,
          salespersonId: selectedSalesperson.id,
          namaSalesperson: selectedSalesperson.nama,
          productAccountId: product.id,
          namaAccount: product.accountName,
          targetKuantitas: Number(entry.targetKuantitas),
          realisasiKuantitas: Number(entry.realisasiKuantitas),
          keteranganKendala: entry.keteranganKendala,
        });
      }

      toastSuccess.custom(
        `Berhasil menyimpan ${validEntries.length} laporan penjualan produk`
      );

      // Reset form
      setProductEntries([
        {
          id: "1",
          productAccountId: "",
          targetKuantitas: "",
          realisasiKuantitas: "",
          keteranganKendala: "",
        },
      ]);
      setStep(1);
      setSelectedPerusahaan(null);
      setSelectedSalesperson(null);

      // Refresh data dengan filter tanggal hari ini
      getLaporanPenjualanProduk().then((data) => {
        console.log(
          "🔍 LAPORAN PENJUALAN WIZARD - After submit, received data:",
          data
        );

        // Filter data untuk hari ini saja menggunakan helper function
        const filteredData = filterDataForToday(data);

        console.log(
          "🔍 LAPORAN PENJUALAN WIZARD - After submit, filtered data:",
          {
            total: data.length,
            filtered: filteredData.length,
            today: new Date().toISOString().split("T")[0],
          }
        );

        setLaporanProduk(filteredData);
      });
    } catch (e: any) {
      toastError.custom(e.message || "Gagal simpan laporan");
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check all accounts in division
  const debugAllAccountsInDivision = async () => {
    const user = getCurrentUser();
    const divisionId = user?.division?.id
      ? parseInt(user.division.id)
      : undefined;

    if (divisionId) {
      console.log("🔍 DEBUG: Checking all accounts in division", divisionId);

      // Call a generic accounts endpoint to see all accounts for this division
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/api/v1/accounts/by-division/${divisionId}?t=${Date.now()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📊 All accounts in division:", data);
          console.log("📊 Total accounts in division:", data.data?.length || 0);

          // Filter by KUANTITAS manually to see the difference
          const kuantitasAccounts =
            data.data?.filter((acc: any) => acc.valueType === "KUANTITAS") ||
            [];
          console.log("📦 KUANTITAS accounts:", kuantitasAccounts);
          console.log("📦 KUANTITAS count:", kuantitasAccounts.length);
        }
      } catch (error) {
        console.error("❌ Error fetching all accounts:", error);
      }
    }
  };

  // ✅ NEW: Debug function untuk check data PDF
  const debugPDFData = async () => {
    const user = getCurrentUser();
    const divisionId = user?.division?.id
      ? parseInt(user.division.id)
      : undefined;

    if (divisionId) {
      console.log("🔍 DEBUG PDF: Checking data for PDF generation");

      try {
        // Get current date
        const today = new Date().toISOString().slice(0, 10);

        // Get all relevant data
        const [accountsData, entriesData, laporanSalesData, laporanProdukData] =
          await Promise.all([
            getAccountsByDivision(divisionId?.toString() || ""),
            getEntriHarianByDate(today),
            getLaporanPenjualanSales(),
            getLaporanPenjualanProduk(),
          ]);

        // Filter data for today
        const filteredLaporanSales = laporanSalesData.filter((laporan: any) => {
          const laporanDate = laporan.tanggalLaporan || laporan.createdAt;
          if (!laporanDate) return false;
          const normalizedDate = new Date(laporanDate)
            .toISOString()
            .split("T")[0];
          const normalizedToday = new Date(today).toISOString().split("T")[0];
          return normalizedDate === normalizedToday;
        });

        const filteredLaporanProduk = laporanProdukData.filter(
          (laporan: any) => {
            const laporanDate = laporan.tanggalLaporan || laporan.createdAt;
            if (!laporanDate) return false;
            const normalizedDate = new Date(laporanDate)
              .toISOString()
              .split("T")[0];
            const normalizedToday = new Date(today).toISOString().split("T")[0];
            return normalizedDate === normalizedToday;
          }
        );

        console.log("🔍 DEBUG PDF DATA:", {
          date: today,
          divisionId,
          accountsCount: accountsData.length,
          entriesCount: entriesData.length,
          laporanSalesCount: laporanSalesData.length,
          filteredLaporanSalesCount: filteredLaporanSales.length,
          laporanProdukCount: laporanProdukData.length,
          filteredLaporanProdukCount: filteredLaporanProduk.length,
          sampleLaporanSales: filteredLaporanSales[0],
          sampleLaporanProduk: filteredLaporanProduk[0],
        });
      } catch (error) {
        console.error("❌ Error debugging PDF data:", error);
      }
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Laporan Penjualan Produk</CardTitle>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Entri Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Data Belum Lengkap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Akan Disimpan</span>
          </div>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-orange-600" />
            <span className="text-orange-600 font-medium">
              Klik "Tambah Baris Produk" untuk menambah entri baru
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Button
            variant={step === 1 ? "default" : "outline"}
            onClick={() => setStep(1)}
          >
            1. Perusahaan
          </Button>
          <Button
            variant={step === 2 ? "default" : "outline"}
            onClick={() => selectedPerusahaan && setStep(2)}
            disabled={!selectedPerusahaan}
          >
            2. Sales
          </Button>
          <Button
            variant={step === 3 ? "default" : "outline"}
            onClick={() => selectedSalesperson && setStep(3)}
            disabled={!selectedSalesperson}
          >
            3. Produk & Input
          </Button>
        </div>
        {step === 1 && (
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Pilih Perusahaan</label>
            <Select
              value={selectedPerusahaan?.id?.toString() || ""}
              onValueChange={(val) => {
                const perusahaan = perusahaanList.find(
                  (p) => p.id.toString() === val
                );
                setSelectedPerusahaan(perusahaan);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih perusahaan..." />
              </SelectTrigger>
              <SelectContent>
                {perusahaanList.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {step === 2 && (
          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Pilih Salesperson
            </label>
            <Select
              value={selectedSalesperson?.id?.toString() || ""}
              onValueChange={(val) => {
                const sales = salesList.find((s) => s.id.toString() === val);
                setSelectedSalesperson(sales);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih salesperson..." />
              </SelectTrigger>
              <SelectContent>
                {salesList.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <Input
                value={newSalespersonName}
                onChange={(e) => setNewSalespersonName(e.target.value)}
                placeholder="Nama salesperson baru"
                disabled={!selectedPerusahaan}
              />
              <Button
                onClick={async () => {
                  if (!newSalespersonName.trim() || !selectedPerusahaan) return;
                  setAddingSales(true);
                  try {
                    const user = JSON.parse(
                      localStorage.getItem("user") || "null"
                    );
                    const divisionId = user?.division?.id
                      ? parseInt(user.division.id)
                      : undefined;
                    const newSales = await createSalesperson(
                      newSalespersonName.trim(),
                      selectedPerusahaan.id,
                      divisionId
                    );
                    const updatedSales = await getSalespeople();
                    setSalesList(updatedSales);
                    setNewSalespersonName("");
                    toastSuccess.custom("Salesperson berhasil ditambahkan!");
                  } catch (e: any) {
                    toastError.custom(
                      e.message || "Gagal menambah salesperson"
                    );
                  } finally {
                    setAddingSales(false);
                  }
                }}
                disabled={
                  !newSalespersonName.trim() ||
                  !selectedPerusahaan ||
                  addingSales
                }
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {addingSales ? "Menyimpan..." : "Tambah"}
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="mb-4 space-y-4">
            {/* Header dengan info dan tombol refresh */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Form Entri Produk Multiple
                </h3>
                <p className="text-sm text-gray-600">
                  Tambahkan beberapa produk sekaligus sebelum menyimpan
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={debugAllAccountsInDivision}
                  variant="outline"
                  size="sm"
                  className="text-purple-600"
                >
                  🔍 Debug All COA
                </Button>
                <Button
                  onClick={debugPDFData}
                  variant="outline"
                  size="sm"
                  className="text-blue-600"
                >
                  📊 Debug PDF Data
                </Button>
                <span className="text-sm text-gray-500 self-center">
                  Total: {productList.length} items
                </span>
              </div>
            </div>

            {/* Multiple Entries List */}
            {productEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="p-4 border rounded-lg bg-orange-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-orange-700">
                    Entri Produk #{index + 1}
                  </h4>
                  {productEntries.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProductEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold">
                      Pilih Produk
                    </label>
                    <Select
                      value={entry.productAccountId}
                      onValueChange={(val) =>
                        updateProductEntry(entry.id, "productAccountId", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk..." />
                      </SelectTrigger>
                      <SelectContent>
                        {productList.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">
                      Target Kuantitas
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={entry.targetKuantitas}
                      onChange={(e) =>
                        updateProductEntry(
                          entry.id,
                          "targetKuantitas",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">
                      Realisasi Kuantitas
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={entry.realisasiKuantitas}
                      onChange={(e) =>
                        updateProductEntry(
                          entry.id,
                          "realisasiKuantitas",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">
                      Keterangan Kendala (opsional)
                    </label>
                    <Input
                      value={entry.keteranganKendala}
                      onChange={(e) =>
                        updateProductEntry(
                          entry.id,
                          "keteranganKendala",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button
                variant="outline"
                onClick={addProductEntry}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Baris Produk
              </Button>
            </div>

            {/* Summary of entries to be saved */}
            {productEntries.length > 1 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                {(() => {
                  const validEntries = productEntries.filter((entry) => {
                    return (
                      entry.productAccountId &&
                      entry.targetKuantitas &&
                      entry.realisasiKuantitas &&
                      Number(entry.targetKuantitas) > 0 &&
                      Number(entry.realisasiKuantitas) > 0
                    );
                  });

                  const invalidCount =
                    productEntries.length - validEntries.length;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-orange-800">
                          📝 <strong>Ringkasan:</strong> Akan menyimpan{" "}
                          {productEntries.length} entri produk sekaligus
                        </p>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="text-green-700 bg-green-50 border-green-200"
                          >
                            ✅ {validEntries.length} Valid
                          </Badge>
                          {invalidCount > 0 && (
                            <Badge
                              variant="outline"
                              className="text-red-700 bg-red-50 border-red-200"
                            >
                              ⚠️ {invalidCount} Belum Lengkap
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Preview Entri */}
                      <div className="space-y-2">
                        {productEntries.map((entry, index) => {
                          const product = getProductById(
                            entry.productAccountId
                          );
                          const isValid = validEntries.includes(entry);

                          return (
                            <div
                              key={entry.id}
                              className={`flex items-center gap-2 text-xs p-2 rounded border ${
                                isValid
                                  ? "bg-green-50 border-green-200"
                                  : "bg-red-50 border-red-200"
                              }`}
                            >
                              <span
                                className={`font-medium ${
                                  isValid ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                #{index + 1}
                              </span>
                              <span className="text-gray-800">
                                {product
                                  ? product.accountName
                                  : "Produk belum dipilih"}
                              </span>
                              {entry.targetKuantitas && (
                                <Badge variant="outline" className="text-xs">
                                  Target: {entry.targetKuantitas}
                                </Badge>
                              )}
                              {entry.realisasiKuantitas && (
                                <Badge variant="outline" className="text-xs">
                                  Realisasi: {entry.realisasiKuantitas}
                                </Badge>
                              )}
                              {!isValid && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-red-600 bg-red-100"
                                >
                                  ⚠️ Data belum lengkap
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handlePrev}>
              Kembali
            </Button>
          )}
          {step < 3 && <Button onClick={handleNext}>Lanjut</Button>}
          {step === 3 && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  SAVE {productEntries.length} ENTRI PRODUK
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary Card Penjualan Produk */}
        <div className="mb-8">
          {(() => {
            let totalTarget = 0;
            let totalRealisasi = 0;
            let jumlahLaporan = laporanProduk.length;
            laporanProduk.forEach((row: any) => {
              totalTarget += Number(
                row.target_kuantitas || row.targetKuantitas || 0
              );
              totalRealisasi += Number(
                row.realisasi_kuantitas || row.realisasiKuantitas || 0
              );
            });
            const totalSelisih = totalTarget - totalRealisasi;
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-800">
                    Total Target Kuantitas
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-2">
                    {totalTarget.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-semibold text-green-800">
                    Total Realisasi Kuantitas
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-2">
                    {totalRealisasi.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="font-semibold text-orange-800">
                    Total Selisih
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mt-2">
                    {totalSelisih.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-semibold text-purple-800">
                    Jumlah Laporan
                  </div>
                  <div className="text-2xl font-bold text-purple-900 mt-2">
                    {jumlahLaporan}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {/* Tabel ringkasan laporan produk */}
        <div className="mt-8">
          <h3 className="font-semibold mb-2">
            Ringkasan Laporan Penjualan Produk Hari Ini
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Realisasi</TableHead>
                <TableHead>Kendala</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanProduk.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>{row.namaPerusahaan}</TableCell>
                  <TableCell>{row.namaSalesperson}</TableCell>
                  <TableCell>{row.namaAccount}</TableCell>
                  <TableCell>{row.targetKuantitas}</TableCell>
                  <TableCell>{row.realisasiKuantitas}</TableCell>
                  <TableCell>{row.keteranganKendala || "-"}</TableCell>
                  <TableCell>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
