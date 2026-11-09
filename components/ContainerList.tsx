'use client';

import React from 'react';
import { Container } from '@/lib/types';
import {
  Package,
  Plus,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  Trash2,
  Warehouse,
  Box,
  Upload,
} from 'lucide-react';
import {
  exportSingleContainerToExcel,
  exportSingleContainerToPdf,
} from '@/lib/exportUtils';
import { deleteContainer } from '@/lib/storage';

interface ContainerListProps {
  containers: Container[];
  searchQuery: string;
  onSelectContainer: (container: Container) => void;
  onOpenAddContainer: () => void;
  onOpenUploadManifest: () => void;
}

export function ContainerList({
  containers,
  searchQuery,
  onSelectContainer,
  onOpenAddContainer,
  onOpenUploadManifest,
}: ContainerListProps) {
  const filteredContainers = containers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.warehouse && c.warehouse.toLowerCase().includes(q)) return true;
    if (c.note && c.note.toLowerCase().includes(q)) return true;
    return c.items.some(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.receiverName.toLowerCase().includes(q) ||
        item.receiverPhone.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q) ||
        item.taken.toLowerCase().includes(q)
    );
  });

  const handleDelete = (e: React.MouseEvent, c: Container) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${c.name}"?`)) {
      deleteContainer(c.id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Clean Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Containers
        </h1>

        <div className="grid grid-cols-1 sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenUploadManifest}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors min-h-[46px]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Manifest</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddContainer}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors min-h-[46px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Container</span>
          </button>
        </div>
      </div>

      {/* Containers Grid */}
      {filteredContainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContainers.map((container) => (
            <div
              key={container.id}
              onClick={() => onSelectContainer(container)}
              className="group p-4 sm:p-5 bg-white border border-slate-200 hover:border-slate-400 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Container Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-800 flex items-center justify-center transition-colors shrink-0">
                      <Box className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors break-words">
                        {container.name}
                      </h2>
                      {container.warehouse && (
                        <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">
                            {container.warehouse}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Updated by: <strong className="text-slate-700">{container.updatedBy || container.createdBy || 'Staff'}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simple Customer List Inside Container */}
                <div className="pt-2 border-t border-slate-100">
                  {container.items.length === 0 ? (
                    <p className="text-xs sm:text-sm text-slate-400 py-2">
                      Empty container — tap to add customers.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {container.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs sm:text-sm py-2 px-3 rounded-xl bg-slate-50 gap-2"
                        >
                          <span className="font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 shrink-0">
                            {item.taken}
                          </span>
                        </div>
                      ))}

                      {container.items.length > 3 && (
                        <p className="text-xs text-blue-600 font-semibold pt-1 px-1">
                          +{container.items.length - 3} more inside
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-blue-600 flex items-center gap-1.5 py-1">
                  <span>Open Container</span>
                  <ArrowRight className="w-4 h-4" />
                </span>

                <div
                  className="flex items-center space-x-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => exportSingleContainerToExcel(container)}
                    title="Excel"
                    className="min-h-[40px] px-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="hidden xs:inline">Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportSingleContainerToPdf(container)}
                    title="PDF"
                    className="min-h-[40px] px-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span className="hidden xs:inline">PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, container)}
                    title="Delete"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-2xl space-y-4">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {searchQuery ? 'No matching containers found' : 'No containers yet'}
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-md mx-auto">
            <button
              type="button"
              onClick={onOpenUploadManifest}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm min-h-[46px] inline-flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Manifest</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddContainer}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm min-h-[46px] inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Container</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
