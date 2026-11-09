'use client';

import React, { useState } from 'react';
import {
  X,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
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
      setError('Please enter Goods In-Stock.');
      return;
    }
    if (!containerName.trim() && !takeoutFromContainer.trim()) {
      setError('Please enter Container Name and Takeout from Container.');
      return;
    }
    if (!offloaderName.trim()) {
      setError('Please enter Container Offloader name.');
      return;
    }
    if (!personName.trim()) {
      setError('Please enter Name of Person.');
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
        (goodsCondition === 'Good' ? 'Good condition' : goodsCondition),
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
      onSaved?.(`Added warehouse record for "${payload.containerName}".`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Warehouse className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-bold text-base sm:text-lg">
              {editingRecord ? 'Update Warehouse Record' : 'Add Warehouse Record'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
        >
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Goods In-Stock & Arrival Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Goods In-Stock *
              </label>
              <input
                type="text"
                value={goodsInStock}
                onChange={(e) => {
                  setGoodsInStock(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 38 Boxes & 20 Bales"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-medium min-h-[46px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Goods Arrival (Date) *
              </label>
              <input
                type="date"
                value={goodsArrivalDate}
                onChange={(e) => setGoodsArrivalDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-medium min-h-[46px]"
                required
              />
            </div>
          </div>

          {/* Container & Takeout from Container */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Container *
              </label>
              <input
                type="text"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="e.g. Container 1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-bold min-h-[46px]"
                required
              />
              {containers.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {containers.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectExistingContainer(c.name)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold ${
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Takeout from Container *
              </label>
              <input
                type="text"
                value={takeoutFromContainer}
                onChange={(e) => setTakeoutFromContainer(e.target.value)}
                placeholder="Goods taken out of container"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-medium min-h-[46px]"
                required
              />
            </div>
          </div>

          {/* Takeout from Warehouse */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Takeout from Warehouse
            </label>
            <input
              type="text"
              value={takeoutFromWarehouse}
              onChange={(e) => setTakeoutFromWarehouse(e.target.value)}
              placeholder="Goods taken out of warehouse"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-medium min-h-[46px]"
            />
          </div>

          {/* Warehouse & Offloader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name of Warehouse
              </label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="Enter warehouse name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-medium min-h-[46px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Container Offloader (Person Name) *
              </label>
              <input
                type="text"
                value={offloaderName}
                onChange={(e) => {
                  setOffloaderName(e.target.value);
                  setError('');
                }}
                placeholder="Enter offloader name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-semibold min-h-[46px]"
                required
              />
            </div>
          </div>

          {/* Name of Person & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name of Person (Staff) *
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-semibold min-h-[46px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirmation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmationStatus('Confirmed')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border min-h-[46px] ${
                    confirmationStatus === 'Confirmed'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmationStatus('Pending')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border min-h-[46px] ${
                    confirmationStatus === 'Pending'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Pending</span>
                </button>
              </div>
            </div>
          </div>

          {/* Goods Condition */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Goods Condition (Good / Damaged)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['Good', 'Part Damaged', 'Damaged'] as GoodsCondition[]).map(
                (cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setGoodsCondition(cond)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1 min-h-[44px] ${
                      goodsCondition === cond
                        ? cond === 'Good'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : cond === 'Part Damaged'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{cond}</span>
                  </button>
                )
              )}
            </div>
            <input
              type="text"
              value={conditionDetails}
              onChange={(e) => setConditionDetails(e.target.value)}
              placeholder="Condition notes (optional)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[44px]"
            />
          </div>

          {/* Unaccounted & Credit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Unaccounted (Missing Goods)
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasUnaccounted(false);
                    setUnaccountedDetails('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border min-h-[44px] ${
                    !hasUnaccounted
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  None Missing
                </button>
                <button
                  type="button"
                  onClick={() => setHasUnaccounted(true)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border min-h-[44px] ${
                    hasUnaccounted
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Missing Goods
                </button>
              </div>
              {hasUnaccounted && (
                <input
                  type="text"
                  value={unaccountedDetails}
                  onChange={(e) => setUnaccountedDetails(e.target.value)}
                  placeholder="What is missing?"
                  className="w-full bg-rose-50/50 border border-rose-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold min-h-[44px]"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Credit
                </label>
                {matchedContainerCredit !== null && (
                  <button
                    type="button"
                    onClick={() => setCredit(String(matchedContainerCredit))}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Use {formatMoney(matchedContainerCredit)}</span>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
              />
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="grid grid-cols-2 sm:flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-bold min-h-[46px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold min-h-[46px]"
            >
              {editingRecord ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
