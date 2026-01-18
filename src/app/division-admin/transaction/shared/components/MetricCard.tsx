"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface Metric {
  label: string;
  value: number | string;
  type: "currency" | "unit" | "percentage" | "number" | "hours" | "text";
  color: string;
}

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const formatValue = (value: number | string, type: string) => {
    if (typeof value === "string") return value;

    switch (type) {
      case "currency":
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(value);
      case "unit":
        return `${value.toLocaleString("id-ID")} unit`;
      case "percentage":
        return `${value.toFixed(2)}%`;
      case "number":
        return value.toLocaleString("id-ID");
      case "hours":
        return `${value.toFixed(1)} jam`;
      default:
        return value.toString();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">{metric.label}</p>
          <p className={`text-xl font-bold ${metric.color}`}>
            {formatValue(metric.value, metric.type)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsGridProps {
  metrics: Metric[];
  totalTransactions?: number;
}

export function MetricsGrid({ metrics, totalTransactions }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {totalTransactions !== undefined && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-bold">{totalTransactions}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {metrics.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  );
}
