"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Menu,
  BookOpen,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  User,
  Wrench,
  Archive,
  ChevronRight,
  Calendar,
  TrendingUp,
  Shield,
  Briefcase,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import ModernNotificationBell from "@/components/modern-notification-bell";

const navigation = [
  { 
    name: "Laporan Harian", 
    href: "/division-admin/journal", 
    icon: Calendar,
    description: "Buat laporan harian divisi"
  },
  {
    name: "Rak Akun Divisi",
    href: "/division-admin/account-rack",
    icon: Archive,
    description: "Kelola akun divisi"
  },
  {
    name: "Riwayat Transaksi",
    href: "/division-admin/transaction",
    icon: PlusCircle,
    description: "Lihat transaksi"
  },
  { 
    name: "Laporan Divisi", 
    href: "/division-admin/reports", 
    icon: TrendingUp,
    description: "Analisis performa"
  },
  { 
    name: "Pengaturan", 
    href: "/division-admin/settings", 
    icon: Settings,
    description: "Konfigurasi sistem"
  },
];

export default function DivisionAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/auth/login");
  };

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header dengan avatar yang lebih menarik */}
      <div className="relative p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Admin Divisi</h1>
            <p className="text-sm text-blue-100 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Operator {user?.division?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation dengan animasi dan hover effects */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-[1.01] hover:shadow-sm"
              }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? "bg-white/20" 
                  : "bg-gray-100 group-hover:bg-blue-100"
              }`}>
                <Icon className={`h-4 w-4 ${
                  isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600"
                }`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  isActive ? "text-white" : "text-gray-900"
                }`}>
                  {item.name}
                </p>
                <p className={`text-xs ${
                  isActive ? "text-blue-100" : "text-gray-500 group-hover:text-blue-600"
                }`}>
                  {item.description}
                </p>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${
                isActive 
                  ? "text-white transform rotate-90" 
                  : "text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1"
              }`} />
            </Link>
          );
        })}
      </nav>

      {/* Footer dengan styling yang lebih menarik */}
      <div className="p-4 border-t bg-gray-50/50">
        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-amber-100 rounded-lg">
              <Wrench className="h-3 w-3 text-amber-600" />
            </div>
            <p className="text-xs text-amber-800 font-semibold">Hak Operator</p>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Anda dapat membuat akun baru untuk operasional divisi dan mengelola data transaksi
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:transform group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Keluar</span>
        </Button>
      </div>
    </div>
  );

  return (
    <AuthGuard requiredRole="ADMIN_DIVISI">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar dengan shadow yang lebih elegan */}
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:bg-white lg:border-r lg:shadow-xl">
          <Sidebar />
        </div>

        {/* Mobile Sidebar dengan width yang disesuaikan */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b px-4 py-3 flex items-center justify-between lg:px-6">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  Sistem Akuntansi
                </span>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  OPERATOR
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-gray-500"> {user?.division?.name}</p>
              </div>
              <ModernNotificationBell />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
