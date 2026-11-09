'use client';

import React from 'react';
import {
  Package,
  Warehouse,
  Search,
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react';
import { Container, WarehouseRecord } from '@/lib/types';
import {
  exportAllContainersToExcel,
  exportAllContainersToPdf,
  exportWarehouseRecordsToExcel,
  exportWarehouseRecordsToPdf,
} from '@/lib/exportUtils';

export type InventoryMode = 'customer' | 'warehouse';

interface SimpleNavbarProps {
  activeMode: InventoryMode;
  onModeChange: (mode: InventoryMode) => void;
  containers: Container[];
  warehouseRecords: WarehouseRecord[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGoHome: () => void;
}

export function SimpleNavbar({
  activeMode,
  onModeChange,
  containers,
  warehouseRecords,
  searchQuery,
  onSearchChange,
  onGoHome,
}: SimpleNavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 space-y-3">
        {/* Top Row: Brand Name & Export Buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center space-x-2.5 text-left min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              {activeMode === 'warehouse' ? (
                <Warehouse className="w-5 h-5 text-amber-400" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 truncate">
              Deep Down Logistics
            </span>
          </button>

          {/* Direct Excel & PDF Export Buttons (Visible on all screens) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                activeMode === 'warehouse'
                  ? exportWarehouseRecordsToExcel(warehouseRecords)
                  : exportAllContainersToExcel(containers)
              }
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-bold text-slate-800 transition-colors min-h-[40px]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() =>
                activeMode === 'warehouse'
                  ? exportWarehouseRecordsToPdf(warehouseRecords)
                  : exportAllContainersToPdf(containers)
              }
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-bold text-slate-800 transition-colors min-h-[40px]"
            >
              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Second Row: 2 Big Section Tabs + Search Input */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Two Clear Section Buttons */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto gap-1">
            <button
              type="button"
              onClick={() => onModeChange('customer')}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[42px] ${
                activeMode === 'customer'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Customer Cargo</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('warehouse')}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[42px] ${
                activeMode === 'warehouse'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Warehouse className="w-4 h-4 shrink-0" />
              <span>Warehouse Records</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                activeMode === 'warehouse'
                  ? 'Search warehouse records...'
                  : 'Search container or customer...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-all min-h-[42px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
