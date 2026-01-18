import { useMemo } from "react";
import { Account } from "@/lib/data";

interface User {
  username?: string;
  division_id?: string | number;
  division_name?: string;
  perusahaan_id?: number; // ✅ NEW: Company ID from backend
  division?: {
    id: string | number;
    name: string;
  };
}

/**
 * ✅ UPDATED: Hook untuk filtering COA berdasarkan perusahaan_id
 * Menggunakan relational database approach (proper foreign key)
 */
export function useCompanyFilter(user: User | null, accounts: Account[]) {
  return useMemo(() => {
    console.log("🔄 [MEMO] Recalculating filtered accounts...", {
      totalAccounts: accounts.length,
      sampleAccount: accounts[0],
    });

    // ✅ NEW: Filter by perusahaan_id (proper relational approach)
    const perusahaanId = user?.perusahaan_id;
    
    const filtered = perusahaanId
      ? accounts.filter((acc) => {
          const accPerusahaanId = acc.perusahaan_id || acc.perusahaanId;
          return accPerusahaanId === perusahaanId;
        })
      : accounts; // SUPER_ADMIN sees all

    // ✅ IMPROVED: Filter berdasarkan kode akun + nama
    const kas = filtered.filter((acc) => {
      const code = acc.accountCode || "";
      const name = acc.accountName?.toLowerCase() || "";
      return code.match(/^1-[13579]\d+$/) || name.includes("kas");
    });

    const piutang = filtered.filter((acc) => {
      const code = acc.accountCode || "";
      const name = acc.accountName?.toLowerCase() || "";
      return code.match(/^1-[2468]\d+$/) || name.includes("piutang");
    });

    const utang = filtered.filter((acc) => {
      const code = acc.accountCode || "";
      const name = acc.accountName?.toLowerCase() || "";
      return (
        code.match(/^2-[12345]\d+$/) ||
        (name.includes("utang") && !name.includes("piutang"))
      );
    });

    console.log("🔍 [JOURNAL] COA FILTERING DEBUG:", {
      divisionName: user?.division_name || user?.division?.name,
      username: user?.username,
      perusahaanId: perusahaanId,
      totalAccounts: accounts.length,
      filteredAccounts: filtered.length,
      kasAccounts: kas.length,
      piutangAccounts: piutang.length,
      utangAccounts: utang.length,
      sampleKasAccounts: kas.slice(0, 3).map((acc) => ({
        code: acc.accountCode,
        name: acc.accountName,
      })),
    });

    return {
      filteredAccounts: filtered,
      kasAccounts: kas,
      piutangAccounts: piutang,
      utangAccounts: utang,
      companyInfo: {
        username: user?.username || "",
        perusahaanId: perusahaanId || null,
        totalFiltered: filtered.length,
      }
    };
  }, [accounts, user?.username, user?.perusahaan_id]);
}

// ✅ NEW: Get company name by perusahaan_id
const COMPANY_NAMES: Record<number, string> = {
  1: "PT Padud Jaya Putera",
  2: "PT Sunarya Putera",
  3: "PT Prima",
  4: "Divisi Blending",
  5: "Holding Company"
};

/**
 * ✅ UPDATED: Get company name berdasarkan perusahaan_id
 */
export function getCompanyName(perusahaanId?: number): string {
  if (!perusahaanId) return "Unknown";
  return COMPANY_NAMES[perusahaanId] || "Unknown Company";
}