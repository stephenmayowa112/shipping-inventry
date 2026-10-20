'use client';

import React, { useState } from 'react';
import { X, Plus, ArrowUpRight, User } from 'lucide-react';
import { addStockToItem, getLastOperatorName } from '@/lib/storage';
import { ContainerItem } from '@/lib/types';

interface AddStockModalProps {
  isOpen: boolean;
  item: ContainerItem | null;
  containerId: string;
  containerName: string;
  onClose: () => void;
}

export function AddStockModal({
  isOpen,
  item,
  containerId,
  containerName,
  onClose
}: AddStockModalProps) {
  const [amount, setAmount] = useState<number | ''>(10);
  const [note, setNote] = useState('');
  const [personName, setPersonName] = useState(() => getLastOperatorName());

  if (!isOpen || !item) return null;

  const numericAmount = Number(amount) || 0;
  const newTotal = item.quantity + numericAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0 || !personName.trim()) return;

    addStockToItem(containerId, item.id, numericAmount, personName, note);
    setAmount(10);
    setNote('');
    onClose();
  };

  const addPreset = (val: number) => {
    setAmount(val);
  };

  const isFormValid = numericAmount > 0 && personName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 bg-emerald-50/70 border-b border-emerald-200/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Adding to {containerName}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Add More Stock
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Target Item Current Count Info Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Item receiving stock:</span>
            <div className="text-base font-bold text-slate-900 mt-0.5 break-words">
              {item.name}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/70 text-xs">
              <span className="text-slate-500">Current in container:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              How Many Are You Adding? *
            </label>
            <input
              type="number"
              min="1"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 20"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-2xl font-bold font-mono text-emerald-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[48px]"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              Quick Quantity Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 20, 50, 100].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => addPreset(n)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors min-h-[38px] ${
                    numericAmount === n 
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* Balance Preview */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-medium">New Total After Adding:</span>
            <span className="font-mono font-black text-emerald-800 text-base">
              {newTotal} {item.unit}
            </span>
          </div>

          {/* Compulsory Person Name */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Your Name (Person Adding Stock) *</span>
              </label>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Compulsory
              </span>
            </div>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. John Doe, Michael, Stephen"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[46px]"
            />
          </div>

          {/* Optional reason / source */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Source / Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Supplier delivery, Offloaded from truck"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch sm:items-center justify-end gap-2 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors min-h-[44px] text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[48px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm Adding +{numericAmount > 0 ? numericAmount : ''} {item.unit}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
