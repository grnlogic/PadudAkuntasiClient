"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Download, Upload, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "PT. Contoh Perusahaan",
    companyAddress: "Jl. Contoh No. 123, Jakarta",
    companyPhone: "+62 21 1234567",
    companyEmail: "info@contoh.com",
    autoBackup: true,
    emailNotifications: true,
    systemMaintenance: false,
    maxUsers: 50,
    sessionTimeout: 30,
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

  const handleBackup = () => {
    // Simulate backup creation
    const data = {
      accounts: localStorage.getItem("accounts"),
      users: localStorage.getItem("users"),
      journalEntries: localStorage.getItem("journalEntries"),
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setSuccess("Backup berhasil diunduh")
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.accounts) localStorage.setItem("accounts", data.accounts)
        if (data.users) localStorage.setItem("users", data.users)
        if (data.journalEntries) localStorage.setItem("journalEntries", data.journalEntries)

        setSuccess("Data berhasil dipulihkan dari backup")
        setTimeout(() => setSuccess(""), 3000)
      } catch (err) {
        alert("File backup tidak valid")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-600 mt-2">Konfigurasi dan pengaturan sistem akuntansi</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perusahaan</CardTitle>
            <CardDescription>Data dasar perusahaan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nama Perusahaan</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyAddress">Alamat</Label>
              <Input
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Telepon</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Sistem</CardTitle>
            <CardDescription>Konfigurasi operasional sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Backup Otomatis</Label>
                <p className="text-sm text-gray-500">Backup data setiap hari</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Notifikasi Email</Label>
                <p className="text-sm text-gray-500">Kirim notifikasi via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Mode Maintenance</Label>
                <p className="text-sm text-gray-500">Sistem dalam pemeliharaan</p>
              </div>
              <Switch
                checked={settings.systemMaintenance}
                onCheckedChange={(checked) => setSettings({ ...settings, systemMaintenance: checked })}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="maxUsers">Maksimal Pengguna</Label>
              <Input
                id="maxUsers"
                type="number"
                value={settings.maxUsers}
                onChange={(e) => setSettings({ ...settings, maxUsers: Number(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sessionTimeout">Timeout Sesi (menit)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>Kelola backup data sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleBackup} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Backup
            </Button>

            <div>
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" id="restore-file" />
              <Button asChild variant="outline">
                <label htmlFor="restore-file" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Restore dari Backup
                </label>
              </Button>
            </div>

            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset ke Default
            </Button>
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
