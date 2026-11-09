'use client';

import React, { useState } from 'react';
import {
  Warehouse,
  Plus,
  Upload,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Edit3,
  Trash2,
  UserCheck,
  Calendar,
  PackageCheck,
  X,
} from 'lucide-react';
import {
  Container,
  WarehouseRecord,
  WarehouseHistory,
} from '@/lib/types';
import {
  updateWarehouseRecord,
  deleteWarehouseRecord,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';
import { WarehouseRecordModal } from './WarehouseRecordModal';
import { UploadWarehouseModal } from './UploadWarehouseModal';

interface WarehouseInventoryViewProps {
  records: WarehouseRecord[];
  history: WarehouseHistory[];
  containers: Container[];
  searchQuery: string;
  onNotify: (msg: string) => void;
}

export function WarehouseInventoryView({
  records,
  history,
  containers,
  searchQuery,
  onNotify,
}: WarehouseInventoryViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WarehouseRecord | null>(
    null
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [confirmingRecord, setConfirmingRecord] =
    useState<WarehouseRecord | null>(null);
  const [quickConfirmStaff, setQuickConfirmStaff] = useState(
    () => getLastOperatorName() || ''
  );

  // Filter records by search query
  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.goodsInStock.toLowerCase().includes(q) ||
      r.containerName.toLowerCase().includes(q) ||
      r.takeoutFromContainer.toLowerCase().includes(q) ||
      r.takeoutFromWarehouse.toLowerCase().includes(q) ||
      r.warehouseName.toLowerCase().includes(q) ||
      r.offloaderName.toLowerCase().includes(q) ||
      r.personName.toLowerCase().includes(q) ||
      r.unaccountedDetails.toLowerCase().includes(q) ||
      r.conditionDetails.toLowerCase().includes(q) ||
      r.goodsArrivalDate.toLowerCase().includes(q)
    );
  });

  const handleQuickToggleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingRecord || !quickConfirmStaff.trim()) return;
    const nextStatus =
      confirmingRecord.confirmationStatus === 'Confirmed'
        ? 'Pending'
        : 'Confirmed';
    updateWarehouseRecord(confirmingRecord.id, {
      confirmationStatus: nextStatus,
      personName: quickConfirmStaff.trim(),
      changeNote: `Confirmation set to "${nextStatus}" for ${confirmingRecord.containerName}`,
    });
    onNotify(
      `Marked "${confirmingRecord.containerName}" as ${nextStatus}.`
    );
    setConfirmingRecord(null);
  };

  const handleDelete = (rec: WarehouseRecord) => {
    if (window.confirm(`Delete warehouse record for "${rec.containerName}"?`)) {
      deleteWarehouseRecord(rec.id, getLastOperatorName() || 'Staff');
      onNotify(`Deleted warehouse record for "${rec.containerName}".`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* Clean Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Warehouse Records
        </h1>

        <div className="grid grid-cols-1 sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors min-h-[46px]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors min-h-[46px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <Warehouse className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {searchQuery
              ? 'No matching warehouse records found'
              : 'No warehouse records yet'}
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold min-h-[46px]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold min-h-[46px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-3">Goods In-Stock</th>
                    <th className="py-3.5 px-3">Goods Arrival</th>
                    <th className="py-3.5 px-3">Takeout from Container</th>
                    <th className="py-3.5 px-3">Takeout from Warehouse</th>
                    <th className="py-3.5 px-3">
                      Warehouse / Container Offloader
                    </th>
                    <th className="py-3.5 px-3">Name of Person</th>
                    <th className="py-3.5 px-3">Confirmation</th>
                    <th className="py-3.5 px-3">Goods Condition</th>
                    <th className="py-3.5 px-3">Unaccounted</th>
                    <th className="py-3.5 px-3 text-right">Credit</th>
                    <th className="py-3.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/90 transition-colors align-top"
                    >
                      {/* Goods In-Stock */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 max-w-[190px]">
                        {rec.goodsInStock}
                      </td>

                      {/* Goods Arrival (Date) */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                        <span className="inline-flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.goodsArrivalDate}</span>
                        </span>
                      </td>

                      {/* Takeout from Container */}
                      <td className="py-3.5 px-3 max-w-[210px]">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase mb-1">
                          {rec.containerName}
                        </span>
                        <div className="text-xs text-slate-700 font-medium">
                          {rec.takeoutFromContainer}
                        </div>
                      </td>

                      {/* Takeout from Warehouse */}
                      <td className="py-3.5 px-3 max-w-[180px] text-xs text-slate-700 font-medium">
                        {rec.takeoutFromWarehouse}
                      </td>

                      {/* Name of Warehouse / Container Offloader */}
                      <td className="py-3.5 px-3 max-w-[190px]">
                        <div className="text-xs font-bold text-slate-900">
                          {rec.warehouseName || 'Main Warehouse'}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Offloader:{' '}
                          <strong className="text-slate-900">
                            {rec.offloaderName}
                          </strong>
                        </div>
                      </td>

                      {/* Name of Person */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1 text-xs font-bold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{rec.personName}</span>
                        </div>
                      </td>

                      {/* Confirmation */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => setConfirmingRecord(rec)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            rec.confirmationStatus === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {rec.confirmationStatus === 'Confirmed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{rec.confirmationStatus}</span>
                        </button>
                      </td>

                      {/* Goods Condition */}
                      <td className="py-3.5 px-3 max-w-[180px]">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                            rec.goodsCondition === 'Good'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : rec.goodsCondition === 'Part Damaged'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <PackageCheck className="w-3 h-3" />
                          <span>{rec.goodsCondition}</span>
                        </span>
                        {rec.conditionDetails &&
                          rec.conditionDetails !== rec.goodsCondition && (
                            <div className="text-[11px] text-slate-600 mt-1">
                              {rec.conditionDetails}
                            </div>
                          )}
                      </td>

                      {/* Unaccounted */}
                      <td className="py-3.5 px-3 max-w-[170px]">
                        {rec.hasUnaccounted ? (
                          <div className="inline-flex items-start space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{rec.unaccountedDetails}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            None
                          </span>
                        )}
                      </td>

                      {/* Credit */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`text-sm font-black ${
                            rec.credit > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {formatMoney(rec.credit)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(rec);
                              setIsAddModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rec)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="lg:hidden space-y-3.5">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5"
              >
                {/* Card Top Bar */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-xs font-bold">
                        {rec.containerName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          rec.confirmationStatus === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {rec.confirmationStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          rec.goodsCondition === 'Good'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : rec.goodsCondition === 'Part Damaged'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {rec.goodsCondition}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 break-words">
                      {rec.goodsInStock}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Credit
                    </span>
                    <span
                      className={`text-base font-black ${
                        rec.credit > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(rec.credit)}
                    </span>
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Goods Arrival (Date)
                    </span>
                    <span className="font-bold text-slate-900">
                      {rec.goodsArrivalDate}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Warehouse / Offloader
                    </span>
                    <span className="font-bold text-slate-900">
                      {rec.warehouseName} · Offloader: {rec.offloaderName}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Takeout from Container
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.takeoutFromContainer}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Takeout from Warehouse
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.takeoutFromWarehouse}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Goods Condition
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.goodsCondition} — {rec.conditionDetails}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl p-3 border ${
                      rec.hasUnaccounted
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-transparent text-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Unaccounted (Missing Goods)
                    </span>
                    <span className="font-bold">{rec.unaccountedDetails}</span>
                  </div>
                </div>

                {/* Card Footer: Name of Person + Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs sm:text-sm text-slate-600">
                    Recorded by:{' '}
                    <strong className="text-slate-900">{rec.personName}</strong>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingRecord(rec)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 min-h-[42px]"
                    >
                      {rec.confirmationStatus === 'Confirmed'
                        ? 'Mark Pending'
                        : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(rec);
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold min-h-[42px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec)}
                      className="col-span-2 sm:col-span-1 min-h-[42px] px-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent Warehouse Log */}
      {history.length > 0 && (
        <div className="pt-4 space-y-2.5">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Recent Warehouse Updates</span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {history.slice(0, 8).map((h) => (
              <div
                key={h.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <div>
                  <strong className="text-slate-900 font-bold">
                    {h.containerName}
                  </strong>{' '}
                  <span className="text-slate-500">(by {h.personName})</span>
                  <p className="text-slate-600 mt-0.5">{h.summary}</p>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {h.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Confirmation Modal */}
      {confirmingRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleQuickToggleConfirm}
            className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Change Confirmation Status
              </h3>
              <button
                type="button"
                onClick={() => setConfirmingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Set <strong>{confirmingRecord.containerName}</strong> to{' '}
              <strong>
                {confirmingRecord.confirmationStatus === 'Confirmed'
                  ? 'Pending'
                  : 'Confirmed'}
              </strong>
              .
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name of Person *
              </label>
              <input
                type="text"
                value={quickConfirmStaff}
                onChange={(e) => setQuickConfirmStaff(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 min-h-[46px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingRecord(null)}
                className="px-4 py-3 rounded-xl bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 min-h-[46px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold min-h-[46px]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Warehouse Record Modal */}
      {isAddModalOpen && (
        <WarehouseRecordModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingRecord(null);
          }}
          containers={containers}
          editingRecord={editingRecord}
          onSaved={(msg) => onNotify(msg)}
        />
      )}

      {/* Upload Warehouse Sheet Modal */}
      {isUploadModalOpen && (
        <UploadWarehouseModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onImported={(count) =>
            onNotify(`Imported ${count} warehouse records.`)
          }
        />
      )}
    </div>
  );
}
