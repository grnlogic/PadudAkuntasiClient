"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
          <p className="text-gray-500">
            Silakan periksa kembali URL atau kembali ke halaman utama.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Kembali ke Login
          </Link>

          <div className="block">
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Kembali ke Halaman Sebelumnya
            </button>
          </div>
        </div>

        <div className="mt-12 text-gray-400">
          <p className="text-sm">Sistema Akuntansi - 404 Error</p>
        </div>
      </div>
    </div>
  );
}

export async function getPiutangTransaksi() {
  const res = await fetch("/api/v1/piutang", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // jika pakai cookie auth
  });
  if (!res.ok) throw new Error("Gagal mengambil data piutang");
  return res.json();
}
