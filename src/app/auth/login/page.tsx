"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogIn, AlertCircle, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/public/images/Adobe Express - file.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticateUser, setCurrentUser } from "@/lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await authenticateUser(username, password);

      if (!user) {
        setError("Username atau password salah");
        setIsLoading(false);
        return;
      }

      if (user && user.role) {
        if (user.role === "SUPER_ADMIN") {
          router.push("/super-admin/dashboard");
        } else {
          router.push("/division-admin/journal");
        }
      }

      setCurrentUser(user);
    } catch (err) {
      setError("Terjadi kesalahan saat login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Login Form */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src={logo}
                alt="Logo Perusahaan"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              Sistem Akuntansi Perusahaan
            </CardTitle>
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
                <p className="text-sm font-medium text-blue-800">
                  Butuh Akun Baru?
                </p>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Hubungi Super Admin untuk pembuatan akun baru. Hanya
                administrator yang dapat membuat akun pengguna.
              </p>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Selvie</p>
                    <p className="text-xs text-gray-600">Super Administrator</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs px-2 py-1"
                    onClick={() =>
                      window.open(
                        `https://wa.me/6285224145488?text=Halo%20Selvie%2C%20saya%20ingin%20mendaftar%20akun%20baru%20untuk%20sistem%20akuntansi.%20Mohon%20bantuan%20untuk%20proses%20pendaftaran.`,
                        "_blank"
                      )
                    }
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WA
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Fajar</p>
                    <p className="text-xs text-gray-600">Developer</p>
                  </div>
                    <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2 py-1"
                    onClick={() =>
                      window.open(
                      `https://wa.me/6281395195039?text=Halo%20Fajar%2C%20saya%20ingin%20menambahkan%20akun%20baru%20pada%20sistem%20akuntansi.%20Mohon%20bantuan%20untuk%20proses%20penambahan%20akun.`,
                      "_blank"
                      )
                    }
                    >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WA
                    </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
