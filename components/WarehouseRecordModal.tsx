'use client';

import React, { useState } from 'react';
import {
  X,
  Warehouse,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import {
  Container,
  WarehouseRecord,
  GoodsCondition,
  ConfirmationStatus,
} from '@/lib/types';
import {
  addWarehouseRecord,
  updateWarehouseRecord,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';

interface WarehouseRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: Container[];
  editingRecord?: WarehouseRecord | null;
  onSaved?: (message: string) => void;
}

export function WarehouseRecordModal({
  isOpen,
  onClose,
  containers,
  editingRecord,
  onSaved,
}: WarehouseRecordModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [goodsInStock, setGoodsInStock] = useState(
    editingRecord?.goodsInStock || ''
  );
  const [goodsArrivalDate, setGoodsArrivalDate] = useState(
    editingRecord?.goodsArrivalDate || todayStr
  );
  const [containerName, setContainerName] = useState(
    editingRecord?.containerName || containers[0]?.name || ''
  );
  const [takeoutFromContainer, setTakeoutFromContainer] = useState(
    editingRecord?.takeoutFromContainer || ''
  );
  const [takeoutFromWarehouse, setTakeoutFromWarehouse] = useState(
    editingRecord?.takeoutFromWarehouse || ''
  );
  const [warehouseName, setWarehouseName] = useState(
    editingRecord?.warehouseName || containers[0]?.warehouse || ''
  );
  const [offloaderName, setOffloaderName] = useState(
    editingRecord?.offloaderName || ''
  );
  const [personName, setPersonName] = useState(
    editingRecord?.lastUpdatedBy ||
      editingRecord?.personName ||
      getLastOperatorName() ||
      ''
  );
  const [confirmationStatus, setConfirmationStatus] =
    useState<ConfirmationStatus>(
      editingRecord?.confirmationStatus || 'Pending'
    );
  const [confirmationNote, setConfirmationNote] = useState(
    editingRecord?.confirmationNote || ''
  );
  const [goodsCondition, setGoodsCondition] = useState<GoodsCondition>(
    editingRecord?.goodsCondition || 'Good'
  );
  const [conditionDetails, setConditionDetails] = useState(
    editingRecord?.conditionDetails || ''
  );
  const [hasUnaccounted, setHasUnaccounted] = useState<boolean>(
    editingRecord?.hasUnaccounted || false
  );
  const [unaccountedDetails, setUnaccountedDetails] = useState(
    editingRecord?.unaccountedDetails &&
      editingRecord.unaccountedDetails !== 'None (0 Missing)'
      ? editingRecord.unaccountedDetails
      : ''
  );
  const [credit, setCredit] = useState<string>(
    editingRecord !== undefined && editingRecord !== null
      ? String(editingRecord.credit)
      : ''
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Find matching container if one exists to offer quick sync of credit & warehouse
  const matchedContainer = containers.find(
    (c) => c.name.toLowerCase() === containerName.trim().toLowerCase()
  );
  const matchedContainerCredit = matchedContainer
    ? matchedContainer.items.reduce((sum, i) => sum + i.credit, 0)
    : null;

  const handleSelectExistingContainer = (cName: string) => {
    setContainerName(cName);
    const found = containers.find((c) => c.name === cName);
    if (found) {
      if (found.warehouse && !warehouseName) {
        setWarehouseName(found.warehouse);
      }
      const totalCred = found.items.reduce((s, i) => s + i.credit, 0);
      if (!credit || credit === '0') {
        setCredit(String(totalCred));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodsInStock.trim()) {
      setError('Please enter Field 1: Goods In-Stock.');
      return;
    }
    if (!containerName.trim() && !takeoutFromContainer.trim()) {
      setError('Please enter Field 3: Container Name / Takeout from Container.');
      return;
    }
    if (!offloaderName.trim()) {
      setError('Please enter Field 5: Name of Container Offloader.');
      return;
    }
    if (!personName.trim()) {
      setError('Please enter Field 6: Name of Person (Staff recording this entry).');
      return;
    }

    const payload = {
      goodsInStock: goodsInStock.trim(),
      goodsArrivalDate: goodsArrivalDate || todayStr,
      containerName: containerName.trim() || 'Container',
      takeoutFromContainer:
        takeoutFromContainer.trim() || 'Offloaded from container',
      takeoutFromWarehouse: takeoutFromWarehouse.trim() || 'None yet',
      warehouseName: warehouseName.trim() || 'Main Warehouse',
      offloaderName: offloaderName.trim(),
      personName: personName.trim(),
      confirmationStatus,
      confirmationNote: confirmationNote.trim(),
      goodsCondition,
      conditionDetails:
        conditionDetails.trim() ||
        (goodsCondition === 'Good'
          ? 'All goods in good condition'
          : goodsCondition),
      hasUnaccounted,
      unaccountedDetails: hasUnaccounted
        ? unaccountedDetails.trim() || 'Missing goods reported'
        : 'None (0 Missing)',
      credit: Math.max(0, Number(credit) || 0),
    };

    if (editingRecord) {
      updateWarehouseRecord(editingRecord.id, payload);
      onSaved?.(`Updated warehouse record for "${payload.containerName}".`);
    } else {
      addWarehouseRecord(payload);
      onSaved?.(`Added new warehouse record for "${payload.containerName}".`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                {editingRecord
                  ? `Update Warehouse Record — ${editingRecord.containerName}`
                  : 'Add Warehouse Inventory Record (10 Fields)'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Deep Down Logistics • Warehouse Stock, Offloader, Condition & Missing Goods Log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1"
        >
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Section 1: Stock, Arrival Date & Container Takeout (Fields 1, 2, 3, 4) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Stock, Arrival & Takeout Details (Fields 1 – 4)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Goods in-stock */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  1. Goods In-Stock <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={goodsInStock}
                  onChange={(e) => {
                    setGoodsInStock(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. 38 Boxes & 20 Bales in Stock"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-medium"
                  required
                />
              </div>

              {/* 2. Goods arrival (date) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  2. Goods Arrival (Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={goodsArrivalDate}
                  onChange={(e) => setGoodsArrivalDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
                  required
                />
              </div>
            </div>

            {/* 3. Takeout from container */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    3a. Container Name <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                  placeholder="e.g. Container 1"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-bold"
                  required
                />
                {containers.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {containers.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectExistingContainer(c.name)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold transition-colors ${
                          containerName === c.name
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  3b. Takeout from Container (Goods Offloaded){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={takeoutFromContainer}
                  onChange={(e) => setTakeoutFromContainer(e.target.value)}
                  placeholder="e.g. 95 Total Packages Offloaded from Container"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-medium"
                  required
                />
              </div>
            </div>

            {/* 4. Takeout from warehouse */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                4. Takeout from Warehouse (Goods Dispatched / Removed)
              </label>
              <input
                type="text"
                value={takeoutFromWarehouse}
                onChange={(e) => setTakeoutFromWarehouse(e.target.value)}
                placeholder="e.g. 57 Packages Dispatched (or None yet)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Section 2: Warehouse, Offloader & Confirmation (Fields 5, 6, 7) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Warehouse, Offloader & Staff Confirmation (Fields 5 – 7)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 5a. Name of Warehouse */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  5a. Name of Warehouse
                </label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Enter warehouse name"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              {/* 5b. Container Offloader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  5b. Container Offloader (Person Name){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={offloaderName}
                  onChange={(e) => {
                    setOffloaderName(e.target.value);
                    setError('');
                  }}
                  placeholder="Who offloaded this container?"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 6. Name of Person (Staff) */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-950 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    6. Name of Person (Staff){' '}
                    <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => {
                    setPersonName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your full name"
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-semibold"
                  required
                />
              </div>

              {/* 7. Confirmation */}
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  7. Confirmation Status
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setConfirmationStatus('Confirmed')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                      confirmationStatus === 'Confirmed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmationStatus('Pending')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                      confirmationStatus === 'Pending'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={confirmationNote}
                  onChange={(e) => setConfirmationNote(e.target.value)}
                  placeholder="Optional confirmation note (e.g. Tally verified)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Goods Condition, Unaccounted/Missing & Credit (Fields 8, 9, 10) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Goods Condition, Missing / Unaccounted & Container Credit (Fields 8 – 10)
            </div>

            {/* 8. Goods Condition (Good / Damaged) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                8. Goods Condition (Good / Damaged)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {(
                  ['Good', 'Part Damaged', 'Damaged'] as GoodsCondition[]
                ).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setGoodsCondition(cond)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                      goodsCondition === cond
                        ? cond === 'Good'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : cond === 'Part Damaged'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>{cond}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={conditionDetails}
                onChange={(e) => setConditionDetails(e.target.value)}
                placeholder={
                  goodsCondition === 'Good'
                    ? 'Condition note (e.g. All goods arrived intact in good condition)'
                    : 'Describe damaged items (e.g. 2 crates dented on arrival)'
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* 9. Unaccounted (Missing Goods) */}
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>9. Unaccounted (Missing Goods in Container)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasUnaccounted(false);
                      setUnaccountedDetails('');
                    }}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                      !hasUnaccounted
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    None Missing
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasUnaccounted(true)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                      hasUnaccounted
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Has Missing Goods
                  </button>
                </div>
                {hasUnaccounted && (
                  <input
                    type="text"
                    value={unaccountedDetails}
                    onChange={(e) => setUnaccountedDetails(e.target.value)}
                    placeholder="Specify missing/unaccounted goods (e.g. 2 Cartons Missing)"
                    className="w-full bg-rose-50/50 border border-rose-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-rose-400 focus:outline-none focus:border-rose-600 font-semibold"
                  />
                )}
              </div>

              {/* 10. Credit */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      10. Credit for Container
                    </label>
                    {matchedContainerCredit !== null && (
                      <button
                        type="button"
                        onClick={() => setCredit(String(matchedContainerCredit))}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        title="Fill credit from matching Customer Container records"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>
                          Use {matchedContainer?.name} Credit (
                          {formatMoney(matchedContainerCredit)})
                        </span>
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Outstanding credit / balance for this container.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              {editingRecord ? 'Save Warehouse Update' : 'Add Warehouse Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
