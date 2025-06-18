"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, LogIn, AlertCircle, MessageCircle, Shield, Users } from "lucide-react"
import { authenticateUser, setCurrentUser } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Pastikan function yang memanggil adalah async
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Gunakan await untuk menunggu Promise resolve
      const user = await authenticateUser(username, password) // atau function login Anda

      if (!user) {
        setError("Username atau password salah")
        setIsLoading(false)
        return
      }

      // Sekarang bisa akses property role
      if (user && user.role) {
        // Handle berdasarkan role
        // Redirect based on role
        if (user.role === "SUPER_ADMIN") {
          router.push("/super-admin/dashboard")
        } else {
          router.push("/division-admin/journal")
        }
      }

      setCurrentUser(user)
    } catch (err) {
      setError("Terjadi kesalahan saat login")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Sistem Akuntansi Perusahaan</CardTitle>
            <CardDescription>Masuk ke ruang kerja Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Masuk...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Masuk
                  </>
                )}
              </Button>
            </form>

            {/* Registration Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">Butuh Akun Baru?</p>
              </div>
              <p className="text-sm text-blue-700">
                Hubungi Super Admin untuk pembuatan akun baru. Hanya administrator yang dapat membuat akun pengguna.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="space-y-6">
          {/* Demo Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-600" />
                Demo Accounts
              </CardTitle>
              <CardDescription>Akun untuk testing sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Super Admin</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Username: <code className="bg-yellow-100 px-1 rounded">superadmin</code>
                  </p>
                  <p className="text-xs text-yellow-600">Akses penuh ke semua fitur sistem</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Admin Divisi:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Keuangan & Administrasi</span>
                      <code className="bg-gray-200 px-1 rounded">admin_keuangan</code>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Produksi</span>
                      <code className="bg-gray-200 px-1 rounded">admin_produksi</code>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Pemasaran & Penjualan</span>
                      <code className="bg-gray-200 px-1 rounded">admin_pemasaran</code>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Distribusi & Gudang</span>
                      <code className="bg-gray-200 px-1 rounded">admin_distribusi</code>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>HRD</span>
                      <code className="bg-gray-200 px-1 rounded">admin_hrd</code>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Password untuk semua akun: <code className="bg-gray-200 px-1 rounded">password123</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fitur Sistem</CardTitle>
              <CardDescription>Kemampuan sistem akuntansi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Manajemen Multi-Divisi</p>
                    <p className="text-gray-600">5 divisi dengan rak akun terpisah</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Jurnal Harian Real-time</p>
                    <p className="text-gray-600">Entri transaksi dan pemantauan langsung</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Rak Akun Dinamis</p>
                    <p className="text-gray-600">Setiap divisi dapat membuat akun sendiri</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Pemantauan Terpusat</p>
                    <p className="text-gray-600">Super Admin memantau semua aktivitas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
