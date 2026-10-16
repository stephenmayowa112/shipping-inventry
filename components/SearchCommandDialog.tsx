'use client';

import React, { useState, useEffect } from 'react';
import { Container, Shipment, ContainerItem } from '@/lib/types';
import { Search, Boxes, Ship, Package, X, ArrowRight } from 'lucide-react';

interface SearchCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  containers: Container[];
  shipments: Shipment[];
  items: ContainerItem[];
  onSelectContainer: (container: Container) => void;
  onSelectShipment: (shipment: Shipment) => void;
}

export function SearchCommandDialog({
  isOpen,
  onClose,
  containers,
  shipments,
  items,
  onSelectContainer,
  onSelectShipment
}: SearchCommandDialogProps) {
  const [query, setQuery] = useState('');

  // Keyboard shortcut Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedContainers = trimmed
    ? containers.filter(c => 
        c.containerNumber.toLowerCase().includes(trimmed) ||
        c.customer.toLowerCase().includes(trimmed) ||
        c.supplier.toLowerCase().includes(trimmed) ||
        c.sealNumber.toLowerCase().includes(trimmed)
      )
    : containers.slice(0, 4);

  const matchedShipments = trimmed
    ? shipments.filter(s =>
        s.referenceNumber.toLowerCase().includes(trimmed) ||
        s.billOfLading.toLowerCase().includes(trimmed) ||
        s.customerName.toLowerCase().includes(trimmed)
      )
    : shipments.slice(0, 3);

  const matchedItems = trimmed
    ? items.filter(i =>
        i.itemName.toLowerCase().includes(trimmed) ||
        i.sku.toLowerCase().includes(trimmed) ||
        i.containerNumber.toLowerCase().includes(trimmed)
      )
    : items.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type container # (e.g. MSCU), SKU, B/L, or consignee..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Matched Containers */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Containers ({matchedContainers.length})
            </span>
            <div className="space-y-1.5">
              {matchedContainers.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectContainer(c);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:border-slate-400 hover:bg-white cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <Boxes className="w-4 h-4 text-slate-700" />
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm mr-2">{c.containerNumber}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{c.shippingLine} • {c.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold uppercase text-slate-700">
                      {c.status.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matched Cargo Items */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Inventory Goods & SKUs ({matchedItems.length})
            </span>
            <div className="space-y-1.5">
              {matchedItems.map(item => {
                const parentContainer = containers.find(c => c.id === item.containerId);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (parentContainer) onSelectContainer(parentContainer);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:border-slate-400 hover:bg-white cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-semibold text-slate-900 mr-2">{item.itemName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{item.sku}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700">{item.balance} {item.unit}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">in {item.containerNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matched Shipments */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Shipments & Consignments ({matchedShipments.length})
            </span>
            <div className="space-y-1.5">
              {matchedShipments.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectShipment(s);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:border-slate-400 hover:bg-white cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-mono font-bold text-slate-900 mr-2">{s.referenceNumber}</span>
                      <span className="text-slate-500 text-[11px]">{s.customerName}</span>
                    </div>
                  </div>
                  <span className="font-mono text-slate-600 text-[11px]">B/L: {s.billOfLading}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Press ESC to exit</span>
          <span className="font-mono">Global Logistics Quick-Search</span>
        </div>
      </div>
    </div>
  );
}
