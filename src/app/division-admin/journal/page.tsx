"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDivisionData } from "./shared/hooks/useDivisionData";
import { DateSelector } from "./shared/components/DateSelector";

// Dynamic imports for division components
const KeuanganJournal = React.lazy(
  () => import("./divisions/keuangan/KeuanganJournal")
);
const PemasaranJournal = React.lazy(
  () => import("./divisions/pemasaran/PemasaranJournal")
);
const ProduksiJournal = React.lazy(
  () => import("./divisions/produksi/ProduksiBlendingJournal")
);
const PersediaanJournal = React.lazy(
  () => import("./divisions/persediaan dan produksi/PersediaanGudangJournal")
);
const HrdJournal = React.lazy(() => import("./divisions/hrd/HrdJournal"));

const LoadingComponent = ({ divisionName }: { divisionName: string }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <div className="animate-spin mx-auto mb-4 h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      <p className="text-gray-600">Loading {divisionName} Journal...</p>
    </CardContent>
  </Card>
);

const ErrorComponent = ({ error }: { error: string }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

export default function JournalMainPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { user, divisionInfo, companyFilter, loading, error } =
    useDivisionData(selectedDate);

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
  if (!user || !divisionInfo) {
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
    switch (divisionInfo.type) {
      case "KEUANGAN":
        return {
          bg: "bg-blue-600",
          icon: DollarSign,
          color: "text-blue-600",
        };
      case "PEMASARAN":
        return {
          bg: "bg-orange-600",
          icon: TrendingUp,
          color: "text-orange-600",
        };
      case "PRODUKSI":
        return {
          bg: "bg-green-600",
          icon: Package,
          color: "text-green-600",
        };
      case "PERSEDIAAN":
        return {
          bg: "bg-purple-600",
          icon: Package,
          color: "text-purple-600",
        };
      case "HRD":
        return {
          bg: "bg-indigo-600",
          icon: Users,
          color: "text-indigo-600",
        };
      default:
        return {
          bg: "bg-gray-600",
          icon: Clock,
          color: "text-gray-600",
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

    switch (divisionInfo.type) {
      case "KEUANGAN":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Keuangan" />}
          >
            <KeuanganJournal {...commonProps} />
          </React.Suspense>
        );
      case "PEMASARAN":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Pemasaran" />}
          >
            <PemasaranJournal {...commonProps} />
          </React.Suspense>
        );
      case "PRODUKSI":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Produksi & Blending" />}
          >
            <ProduksiJournal {...commonProps} />
          </React.Suspense>
        );
      case "PERSEDIAAN":
      case "PERSEDIAAN":
        return (
          <React.Suspense
            fallback={<LoadingComponent divisionName="Produksi & Blending" />}
          >
            <ProduksiJournal {...commonProps} />
          </React.Suspense>
        );
      case "HRD":
        return (
          <React.Suspense fallback={<LoadingComponent divisionName="HRD" />}>
            <HrdJournal {...commonProps} />
          </React.Suspense>
        );
      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Divisi "{divisionInfo.name}" belum didukung. Silakan hubungi
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
                <CardTitle className="text-xl">
                  Jurnal Harian - {divisionInfo.name}
                </CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-sm">
                    {user.name} ({user.username})
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-sm ${divisionStyle.color}`}
                  >
                    {companyFilter.companyName}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Date Selector */}
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Division Component */}
      {renderDivisionComponent()}
    </div>
  );
}
