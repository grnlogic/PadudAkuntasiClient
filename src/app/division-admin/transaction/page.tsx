"use client";

import React, { useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useTransactionData } from "./shared/hooks/useTransactionData";

// Dynamic imports for division components
const KeuanganTransaction = React.lazy(
  () => import("./divisions/keuangan/KeuanganTransaction")
);
const PemasaranTransaction = React.lazy(
  () => import("./divisions/pemasaran/PemasaranTransaction")
);
const LaporanHarianTransaction = React.lazy(
  () => import("./divisions/laporan-harian/LaporanHarianTransaction")
);
const GudangTransaction = React.lazy(
  () => import("./divisions/gudang/GudangTransaction")
);
const HrdTransaction = React.lazy(
  () => import("./divisions/hrd/HrdTransaction")
);

const LoadingComponent = ({ divisionName }: { divisionName: string }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <div className="animate-spin mx-auto mb-4 h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      <p className="text-gray-600">
        Memuat Riwayat Transaksi {divisionName}...
      </p>
    </CardContent>
  </Card>
);

const ErrorComponent = ({ error }: { error: string }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

export default function TransactionPage() {
  const [selectedDate, setSelectedDate] = useState("");

  const { user, divisionType, loading, error } = useTransactionData();

  // ✅ Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingComponent divisionName="System" />
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorComponent error={error} />
      </div>
    );
  }

  // ✅ No user or division
  if (!user || !divisionType) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            User atau divisi tidak ditemukan. Silakan login ulang.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getDivisionStyle = () => {
    switch (divisionType) {
      case "KEUANGAN":
        return {
          bg: "bg-blue-600",
          icon: DollarSign,
          color: "text-blue-600",
          label: "KEUANGAN",
        };
      case "PEMASARAN":
        return {
          bg: "bg-orange-600",
          icon: TrendingUp,
          color: "text-orange-600",
          label: "PEMASARAN",
        };
      case "PRODUKSI":
        return {
          bg: "bg-green-600",
          icon: Package,
          color: "text-green-600",
          label: "PRODUKSI",
        };
      case "PERSEDIAAN_BAHAN_BAKU":
        return {
          bg: "bg-purple-600",
          icon: Package,
          color: "text-purple-600",
          label: "PERSEDIAAN BAHAN BAKU",
        };
      case "GUDANG":
        return {
          bg: "bg-purple-600",
          icon: Warehouse,
          color: "text-purple-600",
          label: "GUDANG",
        };
      case "HRD":
        return {
          bg: "bg-indigo-600",
          icon: Users,
          color: "text-indigo-600",
          label: "HRD",
        };
      default:
        return {
          bg: "bg-gray-600",
          icon: Package,
          color: "text-gray-600",
          label: "GENERAL",
        };
    }
  };

  const divisionStyle = getDivisionStyle();
  const DivisionIcon = divisionStyle.icon;

  const renderDivisionComponent = () => {
    const commonProps = {
      selectedDate,
      onDateChange: setSelectedDate,
    };

    switch (divisionType) {
      case "KEUANGAN":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Keuangan" />}
          >
            <KeuanganTransaction {...commonProps} />
          </React.Suspense>
        );
      case "PEMASARAN":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Pemasaran" />}
          >
            <PemasaranTransaction {...commonProps} />
          </React.Suspense>
        );
      case "PRODUKSI":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Laporan Harian" />}
          >
            <LaporanHarianTransaction {...commonProps} />
          </React.Suspense>
        );
      case "PERSEDIAAN_BAHAN_BAKU":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Laporan Harian" />}
          >
            <LaporanHarianTransaction {...commonProps} />
          </React.Suspense>
        );
      case "GUDANG":
        return (
          <React.Suspense fallback={<LoadingComponent divisionName="Gudang" />}>
            <GudangTransaction {...commonProps} />
          </React.Suspense>
        );
      case "HRD":
        return (
          <React.Suspense fallback={<LoadingComponent divisionName="HRD" />}>
            <HrdTransaction {...commonProps} />
          </React.Suspense>
        );
      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Divisi "{user?.division?.name}" belum didukung. Silakan hubungi
              administrator.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${divisionStyle.bg} text-white`}>
                <DivisionIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Riwayat Transaksi {divisionStyle.label}
                </CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-sm">
                    {user.username}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-sm ${divisionStyle.color}`}
                  >
                    {user?.division?.name}
                  </Badge>
                  {selectedDate ? (
                    <Badge variant="outline" className="text-sm">
                      📅{" "}
                      {new Date(selectedDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm">
                      📅 Semua Tanggal
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Division Component */}
      {renderDivisionComponent()}
    </div>
  );
}
