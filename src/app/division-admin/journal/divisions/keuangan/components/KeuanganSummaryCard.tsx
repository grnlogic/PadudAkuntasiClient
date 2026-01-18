"use client";

import React from "react";
import { formatCurrency } from "../utils/formHelpers";

interface KeuanganSummaryCardProps {
  title: string;
  summary: {
    totalPenerimaan: number;
    totalPengeluaran: number;
    totalSaldoAkhir: number;
  };
  isLoading?: boolean;
}

export default function KeuanganSummaryCard({
  title,
  summary,
  isLoading = false,
}: KeuanganSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
        {title}
      </h3>

      <div className="space-y-1">
        {/* Penerimaan */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-500">
            Total Penerimaan
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.totalPenerimaan)}
          </span>
        </div>

        {/* Pengeluaran */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-500">
            Total Pengeluaran
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.totalPengeluaran)}
          </span>
        </div>

        {/* Saldo Akhir */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-500">
            Total Saldo Akhir
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.totalSaldoAkhir)}
          </span>
        </div>

      </div>
    </div>
  );
}
