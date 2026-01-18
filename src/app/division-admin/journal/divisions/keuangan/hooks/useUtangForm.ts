"use client";

import { useState } from "react";
import { UtangFormData, validateUtangForm } from "../utils/formHelpers";

interface UseUtangFormProps {
  onSubmit: (data: UtangFormData) => Promise<void>;
  initialData?: Partial<UtangFormData>;
}

export function useUtangForm({ onSubmit, initialData }: UseUtangFormProps) {
  const [formData, setFormData] = useState<UtangFormData>({
    tipeTransaksi: initialData?.tipeTransaksi || "UTANG_BARU",
    nominal: initialData?.nominal || 0,
    keterangan: initialData?.keterangan || "",
    tanggalTransaksi: initialData?.tanggalTransaksi || new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof UtangFormData, value: any) => {
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
    
    const validationErrors = validateUtangForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        tipeTransaksi: "UTANG_BARU",
        nominal: 0,
        keterangan: "",
        tanggalTransaksi: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error submitting utang form:", error);
      setErrors(["Terjadi kesalahan saat menyimpan data utang"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipeTransaksi: "UTANG_BARU",
      nominal: 0,
      keterangan: "",
      tanggalTransaksi: new Date().toISOString().split("T")[0],
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