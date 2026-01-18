"use client";

import React from "react";
import { TRANSACTION_TYPES } from "../utils/formHelpers";
import { useUtangForm } from "../hooks/useUtangForm";

interface UtangFormComponentProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export default function UtangFormComponent({
  onSubmit,
  onCancel,
}: UtangFormComponentProps) {
  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
  } = useUtangForm({ onSubmit });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tambah Transaksi Utang
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
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipe Transaksi
          </label>
          <select
            value={formData.tipeTransaksi}
            onChange={(e) => updateField("tipeTransaksi", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {TRANSACTION_TYPES.UTANG.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nominal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nominal
          </label>
          <input
            type="number"
            value={formData.nominal}
            onChange={(e) => updateField("nominal", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
            step="1000"
          />
        </div>

        {/* Tanggal Transaksi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Transaksi
          </label>
          <input
            type="date"
            value={formData.tanggalTransaksi}
            onChange={(e) => updateField("tanggalTransaksi", e.target.value)}
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
