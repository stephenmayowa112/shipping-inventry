'use client';

import React from 'react';
import { Package, Plus, Search, FileSpreadsheet, FileText, RotateCcw } from 'lucide-react';
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
  selectedContainerName
}: SimpleNavbarProps) {
  const totalGoodsAll = containers.reduce((acc, c) => {
    return acc + c.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* Brand */}
          <div 
            onClick={onGoHome}
            className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                  Container Inventory
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedContainerName ? (
                  <span className="text-blue-600 font-semibold truncate max-w-[150px] inline-block align-bottom">
                    Viewing {selectedContainerName}
                  </span>
                ) : (
                  <span>{containers.length} Containers • {totalGoodsAll} Total Goods</span>
                )}
              </p>
            </div>
          </div>

          {/* Search box */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Find item or container..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Export All Excel & PDF */}
            <button
              onClick={() => exportAllContainersToExcel(containers)}
              title="Download Excel spreadsheet of all containers (.xlsx)"
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => exportAllContainersToPdf(containers)}
              title="Download printable PDF summary of all containers"
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>

            {/* Reset Demo button */}
            <button
              onClick={onResetDemo}
              title="Restore sample containers"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Big friendly Add Container button */}
            <button
              onClick={onOpenAddContainer}
              className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Container</span>
            </button>
          </div>

        </div>

        {/* Mobile Search input */}
        <div className="sm:hidden pb-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Find item or container..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
            />
          </div>
        </div>

      </div>
    </header>
  );
}
