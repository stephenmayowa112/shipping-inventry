'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight, User } from 'lucide-react';
import { removeItemFromContainer, getLastOperatorName } from '@/lib/storage';
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
  const [personName, setPersonName] = useState(() => getLastOperatorName());

  if (!isOpen || !item) return null;

  const numericAmount = Number(amount) || 0;
  const remaining = Math.max(0, item.quantity - numericAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0 || !personName.trim()) return;

    removeItemFromContainer(containerId, item.id, numericAmount, personName, note);
    setAmount(1);
    setNote('');
    onClose();
  };

  const setPreset = (val: number) => {
    setAmount(Math.min(val, item.quantity));
  };

  const isFormValid = numericAmount > 0 && personName.trim().length > 0;

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
              Remove / Take Out Goods
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
            <span className="text-[11px] font-medium text-slate-500 block">Item being taken out:</span>
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

          {/* Amount input */}
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
          {item.quantity > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick:</span>
              {[1, 2, 5, 10, item.quantity].filter(n => n <= item.quantity).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPreset(n)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    numericAmount === n 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {n === item.quantity ? `All (${n})` : `-${n}`}
                </button>
              ))}
            </div>
          )}

          {/* Compulsory Person Name */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Your Name (Person Removing Item) *</span>
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Optional reason / customer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason or Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Customer delivery, Moved to front shop, Damaged"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
            />
          </div>

          {/* Remaining Count preview */}
          <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-amber-800 font-medium">Count Left After Removal:</span>
            <span className="font-mono font-bold text-sm text-amber-950">
              {remaining} {item.unit}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Update Container</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
