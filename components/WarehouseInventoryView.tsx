'use client';

import React, { useState } from 'react';
import {
  Warehouse,
  Plus,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Edit3,
  Trash2,
  UserCheck,
  Calendar,
  PackageCheck,
  History,
  Search,
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
import {
  exportWarehouseRecordsToExcel,
  exportWarehouseRecordsToPdf,
} from '@/lib/exportUtils';
import { WarehouseRecordModal } from './WarehouseRecordModal';
import { UploadWarehouseModal } from './UploadWarehouseModal';

interface WarehouseInventoryViewProps {
  records: WarehouseRecord[];
  history: WarehouseHistory[];
  containers: Container[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNotify: (msg: string) => void;
}

type FilterMode =
  | 'all'
  | 'good'
  | 'damaged'
  | 'unaccounted'
  | 'confirmed'
  | 'pending';

export function WarehouseInventoryView({
  records,
  history,
  containers,
  searchQuery,
  onSearchChange,
  onNotify,
}: WarehouseInventoryViewProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'history'>(
    'records'
  );
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

  // Compute summary stats
  const totalRecords = records.length;
  const confirmedCount = records.filter(
    (r) => r.confirmationStatus === 'Confirmed'
  ).length;
  const pendingCount = totalRecords - confirmedCount;
  const goodCount = records.filter((r) => r.goodsCondition === 'Good').length;
  const damagedCount = totalRecords - goodCount;
  const unaccountedCount = records.filter((r) => r.hasUnaccounted).length;
  const totalCredit = records.reduce((sum, r) => sum + r.credit, 0);

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (filterMode === 'good' && r.goodsCondition !== 'Good') return false;
    if (filterMode === 'damaged' && r.goodsCondition === 'Good') return false;
    if (filterMode === 'unaccounted' && !r.hasUnaccounted) return false;
    if (filterMode === 'confirmed' && r.confirmationStatus !== 'Confirmed')
      return false;
    if (filterMode === 'pending' && r.confirmationStatus !== 'Pending')
      return false;

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
      changeNote: `Changed confirmation status to "${nextStatus}" for ${confirmingRecord.containerName}`,
    });
    onNotify(
      `Marked warehouse record for "${confirmingRecord.containerName}" as ${nextStatus}.`
    );
    setConfirmingRecord(null);
  };

  const handleDelete = (rec: WarehouseRecord) => {
    if (
      window.confirm(
        `Delete warehouse inventory record for "${rec.containerName}" (${rec.goodsInStock})?`
      )
    ) {
      deleteWarehouseRecord(rec.id, getLastOperatorName() || 'Staff');
      onNotify(`Deleted warehouse record for "${rec.containerName}".`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Warehouse className="w-3.5 h-3.5" />
              <span>Warehouse Stock & Offloading Log</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Warehouse Inventory Records (10 Fields)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Track goods in-stock, arrival date, container & warehouse takeout,
              container offloader, staff name, confirmation, goods condition
              (good/damaged), unaccounted missing goods, and container credit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportWarehouseRecordsToExcel(records, history)}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => exportWarehouseRecordsToPdf(records)}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Warehouse Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Warehouse Record</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Stock Records
            </span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
              {totalRecords}
            </span>
            <span className="text-[11px] text-slate-400">
              Active warehouse logs
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              7. Confirmation
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 block">
              {confirmedCount} Confirmed
            </span>
            <span className="text-[11px] text-amber-300">
              {pendingCount} Pending check
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              8. Goods Condition
            </span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
              {goodCount} Good
            </span>
            <span
              className={`text-[11px] font-semibold ${
                damagedCount > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {damagedCount} Damaged / Part
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              9. Unaccounted Goods
            </span>
            <span
              className={`text-lg sm:text-xl font-black mt-0.5 block ${
                unaccountedCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {unaccountedCount === 0
                ? '0 Missing'
                : `${unaccountedCount} With Missing`}
            </span>
            <span className="text-[11px] text-slate-400">
              Missing items check
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              10. Total Credit
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 block">
              {formatMoney(totalCredit)}
            </span>
            <span className="text-[11px] text-slate-400">
              Container credit balance
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Sub-Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `All (${totalRecords})` },
              { id: 'good', label: `Good Condition (${goodCount})` },
              { id: 'damaged', label: `Damaged (${damagedCount})` },
              {
                id: 'unaccounted',
                label: `Unaccounted / Missing (${unaccountedCount})`,
              },
              { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
            ] as { id: FilterMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterMode(tab.id);
                setActiveSubTab('records');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterMode === tab.id && activeSubTab === 'records'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Inline Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter stock, offloader..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveSubTab(
                activeSubTab === 'records' ? 'history' : 'records'
              )
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              activeSubTab === 'history'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Log ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 2: Warehouse Activity Log */}
      {activeSubTab === 'history' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Warehouse Activity & Audit Log
              </h2>
              <p className="text-xs text-slate-500">
                Every warehouse stock entry, takeout update, and confirmation with staff name
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('records')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              ← Back to 10-Field Table
            </button>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No warehouse activity recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase">
                        {h.containerName}
                      </span>
                      <span className="text-xs font-bold uppercase text-slate-500">
                        {h.action}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-medium">
                      {h.summary}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0 text-xs text-slate-500">
                    <div className="font-bold text-slate-800">
                      By: {h.personName}
                    </div>
                    <div>{h.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Warehouse className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              No Warehouse Inventory Records Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Add a warehouse record manually or upload a warehouse tally sheet
              to track goods in-stock, arrival date, offloader, goods condition,
              unaccounted items, and container credit.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Warehouse Record</span>
            </button>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Warehouse Sheet</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop 10-Column Table View */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-3">1. Goods In-Stock</th>
                    <th className="py-3.5 px-3">2. Goods Arrival</th>
                    <th className="py-3.5 px-3">3. Takeout from Container</th>
                    <th className="py-3.5 px-3">4. Takeout from Warehouse</th>
                    <th className="py-3.5 px-3">
                      5. Warehouse / Container Offloader
                    </th>
                    <th className="py-3.5 px-3">6. Name of Person</th>
                    <th className="py-3.5 px-3">7. Confirmation</th>
                    <th className="py-3.5 px-3">
                      8. Goods Condition (Good/Damaged)
                    </th>
                    <th className="py-3.5 px-3">9. Unaccounted</th>
                    <th className="py-3.5 px-3 text-right">10. Credit</th>
                    <th className="py-3.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/90 transition-colors align-top"
                    >
                      {/* 1. Goods In-Stock */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 max-w-[190px]">
                        {rec.goodsInStock}
                      </td>

                      {/* 2. Goods Arrival (Date) */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                        <span className="inline-flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.goodsArrivalDate}</span>
                        </span>
                      </td>

                      {/* 3. Takeout from Container */}
                      <td className="py-3.5 px-3 max-w-[210px]">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase mb-1">
                          {rec.containerName}
                        </span>
                        <div className="text-xs text-slate-700 font-medium">
                          {rec.takeoutFromContainer}
                        </div>
                      </td>

                      {/* 4. Takeout from Warehouse */}
                      <td className="py-3.5 px-3 max-w-[180px] text-xs text-slate-700 font-medium">
                        {rec.takeoutFromWarehouse}
                      </td>

                      {/* 5. Name of Warehouse / Container Offloader */}
                      <td className="py-3.5 px-3 max-w-[190px]">
                        <div className="text-xs font-bold text-slate-900">
                          {rec.warehouseName || 'Main Warehouse'}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Offloader:{' '}
                          <strong className="text-slate-900">
                            {rec.offloaderName}
                          </strong>
                        </div>
                      </td>

                      {/* 6. Name of Person */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1 text-xs font-bold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{rec.personName}</span>
                        </div>
                        {rec.lastUpdatedBy &&
                          rec.lastUpdatedBy !== rec.personName && (
                            <div className="text-[10px] text-slate-400">
                              Updated: {rec.lastUpdatedBy}
                            </div>
                          )}
                      </td>

                      {/* 7. Confirmation */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => setConfirmingRecord(rec)}
                          title="Click to change confirmation status"
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
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
                        {rec.confirmationNote && (
                          <div className="text-[11px] text-slate-500 mt-1 max-w-[140px]">
                            {rec.confirmationNote}
                          </div>
                        )}
                      </td>

                      {/* 8. Goods Condition (Good / Damaged) */}
                      <td className="py-3.5 px-3 max-w-[180px]">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
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

                      {/* 9. Unaccounted */}
                      <td className="py-3.5 px-3 max-w-[170px]">
                        {rec.hasUnaccounted ? (
                          <div className="inline-flex items-start space-x-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{rec.unaccountedDetails}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            None (0 Missing)
                          </span>
                        )}
                      </td>

                      {/* 10. Credit */}
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
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(rec);
                              setIsAddModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                            title="Update warehouse record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rec)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete record"
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

          {/* Mobile & Tablet Cards View (10 Fields Clearly Labeled) */}
          <div className="lg:hidden space-y-3">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5"
              >
                {/* Card Top Bar */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold uppercase">
                        {rec.containerName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          rec.confirmationStatus === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        7. {rec.confirmationStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          rec.goodsCondition === 'Good'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : rec.goodsCondition === 'Part Damaged'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        8. {rec.goodsCondition}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      1. {rec.goodsInStock}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      10. Credit
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

                {/* 10 Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      2. Goods Arrival (Date)
                    </span>
                    <span className="font-bold text-slate-900">
                      {rec.goodsArrivalDate}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      5. Warehouse / Container Offloader
                    </span>
                    <span className="font-bold text-slate-900">
                      {rec.warehouseName} • Offloader: {rec.offloaderName}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      3. Takeout from Container ({rec.containerName})
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.takeoutFromContainer}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      4. Takeout from Warehouse
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.takeoutFromWarehouse}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      8. Goods Condition Details
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.goodsCondition} — {rec.conditionDetails}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl p-2.5 border ${
                      rec.hasUnaccounted
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-transparent text-slate-800'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      9. Unaccounted (Missing Goods)
                    </span>
                    <span className="font-bold">{rec.unaccountedDetails}</span>
                  </div>
                </div>

                {/* Card Footer: Field 6 (Name of Person) + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900">
                      6. Person: {rec.personName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingRecord(rec)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      {rec.confirmationStatus === 'Confirmed'
                        ? 'Mark Pending'
                        : 'Confirm Tally'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(rec);
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
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

      {/* Quick Confirmation Modal */}
      {confirmingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleQuickToggleConfirm}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Update Field 7: Confirmation Status
              </h3>
              <button
                type="button"
                onClick={() => setConfirmingRecord(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Change confirmation for{' '}
              <strong>{confirmingRecord.containerName}</strong> (
              {confirmingRecord.goodsInStock}) to{' '}
              <strong>
                {confirmingRecord.confirmationStatus === 'Confirmed'
                  ? 'Pending'
                  : 'Confirmed'}
              </strong>
              .
            </p>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                6. Name of Person (Staff Confirming){' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={quickConfirmStaff}
                onChange={(e) => setQuickConfirmStaff(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingRecord(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Save Confirmation
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
            onNotify(
              `Successfully imported ${count} warehouse inventory records from uploaded sheet.`
            )
          }
        />
      )}
    </div>
  );
}
