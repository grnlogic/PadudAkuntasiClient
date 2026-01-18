/**
 * Utility functions untuk divisi pemasaran
 * Dikumpulkan dari backup file untuk konsistensi
 */

// ✅ Helper function untuk filter data berdasarkan tanggal hari ini
export const filterDataForToday = (data: any[]) => {
  const today = new Date().toISOString().split("T")[0];
  return data.filter((laporan: any) => {
    // Gunakan field tanggal_laporan dari API response
    const laporanDate = laporan.tanggal_laporan || laporan.tanggalLaporan || laporan.createdAt;
    if (!laporanDate) return false;

    // Jika sudah dalam format YYYY-MM-DD, langsung bandingkan
    if (typeof laporanDate === 'string' && laporanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return laporanDate === today;
    }

    // Jika perlu normalisasi tanggal
    const normalizedDate = new Date(laporanDate).toISOString().split("T")[0];
    return normalizedDate === today;
  });
};

// ✅ Helper function untuk filter data berdasarkan tanggal tertentu
export const filterDataByDate = (data: any[], targetDate: string) => {
  return data.filter((laporan: any) => {
    const laporanDate = laporan.tanggalLaporan || laporan.createdAt;
    if (!laporanDate) return false;

    // Normalisasi tanggal ke format YYYY-MM-DD
    const normalizedDate = new Date(laporanDate).toISOString().split("T")[0];
    const normalizedTargetDate = new Date(targetDate).toISOString().split("T")[0];

    return normalizedDate === normalizedTargetDate;
  });
};

// ✅ Helper function untuk format currency
export const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);
};

// ✅ Helper function untuk membuat enhanced accounts dari data laporan produk
export const createEnhancedAccountsFromProduk = (laporanProdukData: any[]) => {
  return laporanProdukData.map((item, index) => ({
    id: item.accountId || index + 1,
    accountId: item.accountId || index + 1,
    accountName: item.productName || `Produk ${index + 1}`,
    accountCode: item.productCode || item.productName?.substring(0, 10) || `P${String(index + 1).padStart(3, '0')}`,
    accountType: "REVENUE",
    balance: item.totalRevenue || 0,
  }));
};

// ✅ Helper function untuk menghitung total revenue dari laporan produk
export const calculateTotalRevenue = (laporanProdukData: any[]) => {
  return laporanProdukData.reduce((total, item) => {
    return total + (item.totalRevenue || 0);
  }, 0);
};

// ✅ Helper function untuk menghitung total target dari laporan sales
export const calculateTotalTarget = (laporanSalesData: any[]) => {
  return laporanSalesData.reduce((total, item) => {
    return total + (item.targetPenjualan || 0);
  }, 0);
};

// ✅ Helper function untuk menghitung total realisasi dari laporan sales
export const calculateTotalRealisasi = (laporanSalesData: any[]) => {
  return laporanSalesData.reduce((total, item) => {
    return total + (item.realisasiPenjualan || 0);
  }, 0);
};

// ✅ Helper function untuk mendapatkan summary statistik
export const getPemasaranSummary = (laporanProdukData: any[], laporanSalesData: any[]) => {
  const totalRevenue = calculateTotalRevenue(laporanProdukData);
  const totalTarget = calculateTotalTarget(laporanSalesData);
  const totalRealisasi = calculateTotalRealisasi(laporanSalesData);
  const achievementPercentage = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

  return {
    totalRevenue,
    totalTarget,
    totalRealisasi,
    achievementPercentage: Math.round(achievementPercentage * 100) / 100,
    totalProdukEntries: laporanProdukData.length,
    totalSalesEntries: laporanSalesData.length,
  };
};

// ✅ Helper function untuk validasi data laporan
export const validateLaporanData = (data: any) => {
  const errors: string[] = [];

  if (!data.tanggalLaporan) {
    errors.push("Tanggal laporan harus diisi");
  }

  if (data.productName && !data.productName.trim()) {
    errors.push("Nama produk tidak boleh kosong");
  }

  if (data.kuantitas !== undefined && data.kuantitas < 0) {
    errors.push("Kuantitas tidak boleh negatif");
  }

  if (data.hargaUnit !== undefined && data.hargaUnit < 0) {
    errors.push("Harga unit tidak boleh negatif");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ✅ Helper function untuk debug logging yang konsisten
export const debugLog = (context: string, data: any) => {

};