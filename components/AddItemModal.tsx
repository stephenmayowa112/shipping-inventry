'use client';

import React, { useState } from 'react';
import { X, Plus, User, Check, Calendar, Warehouse } from 'lucide-react';
import {
  addCargoItem,
  updateCargoItem,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';
import { ContainerItem, TakenStatus } from '@/lib/types';

interface AddItemModalProps {
  isOpen: boolean;
  containerId: string;
  containerName: string;
  defaultWarehouse: string;
  editingItem?: ContainerItem | null;
  onClose: () => void;
}

const WAREHOUSE_PRESETS = [
  'Warehouse A - Main Yard',
  'Warehouse B - Annex',
  'Apapa Terminal Warehouse',
  'Ikeja Yard Warehouse',
];

export function AddItemModal({
  isOpen,
  containerId,
  containerName,
  defaultWarehouse,
  editingItem,
  onClose,
}: AddItemModalProps) {
  const isEditing = !!editingItem;

  // 2. Name
  const [name, setName] = useState(editingItem?.name || '');
  // 3. Phone Number
  const [phone, setPhone] = useState(editingItem?.phone || '');
  // 4. CBM
  const [cbm, setCbm] = useState<string>(
    editingItem ? String(editingItem.cbm) : ''
  );
  // 5. Amount
  const [amount, setAmount] = useState<string>(
    editingItem ? String(editingItem.amount) : ''
  );
  // 6. Taken
  const [takenStatus, setTakenStatus] = useState<TakenStatus>(
    editingItem?.takenStatus || 'Not Taken'
  );
  const [taken, setTaken] = useState(editingItem?.taken || 'Not Taken');
  // 7. Paid
  const [paid, setPaid] = useState<string>(
    editingItem ? String(editingItem.paid) : '0'
  );
  // 9. Receiver's (Name, Phone Number, Date)
  const [receiverName, setReceiverName] = useState(
    editingItem?.receiverName || ''
  );
  const [receiverPhone, setReceiverPhone] = useState(
    editingItem?.receiverPhone || ''
  );
  const [receiverDate, setReceiverDate] = useState(
    editingItem?.receiverDate || ''
  );
  // 10. Warehouse
  const [warehouse, setWarehouse] = useState(
    editingItem?.warehouse || defaultWarehouse || 'Warehouse A - Main Yard'
  );
  // Compulsory Staff Name
  const [personName, setPersonName] = useState(() => getLastOperatorName());

  if (!isOpen) return null;

  const numAmount = Math.max(0, Number(amount) || 0);
  const numPaid = Math.max(0, Number(paid) || 0);
  // 8. Credit (auto-calculated as Amount - Paid)
  const calculatedCredit = Math.max(0, numAmount - numPaid);

  const handleTakenStatusChange = (status: TakenStatus) => {
    setTakenStatus(status);
    if (status === 'Not Taken' && (!taken || taken === 'All Collected' || taken === 'Taken')) {
      setTaken('Not Taken');
    } else if (status === 'Taken' && (taken === 'Not Taken' || !taken)) {
      setTaken('All Collected');
      if (!receiverDate) {
        setReceiverDate(new Date().toISOString().split('T')[0]);
      }
    } else if (status === 'Partial' && (taken === 'Not Taken' || taken === 'All Collected')) {
      setTaken('Part Taken (Specify Qty)');
      if (!receiverDate) {
        setReceiverDate(new Date().toISOString().split('T')[0]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !personName.trim()) return;

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      cbm: Math.max(0, Number(cbm) || 0),
      amount: numAmount,
      takenStatus,
      taken: taken.trim() || takenStatus,
      paid: numPaid,
      credit: calculatedCredit,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverDate: receiverDate.trim(),
      warehouse: warehouse.trim() || defaultWarehouse || 'Main Warehouse',
      personName: personName.trim(),
    };

    if (isEditing && editingItem) {
      updateCargoItem(containerId, editingItem.id, {
        ...payload,
        actionType: 'updated',
      });
    } else {
      addCargoItem(containerId, payload);
    }

    onClose();
  };

  const isFormValid = name.trim().length > 0 && personName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-[11px] font-bold text-blue-600 block uppercase tracking-wider">
              1. Container: {containerName}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {isEditing
                ? `Edit Customer Record (All 10 Fields)`
                : `Add Customer Cargo Record (10 Fields)`}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Field 1: Container (Read-only confirmation) */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              1. Container
            </span>
            <span className="font-bold text-slate-900">{containerName}</span>
          </div>

          {/* Fields 2 & 3: Customer Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Name (Customer / Owner) *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alhaji Musa Ibrahim"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                3. Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 452 8910"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
              />
            </div>
          </div>

          {/* Fields 4, 5, 7, 8: CBM, Amount, Paid, Auto Credit */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 4. CBM */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  4. CBM (Volume m³) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cbm}
                  onChange={(e) => setCbm(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-slate-900 min-h-[46px]"
                />
              </div>

              {/* 5. Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  5. Amount (Total Cost) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 850000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-slate-900 min-h-[46px]"
                />
              </div>

              {/* 7. Paid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  7. Paid (Amount Paid)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold font-mono text-emerald-700 focus:outline-none focus:border-slate-900 min-h-[46px]"
                />
                {numAmount > 0 && numPaid < numAmount && (
                  <button
                    type="button"
                    onClick={() => setPaid(String(numAmount))}
                    className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Mark Fully Paid ({formatMoney(numAmount)})
                  </button>
                )}
              </div>
            </div>

            {/* 8. Credit (Auto-calculated) */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  8. Credit (Balance Owed = Amount − Paid)
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically calculated from Total Amount minus Paid
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-lg sm:text-xl font-black font-mono ${
                    calculatedCredit > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatMoney(calculatedCredit)}
                </span>
                <span className="block text-[10px] font-semibold text-slate-500">
                  {calculatedCredit === 0 ? 'Fully Settled' : 'Outstanding Credit'}
                </span>
              </div>
            </div>
          </div>

          {/* Field 6: Taken (Status & Quantity Collected) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              6. Taken (Collection Status & Quantity Collected)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {(['Not Taken', 'Partial', 'Taken'] as TakenStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleTakenStatusChange(status)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors min-h-[40px] ${
                    takenStatus === status
                      ? status === 'Taken'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : status === 'Partial'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Taken Details / Quantity Note:
              </label>
              <input
                type="text"
                value={taken}
                onChange={(e) => setTaken(e.target.value)}
                placeholder="e.g. Not Taken, 10 of 25 Cartons Taken, All 40 Bags Collected"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          {/* Field 9: Receiver's (Name, Phone Number, and Date) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                9. Receiver&apos;s Details (Name, Phone Number & Date)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!receiverName && name) setReceiverName(name);
                  if (!receiverPhone && phone) setReceiverPhone(phone);
                  if (!receiverDate)
                    setReceiverDate(new Date().toISOString().split('T')[0]);
                }}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Same as Customer + Today
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Receiver&apos;s Name
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Suleiman Musa"
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
                    <span>Receiver&apos;s Date</span>
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
          </div>

          {/* Field 10: Warehouse */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Warehouse className="w-3.5 h-3.5 text-slate-600" />
              <span>10. Warehouse *</span>
            </label>
            <input
              type="text"
              required
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder="e.g. Warehouse A - Main Yard"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {WAREHOUSE_PRESETS.map((w) => (
                <button
                  type="button"
                  key={w}
                  onClick={() => setWarehouse(w)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    warehouse === w
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Compulsory Staff Name */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  Your Name ({isEditing ? 'Staff Updating Record' : 'Staff Adding Record'}) *
                </span>
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
              className="px-5 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[48px]"
            >
              {isEditing ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Updated Record</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Customer Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
