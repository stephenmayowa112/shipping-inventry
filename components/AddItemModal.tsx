'use client';

import React, { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { addItemToContainer } from '@/lib/storage';

interface AddItemModalProps {
  isOpen: boolean;
  containerId: string;
  containerName: string;
  onClose: () => void;
}

const COMMON_UNITS = ['boxes', 'bags', 'cartons', 'cans', 'pieces', 'sacks', 'bundles', 'packs', 'drums'];

export function AddItemModal({
  isOpen,
  containerId,
  containerName,
  onClose
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('boxes');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(quantity) <= 0) return;

    addItemToContainer(containerId, name, Number(quantity), unit);
    setName('');
    setQuantity('');
    setUnit('boxes');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 block uppercase tracking-wider">
              {containerName}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Add Goods Into Container
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Item / Product Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cooking Oil 5L, Cement 50kg Bags, Rice Sacks"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Number of Goods *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 50"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Unit (Type)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="boxes, bags, etc."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Quick unit chips */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              Quick select unit:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UNITS.map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    unit === u
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || Number(quantity) <= 0}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Container</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
