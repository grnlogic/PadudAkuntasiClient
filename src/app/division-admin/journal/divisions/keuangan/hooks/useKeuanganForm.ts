"use client";

import { useState } from "react";
import { KeuanganFormData, validateKeuanganForm } from "../utils/formHelpers";
import { Account } from "@/lib/data";

interface UseKeuanganFormProps {
  accounts: Account[];
  onSubmit: (data: KeuanganFormData) => Promise<void>;
  initialData?: Partial<KeuanganFormData>;
}

export function useKeuanganForm({ accounts, onSubmit, initialData }: UseKeuanganFormProps) {
  const [formData, setFormData] = useState<KeuanganFormData>({
    accountId: initialData?.accountId || "",
    transactionType: initialData?.transactionType || "PENERIMAAN",
    nilai: initialData?.nilai || 0,
    saldoAkhir: initialData?.saldoAkhir,
    keterangan: initialData?.keterangan || "",
    tanggal: initialData?.tanggal || new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof KeuanganFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateKeuanganForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        accountId: "",
        transactionType: "PENERIMAAN",
        nilai: 0,
        keterangan: "",
        tanggal: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors(["Terjadi kesalahan saat menyimpan data"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: "",
      transactionType: "PENERIMAAN",
      nilai: 0,
      keterangan: "",
      tanggal: new Date().toISOString().split("T")[0],
    });
    setErrors([]);
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
  };
}