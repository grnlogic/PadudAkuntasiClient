"use client";

import React from "react";
import { TRANSACTION_TYPES } from "../utils/formHelpers";
import { useKeuanganForm } from "../hooks/useKeuanganForm";
import { Account } from "@/lib/data";

interface KeuanganFormComponentProps {
  accounts: Account[];
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export default function KeuanganFormComponent({
  accounts,
  onSubmit,
  onCancel,
}: KeuanganFormComponentProps) {
  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
  } = useKeuanganForm({ accounts, onSubmit });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tambah Transaksi Keuangan
      </h3>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            value={formData.accountId}
            onChange={(e) => updateField("accountId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Pilih Account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountCode} - {account.accountName}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipe Transaksi
          </label>
          <select
            value={formData.transactionType}
            onChange={(e) => updateField("transactionType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {TRANSACTION_TYPES.KEUANGAN.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nilai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nilai
          </label>
          <input
            type="number"
            value={formData.nilai}
            onChange={(e) => updateField("nilai", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
            step="1000"
          />
        </div>

        {/* Saldo Akhir - only show for SALDO_AKHIR type */}
        {formData.transactionType === "SALDO_AKHIR" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Akhir
            </label>
            <input
              type="number"
              value={formData.saldoAkhir || ""}
              onChange={(e) =>
                updateField("saldoAkhir", Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              min="0"
              step="1000"
            />
          </div>
        )}

        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={formData.tanggal}
            onChange={(e) => updateField("tanggal", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Keterangan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keterangan
          </label>
          <textarea
            value={formData.keterangan}
            onChange={(e) => updateField("keterangan", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Masukkan keterangan (opsional)"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Batal
            </button>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
