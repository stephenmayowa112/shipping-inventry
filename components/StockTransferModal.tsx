'use client';

import React, { useState } from 'react';
import { Container, ContainerItem, UserProfile } from '@/lib/types';
import { recordStockTransfer } from '@/lib/storage';
import { ArrowLeftRight, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: Container[];
  items: ContainerItem[];
  currentUser: UserProfile;
  initialContainerId?: string;
  initialItemId?: string;
}

export function StockTransferModal({
  isOpen,
  onClose,
  containers,
  items,
  currentUser,
  initialContainerId,
  initialItemId
}: StockTransferModalProps) {
  const defaultContainer = containers.find(c => c.id === initialContainerId) || containers[0];
  const [selectedContainerId, setSelectedContainerId] = useState(defaultContainer?.id || '');

  const containerItems = items.filter(i => i.containerId === (selectedContainerId || defaultContainer?.id) && i.balance > 0);
  const defaultItem = containerItems.find(i => i.id === initialItemId) || containerItems[0];

  const [selectedItemId, setSelectedItemId] = useState(defaultItem?.id || '');
  const [quantity, setQuantity] = useState(defaultItem?.balance || 10);
  const [targetLocation, setTargetLocation] = useState('Central Warehouse Rack B-04');
  const [reason, setReason] = useState('Unloaded from container into indoor climate rack');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleContainerChange = (cId: string) => {
    setSelectedContainerId(cId);
    const newItems = items.filter(i => i.containerId === cId && i.balance > 0);
    const firstItem = newItems[0];
    setSelectedItemId(firstItem?.id || '');
    if (firstItem) setQuantity(firstItem.balance);
  };

  const handleItemChange = (iId: string) => {
    setSelectedItemId(iId);
    const itm = items.find(i => i.id === iId);
    if (itm) setQuantity(itm.balance);
  };

  const activeItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!activeItem) {
      setFeedback({ type: 'error', message: 'Please select an item to transfer.' });
      return;
    }

    if (quantity <= 0 || quantity > activeItem.balance) {
      setFeedback({ type: 'error', message: `Transfer quantity must be between 1 and ${activeItem.balance}.` });
      return;
    }

    const res = recordStockTransfer({
      containerId: selectedContainerId,
      itemId: activeItem.id,
      quantity: Number(quantity),
      targetLocation: targetLocation.trim(),
      reason: reason.trim(),
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Transfer Stock Location</h3>
              <p className="text-xs text-slate-500">Relocate cargo between container and warehouse floor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Container</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item to Relocate</label>
            {containerItems.length === 0 ? (
              <p className="text-xs text-amber-700 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                No active stock items in this container.
              </p>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                {containerItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} (Available: {item.balance} {item.unit} • Currently at: {item.storageLocation})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity ({activeItem?.unit || 'Units'})
              </label>
              <input
                type="number"
                min="1"
                max={activeItem?.balance || 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Storage Location</label>
              <input
                type="text"
                required
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="e.g. Warehouse Bay 3 - Rack C2"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Relocation</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Emptying container to avoid demurrage fees"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!activeItem || activeItem.balance <= 0}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-40 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Confirm Location Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
