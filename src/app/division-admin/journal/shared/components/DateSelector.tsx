import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  disabled?: boolean;
  className?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Calendar className="h-5 w-5 text-gray-500" />
      <label htmlFor="selectedDate" className="font-semibold text-gray-700">
        Tanggal Jurnal:
      </label>
      <Input
        id="selectedDate"
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        disabled={disabled}
        className="w-auto"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
        disabled={disabled}
        className="text-blue-600 hover:text-blue-700"
      >
        Hari Ini
      </Button>
    </div>
  );
};
