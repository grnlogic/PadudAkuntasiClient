"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, X, Check, Trash2, Settings, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotifications, markNotificationAsRead } from "@/lib/data";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Ambil notifikasi dari backend
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();

      // Pastikan data array, jika tidak, fallback ke []
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (
        data &&
        typeof data === "object" &&
        Array.isArray((data as any).data)
      ) {
        setNotifications((data as any).data);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // polling tiap 1 menit
    return () => clearInterval(interval);
  }, []);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Pastikan notifications selalu array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  // ✅ Helper function untuk format tanggal yang safe
  const formatNotificationDate = (dateString: any) => {
    if (!dateString) return "Baru saja";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Baru saja";
      }
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Baru saja";
    }
  };

  // ✅ NEW: Clear all notifications function
  const clearAllNotifications = async () => {
    try {
      // Mark all notifications as read
      const unreadNotifications = safeNotifications.filter((n) => !n.isRead);
      for (const notif of unreadNotifications) {
        await markNotificationAsRead(notif.id);
      }
      fetchNotifications();
    } catch (error) {}
  };

  const handleRead = async (notif: any) => {
    await markNotificationAsRead(notif.id);
    fetchNotifications();
    if (notif.linkUrl) window.location.href = notif.linkUrl;
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" onClick={() => setOpen((o) => !o)}>
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute top-0 right-0 bg-red-500 text-white">
            {unreadCount}
          </Badge>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 border">
          <div className="p-2 border-b font-semibold flex justify-between items-center">
            <span>Notifikasi</span>
            {safeNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {safeNotifications.length === 0 && (
              <li className="p-4 text-center text-gray-400">
                Tidak ada notifikasi
              </li>
            )}
            {/* ✅ Limit to latest 15 notifications */}
            {safeNotifications.slice(0, 15).map((notif) => (
              <li
                key={notif.id}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                  notif.isRead ? "text-gray-500" : "font-bold"
                }`}
                onClick={() => handleRead(notif)}
              >
                <div>{notif.message}</div>
                <div className="text-xs text-gray-400">
                  {formatNotificationDate(notif.createdAt)}
                </div>
              </li>
            ))}
            {safeNotifications.length > 15 && (
              <li className="p-2 text-center text-xs text-gray-400">
                Menampilkan 15 notifikasi terbaru dari{" "}
                {safeNotifications.length} total
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
