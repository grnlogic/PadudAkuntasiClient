"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Building,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Eye,
  Database,
  Activity,
  UserCheck,
  Bell,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout, getCurrentUser } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";
import NotificationBell from "@/components/notification-bell";
import SystemStatusCard from "@/components/SystemStatusCard";

const navigation = [
  {
    name: "Dashboard Pemantauan",
    href: "/super-admin/dashboard",
    icon: Eye,
    description: "Monitor seluruh sistem",
    badge: null,
  },
  {
    name: "Monitoring Produksi",
    href: "/super-admin/monitoring-produksi",
    icon: FileText,
    description: "Pantau hasil produksi harian seluruh operator",
    badge: null,
  },
  // Tambahkan menu Monitoring HRD di sini
  {
    name: "Monitoring HRD",
    href: "/super-admin/monitoring-hrd",
    icon: Users,
    description: "Pantau absensi HRD seluruh divisi",
    badge: null,
  },
  {
    name: "Monitoring Pemasaran",
    href: "/super-admin/monitoring-pemasaran",
    icon: TrendingUp,
    description: "Pantau penjualan produk per sales",
    badge: null,
  },
  {
    name: "Konsolidasi Keuangan",
    href: "/super-admin/konsolidasi-keuangan",
    icon: Database,
    description: "Total kas per perusahaan",
    badge: null,
  },
  {
    name: "Mengelola Admin",
    href: "/super-admin/users",
    icon: Users,
    description: "Kelola admin divisi",
    badge: "3",
  },
  {
    name: "Chart of Accounts",
    href: "/super-admin/chart-of-account",
    icon: BookOpen,
    description: "Master akun perusahaan",
    badge: null,
  },
  {
    name: "Pengaturan Sistem",
    href: "/super-admin/settings",
    icon: Settings,
    description: "Konfigurasi sistem",
    badge: null,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getPageTitle = () => {
    const currentNav = navigation.find((nav) => nav.href === pathname);
    return currentNav?.name || "Dashboard";
  };

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      {/* Container utama dengan flex layout */}
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}

        {/* Sidebar - Fixed width dan height penuh */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-500">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">Super Admin</h1>
                <p className="text-blue-100 text-sm">System Administrator</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-blue-500 p-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.username || "Administrator"}
                </p>
                <p className="text-xs text-gray-600">System Administrator</p>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-xs"
              >
                <Search className="h-3 w-3 mr-2" />
                Cari Menu
              </Button>
              <NotificationBell />
            </div>
          </div>

          {/* Navigation - dengan scroll jika konten panjang */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 transform scale-[1.02]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mr-3 ${
                        isActive
                          ? "bg-white bg-opacity-20"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive
                            ? "text-white"
                            : "text-gray-600 group-hover:text-gray-700"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          isActive ? "text-white" : ""
                        }`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isActive
                            ? "text-blue-100"
                            : "text-gray-500 group-hover:text-gray-600"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                    {item.badge && (
                      <Badge
                        className={`${
                          isActive
                            ? "bg-white text-blue-600"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* System Status & Logout - Fixed di bottom */}
          <div className="mt-auto p-4 border-t bg-gray-50">
            <SystemStatusCard />
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar Sistem
            </Button>
          </div>
        </div>

        {/* Main content area - menggunakan flex-1 untuk mengisi sisa space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header - hanya tampil di mobile */}
          <div className="lg:hidden bg-white shadow-sm border-b">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <span className="font-semibold text-gray-900">
                      Super Admin
                    </span>
                    <p className="text-xs text-gray-500">{getPageTitle()}</p>
                  </div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
            </div>
          </div>

          {/* Page content - scrollable */}
          <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
