import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  BarChart3,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface SummaryItem {
  label: string;
  value: number | string;
  color?:
    | "blue"
    | "green"
    | "orange"
    | "purple"
    | "red"
    | "yellow"
    | "gray"
    | "indigo"
    | "pink";
  prefix?: string;
  icon?: "trending-up" | "trending-down" | "dollar" | "alert" | "chart";
  change?: number;
  subtitle?: string;
  trend?: number[];
}

interface SummaryCardProps {
  title: string;
  items: SummaryItem[];
  className?: string;
  variant?: "default" | "compact" | "detailed";
  animated?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  items,
  className = "",
  variant = "default",
  animated = true,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getColorClasses = (color?: string) => {
    const colors: Record<string, any> = {
      blue: {
        bg: "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50",
        border: "border-blue-300",
        text: "text-blue-900",
        accent: "bg-gradient-to-r from-blue-400 to-blue-600",
        icon: "text-blue-600",
        glow: "shadow-blue-200",
        ring: "ring-blue-400",
      },
      green: {
        bg: "bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-50",
        border: "border-green-300",
        text: "text-green-900",
        accent: "bg-gradient-to-r from-emerald-400 to-green-600",
        icon: "text-green-600",
        glow: "shadow-green-200",
        ring: "ring-green-400",
      },
      orange: {
        bg: "bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50",
        border: "border-orange-300",
        text: "text-orange-900",
        accent: "bg-gradient-to-r from-orange-400 to-orange-600",
        icon: "text-orange-600",
        glow: "shadow-orange-200",
        ring: "ring-orange-400",
      },
      purple: {
        bg: "bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50",
        border: "border-purple-300",
        text: "text-purple-900",
        accent: "bg-gradient-to-r from-purple-400 to-purple-600",
        icon: "text-purple-600",
        glow: "shadow-purple-200",
        ring: "ring-purple-400",
      },
      red: {
        bg: "bg-gradient-to-br from-red-50 via-red-100 to-red-50",
        border: "border-red-300",
        text: "text-red-900",
        accent: "bg-gradient-to-r from-red-400 to-red-600",
        icon: "text-red-600",
        glow: "shadow-red-200",
        ring: "ring-red-400",
      },
      yellow: {
        bg: "bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50",
        border: "border-yellow-300",
        text: "text-yellow-900",
        accent: "bg-gradient-to-r from-yellow-400 to-yellow-600",
        icon: "text-yellow-600",
        glow: "shadow-yellow-200",
        ring: "ring-yellow-400",
      },
      indigo: {
        bg: "bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-50",
        border: "border-indigo-300",
        text: "text-indigo-900",
        accent: "bg-gradient-to-r from-indigo-400 to-indigo-600",
        icon: "text-indigo-600",
        glow: "shadow-indigo-200",
        ring: "ring-indigo-400",
      },
      pink: {
        bg: "bg-gradient-to-br from-pink-50 via-pink-100 to-pink-50",
        border: "border-pink-300",
        text: "text-pink-900",
        accent: "bg-gradient-to-r from-pink-400 to-pink-600",
        icon: "text-pink-600",
        glow: "shadow-pink-200",
        ring: "ring-pink-400",
      },
      gray: {
        bg: "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50",
        border: "border-gray-300",
        text: "text-gray-900",
        accent: "bg-gradient-to-r from-gray-400 to-gray-600",
        icon: "text-gray-600",
        glow: "shadow-gray-200",
        ring: "ring-gray-400",
      },
    };

    return colors[color || "gray"] || colors.gray;
  };

  const getIcon = (iconType?: string) => {
    const iconClass = "h-5 w-5";
    switch (iconType) {
      case "trending-up":
        return <TrendingUp className={iconClass} />;
      case "trending-down":
        return <TrendingDown className={iconClass} />;
      case "dollar":
        return <DollarSign className={iconClass} />;
      case "alert":
        return <AlertCircle className={iconClass} />;
      case "chart":
        return <BarChart3 className={iconClass} />;
      default:
        return <DollarSign className={iconClass} />;
    }
  };

  const formatValue = (value: number | string, prefix?: string) => {
    if (typeof value === "number") {
      const formatted = value.toLocaleString("id-ID");
      return prefix ? `${prefix}${formatted}` : formatted;
    }
    return value;
  };

  const getGridLayout = () => {
    const itemCount = items.length;
    if (variant === "compact") return "grid grid-cols-1 md:grid-cols-2 gap-3";
    if (itemCount === 1) return "grid grid-cols-1 gap-4";
    if (itemCount === 2) return "grid grid-cols-1 md:grid-cols-2 gap-4";
    if (itemCount <= 4) return "grid grid-cols-1 md:grid-cols-2 gap-4";
    if (itemCount <= 6)
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
    return "flex flex-wrap gap-4";
  };

  const MiniSparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;

    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="opacity-40">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
          {title}
          <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {items.length} items
          </span>
        </h3>
      </div>
      <div className="p-6">
        <div className={getGridLayout()}>
          {items.map((item, index) => {
            const colorClasses = getColorClasses(item.color);
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={index}
                className={`
                  bg-white rounded-lg border-2 ${colorClasses.border} 
                  p-6 transition-all duration-200 hover:shadow-md
                  ${items.length > 4 ? "flex-1 min-w-[280px]" : ""}
                `}
              >
                {/* Top accent */}
                <div
                  className={`w-full h-1 ${colorClasses.accent} rounded-full mb-4`}
                ></div>

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.icon}`}
                  >
                    {getIcon(item.icon)}
                  </div>
                  {item.change !== undefined && (
                    <div
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                        item.change >= 0
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {item.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(item.change)}%
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="text-sm font-medium text-gray-600 mb-2">
                  {item.label}
                </div>

                {/* Value */}
                <div
                  className={`text-2xl md:text-3xl font-bold ${colorClasses.text} mb-1 font-mono tracking-tight leading-tight`}
                >
                  {formatValue(item.value, item.prefix)}
                </div>

                {/* Subtitle */}
                {item.subtitle && (
                  <div className="text-xs text-gray-500">{item.subtitle}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        )}
      `}</style>
    </div>
  );
};

// Demo Component
function Demo() {
  const sampleItems: SummaryItem[] = [
    {
      label: "Total Revenue",
      value: 1250000000,
      color: "blue",
      prefix: "Rp ",
      icon: "dollar",
      change: 12.5,
      subtitle: "vs last month",
      trend: [100, 120, 115, 140, 135, 150, 145, 165],
    },
    {
      label: "Active Users",
      value: 45678,
      color: "green",
      icon: "trending-up",
      change: 8.3,
      subtitle: "Growing steadily",
      trend: [400, 420, 410, 450, 470, 460, 456],
    },
    {
      label: "Pending Orders",
      value: 234,
      color: "orange",
      icon: "alert",
      change: -3.2,
      subtitle: "Needs attention",
      trend: [250, 240, 245, 235, 238, 234],
    },
    {
      label: "Conversion Rate",
      value: "23.4%",
      color: "purple",
      icon: "chart",
      change: 5.1,
      subtitle: "Above target",
      trend: [20, 21, 22, 21.5, 22.5, 23, 23.4],
    },
    {
      label: "Customer Satisfaction",
      value: "4.8/5.0",
      color: "pink",
      icon: "trending-up",
      change: 2.1,
      subtitle: "Excellent rating",
    },
    {
      label: "Support Tickets",
      value: 89,
      color: "red",
      icon: "alert",
      change: -15.3,
      subtitle: "Improved response",
      trend: [120, 110, 105, 100, 95, 92, 89],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
            Enhanced Summary Card
          </h1>
          <p className="text-slate-600 text-lg">
            Click on any card to expand and see more details
          </p>
        </div>

        <SummaryCard
          title="Business Overview Dashboard"
          items={sampleItems}
          animated={true}
        />

        <SummaryCard
          title="Quick Stats"
          items={sampleItems.slice(0, 3)}
          variant="compact"
          animated={true}
        />
      </div>
    </div>
  );
}
