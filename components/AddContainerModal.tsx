'use client';

import React, { useState } from 'react';
import { X, Package, Plus } from 'lucide-react';
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
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Package className="w-5 h-5" />
            <h3 className="text-base font-bold">Add Container</h3>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Container Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Container 1"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Warehouse *
            </label>
            <input
              type="text"
              required
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder="Enter warehouse name"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
            />
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
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
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 min-h-[46px]"
            >
              <Plus className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
