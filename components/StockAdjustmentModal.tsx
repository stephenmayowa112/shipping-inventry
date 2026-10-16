'use client';

import React, { useState } from 'react';
import { Container, ContainerItem, UserProfile } from '@/lib/types';
import { recordStockAdjustment } from '@/lib/storage';
import { SlidersHorizontal, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: Container[];
  items: ContainerItem[];
  currentUser: UserProfile;
  initialContainerId?: string;
  initialItemId?: string;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  containers,
  items,
  currentUser,
  initialContainerId,
  initialItemId
}: StockAdjustmentModalProps) {
  const defaultContainer = containers.find(c => c.id === initialContainerId) || containers[0];
  const [selectedContainerId, setSelectedContainerId] = useState(defaultContainer?.id || '');

  const containerItems = items.filter(i => i.containerId === (selectedContainerId || defaultContainer?.id));
  const defaultItem = containerItems.find(i => i.id === initialItemId) || containerItems[0];

  const [selectedItemId, setSelectedItemId] = useState(defaultItem?.id || '');
  const [newBalance, setNewBalance] = useState<number>(defaultItem ? defaultItem.balance : 0);
  const [reason, setReason] = useState('Physical stock recount discrepancy');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  // Authorization check: only admin or warehouse_manager can adjust stock
  const hasPermission = currentUser.role === 'admin' || currentUser.role === 'warehouse_manager';

  const handleContainerChange = (cId: string) => {
    setSelectedContainerId(cId);
    const newItems = items.filter(i => i.containerId === cId);
    const first = newItems[0];
    setSelectedItemId(first?.id || '');
    setNewBalance(first ? first.balance : 0);
  };

  const handleItemChange = (iId: string) => {
    setSelectedItemId(iId);
    const itm = items.find(i => i.id === iId);
    setNewBalance(itm ? itm.balance : 0);
  };

  const activeItem = items.find(i => i.id === selectedItemId);
  const currentBalance = activeItem ? activeItem.balance : 0;
  const variance = (newBalance || 0) - currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!hasPermission) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: Stock adjustment requires Warehouse Manager or Administrator authorization.'
      });
      return;
    }

    if (!activeItem) {
      setFeedback({ type: 'error', message: 'Please select an item to reconcile.' });
      return;
    }

    if (newBalance < 0) {
      setFeedback({ type: 'error', message: 'Physical balance cannot be negative.' });
      return;
    }

    if (variance === 0) {
      setFeedback({ type: 'error', message: 'No variance detected. New balance equals current recorded balance.' });
      return;
    }

    const res = recordStockAdjustment({
      containerId: selectedContainerId,
      itemId: activeItem.id,
      newBalance: Number(newBalance),
      reason,
      authorizingOfficer: currentUser.name,
      officerRole: currentUser.role,
      notes: notes.trim()
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock Adjustment & Reconciliation</h3>
              <p className="text-xs text-slate-500">Reconcile physical inventory variances with full audit trace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasPermission && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Managerial Authorization Required</strong>
              <span>
                Your current role ({currentUser.role.replace('_', ' ')}) is not authorized to submit stock adjustments.
                Please switch to <strong>Warehouse Manager</strong> or <strong>Administrator</strong> using the top staff switcher to approve variances.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {feedback && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Container</label>
            <select
              value={selectedContainerId}
              onChange={(e) => handleContainerChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
            >
              {containers.map(c => (
                <option key={c.id} value={c.id}>{c.containerNumber} ({c.shippingLine})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item to Reconcile</label>
            {containerItems.length === 0 ? (
              <p className="text-xs text-slate-500">No items recorded in this container.</p>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                {containerItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} (SKU: {item.sku} • Current Balance: {item.balance} {item.unit})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Variance Calculator Widget */}
          {activeItem && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Reconciliation Variance Math</span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-sans">Recorded</span>
                  <span className="text-sm font-bold text-slate-800">{currentBalance} {activeItem.unit}</span>
                </div>
                <div className="p-2 rounded bg-white border border-purple-300 shadow-2xs">
                  <span className="text-[10px] text-purple-700 block font-sans">Physical Count</span>
                  <input
                    type="number"
                    min="0"
                    value={newBalance}
                    onChange={(e) => setNewBalance(Number(e.target.value))}
                    disabled={!hasPermission}
                    className="w-full text-center bg-transparent font-bold text-sm text-purple-900 focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-sans">Variance</span>
                  <span className={`text-sm font-bold ${variance > 0 ? 'text-emerald-700' : variance < 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    {variance > 0 ? `+${variance}` : variance} {activeItem.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Variance <span className="text-rose-500">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            >
              <option value="Physical stock recount discrepancy">Physical stock recount discrepancy</option>
              <option value="Damaged cargo write-off upon inspection">Damaged cargo write-off upon inspection</option>
              <option value="Supplier short-shipped packaging discrepancy">Supplier short-shipped packaging discrepancy</option>
              <option value="Customs inspection sample extraction">Customs inspection sample extraction</option>
              <option value="Correction of previous tally entry error">Correction of previous tally entry error</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Explanatory Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by physically counting Rack 02 pallet rows."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Authorizer: <strong className="text-slate-800">{currentUser.name}</strong>
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasPermission || variance === 0}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-40 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Authorize Adjustment</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
