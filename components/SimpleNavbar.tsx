'use client';

import React, { useState } from 'react';
import {
  Package,
  Warehouse,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Download,
  Upload,
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
  onOpenAddContainer: () => void;
  onOpenUploadManifest: () => void;
  onResetDemo: () => void;
  onGoHome: () => void;
  selectedContainerName?: string;
}

export function SimpleNavbar({
  activeMode,
  onModeChange,
  containers,
  warehouseRecords,
  searchQuery,
  onSearchChange,
  onOpenAddContainer,
  onOpenUploadManifest,
  onResetDemo,
  onGoHome,
  selectedContainerName,
}: SimpleNavbarProps) {
  const [showMobileExportMenu, setShowMobileExportMenu] = useState(false);

  const totalCustomers = containers.reduce((acc, c) => acc + c.items.length, 0);
  const totalCbm = containers.reduce(
    (acc, c) => acc + c.items.reduce((sum, item) => sum + item.cbm, 0),
    0
  );

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand - Deep Down Logistics */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center space-x-2 sm:space-x-3 text-left group select-none min-w-0 shrink"
            title="Return to main overview"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
              {activeMode === 'warehouse' ? (
                <Warehouse className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] text-amber-400" />
              ) : (
                <Package className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-black text-sm sm:text-base md:text-lg tracking-tight text-slate-900 block truncate">
                Deep Down Logistics
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                {activeMode === 'warehouse' ? (
                  <span className="text-amber-700 font-semibold">
                    Warehouse Inventory · {warehouseRecords.length} Records
                  </span>
                ) : selectedContainerName ? (
                  <span className="text-blue-600 font-semibold truncate block">
                    ← {selectedContainerName}
                  </span>
                ) : (
                  <span>
                    {containers.length} Containers · {totalCustomers} Customers ·{' '}
                    {totalCbm.toFixed(1)} CBM
                  </span>
                )}
              </p>
            </div>
          </button>

          {/* Search box for tablet and desktop */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  activeMode === 'warehouse'
                    ? 'Search stock, offloader, condition, missing...'
                    : 'Search customer, phone, receiver, warehouse...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                activeMode === 'warehouse'
                  ? exportWarehouseRecordsToExcel(warehouseRecords)
                  : exportAllContainersToExcel(containers)
              }
              title="Download Excel spreadsheet (.xlsx)"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() =>
                activeMode === 'warehouse'
                  ? exportWarehouseRecordsToPdf(warehouseRecords)
                  : exportAllContainersToPdf(containers)
              }
              title="Download printable PDF report"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>

            {/* Mobile / Tablet Export Menu Button */}
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setShowMobileExportMenu(!showMobileExportMenu)}
                title="Export options"
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                aria-label="Export options"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </button>

              {showMobileExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-slate-900/20"
                    onClick={() => setShowMobileExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeMode === 'warehouse'
                        ? 'Export Warehouse Inventory'
                        : 'Export Customer Containers'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeMode === 'warehouse') {
                          exportWarehouseRecordsToExcel(warehouseRecords);
                        } else {
                          exportAllContainersToExcel(containers);
                        }
                        setShowMobileExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Export Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeMode === 'warehouse') {
                          exportWarehouseRecordsToPdf(warehouseRecords);
                        } else {
                          exportAllContainersToPdf(containers);
                        }
                        setShowMobileExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span>Export PDF Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Reset Demo button */}
            <button
              type="button"
              onClick={onResetDemo}
              title="Restore sample records"
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Restore demo records"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {activeMode === 'customer' && (
              <>
                {/* Upload Manifest button */}
                <button
                  type="button"
                  onClick={onOpenUploadManifest}
                  title="Upload Manifest (Excel, CSV, PDF, or Image)"
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0 min-h-[36px] sm:min-h-[40px]"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  <span className="hidden sm:inline">Upload Manifest</span>
                  <span className="sm:hidden">Manifest</span>
                </button>

                {/* Add Container button */}
                <button
                  type="button"
                  onClick={onOpenAddContainer}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0 min-h-[36px] sm:min-h-[40px]"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">+ Add Container</span>
                  <span className="sm:hidden">+ Container</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Prominent 2-Tab Inventory Switcher (Customer Inventory vs Warehouse Inventory) */}
        <div className="flex items-center justify-between border-t border-slate-100 py-2 gap-2">
          <div className="grid grid-cols-2 sm:inline-flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto gap-1">
            <button
              type="button"
              onClick={() => onModeChange('customer')}
              className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeMode === 'customer'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Customer Cargo Inventory</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                  activeMode === 'customer'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {containers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('warehouse')}
              className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeMode === 'warehouse'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Warehouse className="w-4 h-4 shrink-0" />
              <span>Warehouse Inventory</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                  activeMode === 'warehouse'
                    ? 'bg-amber-400/20 text-amber-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {warehouseRecords.length}
              </span>
            </button>
          </div>

          <div className="hidden lg:block text-xs text-slate-500 font-medium">
            {activeMode === 'customer'
              ? 'Staff Customer Cargo & Container Manifests (10 Fields)'
              : 'Warehouse Stock, Offloader, Goods Condition & Missing Log (10 Fields)'}
          </div>
        </div>

        {/* Mobile Search Row */}
        <div className="md:hidden pb-2.5 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                activeMode === 'warehouse'
                  ? 'Search warehouse stock, offloader, missing...'
                  : 'Search container, customer, phone, receiver...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-all min-h-[42px]"
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
