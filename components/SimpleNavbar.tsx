'use client';

import React, { useState } from 'react';
import { Package, Plus, Search, FileSpreadsheet, FileText, RotateCcw, Download, X } from 'lucide-react';
import { Container } from '@/lib/types';
import { exportAllContainersToExcel, exportAllContainersToPdf } from '@/lib/exportUtils';

interface SimpleNavbarProps {
  containers: Container[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddContainer: () => void;
  onResetDemo: () => void;
  onGoHome: () => void;
  selectedContainerName?: string;
}

export function SimpleNavbar({
  containers,
  searchQuery,
  onSearchChange,
  onOpenAddContainer,
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
            title="Return to yard overview"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-sm sm:text-base md:text-lg tracking-tight text-slate-900 block truncate">
                Deep Down Logistics
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                {selectedContainerName ? (
                  <span className="text-blue-600 font-semibold truncate block">
                    ← {selectedContainerName}
                  </span>
                ) : (
                  <span>
                    {containers.length} Containers · {totalCustomers} Customers · {totalCbm.toFixed(1)} CBM
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
                placeholder="Search customer, phone, receiver, warehouse..."
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
              onClick={() => exportAllContainersToExcel(containers)}
              title="Download Excel spreadsheet of all containers (.xlsx)"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => exportAllContainersToPdf(containers)}
              title="Download printable PDF summary of all containers"
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
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Export All (10 Fields)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        exportAllContainersToExcel(containers);
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
                        exportAllContainersToPdf(containers);
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
              title="Restore sample containers"
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Restore demo containers"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
              placeholder="Search container, customer, phone, receiver..."
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
