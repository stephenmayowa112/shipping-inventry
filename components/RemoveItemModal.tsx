'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight, Check } from 'lucide-react';
import { removeItemFromContainer } from '@/lib/storage';
import { ContainerItem } from '@/lib/types';

interface RemoveItemModalProps {
  isOpen: boolean;
  item: ContainerItem | null;
  containerId: string;
  containerName: string;
  onClose: () => void;
}

export function RemoveItemModal({
  isOpen,
  item,
  containerId,
  containerName,
  onClose
}: RemoveItemModalProps) {
  const [amount, setAmount] = useState<number | ''>(1);
  const [note, setNote] = useState('');

  if (!isOpen || !item) return null;

  const numericAmount = Number(amount) || 0;
  const remaining = Math.max(0, item.quantity - numericAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    removeItemFromContainer(containerId, item.id, numericAmount, note);
    setAmount(1);
    setNote('');
    onClose();
  };

  const setPreset = (val: number) => {
    setAmount(Math.min(val, item.quantity));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/60 border-b border-amber-200/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Taking Out of {containerName}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Remove / Update Item
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
          
          {/* Target Item Current Count Info Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Item being removed:</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {item.name}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/70 text-xs">
              <span className="text-slate-500">Currently in container:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              How Many Are You Taking Out? *
            </label>
            <input
              type="number"
              min="1"
              max={item.quantity}
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Math.min(Number(e.target.value), item.quantity) : '')}
              placeholder="e.g. 5"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xl font-bold font-mono text-amber-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 5, 10, 20].filter(n => n <= item.quantity).map(n => (
              <button
                type="button"
                key={n}
                onClick={() => setPreset(n)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  numericAmount === n 
                    ? 'bg-amber-100 border-amber-300 text-amber-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                -{n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreset(item.quantity)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 ml-auto"
            >
              Take All ({item.quantity})
            </button>
          </div>

          {/* Dynamic remaining preview */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs">
            <span className="text-amber-800 font-medium flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4 text-amber-600" />
              Will remain in container:
            </span>
            <span className="font-mono font-bold text-amber-900 text-sm">
              {remaining} {item.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason or Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Sold to customer, Delivery to shop, Damaged"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
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
              disabled={numericAmount <= 0 || numericAmount > item.quantity}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Update ({numericAmount} {item.unit})</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
