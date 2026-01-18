import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  getAccountsByDivision,
  getEntriHarianByDate,
  type Account,
  type EntriHarian
} from "@/lib/data";
import { useCompanyFilter } from "./useCompanyFilter";

export interface DivisionInfo {
  id: string;
  name: string;
  type: "KEUANGAN" | "PEMASARAN" | "PRODUKSI" | "PERSEDIAAN" | "HRD" | "GENERAL";
}

export const useDivisionData = (selectedDate: string) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [existingEntries, setExistingEntries] = useState<EntriHarian[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = getCurrentUser();
  const { companyFilter, filterAccountsByCompany } = useCompanyFilter();

  // Helper functions
  const getDivisionId = () => user?.division_id || user?.division?.id;
  const getDivisionName = () => user?.division_name || user?.division?.name || "";

  const getDivisionType = (): DivisionInfo["type"] => {
    const divisionName = getDivisionName().toLowerCase();

    // ✅ FIXED: 5 Divisi sebenarnya berdasarkan analisis backup
    if (divisionName?.includes("keuangan")) return "KEUANGAN";
    if (divisionName?.includes("pemasaran") || divisionName?.includes("marketing"))
      return "PEMASARAN";
    if (divisionName?.includes("produksi") || divisionName?.includes("blending"))
      return "PRODUKSI"; // PRODUKSI + BLENDING digabung
    if (divisionName?.includes("persediaan") || divisionName?.includes("bahan baku") ||
      divisionName?.includes("gudang") || divisionName?.includes("warehouse"))
      return "PERSEDIAAN"; // PERSEDIAAN + GUDANG digabung  
    if (divisionName?.includes("hrd") || divisionName?.includes("sumber daya manusia"))
      return "HRD";

    return "GENERAL";
  };

  const getUserDivision = (): DivisionInfo | null => {
    const divisionId = getDivisionId();
    const divisionName = getDivisionName();

    if (!divisionId || !divisionName) return null;

    return {
      id: String(divisionId),
      name: divisionName,
      type: getDivisionType()
    };
  };

  const loadData = async () => {
    const divisionId = getDivisionId();
    if (!divisionId) {
      setError("Division ID not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Load accounts and entries in parallel
      const [accountsData, entriesData] = await Promise.all([
        getAccountsByDivision(divisionId.toString()),
        // ✅ FIXED: Fetch all entries for the date (pass null) so we can filter client-side
        // This ensures shared accounts (perusahaan_id = null) are not hidden by strict backend filtering
        getEntriHarianByDate(selectedDate, null)
      ]);

      // Filter accounts by company
      const filteredAccounts = filterAccountsByCompany(accountsData);

      console.log("📊 useDivisionData loaded:", {
        selectedDate,
        divisionId,
        totalAccounts: accountsData.length,
        filteredAccounts: filteredAccounts.length,
        totalEntries: entriesData.length,
        companyFilter
      });

      setAccounts(filteredAccounts);
      setExistingEntries(entriesData);



    } catch (err) {
      console.error("Error loading division data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load data when selectedDate changes
  useEffect(() => {
    if (selectedDate && getDivisionId()) {
      loadData();
    }
  }, [selectedDate]);

  return {
    // User & Division Info
    user,
    divisionInfo: getUserDivision(),
    companyFilter,

    // Data
    accounts,
    existingEntries,
    loading,
    error,

    // Actions
    refetchData: loadData,
    filterAccountsByCompany
  };
};