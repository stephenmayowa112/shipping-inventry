'use client';

import React, { useState } from 'react';
import { X, Package, User, Plus, Warehouse } from 'lucide-react';
import { addContainer, getLastOperatorName } from '@/lib/storage';

interface AddContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContainerCreated: (newContainerId: string) => void;
}

export function AddContainerModal({
  isOpen,
  onClose,
  onContainerCreated,
}: AddContainerModalProps) {
  const [name, setName] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [personName, setPersonName] = useState(() => getLastOperatorName());
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !warehouse.trim() || !personName.trim()) return;

    const newContainer = addContainer(name, warehouse, personName, note);
    setName('');
    setWarehouse('');
    setNote('');
    onClose();
    onContainerCreated(newContainer.id);
  };

  const isFormValid =
    name.trim().length > 0 &&
    warehouse.trim().length > 0 &&
    personName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Container</h3>
              <p className="text-[11px] text-slate-500">Deep Down Logistics Inventory</p>
            </div>
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
          {/* 1. Container Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              1. Container Name / Number *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Container 1"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[46px]"
            />
          </div>

          {/* 10. Default Warehouse */}
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
              placeholder="Enter warehouse name or location..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 min-h-[46px]"
            />
          </div>

          {/* Compulsory Person Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Your Name (Person Creating Container) *</span>
              </label>
              <span className="text-[10px] font-bold uppercase text-amber-800">
                Compulsory
              </span>
            </div>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Arrival Note / Description (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional notes or details..."
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
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Container</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
