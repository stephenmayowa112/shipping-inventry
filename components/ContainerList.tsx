'use client';

import React from 'react';
import { Container } from '@/lib/types';
import { Package, Plus, FileSpreadsheet, FileText, ArrowRight, Trash2, MapPin, Box } from 'lucide-react';
import { exportSingleContainerToExcel, exportSingleContainerToPdf } from '@/lib/exportUtils';
import { deleteContainer } from '@/lib/storage';

interface ContainerListProps {
  containers: Container[];
  searchQuery: string;
  onSelectContainer: (container: Container) => void;
  onOpenAddContainer: () => void;
}

export function ContainerList({
  containers,
  searchQuery,
  onSelectContainer,
  onOpenAddContainer
}: ContainerListProps) {
  // Filter containers by name, note, or item names
  const filteredContainers = containers.filter(c => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.note && c.note.toLowerCase().includes(q)) return true;
    return c.items.some(item => item.name.toLowerCase().includes(q));
  });

  const handleDelete = (e: React.MouseEvent, c: Container) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${c.name}" and all its recorded items?`)) {
      deleteContainer(c.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Deep Down Logistics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Yard Containers & Goods
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a container to see all items inside, remove goods, or update stock counts.
          </p>
        </div>

        <button
          onClick={onOpenAddContainer}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add New Container</span>
        </button>
      </div>

      {/* Containers Grid */}
      {filteredContainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredContainers.map((container) => {
            const totalGoods = container.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={container.id}
                onClick={() => onSelectContainer(container)}
                className="group p-5 sm:p-6 bg-white border border-slate-200 hover:border-slate-400 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  
                  {/* Container Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-800 flex items-center justify-center transition-colors shrink-0 mt-0.5">
                        <Box className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {container.name}
                        </h2>
                        {container.note && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{container.note}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>Created by: <strong className="text-slate-700 font-semibold">{container.createdBy || 'Staff'}</strong></span>
                          {container.updatedBy && (
                            <span>• Updated by: <strong className="text-slate-700 font-semibold">{container.updatedBy}</strong></span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      {totalGoods} Goods Left
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
                      <span>Items Inside ({container.items.length})</span>
                      <span>Quantity</span>
                    </div>

                    {container.items.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No goods added yet. Click to open and add items.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {container.items.slice(0, 4).map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors"
                          >
                            <span className="font-medium text-slate-800 truncate max-w-[200px]">
                              {item.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {item.quantity} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                            </span>
                          </div>
                        ))}

                        {container.items.length > 4 && (
                          <p className="text-[11px] text-blue-600 font-semibold pt-1">
                            +{container.items.length - 4} more items inside...
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open Container</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => exportSingleContainerToExcel(container)}
                      title="Download Excel (.xlsx)"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportSingleContainerToPdf(container)}
                      title="Download PDF"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, container)}
                      title="Delete Container"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-300 rounded-2xl">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {searchQuery ? 'No containers or items match your search' : 'No containers created yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? 'Try searching with a different item or container name.'
              : 'Add your first container to start tracking goods, quantities, and removals.'}
          </p>
          <button
            onClick={onOpenAddContainer}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors"
          >
            + Add First Container
          </button>
        </div>
      )}

    </div>
  );
}
