"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, X, Check, Trash2, Settings, ChevronDown } from "lucide-react";
import { getNotifications, markNotificationAsRead } from "@/lib/data";

export default function ModernNotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // === NEW: Popup state for new notifications ===
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessages, setPopupMessages] = useState<string[]>([]);
  const [fadeClass, setFadeClass] = useState("");
  const lastUnreadIds = useRef<Set<number>>(new Set());
  const popupTimeout = useRef<NodeJS.Timeout | null>(null);

  // Ambil notifikasi dari backend
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();

      let safeData: any[] = [];
      if (Array.isArray(data)) {
        safeData = data;
        setNotifications(data);
      } else if (
        data &&
        typeof data === "object" &&
        Array.isArray((data as any).data)
      ) {
        safeData = (data as any).data;
        setNotifications((data as any).data);
      } else {
        console.warn("⚠️ Notifications data is not array:", data);
        setNotifications([]);
      }
      // === NEW: Show popup if there are new unread notifications ===
      const unread = safeData.filter((n) => !n.isRead);
      const newUnread = unread.filter((n) => !lastUnreadIds.current.has(n.id));
      if (newUnread.length > 0) {
        setPopupMessages(
          newUnread
            .slice(0, 3)
            .map((n) =>
              n.message.length > 30 ? n.message.slice(0, 30) + "..." : n.message
            )
        );
        setShowPopup(true);
        setFadeClass("fade-in");
        if (popupTimeout.current) clearTimeout(popupTimeout.current);
        popupTimeout.current = setTimeout(() => {
          setFadeClass("fade-out");
          setTimeout(() => setShowPopup(false), 400); // fade out duration
        }, 4000);
      }
      lastUnreadIds.current = new Set(unread.map((n) => n.id));
    } catch (e) {
      console.error("❌ Error fetching notifications:", e);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // polling tiap 30 detik
    return () => clearInterval(interval);
  }, []);

  // Tampilkan popup selama masih ada unread
  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length > 0) {
      const messages = unread
        .slice(0, 3)
        .map((n) =>
          n.message.length > 30 ? n.message.slice(0, 30) + "..." : n.message
        );
      setPopupMessages(messages);
      setShowPopup(true);
      setFadeClass("fade-in");
    } else {
      setShowPopup(false);
      setFadeClass("");
    }
  }, [notifications]);

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

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  // Filter notifications berdasarkan status
  const filteredNotifications = safeNotifications
    .filter((notif) => {
      if (filter === "unread") return !notif.isRead;
      if (filter === "read") return notif.isRead;
      return true;
    })
    .slice(0, 20); // Limit 20 notifikasi

  // Helper function untuk format tanggal yang cantik
  const formatNotificationDate = (dateString: any) => {
    if (!dateString) return "Baru saja";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Baru saja";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays < 7) return `${diffDays} hari lalu`;

      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: diffDays > 365 ? "numeric" : undefined,
      });
    } catch (error) {
      return "Baru saja";
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notif: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (notif.isRead) return;

    try {
      await markNotificationAsRead(notif.id);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const unreadNotifications = safeNotifications.filter((n) => !n.isRead);
    try {
      for (const notif of unreadNotifications) {
        await markNotificationAsRead(notif.id);
      }
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
      fetchNotifications();
    }
    if (notif.linkUrl) {
      window.open(notif.linkUrl, "_blank");
    }
  };

  return (
    <>
      {/* Custom CSS Styles */}
      <style jsx>{`
        .notification-bell {
          position: relative;
        }

        .bell-button {
          position: relative;
          padding: 12px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          cursor: pointer;
          transition: box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bell-button:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .bell-icon {
          color: #222;
          width: 22px;
          height: 22px;
          stroke-width: 2.2;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ff3b3b;
          color: #fff;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          border: 2px solid #fff;
          padding: 0 4px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          z-index: 2;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 12px;
          width: 400px;
          max-height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.1);
          overflow: hidden;
          z-index: 1000;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .notification-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .notification-title {
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .filter-tabs {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 6px;
          margin-bottom: 8px;
        }

        .filter-tab {
          padding: 8px 16px;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .filter-tab.active {
          background: rgba(255, 255, 255, 0.9);
          color: #667eea;
          font-weight: 600;
        }

        .notification-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .notification-list {
          max-height: 450px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background: rgba(102, 126, 234, 0.08);
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background: linear-gradient(
            90deg,
            rgba(102, 126, 234, 0.08) 0%,
            transparent 100%
          );
          border-left: 4px solid #667eea;
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .notification-icon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notification-icon.unread {
          background: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .notification-icon.read {
          background: #e2e8f0;
        }

        .notification-text {
          flex: 1;
        }

        .notification-message {
          color: #1a202c;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .notification-time {
          color: #718096;
          font-size: 12px;
          font-weight: 400;
        }

        .notification-actions-inline {
          position: absolute;
          top: 16px;
          right: 20px;
          opacity: 0;
          transition: opacity 0.2s ease;
          display: flex;
          gap: 4px;
        }

        .notification-item:hover .notification-actions-inline {
          opacity: 1;
        }

        .inline-action-button {
          background: transparent;
          border: none;
          color: #718096;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inline-action-button:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          transform: scale(1.1);
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #718096;
        }

        .empty-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 20px;
          color: #cbd5e0;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 14px;
          color: #718096;
        }

        .loading-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 2px solid white;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .notification-footer {
          padding: 16px 24px;
          background: #f8fafc;
          text-align: center;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .footer-text {
          color: #718096;
          font-size: 13px;
          font-weight: 500;
        }

        /* Custom scrollbar */
        .notification-list::-webkit-scrollbar {
          width: 6px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.3);
          border-radius: 3px;
        }

        .notification-list::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 126, 234, 0.5);
        }

        .fade-in {
          opacity: 0;
          animation: fadeInNotif 0.4s forwards;
        }
        .fade-out {
          opacity: 1;
          animation: fadeOutNotif 0.4s forwards;
        }
        @keyframes fadeInNotif {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOutNotif {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
      `}</style>

      <div className="notification-bell" ref={ref}>
        <button
          className="bell-button"
          onClick={() => setOpen(!open)}
          title="Notifikasi"
        >
          <Bell className="bell-icon" />
          {unreadCount > 0 && (
            <div className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>
        {/* === NEW: Popup for unread notifications === */}
        {showPopup && popupMessages.length > 0 && (
          <div
            className={`absolute right-0 mt-2 bg-white shadow-lg rounded px-4 py-2 text-sm z-50 border max-w-xs min-w-[180px] border transition-opacity duration-400 ${fadeClass}`}
            style={{ top: "110%" }}
          >
            <div className="font-bold text-red-600 mb-1 text-center">
              <span role="img" aria-label="notif">
                ⚠️
              </span>{" "}
              Ada Notifikasi Baru!
            </div>
            {popupMessages.map((msg, idx) => (
              <div key={idx} className="truncate text-gray-800">
                {msg}
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-1 text-center">
              Tandai semua sebagai dibaca untuk menutup popup
            </div>
          </div>
        )}

        {open && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <div className="notification-title">
                <span>
                  Notifikasi {unreadCount > 0 && `(${unreadCount} baru)`}
                </span>
                <div className="notification-actions">
                  {unreadCount > 0 && (
                    <button
                      className="action-button"
                      onClick={handleMarkAllAsRead}
                      title="Tandai semua sebagai dibaca"
                    >
                      <Check size={18} />
                    </button>
                  )}

                  <button
                    className="action-button"
                    onClick={fetchNotifications}
                    title="Refresh"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <Settings size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  Semua ({safeNotifications.length})
                </button>
                <button
                  className={`filter-tab ${
                    filter === "unread" ? "active" : ""
                  }`}
                  onClick={() => setFilter("unread")}
                >
                  Belum Dibaca ({unreadCount})
                </button>
                <button
                  className={`filter-tab ${filter === "read" ? "active" : ""}`}
                  onClick={() => setFilter("read")}
                >
                  Sudah Dibaca ({safeNotifications.length - unreadCount})
                </button>
              </div>
            </div>

            <div className="notification-list">
              {filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <Bell className="empty-icon" />
                  <div className="empty-title">
                    {filter === "unread"
                      ? "Tidak ada notifikasi baru"
                      : filter === "read"
                      ? "Tidak ada notifikasi yang sudah dibaca"
                      : "Tidak ada notifikasi"}
                  </div>
                  <div className="empty-description">
                    {filter === "all"
                      ? "Notifikasi akan muncul di sini ketika ada aktivitas baru"
                      : "Coba ubah filter untuk melihat notifikasi lainnya"}
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${
                      !notif.isRead ? "unread" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notification-content">
                      <div
                        className={`notification-icon ${
                          notif.isRead ? "read" : "unread"
                        }`}
                      />
                      <div className="notification-text">
                        <div className="notification-message">
                          {notif.message}
                        </div>
                        <div className="notification-time">
                          {formatNotificationDate(notif.createdAt)}
                        </div>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <div className="notification-actions-inline">
                        <button
                          className="inline-action-button"
                          onClick={(e) => handleMarkAsRead(notif, e)}
                          title="Tandai sebagai dibaca"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {filteredNotifications.length > 0 && (
              <div className="notification-footer">
                <div className="footer-text">
                  Menampilkan {filteredNotifications.length} dari{" "}
                  {safeNotifications.length} notifikasi
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
