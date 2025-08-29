# Dashboard Reports per Divisi

## Struktur File

```
src/app/division-admin/reports/
├── page.tsx                     # Main router untuk reports
├── components/
│   ├── KeuanganReports.tsx      # Dashboard Keuangan
│   ├── PemasaranReports.tsx     # Dashboard Pemasaran & Penjualan
│   ├── ProduksiReports.tsx      # Dashboard Produksi
│   ├── BlendingReports.tsx      # Dashboard Blending & Persediaan
│   ├── HRDReports.tsx           # Dashboard HRD & Absensi
│   └── GudangReports.tsx        # Dashboard Gudang & Warehouse
```

## Fitur per Divisi

### 🟢 KeuanganReports.tsx

**Target Divisi:** DIVISI KEUANGAN

- **Summary Cards:** Total Penerimaan, Pengeluaran, Saldo Kas Bersih, Saldo Akhir
- **Ringkasan Piutang:** Piutang baru, tertagih, macet
- **Ringkasan Utang:** Utang baru, dibayar, saldo utang
- **Transaksi Terbaru:** 5 transaksi terakhir dengan badge status
- **Aksi Cepat:** Buat entri baru, laporan bulanan, export data

### 🔵 PemasaranReports.tsx

**Target Divisi:** DIVISI PEMASARAN & PENJUALAN

- **Summary Cards:** Total Target, Realisasi, Pencapaian %, Total Retur
- **Top Performer:** Produk terlaris dan sales terbaik
- **Ringkasan Tim:** Jumlah sales, laporan hari ini, progress bar pencapaian
- **Performa Produk:** Tabel detail target vs realisasi per produk
- **Aksi Cepat:** Input penjualan, kelola sales, ranking sales, export laporan

### 🟠 ProduksiReports.tsx

**Target Divisi:** DIVISI PRODUKSI

- **Summary Cards:** Hasil Produksi, Barang Gagal, Efisiensi %, Stock Barang Jadi
- **Status Produksi:** Progress bar efisiensi dengan color coding
- **Target & Rekomendasi:** Saran peningkatan performa
- **Detail Produksi:** Tabel per produk dengan tingkat efisiensi
- **Aksi Cepat:** Input produksi, maintenance, analisis trend, export laporan

### 🟣 BlendingReports.tsx

**Target Divisi:** BLENDING PERSEDIAAN BAHAN BAKU / DIVISI BLENDING PERSEDIAAN BAHAN BAKU

- **Summary Cards:** Stok Awal, Pemakaian, Stok Akhir, Efficiency Rate
- **Metrics Gudang:** Utilisasi gudang, akurasi stok, net flow
- **Stock Alerts:** Warning untuk low stock, overstock, no movement
- **Detail Inventory:** Tabel lengkap dengan status dan turnover ratio
- **Aksi Cepat:** Input inventory, stock alert, analisis trend, export laporan

### 🟡 HRDReports.tsx

**Target Divisi:** DIVISI HRD / DIVISI SUMBER DAYA MANUSIA

- **Summary Cards:** Total Karyawan, Hadir, Tidak Hadir, Tingkat Kehadiran %
- **Breakdown Kehadiran:** Sakit, izin, lembur dengan progress bar
- **Insights & Rekomendasi:** Status performa dan saran perbaikan
- **Detail Kehadiran:** Tabel per karyawan dengan status dan shift
- **Aksi Cepat:** Input absensi, evaluasi kinerja, alert absen, export laporan

### 🔵 GudangReports.tsx

**Target Divisi:** DIVISI GUDANG / DIVISI WAREHOUSE

- **Summary Cards:** Stok Masuk, Keluar, Stok Saat Ini, Items Dikelola
- **Metrics Gudang:** Utilisasi gudang, akurasi stok, net flow
- **Stock Alerts:** Multi-level alerts (error, warning, info)
- **Pergerakan Stok:** Tabel dengan turnover dan status per item
- **Aksi Cepat:** Input stok, cari item, shipping, export laporan

## Teknologi yang Digunakan

- **React 18** dengan Hooks (useState, useEffect)
- **TypeScript** untuk type safety
- **Tailwind CSS** untuk styling
- **Lucide React** untuk icons
- **Shadcn/ui** untuk komponen UI
- **Next.js** lazy loading untuk performa optimal

## Fitur Umum Semua Dashboard

### 📊 Real-time Data

- Data refresh otomatis berdasarkan tanggal yang dipilih
- Filter data harian dengan date picker
- Loading states dengan skeleton animation

### 🎨 Responsive Design

- Grid layout yang adaptif (1 kolom mobile, 2-4 kolom desktop)
- Card-based interface untuk readability
- Color-coded status dan progress bars

### 📈 Interactive Elements

- Badge sistem untuk status (success, warning, error)
- Progress bars dengan threshold colors
- Hover effects dan transitions

### ⚡ Performance Optimization

- Lazy loading komponen dengan React.lazy()
- Suspense untuk smooth loading experience
- Efficient re-renders dengan proper state management

## Data Integration

### API Endpoints yang Digunakan

- `getEntriHarianByDate()` - Data transaksi harian
- `getLaporanPenjualanProduk()` - Data penjualan produk
- `getLaporanProduksi()` - Data produksi harian
- `getLaporanGudang()` - Data inventory gudang
- `getSalespeople()` - Data sales team
- `getUtangTransaksi()` - Data utang

### Data Processing

- Filter berdasarkan tanggal yang dipilih
- Aggregation untuk summary calculations
- Group by logic untuk organisasi data
- Error handling untuk missing data

## Color Schemes per Divisi

- **Keuangan:** Green theme (money/finance)
- **Pemasaran:** Blue theme (marketing/sales)
- **Produksi:** Orange theme (manufacturing)
- **Blending:** Purple theme (warehouse/inventory)
- **HRD:** Green theme (people/attendance)
- **Gudang:** Indigo theme (storage/logistics)

## Future Enhancements

1. **Chart Integration** - Add Chart.js atau Recharts untuk visualisasi data
2. **Export Functionality** - Implementasi PDF dan Excel export
3. **Real-time Updates** - WebSocket integration untuk live data
4. **Advanced Filtering** - Date range, kategori, dan custom filters
5. **Mobile Optimization** - PWA features untuk mobile usage
6. **Notification System** - Push notifications untuk alerts penting

## Usage

Sistem secara otomatis mendeteksi divisi user yang login dan menampilkan dashboard yang sesuai. Setiap dashboard memiliki:

1. **Header** dengan nama divisi dan kontrol tanggal
2. **Summary Cards** dengan metrics utama
3. **Detail Sections** dengan data breakdown
4. **Action Buttons** untuk operasi cepat
5. **Data Tables** dengan informasi lengkap

Untuk divisi yang belum memiliki dashboard khusus, sistem akan menampilkan pesan "Dalam Pengembangan" dengan opsi kembali ke Jurnal Harian.
