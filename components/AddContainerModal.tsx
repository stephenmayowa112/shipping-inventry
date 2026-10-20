'use client';

import React, { useState } from 'react';
import { X, Package, Plus } from 'lucide-react';
import { addContainer } from '@/lib/storage';

interface AddContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContainerCreated: (newContainerId: string) => void;
}

export function AddContainerModal({
  isOpen,
  onClose,
  onContainerCreated
}: AddContainerModalProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newContainer = addContainer(name, note);
    setName('');
    setNote('');
    onClose();
    onContainerCreated(newContainer.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Add New Container</h3>
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
              Container Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Container 1, Blue Yard Container, Batch A"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Give it a simple name so you can identify it easily.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Location or Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Front yard, Behind shop, Warehouse Bay 2"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
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
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
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
