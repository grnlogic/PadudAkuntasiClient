"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogIn,
  AlertCircle,
  MessageCircle,
  Users,
  ChevronDown,
  X,
} from "lucide-react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [userName, setUserName] = useState("");
  const [userDivision, setUserDivision] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
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

  const handleIssueSelect = (issue: string) => {
    setSelectedIssue(issue);
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmitForm = () => {
    const issueLabels = {
      "tambah-akun": "Tambah Akun User",
      "kendala-login": "Kendala Login",
      "kendala-sistem": "Kendala Sistem",
      "fitur-baru": "Tambah Fitur Baru",
      lainnya: "Lainnya",
    };

    const issueLabel =
      issueLabels[selectedIssue as keyof typeof issueLabels] || "Lainnya";

    let message = `Halo Fajar,

Saya ingin melaporkan kendala terkait sistem akuntansi:

Jenis Kendala: ${issueLabel}
Username: ${userName}
Divisi: ${userDivision}
Deskripsi: ${issueDescription}

Mohon bantuan untuk menyelesaikan masalah ini.

Terima kasih.`;

    const encodedMessage = encodeURIComponent(message);

    window.open(`https://wa.me/6281395195039?text=${encodedMessage}`, "_blank");

    // Reset form
    setIsModalOpen(false);
    setSelectedIssue("");
    setUserName("");
    setUserDivision("");
    setIssueDescription("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIssue("");
    setUserName("");
    setUserDivision("");
    setIssueDescription("");
  };

  const getModalTitle = () => {
    const titles = {
      "tambah-akun": "Form Permintaan Akun Baru",
      "kendala-login": "Form Kendala Login",
      "kendala-sistem": "Form Kendala Sistem",
      "fitur-baru": "Form Permintaan Fitur Baru",
      lainnya: "Form Laporan Kendala",
    };
    return (
      titles[selectedIssue as keyof typeof titles] || "Form Laporan Kendala"
    );
  };

  const getDivisionLabel = () => {
    const labels = {
      "tambah-akun": "Divisi untuk Akun Baru",
      "kendala-login": "Divisi",
      "kendala-sistem": "Divisi",
      "fitur-baru": "Divisi",
      lainnya: "Divisi",
    };
    return labels[selectedIssue as keyof typeof labels] || "Divisi";
  };

  const getDivisionPlaceholder = () => {
    const placeholders = {
      "tambah-akun": "Contoh: Keuangan, HRD, Produksi, IT",
      "kendala-login": "Contoh: Keuangan, HRD, Produksi, IT",
      "kendala-sistem": "Contoh: Keuangan, HRD, Produksi, IT",
      "fitur-baru": "Contoh: Keuangan, HRD, Produksi, IT",
      lainnya: "Contoh: Keuangan, HRD, Produksi, IT",
    };
    return (
      placeholders[selectedIssue as keyof typeof placeholders] ||
      "Contoh: Keuangan, HRD, Produksi, IT"
    );
  };

  const getDescriptionPlaceholder = () => {
    const placeholders = {
      "tambah-akun": "Jelaskan kebutuhan akun dan akses yang diperlukan",
      "kendala-login": "Jelaskan detail masalah login yang dialami",
      "kendala-sistem": "Jelaskan masalah pada sistem atau modul tertentu",
      "fitur-baru": "Jelaskan fitur yang ingin ditambahkan dan kegunaannya",
      lainnya: "Jelaskan detail kendala atau permintaan Anda",
    };
    return (
      placeholders[selectedIssue as keyof typeof placeholders] ||
      "Jelaskan detail kendala atau permintaan Anda"
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
        {/* Subtle red accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent"></div>

        <div className="max-w-md space-y-6 relative z-10">
          <div className="flex justify-center mb-8">
            <Image
              src={logo}
              alt="Logo Perusahaan"
              width={120}
              height={120}
              className="rounded-full shadow-2xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-center">
            Sistem Akuntansi Perusahaan
          </h1>
          <p className="text-xl text-center text-gray-300">
            PT Padud Jayaputera
          </p>
          <p className="text-center text-gray-400 text-base">
            Sistem manajemen terintegrasi untuk semua divisi perusahaan
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Image
              src={logo}
              alt="Logo Perusahaan"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>

          {/* Login Header */}
          <div className="text-center lg:text-left space-y-1">
            <h2 className="text-3xl font-bold text-gray-900">Selamat Datang</h2>
            <p className="text-gray-600">Silakan masuk ke akun Anda</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in fade-in slide-in-from-top-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-semibold text-gray-700"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 transition-all duration-200 font-semibold"
                disabled={isLoading}
              >
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
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                Butuh Bantuan?
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Hubungi developer untuk bantuan teknis, penambahan akun, atau
              kendala lainnya.
            </p>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div>
                <p className="font-semibold text-gray-900">Fajar</p>
                <p className="text-xs text-gray-600">Developer</p>
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 font-medium shadow-sm"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Hubungi
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                    <div className="py-1">
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleIssueSelect("tambah-akun")}
                      >
                        Tambah Akun User
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleIssueSelect("kendala-login")}
                      >
                        Kendala Login
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleIssueSelect("kendala-sistem")}
                      >
                        Kendala Sistem
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleIssueSelect("fitur-baru")}
                      >
                        Tambah Fitur Baru
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleIssueSelect("lainnya")}
                      >
                        Lainnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{getModalTitle()}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Masukkan username Anda"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userDivision">{getDivisionLabel()}</Label>
                <Input
                  id="userDivision"
                  type="text"
                  placeholder={getDivisionPlaceholder()}
                  value={userDivision}
                  onChange={(e) => setUserDivision(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDescription">Deskripsi</Label>
                <textarea
                  id="issueDescription"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={getDescriptionPlaceholder()}
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitForm}
                  disabled={!userName || !userDivision || !issueDescription}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kirim ke WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
