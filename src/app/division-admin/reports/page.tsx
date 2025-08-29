"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, AlertTriangle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Lazy load komponen untuk setiap divisi
const KeuanganReports = lazy(() => import("./components/KeuanganReports"));
const PemasaranReports = lazy(() => import("./components/PemasaranReports"));
const ProduksiReports = lazy(() => import("./components/ProduksiReports"));
const BlendingReports = lazy(() => import("./components/BlendingReports"));
const HRDReports = lazy(() => import("./components/HRDReports"));
const GudangReports = lazy(() => import("./components/GudangReports"));

// Loading component
const LoadingDashboard = ({ divisionName }: { divisionName: string }) => (
  <div className="p-6 space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
    <div className="text-center text-gray-500 mt-4">
      Loading Dashboard {divisionName}...
    </div>
  </div>
);

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.division?.name) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              Anda tidak memiliki akses ke halaman laporan. Silakan hubungi
              administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render komponen berdasarkan divisi
  const renderDivisionReports = () => {
    const divisionName = user.division.name.toLowerCase();
    const divisionDisplayName = user.division.name;

    if (divisionName.includes("keuangan")) {
      return (
        <Suspense fallback={<LoadingDashboard divisionName="Keuangan" />}>
          <KeuanganReports />
        </Suspense>
      );
    } else if (
      divisionName.includes("pemasaran") ||
      divisionName.includes("penjualan")
    ) {
      return (
        <Suspense fallback={<LoadingDashboard divisionName="Pemasaran" />}>
          <PemasaranReports />
        </Suspense>
      );
    } else if (divisionName.includes("produksi")) {
      return (
        <Suspense fallback={<LoadingDashboard divisionName="Produksi" />}>
          <ProduksiReports />
        </Suspense>
      );
    } else if (
      divisionName.includes("blending") ||
      divisionName.includes("persediaan")
    ) {
      return (
        <Suspense fallback={<LoadingDashboard divisionName="Blending" />}>
          <BlendingReports />
        </Suspense>
      );
    } else if (
      divisionName.includes("hrd") ||
      divisionName.includes("sumber daya")
    ) {
      return (
        <Suspense fallback={<LoadingDashboard divisionName="HRD" />}>
          <HRDReports />
        </Suspense>
      );
    } else if (divisionName.includes("gudang")) {
      return (
        <Suspense fallback={<LoadingDashboard divisionName="Gudang" />}>
          <GudangReports />
        </Suspense>
      );
    } else {
      return <DefaultReports divisionName={divisionDisplayName} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">{renderDivisionReports()}</div>
  );
}

// Komponen default untuk divisi yang belum memiliki laporan khusus
function DefaultReports({ divisionName }: { divisionName: string }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
          <Wrench className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan {divisionName}
          </h1>
          <p className="text-gray-600">
            Fitur laporan khusus untuk divisi ini sedang dalam pengembangan
          </p>
        </div>
      </div>

      {/* Main Maintenance Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Dalam Pengembangan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800 mb-2">
                Fitur Laporan Khusus Sedang Dikembangkan
              </h3>
              <p className="text-orange-700 text-sm leading-relaxed">
                Tim pengembang sedang mempersiapkan dashboard laporan khusus
                untuk divisi Anda. Fitur ini akan mencakup analisis data yang
                relevan dengan kebutuhan operasional divisi.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">
              Alternatif sementara:
            </h4>
            <p className="text-blue-800 text-sm">
              Anda dapat mengakses data transaksi melalui halaman{" "}
              <Link
                href="/division-admin/journal"
                className="underline font-medium"
              >
                Jurnal Harian
              </Link>{" "}
              untuk melihat entri transaksi terbaru.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/division-admin/journal">
          <Button className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Jurnal Harian
          </Button>
        </Link>
      </div>
    </div>
  );
}
