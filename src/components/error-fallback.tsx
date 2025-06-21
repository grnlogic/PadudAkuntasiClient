"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void; // ✅ Make optional
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const handleReset = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      // ✅ Fallback: reload page if no reset function
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Oops! Ada yang salah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center">
            <p>Aplikasi mengalami kesalahan yang tidak terduga.</p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-left">
                <summary className="cursor-pointer font-medium">
                  Detail Error (Development)
                </summary>
                <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReset} className="flex-1" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Refresh Halaman
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
