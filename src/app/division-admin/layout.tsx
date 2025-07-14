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
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import ModernNotificationBell from "@/components/modern-notification-bell";

const navigation = [
  { name: "Laporan Harian", href: "/division-admin/journal", icon: BookOpen },
  {
    name: "Rak Akun Divisi",
    href: "/division-admin/account-rack",
    icon: Archive,
  },
  {
    name: "Riwayat Transaksi",
    href: "/division-admin/transaction",
    icon: PlusCircle,
  },
  { name: "Laporan Divisi", href: "/division-admin/reports", icon: BarChart3 },
  { name: "Pengaturan", href: "/division-admin/settings", icon: Settings },
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-6 border-b">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="font-bold text-lg">Admin Divisi</h1>
          <p className="text-sm text-gray-500">
            Operator {user?.division?.name}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-blue-800 font-medium">Hak Operator</p>
          </div>
          <p className="text-xs text-blue-700">
            Anda dapat membuat akun baru untuk operasional divisi
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <AuthGuard requiredRole="ADMIN_DIVISI">
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
