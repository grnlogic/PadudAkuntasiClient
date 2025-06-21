"use client";

import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./error-fallback";

interface ClientErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ClientErrorBoundary({
  children,
}: ClientErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: any) => {
    console.error("🚨 Client error caught:", error, errorInfo);

    // ✅ Optional: Send error to logging service
    // errorReportingService.captureException(error, errorInfo);
  };

  const handleReset = () => {
    // ✅ Reset any global state if needed
    console.log("🔄 Resetting error boundary...");

    // Clear any cached data that might be causing issues
    if (typeof window !== "undefined") {
      // Optional: Clear localStorage items that might be corrupted
      // localStorage.removeItem('problematic-key');
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
}
