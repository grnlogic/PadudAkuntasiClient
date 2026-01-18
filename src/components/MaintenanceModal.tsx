"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LogOut, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MaintenanceModalProps {
  show: boolean;
  message?: string;
}

export default function MaintenanceModal({
  show,
  message = "Sistem sedang dalam mode maintenance. Tunggu beberapa saat atau hubungi admin.",
}: MaintenanceModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (show) {
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  const handleBackToLogin = () => {
    // Clear auth token
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");

    // Redirect to login
    router.push("/auth/login");
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 transform transition-all duration-500 ${
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        {/* Icon with pulse animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping"></div>
            <div className="relative bg-yellow-100 rounded-full p-4">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Sistem Maintenance
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleBackToLogin}
            className="w-full bg-slate-700 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Kembali ke Halaman Login
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">atau</span>
            </div>
          </div>

          <a
            href="https://wa.me/6281395195039"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Hubungi Developer Padud
            </Button>
          </a>
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Mohon tunggu, sistem akan segera kembali normal
        </p>
      </div>
    </div>
  );
}
