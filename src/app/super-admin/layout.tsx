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
  FileText,
  Settings,
  LogOut,
  Shield,
  Eye,
  Database,
  TrendingUp,
  Users,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import ModernNotificationBell from "@/components/modern-notification-bell";

const navigation = [
  {
    name: "Dashboard Pemantauan",
    href: "/super-admin/dashboard",
    icon: Eye,
    description: "Monitor seluruh sistem",
  },
  {
    name: "Monitoring Produksi",
    href: "/super-admin/monitoring-produksi",
    icon: FileText,
    description: "Pantau hasil produksi harian",
  },
  {
    name: "Monitoring HRD",
    href: "/super-admin/monitoring-hrd",
    icon: Users,
    description: "Pantau absensi HRD divisi",
  },
  {
    name: "Monitoring Pemasaran",
    href: "/super-admin/monitoring-pemasaran",
    icon: TrendingUp,
    description: "Pantau penjualan per sales",
  },
  {
    name: "Konsolidasi Keuangan",
    href: "/super-admin/konsolidasi-keuangan",
    icon: Database,
    description: "Total kas per perusahaan",
  },
  {
    name: "Mengelola Admin",
    href: "/super-admin/users",
    icon: Users,
    description: "Kelola admin divisi",
  },
  {
    name: "Chart of Accounts",
    href: "/super-admin/chart-of-account",
    icon: BookOpen,
    description: "Master akun perusahaan",
  },
  {
    name: "Pengaturan Sistem",
    href: "/super-admin/settings",
    icon: Settings,
    description: "Konfigurasi sistem",
  },
];

export default function SuperAdminLayout({
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-gray-700" />
          <div>
            <h1 className="font-semibold text-lg text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500">System Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-white" : "text-gray-600"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    isActive ? "text-white" : "text-gray-900"
                  }`}
                >
                  {item.name}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Keluar</span>
        </Button>
      </div>
    </div>
  );

  return (
    <AuthGuard requiredRole="SUPER_ADMIN">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
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
                <Building2 className="h-6 w-6 text-gray-700" />
                <span className="font-semibold text-gray-900">
                  Sistem Akuntansi
                </span>
                <Badge variant="outline" className="text-xs">
                  SUPER ADMIN
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">
                  {user?.username || "Administrator"}
                </p>
                <p className="text-xs text-gray-500">System Administrator</p>
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
