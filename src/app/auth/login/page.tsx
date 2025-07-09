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
            <CardDescription>PT Padud Jayaputera</CardDescription>
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
                  Butuh Bantuan?
                </p>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Hubungi developer untuk bantuan teknis, penambahan akun, atau
                kendala lainnya.
              </p>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Fajar</p>
                    <p className="text-xs text-gray-600">Developer</p>
                  </div>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2 py-1"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Hubungi
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleIssueSelect("tambah-akun")}
                          >
                            Tambah Akun User
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleIssueSelect("kendala-login")}
                          >
                            Kendala Login
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleIssueSelect("kendala-sistem")}
                          >
                            Kendala Sistem
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => handleIssueSelect("fitur-baru")}
                          >
                            Tambah Fitur Baru
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
          </CardContent>
        </Card>
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
