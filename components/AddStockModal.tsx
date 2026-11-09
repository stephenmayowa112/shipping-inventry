'use client';

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import {
  updateCargoItem,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';
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
      changeNote: `Payment recorded (+${formatMoney(numAddPay)}) • Paid: ${formatMoney(
        newPaid
      )} • Credit: ${formatMoney(newCredit)}`,
    });

    onClose();
  };

  const isFormValid = personName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-300 block">
              {containerName}
            </span>
            <h3 className="text-base font-bold">Update Payment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-base font-bold text-slate-900 break-words">
              {item.name}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-500 block font-bold">Amount</span>
                <span className="font-bold text-slate-900">
                  {formatMoney(item.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Paid</span>
                <span className="font-bold text-emerald-700">
                  {formatMoney(item.paid)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Credit</span>
                <span className="font-bold text-rose-600">
                  {formatMoney(item.credit)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Total Amount
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                New Payment Received *
              </label>
              {item.credit > 0 && (
                <button
                  type="button"
                  onClick={() => setAdditionalPayment(String(item.credit))}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Pay Full ({formatMoney(item.credit)})
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
              placeholder="0"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xl font-bold text-emerald-800 focus:outline-none focus:border-emerald-600 min-h-[48px]"
            />
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-semibold">New Paid:</span>
              <span className="font-black text-emerald-800 text-sm">
                {formatMoney(newPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/60">
              <span className="text-slate-700 font-semibold">New Credit:</span>
              <span
                className={`font-black text-base ${
                  newCredit > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatMoney(newCredit)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Your Name (Staff) *
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm min-h-[46px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 min-h-[46px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
