"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle } from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export default function SystemStatusCard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      setError(false);
      try {
        const BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
        const res = await fetch(`${BASE_URL}/api/health`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setHealth(data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // refresh setiap 10 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Status Sistem
          </span>
          {loading ? (
            <Badge className="bg-gray-100 text-gray-600 animate-pulse">
              Checking...
            </Badge>
          ) : error || !health ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1 inline" />
              Offline
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">
              <Activity className="w-3 h-3 mr-1 inline" />
              Online
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500 mb-2">
          {loading
            ? "Mengecek status..."
            : error || !health
            ? "Tidak dapat terhubung ke backend API"
            : `Layanan berjalan normal`}
        </div>
        {health && !loading && !error && (
          <div className="text-xs text-gray-400 mb-2 space-y-1">
            <div>
              <span className="text-gray-600">Service:</span> {health.service}
            </div>
            <div>
              <span className="text-gray-600">Version:</span> {health.version}
            </div>
            <div>
              <span className="text-gray-600">Waktu:</span>{" "}
              {new Date(health.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
