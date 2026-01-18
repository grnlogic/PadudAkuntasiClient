"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  filterOptions: FilterOption[];
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterOptions,
}: SearchFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Cari transaksi..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger>
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Tipe</SelectItem>
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <Icon className={`h-4 w-4 mr-2 ${option.color}`} />
                  {option.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
