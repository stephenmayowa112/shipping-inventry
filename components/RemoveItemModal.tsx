'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight, User, Calendar } from 'lucide-react';
import { updateCargoItem, getLastOperatorName } from '@/lib/storage';
import { ContainerItem, TakenStatus } from '@/lib/types';

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
  onClose,
}: RemoveItemModalProps) {
  const [takenStatus, setTakenStatus] = useState<TakenStatus>(
    item?.takenStatus === 'Not Taken' ? 'Taken' : item?.takenStatus || 'Taken'
  );
  const [taken, setTaken] = useState(
    item?.taken && item.taken !== 'Not Taken' ? item.taken : 'All Goods Collected'
  );
  const [receiverName, setReceiverName] = useState(
    item?.receiverName || item?.name || ''
  );
  const [receiverPhone, setReceiverPhone] = useState(
    item?.receiverPhone || item?.phone || ''
  );
  const [receiverDate, setReceiverDate] = useState(
    item?.receiverDate || new Date().toISOString().split('T')[0]
  );
  const [personName, setPersonName] = useState(() => getLastOperatorName());

  if (!isOpen || !item) return null;

  const handleStatusPreset = (status: TakenStatus) => {
    setTakenStatus(status);
    if (status === 'Taken') {
      setTaken('All Goods Collected');
    } else if (status === 'Partial') {
      setTaken('Part Taken (Specify Qty Collected)');
    } else {
      setTaken('Not Taken');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !taken.trim()) return;

    updateCargoItem(containerId, item.id, {
      takenStatus,
      taken: taken.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverDate: receiverDate.trim(),
      personName: personName.trim(),
      actionType: 'collected',
      changeNote: `Pickup updated • Taken: "${taken.trim()}" • Receiver: ${
        receiverName.trim() || 'N/A'
      } (${receiverPhone.trim() || 'No phone'}) on ${
        receiverDate.trim() || 'N/A'
      }`,
    });

    onClose();
  };

  const isFormValid = taken.trim().length > 0 && personName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 bg-amber-50/70 border-b border-amber-200/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              {containerName}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Update Taken & Receiver Details
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">
              Customer / Cargo Owner:
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5 break-words">
              {item.name}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs text-slate-600">
              <span>Tel: {item.phone || 'N/A'}</span>
              <span className="font-mono font-bold">{item.cbm} CBM</span>
            </div>
          </div>

          {/* 6. Taken Status & Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              6. Taken Status & Quantity Collected *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {(['Taken', 'Partial', 'Not Taken'] as TakenStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusPreset(status)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors min-h-[38px] ${
                      takenStatus === status
                        ? status === 'Taken'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : status === 'Partial'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>

            <input
              type="text"
              required
              autoFocus
              value={taken}
              onChange={(e) => setTaken(e.target.value)}
              placeholder="e.g. All Collected, 10 of 25 Cartons Taken"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-600 min-h-[46px]"
            />
          </div>

          {/* 9. Receiver's (Name, Phone Number & Date) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              9. Receiver&apos;s (Name, Phone Number & Date)
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Receiver&apos;s Name
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Name of person collecting cargo"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Receiver&apos;s Phone Number
              </label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="e.g. 0806 112 3344"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Receiver&apos;s Collection Date</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setReceiverDate(new Date().toISOString().split('T')[0])
                  }
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Today
                </button>
              </div>
              <input
                type="date"
                value={receiverDate}
                onChange={(e) => setReceiverDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          {/* Compulsory Staff Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Your Name (Staff Releasing Cargo) *</span>
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
              className="px-5 py-3 sm:py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[48px]"
            >
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              <span>Save Pickup & Receiver</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
