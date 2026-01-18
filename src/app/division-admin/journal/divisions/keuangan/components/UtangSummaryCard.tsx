"use client";

import React from "react";
import { formatCurrency } from "../utils/formHelpers";

interface UtangSummaryCardProps {
  title: string;
  summary: {
    baru: number;
    dibayar: number;
    saldoAkhir: number;
  };
  isLoading?: boolean;
}

export default function UtangSummaryCard({
  title,
  summary,
  isLoading = false,
}: UtangSummaryCardProps) {
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
        {/* Utang Baru */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-500">Utang Baru</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.baru)}
          </span>
        </div>

        {/* Utang Dibayar */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-500">
            Utang Dibayar
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.dibayar)}
          </span>
        </div>

        {/* Saldo Akhir Utang */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-500">
            Saldo Akhir Utang
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.saldoAkhir)}
          </span>
        </div>

      </div>
    </div>
  );
}
