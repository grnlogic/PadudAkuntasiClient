import { useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";

// ✅ NEW: Proper company mapping based on perusahaan_id
const COMPANY_NAMES: Record<number, string> = {
  1: "PJP",
  2: "SP",
  3: "PRIMA",
  4: "BLENDING",
  5: "HOLDING"
};

export interface CompanyFilter {
  companyName: "PJP" | "SP" | "PRIMA" | "BLENDING" | "HOLDING" | "ALL";
  perusahaanId: number | null; // ✅ NEW: Use perusahaan_id instead of prefixes
}

export const useCompanyFilter = () => {
  const user = getCurrentUser();

  const companyFilter = useMemo((): CompanyFilter => {
    // ✅ NEW: Get perusahaan_id directly from user data (from backend)
    const perusahaanId = user?.perusahaan_id;

    if (!perusahaanId || user?.role === "SUPER_ADMIN") {
      return {
        companyName: "ALL",
        perusahaanId: null // null = no filtering (SUPER_ADMIN sees all)
      };
    }

    const companyName = COMPANY_NAMES[perusahaanId] as CompanyFilter["companyName"] || "ALL";

    console.log("🏢 Company Filter Initialized:", {
      userId: user.id,
      username: user.username,
      perusahaanId,
      companyName
    });

    return {
      companyName,
      perusahaanId
    };
  }, [user?.perusahaan_id, user?.role]);

  // ✅ NEW: Filter based on perusahaan_id (proper relational approach)
  const filterAccountsByCompany = (accounts: any[]) => {
    // No filtering for SUPER_ADMIN
    if (companyFilter.perusahaanId === null) {
      console.log("🔓 No company filter - SUPER_ADMIN mode");
      return accounts;
    }

    const filtered = accounts.filter((account) => {
      const accountPerusahaanId = account.perusahaan_id || account.perusahaanId;
      // ✅ FIXED: Allow accounts with specific perusahaan_id OR shared accounts (null)
      return accountPerusahaanId === companyFilter.perusahaanId || accountPerusahaanId == null;
    });

    console.log("🏢 Filtered by perusahaan_id:", {
      perusahaanId: companyFilter.perusahaanId,
      companyName: companyFilter.companyName,
      totalAccounts: accounts.length,
      filteredAccounts: filtered.length
    });

    return filtered;
  };

  return {
    companyFilter,
    filterAccountsByCompany
  };
};