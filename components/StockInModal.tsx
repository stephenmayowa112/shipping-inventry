'use client';

import React, { useState } from 'react';
import { Container, Shipment, ContainerItem, UserProfile } from '@/lib/types';
import { recordStockIn } from '@/lib/storage';
import { ArrowDownToLine, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: Container[];
  shipments: Shipment[];
  existingItems: ContainerItem[];
  currentUser: UserProfile;
  initialContainerId?: string;
}

export function StockInModal({
  isOpen,
  onClose,
  containers,
  shipments,
  existingItems,
  currentUser,
  initialContainerId
}: StockInModalProps) {
  const defaultContainer = containers.find(c => c.id === initialContainerId) || containers[0];
  const [selectedContainerId, setSelectedContainerId] = useState<string>(defaultContainer?.id || '');
  const [selectedShipmentRef, setSelectedShipmentRef] = useState<string>(defaultContainer?.shipmentRef || '');
  const [selectedExistingItemId, setSelectedExistingItemId] = useState<string>('new');
  
  // Form fields
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Consumer Goods');
  const [unit, setUnit] = useState('Cartons');
  const [expectedQuantity, setExpectedQuantity] = useState<number>(100);
  const [quantityReceived, setQuantityReceived] = useState<number>(100);
  const [storageLocation, setStorageLocation] = useState(defaultContainer ? `Inside Container ${defaultContainer.containerNumber}` : '');
  const [condition, setCondition] = useState<ContainerItem['condition']>('intact');
  const [referenceNumber, setReferenceNumber] = useState('RCV-2026-INBOUND-01');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleContainerChange = (cId: string) => {
    setSelectedContainerId(cId);
    const cnt = containers.find(c => c.id === cId);
    if (cnt) {
      setSelectedShipmentRef(cnt.shipmentRef);
      setStorageLocation(`Inside Container ${cnt.containerNumber}`);
    }
  };

  const containerItems = existingItems.filter(i => i.containerId === selectedContainerId);

  const handleItemSelectChange = (itemId: string) => {
    setSelectedExistingItemId(itemId);
    if (itemId === 'new') {
      setItemName('');
      setSku('');
      setCategory('Consumer Goods');
      setUnit('Cartons');
      setExpectedQuantity(100);
      setQuantityReceived(100);
    } else {
      const match = containerItems.find(i => i.id === itemId);
      if (match) {
        setItemName(match.itemName);
        setSku(match.sku);
        setCategory(match.category);
        setUnit(match.unit);
        const remExpected = Math.max(0, match.expectedQuantity - match.receivedQuantity);
        setExpectedQuantity(match.expectedQuantity);
        setQuantityReceived(remExpected > 0 ? remExpected : 50);
        setStorageLocation(match.storageLocation);
        setCondition(match.condition);
      }
    }
  };

  const activeContainer = containers.find(c => c.id === selectedContainerId) || containers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!activeContainer) {
      setFeedback({ type: 'error', message: 'Please select a valid container.' });
      return;
    }

    if (!itemName.trim() || quantityReceived <= 0) {
      setFeedback({ type: 'error', message: 'Please specify an item name and valid received quantity.' });
      return;
    }

    const res = recordStockIn({
      containerId: activeContainer.id,
      containerNumber: activeContainer.containerNumber,
      shipmentRef: selectedShipmentRef || activeContainer.shipmentRef,
      itemName: itemName.trim(),
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      unit,
      quantityReceived: Number(quantityReceived),
      expectedQuantity: Number(expectedQuantity),
      condition,
      storageLocation: storageLocation.trim() || `Inside Container ${activeContainer.containerNumber}`,
      referenceNumber: referenceNumber.trim(),
      receivingOfficer: currentUser.name,
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
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ArrowDownToLine className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Stock-In (Goods Receiving)</h3>
              <p className="text-xs text-slate-500">Register incoming cargo into designated container inventory</p>
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
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Container & Shipment Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Container <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedContainerId}
                onChange={(e) => handleContainerChange(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              >
                {containers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.containerNumber} ({c.shippingLine} • {c.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shipment Reference
              </label>
              <input
                type="text"
                value={selectedShipmentRef}
                onChange={(e) => setSelectedShipmentRef(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none font-mono"
                placeholder="e.g. SHP-2026-8841"
              />
            </div>
          </div>

          {/* Pre-fill from existing container line or new */}
          {containerItems.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Quick Action: Unload existing cargo line or add new?
              </label>
              <select
                value={selectedExistingItemId}
                onChange={(e) => handleItemSelectChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="new">+ Register New Item into this container</option>
                {containerItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} (SKU: {item.sku} • Received so far: {item.receivedQuantity}/{item.expectedQuantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Goods Description / Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. 4K OLED Smart TVs (Master Carton)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. EL-OLED-65U"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Category, Unit, Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Electronics, Agro..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="Cartons">Cartons</option>
                <option value="Bags">Bags (Jute/Poly)</option>
                <option value="Pallets">Pallets</option>
                <option value="Pieces">Pieces</option>
                <option value="Crates">Crates</option>
                <option value="Drums">Drums</option>
                <option value="Kg">Kilograms (Kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Expected Qty
              </label>
              <input
                type="number"
                min="1"
                value={expectedQuantity}
                onChange={(e) => setExpectedQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-700 mb-1">
                Qty Receiving Now <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Partial Unloading notice */}
          {expectedQuantity > quantityReceived && (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-800 flex items-center justify-between">
              <span>
                Partial Unloading: Receiving {quantityReceived} of {expectedQuantity} expected {unit}. 
                Remaining {expectedQuantity - quantityReceived} can be verified and unloaded in subsequent runs.
              </span>
              <span className="font-mono font-bold text-xs ml-2">
                {Math.round((quantityReceived / expectedQuantity) * 100)}%
              </span>
            </div>
          )}

          {/* Storage Location & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage / Placement Location
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Inside Container or Bay 4 - Rack 2"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition of Received Cargo
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ContainerItem['condition'])}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="intact">Intact (Factory Seals Good)</option>
                <option value="good">Good (Normal Condition)</option>
                <option value="minor_damage">Minor Packaging Scuffs</option>
                <option value="damaged">Damaged (Requires Claim Note)</option>
              </select>
            </div>
          </div>

          {/* Receiving Officer & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiving / Tally Officer
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.role.replace('_', ' ')})`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt / Waybill Ref
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Notes / Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pallet straps intact. Verified tally sheet."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Increments container balance and appends to audit ledger.
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
                className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-all"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Confirm Stock-In (+{quantityReceived} {unit})</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
