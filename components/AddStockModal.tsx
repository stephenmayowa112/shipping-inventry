'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, User } from 'lucide-react';
import { updateCargoItem, getLastOperatorName, formatMoney } from '@/lib/storage';
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
  onClose,
}: AddStockModalProps) {
  const [amount, setAmount] = useState<string>(item ? String(item.amount) : '0');
  const [additionalPayment, setAdditionalPayment] = useState<string>(
    item && item.credit > 0 ? String(item.credit) : ''
  );
  const [personName, setPersonName] = useState(() => getLastOperatorName());
  const [note, setNote] = useState('');

  if (!isOpen || !item) return null;

  const numAmount = Math.max(0, Number(amount) || 0);
  const numAddPay = Math.max(0, Number(additionalPayment) || 0);
  const newPaid = item.paid + numAddPay;
  const newCredit = Math.max(0, numAmount - newPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    updateCargoItem(containerId, item.id, {
      amount: numAmount,
      paid: newPaid,
      credit: newCredit,
      personName: personName.trim(),
      actionType: 'payment',
      changeNote: `Payment recorded (+${formatMoney(numAddPay)}) • Total Paid: ${formatMoney(
        newPaid
      )} • Remaining Credit: ${formatMoney(newCredit)}${
        note.trim() ? ` • Note: ${note.trim()}` : ''
      }`,
    });

    onClose();
  };

  const isFormValid = personName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 bg-emerald-50/70 border-b border-emerald-200/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              {containerName}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Update Payment (Paid & Credit)
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
          {/* Customer Info Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Customer:
              </span>
              <div className="text-base font-bold text-slate-900 break-words">
                {item.name}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  5. Amount
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatMoney(item.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  7. Paid So Far
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatMoney(item.paid)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  8. Credit Owed
                </span>
                <span className="font-mono font-bold text-rose-600">
                  {formatMoney(item.credit)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Total Amount (adjustable if needed) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              5. Total Cargo Amount
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-base sm:text-sm font-bold font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[44px]"
            />
          </div>

          {/* New Payment Being Added to 7. Paid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Add New Payment Received Today *
              </label>
              {item.credit > 0 && (
                <button
                  type="button"
                  onClick={() => setAdditionalPayment(String(item.credit))}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Pay Full Balance ({formatMoney(item.credit)})
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="any"
              autoFocus
              value={additionalPayment}
              onChange={(e) => setAdditionalPayment(e.target.value)}
              placeholder="Enter amount paid..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-2xl font-bold font-mono text-emerald-800 focus:outline-none focus:border-emerald-600 min-h-[48px]"
            />
          </div>

          {/* Live Preview of 7. Paid and 8. Credit */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-semibold">
                7. New Total Paid:
              </span>
              <span className="font-mono font-black text-emerald-800 text-sm">
                {formatMoney(newPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/60">
              <span className="text-slate-700 font-semibold">
                8. New Credit (Balance Owed):
              </span>
              <span
                className={`font-mono font-black text-base ${
                  newCredit > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatMoney(newCredit)}
              </span>
            </div>
          </div>

          {/* Compulsory Staff Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Your Name (Staff Recording Payment) *</span>
              </label>
              <span className="text-[10px] uppercase font-bold text-amber-800">
                Compulsory
              </span>
            </div>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Stephen Mayowa, Michael Ade"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
          </div>

          {/* Optional Payment Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Payment Reference / Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank Transfer, Cash at Office"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[44px]"
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
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Save Payment & Credit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
