"use client";

import { useState } from "react";
import { PiutangFormData, validatePiutangForm } from "../utils/formHelpers";

interface UsePiutangFormProps {
  onSubmit: (data: PiutangFormData) => Promise<void>;
  initialData?: Partial<PiutangFormData>;
}

export function usePiutangForm({ onSubmit, initialData }: UsePiutangFormProps) {
  const [formData, setFormData] = useState<PiutangFormData>({
    tipeTransaksi: initialData?.tipeTransaksi || "PIUTANG_BARU",
    nominal: initialData?.nominal || 0,
    keterangan: initialData?.keterangan || "",
    tanggalTransaksi: initialData?.tanggalTransaksi || new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof PiutangFormData, value: any) => {
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
    
    const validationErrors = validatePiutangForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        tipeTransaksi: "PIUTANG_BARU",
        nominal: 0,
        keterangan: "",
        tanggalTransaksi: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error submitting piutang form:", error);
      setErrors(["Terjadi kesalahan saat menyimpan data piutang"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipeTransaksi: "PIUTANG_BARU",
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