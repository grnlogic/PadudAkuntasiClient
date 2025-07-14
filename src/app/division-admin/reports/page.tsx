"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, AlertTriangle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
          <Wrench className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Halaman Laporan Sedang Maintenance
          </h1>
          <p className="text-gray-600">
            Kami sedang melakukan perbaikan dan peningkatan fitur laporan
          </p>
        </div>
      </div>

      {/* Main Maintenance Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800 mb-2">
                Fitur Laporan Sementara Tidak Tersedia
              </h3>
              <p className="text-orange-700 text-sm leading-relaxed">
                Tim pengembang sedang melakukan perbaikan dan peningkatan pada
                sistem laporan untuk memberikan pengalaman yang lebih baik. Kami
                memperkirakan fitur ini akan kembali tersedia dalam waktu dekat.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-medium text-gray-900 mb-2">
              Yang sedang diperbaiki:
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Peningkatan akurasi data laporan</li>
              <li>• Optimasi performa loading data</li>
              <li>• Penambahan fitur export yang lebih lengkap</li>
              <li>• Perbaikan tampilan laporan per divisi</li>
              <li>
                • Integrasi data dari semua sumber (entri, piutang, utang, dll)
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">
              Alternatif sementara:
            </h4>
            <p className="text-blue-800 text-sm">
              Anda masih dapat mengakses data transaksi melalui halaman{" "}
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

        <Button variant="outline" className="w-full sm:w-auto" disabled>
          <Clock className="mr-2 h-4 w-4" />
          Cek Status Maintenance
        </Button>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-orange-600">
                  Maintenance
                </p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Perkiraan Selesai</p>
                <p className="text-lg font-semibold text-blue-600">24-48 Jam</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fitur Lain</p>
                <p className="text-lg font-semibold text-green-600">Tersedia</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Jika Anda membutuhkan laporan mendesak, silakan hubungi:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <span className="text-gray-700">
                📧 Email: geranug@gmail.com
              </span>
              <span className="text-gray-700">📞 Telp: 6281395195039</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
