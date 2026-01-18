"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DateFilterProps {
  filterDate: string;
  onDateChange: (date: string) => void;
  onReset?: () => void;
}

export function DateFilter({
  filterDate,
  onDateChange,
  onReset,
}: DateFilterProps) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500">Filter Tanggal:</Label>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => onDateChange(e.target.value)}
          placeholder="Filter tanggal"
        />
      </div>
      {onReset && (
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}
