import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientErrorBoundary from "@/components/client-error-boundary";
import { MaintenanceProvider } from "@/lib/contexts/MaintenanceContext";
import MaintenanceInterceptor from "@/components/MaintenanceInterceptor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Akuntansi",
  description: "Sistem Akuntansi Perusahaan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MaintenanceProvider>
          <MaintenanceInterceptor />
          <ClientErrorBoundary>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                  zIndex: 9999, // ✅ Ensure high z-index
                },
                success: {
                  duration: 3000,
                  style: {
                    background: "#10B981",
                    color: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: "#EF4444",
                    color: "#fff",
                  },
                },
                loading: {
                  style: {
                    background: "#3B82F6",
                    color: "#fff",
                  },
                },
              }}
            />
          </ClientErrorBoundary>
        </MaintenanceProvider>
      </body>
    </html>
  );
}
