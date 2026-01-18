"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  getAccountsByDivision,
  getEntriHarian,
  getPiutangTransaksi,
  getUtangTransaksi,
  getLaporanPenjualanSales,
  getLaporanPenjualanProduk,
  getLaporanProduksi,
  getLaporanGudang,
  type Account,
  type EntriHarian,
} from "@/lib/data";

export type DivisionType =
  | "KEUANGAN"
  | "PRODUKSI"
  | "PEMASARAN"
  | "GUDANG"
  | "PERSEDIAAN_BAHAN_BAKU"
  | "HRD"
  | "GENERAL";

export interface UseTransactionDataReturn {
  user: any;
  divisionType: DivisionType;
  accounts: Account[];
  entries: EntriHarian[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransactionData(): UseTransactionDataReturn {
  const [user, setUser] = useState<any>(null);
  const [divisionType, setDivisionType] = useState<DivisionType>("GENERAL");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<EntriHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDivisionType = (divisionName: string | undefined): DivisionType => {
    if (!divisionName) return "GENERAL";
    const name = divisionName.toLowerCase();
    
    if (name.includes("keuangan")) return "KEUANGAN";
    if (name.includes("produksi")) return "PRODUKSI";
    if (name.includes("pemasaran") || name.includes("marketing")) return "PEMASARAN";
    if (name.includes("gudang") || name.includes("warehouse")) return "GUDANG";
    if (name.includes("hrd") || name.includes("sumber daya manusia")) return "HRD";
    if (name.includes("blending") || name.includes("persediaan")) return "PERSEDIAAN_BAHAN_BAKU";
    
    return "GENERAL";
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.division?.id) {
        setError("User atau divisi tidak ditemukan");
        return;
      }

      setUser(currentUser);
      const divType = getDivisionType(currentUser.division?.name);
      setDivisionType(divType);

      // Load accounts
      const accountsData = await getAccountsByDivision(currentUser.division.id);
      setAccounts(accountsData);

      console.log("🔍 [useTransactionData] Accounts loaded:", {
        divisionId: currentUser.division.id,
        accountCount: accountsData.length,
        accountIds: accountsData.map(a => a.id),
        sampleAccounts: accountsData.slice(0, 3)
      });

      // Load base entries
      const allEntries = await getEntriHarian();
      
      console.log("🔍 [useTransactionData] All entries loaded:", {
        total: allEntries.length,
        sample: allEntries.slice(0, 3),
        transactionTypes: [...new Set(allEntries.map((e: any) => e.transactionType))],
        accountIds: [...new Set(allEntries.map(e => e.accountId))].slice(0, 10)
      });
      
      // Filter by division accounts AND current user
      let divisionEntries = allEntries.filter((entry) => {
        const isUserData = entry.createdBy === currentUser.username || 
                          (entry as any).username === currentUser.username;
        const isDivisionAccount = accountsData.map((acc) => acc.id).includes(entry.accountId);
        return isUserData && isDivisionAccount;
      });

      console.log("🔍 [useTransactionData] Division entries filtered by user:", {
        currentUser: currentUser.username,
        total: divisionEntries.length,
        sample: divisionEntries.slice(0, 3)
      });

      let combinedEntries: EntriHarian[] = divisionEntries;

      // Load division-specific data
      switch (divType) {
        case "KEUANGAN":
          const piutangEntries = await getPiutangTransaksi();
          const utangEntries = await getUtangTransaksi();

          const mappedPiutang =
            piutangEntries
              ?.filter((p: any) => 
                p.user?.username === currentUser.username || 
                p.username === currentUser.username
              )
              .map((p: any) => ({
              id: p.id,
              tanggal: p.tanggal_transaksi || p.tanggalTransaksi || "",
              accountId:
                p.account?.id?.toString() || p.accountId?.toString() || "PIUTANG",
              nilai: p.nominal,
              description: p.keterangan,
              transactionType: p.tipe_transaksi || p.tipeTransaksi || "",
              createdAt:
                p.created_at ||
                p.createdAt ||
                p.tanggal_transaksi ||
                p.tanggalTransaksi ||
                "",
              keterangan: p.keterangan,
              date: p.tanggal_transaksi || p.tanggalTransaksi || "",
              createdBy: p.user?.username || p.username || "system",
            })) || [];

          const mappedUtang =
            utangEntries
              ?.filter((u: any) => 
                u.user?.username === currentUser.username || 
                u.username === currentUser.username
              )
              .map((u: any) => ({
              id: u.id,
              tanggal: u.tanggal_transaksi || u.tanggalTransaksi || "",
              accountId:
                u.account?.id?.toString() || u.accountId?.toString() || "UTANG",
              nilai: u.nominal,
              description: u.keterangan,
              transactionType: u.tipe_transaksi || u.tipeTransaksi || "",
              kategori: u.kategori || "",
              createdAt:
                u.created_at ||
                u.createdAt ||
                u.tanggal_transaksi ||
                u.tanggalTransaksi ||
                "",
              keterangan: u.keterangan,
              date: u.tanggal_transaksi || u.tanggalTransaksi || "",
              createdBy: u.user?.username || u.username || "system",
            })) || [];

          combinedEntries = [...divisionEntries, ...mappedPiutang, ...mappedUtang];
          
          console.log("🔍 [useTransactionData] KEUANGAN data (filtered by user):", {
            currentUser: currentUser.username,
            divisionEntries: divisionEntries.length,
            mappedPiutang: mappedPiutang.length,
            mappedUtang: mappedUtang.length,
            total: combinedEntries.length,
            sampleDivisionEntry: divisionEntries[0],
            samplePiutang: mappedPiutang[0],
            sampleUtang: mappedUtang[0]
          });
          break;

        case "PEMASARAN":
          const laporanSalesEntries = await getLaporanPenjualanSales();
          const laporanProdukEntries = await getLaporanPenjualanProduk();

          const mappedSales =
            laporanSalesEntries?.map((laporan: any) => ({
              id: `sales-${laporan.id}`,
              accountId: "SALES",
              tanggal: laporan.tanggalLaporan || laporan.createdAt || "",
              date: laporan.tanggalLaporan || laporan.createdAt || "",
              nilai: Number(laporan.realisasiAmount || laporan.realisasiPenjualan || 0),
              description: `Sales: ${laporan.salesperson?.username || "Unknown"} - Target: ${
                laporan.targetAmount || laporan.targetPenjualan || 0
              }`,
              keterangan: laporan.keteranganKendala || "",
              createdBy: laporan.createdBy?.username || "system",
              createdAt: laporan.createdAt || new Date().toISOString(),
              targetAmount: Number(laporan.targetAmount || laporan.targetPenjualan || 0),
              realisasiAmount: Number(laporan.realisasiAmount || laporan.realisasiPenjualan || 0),
              returPenjualan: Number(laporan.returPenjualan || 0),
              salesUserId: laporan.salesperson?.id,
              keteranganKendala: laporan.keteranganKendala,
            })) || [];

          const mappedProduk =
            laporanProdukEntries?.map((laporan: any) => ({
              id: `produk-${laporan.id}`,
              accountId: laporan.productAccountId?.toString() || "PRODUK",
              tanggal: laporan.tanggalLaporan || laporan.createdAt || "",
              date: laporan.tanggalLaporan || laporan.createdAt || "",
              nilai: Number(laporan.realisasiKuantitas || 0),
              description: `Produk: ${laporan.namaAccount || "Unknown"} (${
                laporan.namaSalesperson
              })`,
              keterangan: laporan.keteranganKendala || "",
              createdBy: laporan.createdByUsername || "system",
              createdAt: laporan.createdAt || new Date().toISOString(),
              targetAmount: Number(laporan.targetKuantitas || 0),
              realisasiAmount: Number(laporan.realisasiKuantitas || 0),
              namaSalesperson: laporan.namaSalesperson,
              namaAccount: laporan.namaAccount,
            })) || [];

          combinedEntries = [...divisionEntries, ...mappedSales, ...mappedProduk];
          break;

        case "PRODUKSI":
          const laporanProduksiEntries = await getLaporanProduksi();

          const mappedProduksi =
            laporanProduksiEntries?.map((laporan: any) => ({
              id: `produksi-${laporan.id}`,
              accountId: laporan.account?.id?.toString() || "PRODUKSI",
              tanggal: laporan.tanggalLaporan || laporan.tanggal_laporan || laporan.createdAt || "",
              date: laporan.tanggalLaporan || laporan.tanggal_laporan || laporan.createdAt || "",
              nilai: Number(laporan.hasilProduksi || laporan.hasil_produksi || 0),
              description: `Produksi: ${laporan.account?.accountName || "Unknown"} - Hasil: ${
                laporan.hasilProduksi || laporan.hasil_produksi || 0
              }`,
              keterangan: laporan.keteranganKendala || laporan.keterangan_kendala || "",
              createdBy: laporan.createdBy?.username || laporan.created_by?.username || "system",
              createdAt: laporan.createdAt || laporan.created_at || new Date().toISOString(),
              hasilProduksi: Number(laporan.hasilProduksi || laporan.hasil_produksi || 0),
              barangGagal: Number(laporan.barangGagal || laporan.barang_gagal || 0),
              stockBarangJadi: Number(laporan.stockBarangJadi || laporan.stock_barang_jadi || 0),
              hppAmount: Number(laporan.hpBarangJadi || laporan.hp_barang_jadi || 0),
            })) || [];

          combinedEntries = [...divisionEntries, ...mappedProduksi];
          break;

        case "PERSEDIAAN_BAHAN_BAKU":
        case "GUDANG":
          const laporanGudangEntries = await getLaporanGudang();

          const mappedGudang =
            laporanGudangEntries?.map((laporan: any) => ({
              id: `gudang-${laporan.id}`,
              accountId: laporan.account?.id?.toString() || "GUDANG",
              tanggal: laporan.tanggalLaporan || laporan.tanggal_laporan || laporan.createdAt || "",
              date: laporan.tanggalLaporan || laporan.tanggal_laporan || laporan.createdAt || "",
              nilai: Number(laporan.stokAkhir || laporan.stok_akhir || 0),
              description: `Gudang: ${laporan.account?.accountName || "Unknown"} - Stok Akhir: ${
                laporan.stokAkhir || laporan.stok_akhir || 0
              }`,
              keterangan: laporan.keterangan || laporan.kondisi_gudang || "",
              createdBy: laporan.createdBy?.username || laporan.created_by?.username || "system",
              createdAt: laporan.createdAt || laporan.created_at || new Date().toISOString(),
              barangMasuk: Number(
                laporan.barangMasuk ||
                  laporan.barang_masuk ||
                  laporan.stokAwal ||
                  laporan.stok_awal ||
                  0
              ),
              pemakaianAmount: Number(laporan.pemakaian || 0),
              stokAkhir: Number(laporan.stokAkhir || laporan.stok_akhir || 0),
            })) || [];

          combinedEntries = [...divisionEntries, ...mappedGudang];
          break;
      }

      setEntries(combinedEntries);
    } catch (err: any) {
      console.error("Error loading transaction data:", err);
      setError(err.message || "Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    user,
    divisionType,
    accounts,
    entries,
    loading,
    error,
    refetch: loadData,
  };
}
