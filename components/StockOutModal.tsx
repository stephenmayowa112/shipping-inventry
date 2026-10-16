'use client';

import React, { useState } from 'react';
import { Container, ContainerItem, UserProfile } from '@/lib/types';
import { recordStockOut } from '@/lib/storage';
import { ArrowUpFromLine, X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: Container[];
  items: ContainerItem[];
  currentUser: UserProfile;
  initialContainerId?: string;
  initialItemId?: string;
}

export function StockOutModal({
  isOpen,
  onClose,
  containers,
  items,
  currentUser,
  initialContainerId,
  initialItemId
}: StockOutModalProps) {
  const defaultContainer = containers.find(c => c.id === initialContainerId) || containers[0];
  const [selectedContainerId, setSelectedContainerId] = useState<string>(defaultContainer?.id || '');

  // Filter items in selected container
  const containerItems = items.filter(i => i.containerId === (selectedContainerId || defaultContainer?.id));
  const defaultItem = containerItems.find(i => i.id === initialItemId) || containerItems.find(i => i.balance > 0) || containerItems[0];
  
  const [selectedItemId, setSelectedItemId] = useState<string>(defaultItem?.id || '');
  const [quantityToDispatch, setQuantityToDispatch] = useState<number>(10);
  const [recipient, setRecipient] = useState(defaultContainer?.customer || '');
  const [referenceNumber, setReferenceNumber] = useState('DSP-2026-OUTBOUND-01');
  const [deliveryTruck, setDeliveryTruck] = useState('');
  const [reason, setReason] = useState('Customer Sales Order Delivery');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleContainerChange = (cId: string) => {
    setSelectedContainerId(cId);
    const cnt = containers.find(c => c.id === cId);
    if (cnt) setRecipient(cnt.customer || '');
    const newItems = items.filter(i => i.containerId === cId);
    const firstWithStock = newItems.find(i => i.balance > 0) || newItems[0];
    setSelectedItemId(firstWithStock?.id || '');
  };

  const activeContainer = containers.find(c => c.id === selectedContainerId);
  const activeItem = items.find(i => i.id === selectedItemId);

  const currentAvailableBalance = activeItem ? activeItem.balance : 0;
  const isOverBalance = quantityToDispatch > currentAvailableBalance;
  const projectedBalance = Math.max(0, currentAvailableBalance - (quantityToDispatch || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!activeContainer || !activeItem) {
      setFeedback({ type: 'error', message: 'Please select a valid container and inventory item.' });
      return;
    }

    if (quantityToDispatch <= 0) {
      setFeedback({ type: 'error', message: 'Dispatch quantity must be greater than zero.' });
      return;
    }

    if (isOverBalance) {
      setFeedback({
        type: 'error',
        message: `Validation Error: Cannot dispatch ${quantityToDispatch} ${activeItem.unit}. Only ${currentAvailableBalance} ${activeItem.unit} available in this container!`
      });
      return;
    }

    const res = recordStockOut({
      containerId: activeContainer.id,
      itemId: activeItem.id,
      quantityToDispatch: Number(quantityToDispatch),
      recipient: recipient.trim() || activeContainer.customer,
      referenceNumber: referenceNumber.trim(),
      authorizingOfficer: currentUser.name,
      officerRole: currentUser.role,
      reason,
      deliveryTruck: deliveryTruck.trim(),
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
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ArrowUpFromLine className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Process Stock-Out (Cargo Release)</h3>
              <p className="text-xs text-slate-500">Authorize and dispatch goods with real-time balance validation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {feedback && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Select Container */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Container <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedContainerId}
              onChange={(e) => handleContainerChange(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
            >
              {containers.map(c => {
                const cItems = items.filter(i => i.containerId === c.id);
                const totalBal = cItems.reduce((acc, curr) => acc + curr.balance, 0);
                return (
                  <option key={c.id} value={c.id}>
                    {c.containerNumber} ({c.shippingLine} • In-stock: {totalBal} units • {c.location})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Select Item to Dispatch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cargo Item to Dispatch <span className="text-rose-500">*</span>
            </label>
            {containerItems.length === 0 ? (
              <div className="p-3 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs">
                No cargo recorded in this container yet.
              </div>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {containerItems.map(item => (
                  <option key={item.id} value={item.id} disabled={item.balance <= 0}>
                    {item.itemName} (SKU: {item.sku} • Available Balance: {item.balance} {item.unit}) {item.balance === 0 ? ' [OUT OF STOCK]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Live Balance Checker Widget */}
          {activeItem && (
            <div className={`p-3.5 rounded-xl border transition-all ${
              isOverBalance 
                ? 'bg-rose-50 border-rose-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Container Balance Status:</span>
                <span className="font-mono text-slate-500 text-[11px]">SKU: {activeItem.sku}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 text-center font-mono">
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Available</span>
                  <span className="text-base font-bold text-emerald-700">
                    {currentAvailableBalance} {activeItem.unit}
                  </span>
                </div>

                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Dispatch Qty</span>
                  <span className={`text-base font-bold ${isOverBalance ? 'text-rose-600' : 'text-amber-700'}`}>
                    -{quantityToDispatch || 0} {activeItem.unit}
                  </span>
                </div>

                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Remaining</span>
                  <span className={`text-base font-bold ${isOverBalance ? 'text-rose-600' : 'text-slate-800'}`}>
                    {isOverBalance ? 'EXCEEDED' : `${projectedBalance} ${activeItem.unit}`}
                  </span>
                </div>
              </div>

              {isOverBalance && (
                <div className="mt-2 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    Negative balance prevention: You cannot dispatch more than the available {currentAvailableBalance} {activeItem.unit}.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dispatch Quantity & Reference # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Dispatch ({activeItem?.unit || 'Units'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={currentAvailableBalance > 0 ? currentAvailableBalance : 1}
                required
                value={quantityToDispatch}
                onChange={(e) => setQuantityToDispatch(Number(e.target.value))}
                className={`w-full bg-white rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none border ${
                  isOverBalance ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch / Gate Pass Ref # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. DSP-2026-8801"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Consignee Recipient & Carrier Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Consignee Recipient <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Apex Central Warehouse West"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Carrier / Truck License Plate
              </label>
              <input
                type="text"
                value={deliveryTruck}
                onChange={(e) => setDeliveryTruck(e.target.value)}
                placeholder="e.g. NL-98-XBV (EuroTrailer)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Reason for Release & Authorizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Release
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="Customer Sales Order Delivery">Customer Sales Order Delivery</option>
                <option value="Direct Store Replenishment">Direct Store Replenishment</option>
                <option value="Inter-Depot Warehouse Transfer">Inter-Depot Warehouse Transfer</option>
                <option value="Customs Inspection Sample">Customs Inspection Sample</option>
                <option value="Damaged Goods Write-off">Damaged Goods Write-off</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorizing Dispatch Officer
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.role.replace('_', ' ')})`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Remarks & Handling Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer signature required on delivery waybill. Keep upright."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Instantly deducts from container balance and produces an audit log.
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
                disabled={isOverBalance || currentAvailableBalance <= 0 || !activeItem}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Confirm Outbound Release (-{quantityToDispatch} {activeItem?.unit || 'Units'})</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
