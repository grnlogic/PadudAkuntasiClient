"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, User, Bell, Shield } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

export default function DivisionSettingsPage() {
  const user = getCurrentUser()
  const [settings, setSettings] = useState({
    name: user?.username || "",
    email: "",
    division: typeof user?.division === 'object' ? user.division.name : (user?.division || ""),
    notifications: true,
    autoSave: true,
    darkMode: false,
    language: "id",
  })
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = () => {
    setIsLoading(true)
    // Simulate save operation
    setTimeout(() => {
      setSuccess("Pengaturan berhasil disimpan")
      setIsLoading(false)
      setTimeout(() => setSuccess(""), 3000)
    }, 1000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-2">Kelola preferensi dan pengaturan akun Anda</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Pengguna
            </CardTitle>
            <CardDescription>Informasi dasar akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="division">Divisi</Label>
              <Input id="division" value={settings.division} disabled className="mt-1 bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Divisi tidak dapat diubah</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi
            </CardTitle>
            <CardDescription>Pengaturan pemberitahuan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifikasi Email</Label>
                <p className="text-sm text-gray-500">Terima notifikasi via email</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Save</Label>
                <p className="text-sm text-gray-500">Simpan otomatis saat input</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Mode Gelap</Label>
                <p className="text-sm text-gray-500">Tampilan gelap untuk mata</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Keamanan
          </CardTitle>
          <CardDescription>Pengaturan keamanan akun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <Input id="currentPassword" type="password" placeholder="Masukkan password saat ini" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input id="newPassword" type="password" placeholder="Masukkan password baru" className="mt-1" />
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" className="mr-2">
              Ubah Password
            </Button>
            <Button variant="outline">Logout dari Semua Device</Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terakhir</CardTitle>
          <CardDescription>Log aktivitas akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="text-sm font-medium">Login berhasil</p>
                <p className="text-xs text-gray-500">Dari IP: 192.168.1.1</p>
              </div>
              <span className="text-xs text-gray-400">2 jam lalu</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="text-sm font-medium">Transaksi ditambahkan</p>
                <p className="text-xs text-gray-500">Jurnal Keuangan</p>
              </div>
              <span className="text-xs text-gray-400">4 jam lalu</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium">Laporan diunduh</p>
                <p className="text-xs text-gray-500">Laporan Bulanan</p>
              </div>
              <span className="text-xs text-gray-400">1 hari lalu</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Pengaturan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
