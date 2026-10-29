'use client';

import React, { useState } from 'react';
import { Container, ContainerItem } from '@/lib/types';
import {
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  FileText,
  Trash2,
  Warehouse,
  Clock,
  ArrowDownRight,
  Edit2,
  Package,
  User,
  Phone,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  exportSingleContainerToExcel,
  exportSingleContainerToPdf,
} from '@/lib/exportUtils';
import {
  deleteItemFromContainer,
  updateContainer,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';
import { AddItemModal } from './AddItemModal';
import { RemoveItemModal } from './RemoveItemModal';
import { AddStockModal } from './AddStockModal';

interface ContainerDetailViewProps {
  container: Container;
  onBack: () => void;
}

type FilterStatus = 'all' | 'Not Taken' | 'Partial' | 'Taken' | 'credit';

export function ContainerDetailView({
  container,
  onBack,
}: ContainerDetailViewProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContainerItem | null>(null);
  const [selectedPickupItem, setSelectedPickupItem] =
    useState<ContainerItem | null>(null);
  const [selectedPaymentItem, setSelectedPaymentItem] =
    useState<ContainerItem | null>(null);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Edit container title/warehouse/note state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editName, setEditName] = useState(container.name);
  const [editWarehouse, setEditWarehouse] = useState(container.warehouse || '');
  const [editNote, setEditNote] = useState(container.note || '');
  const [editPersonName, setEditPersonName] = useState('');

  // Totals across this container
  const totalCbm = container.items.reduce((sum, item) => sum + item.cbm, 0);
  const totalAmount = container.items.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = container.items.reduce((sum, item) => sum + item.paid, 0);
  const totalCredit = container.items.reduce((sum, item) => sum + item.credit, 0);

  // Filtered items
  const filteredItems = container.items.filter((item) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'credit') return item.credit > 0;
    return item.takenStatus === filterStatus;
  });

  const handleDeleteItem = (item: ContainerItem) => {
    if (
      window.confirm(
        `Are you sure you want to delete customer record "${item.name}" from this container?`
      )
    ) {
      deleteItemFromContainer(container.id, item.id);
    }
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editWarehouse.trim() || !editPersonName.trim())
      return;
    updateContainer(
      container.id,
      editName.trim(),
      editWarehouse.trim(),
      editPersonName.trim(),
      editNote.trim()
    );
    setIsEditingTitle(false);
  };

  const isTitleEditValid =
    editName.trim().length > 0 &&
    editWarehouse.trim().length > 0 &&
    editPersonName.trim().length > 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 sm:pb-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 shadow-2xs transition-colors min-h-[42px]"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          <span>Back to All Containers</span>
        </button>

        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Deep Down Logistics · 10-Field Container Manifest
        </span>
      </div>

      {/* Container Header Banner */}
      <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {!isEditingTitle ? (
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-900">
                    Deep Down Logistics
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Created by:{' '}
                    <strong className="text-slate-700 font-semibold">
                      {container.createdBy || 'Staff'}
                    </strong>
                  </span>
                  {container.updatedBy && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        Updated by:{' '}
                        <strong className="text-slate-700 font-semibold">
                          {container.updatedBy}
                        </strong>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight break-words">
                    1. {container.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(container.name);
                      setEditWarehouse(container.warehouse || '');
                      setEditNote(container.note || '');
                      setEditPersonName(
                        getLastOperatorName() || container.updatedBy || ''
                      );
                      setIsEditingTitle(true);
                    }}
                    title="Edit container name, warehouse, or updater"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                    aria-label="Edit container information"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Warehouse className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>10. Warehouse: {container.warehouse || 'Not Specified'}</span>
                  </span>
                  {container.note && (
                    <span className="text-slate-500">· {container.note}</span>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSaveTitle}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-lg"
              >
                <span className="text-xs font-bold text-slate-900 block">
                  Update Container & Warehouse Info
                </span>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    1. Container Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    10. Default Warehouse *
                  </label>
                  <input
                    type="text"
                    required
                    value={editWarehouse}
                    onChange={(e) => setEditWarehouse(e.target.value)}
                    className="w-full text-base sm:text-sm font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Your Name (Person Updating) *</span>
                    </label>
                    <span className="text-[10px] font-bold uppercase text-amber-800">
                      Compulsory
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={editPersonName}
                    onChange={(e) => setEditPersonName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-base sm:text-sm font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Optional note"
                    className="w-full text-base sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!isTitleEditValid}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-colors min-h-[42px]"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition-colors min-h-[42px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddItemOpen(true);
              }}
              className="order-1 xs:order-3 sm:order-3 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Customer Record</span>
            </button>

            <div className="flex items-center gap-2 order-2 xs:order-1 sm:order-1">
              <button
                type="button"
                onClick={() => exportSingleContainerToExcel(container)}
                title="Download Excel Spreadsheet of this container (10 Fields)"
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors min-h-[42px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={() => exportSingleContainerToPdf(container)}
                title="Download PDF printout of this container (10 Fields)"
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors min-h-[42px]"
              >
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="mt-4 sm:mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Customers
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900">
              {container.items.length}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              4. Total CBM
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900">
              {totalCbm.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              5. Total Amount
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900">
              {formatMoney(totalAmount)}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              7. Total Paid
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-700">
              {formatMoney(totalPaid)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl bg-rose-50/60 border border-rose-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
              8. Total Credit
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-rose-600">
              {formatMoney(totalCredit)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
          {(
            [
              { id: 'all', label: `All (${container.items.length})` },
              {
                id: 'Not Taken',
                label: `Not Taken (${
                  container.items.filter((i) => i.takenStatus === 'Not Taken')
                    .length
                })`,
              },
              {
                id: 'Partial',
                label: `Partial (${
                  container.items.filter((i) => i.takenStatus === 'Partial')
                    .length
                })`,
              },
              {
                id: 'Taken',
                label: `Taken (${
                  container.items.filter((i) => i.takenStatus === 'Taken')
                    .length
                })`,
              },
              {
                id: 'credit',
                label: `Has Credit (${
                  container.items.filter((i) => i.credit > 0).length
                })`,
              },
            ] as { id: FilterStatus; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[34px] ${
                filterStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Switcher: Cards vs 10-Field Table */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[34px] ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>10-Field Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[34px] ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>10-Column Table</span>
          </button>
        </div>
      </div>

      {/* Customer Cargo Entries (All 10 Fields) */}
      {filteredItems.length === 0 ? (
        <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500">
            {container.items.length === 0
              ? 'This container has no customer cargo records yet.'
              : 'No records match the selected filter.'}
          </p>
          {container.items.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddItemOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Customer Record (10 Fields)</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* 10-COLUMN SPREADSHEET TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 whitespace-nowrap">1. Container</th>
                  <th className="py-3 px-3 whitespace-nowrap">2. Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">3. Phone</th>
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    4. CBM
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    5. Amount
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">6. Taken</th>
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    7. Paid
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    8. Credit
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">
                    9. Receiver&apos;s (Name, Phone & Date)
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">10. Warehouse</th>
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                      {item.containerName || container.name}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {item.name}
                      <span className="block text-[10px] font-normal text-slate-400">
                        By: {item.lastUpdatedBy || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {item.phone || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right whitespace-nowrap">
                      {item.cbm}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right whitespace-nowrap">
                      {formatMoney(item.amount)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          item.takenStatus === 'Taken'
                            ? 'text-emerald-700'
                            : item.takenStatus === 'Partial'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.taken}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700 text-right whitespace-nowrap">
                      {formatMoney(item.paid)}
                    </td>
                    <td
                      className={`py-3 px-3 font-mono font-bold text-right whitespace-nowrap ${
                        item.credit > 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {formatMoney(item.credit)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.receiverName ? (
                        <div>
                          <span className="font-semibold text-slate-900">
                            {item.receiverName}
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            {item.receiverPhone || 'No Tel'} ·{' '}
                            {item.receiverDate || 'No Date'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Not received yet
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {item.warehouse || container.warehouse}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPickupItem(item)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px]"
                          title="Update Taken & Receiver"
                        >
                          Pickup
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentItem(item)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[11px]"
                          title="Update Paid & Credit"
                        >
                          Pay
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsAddItemOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Edit all 10 fields"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* RESPONSIVE 10-FIELD CARDS VIEW */
        <div className="grid grid-cols-1 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs space-y-4 transition-all"
            >
              {/* Top Row: Fields 1, 2, 3, 10 */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>
                      <strong className="text-slate-700">1. Container:</strong>{' '}
                      {item.containerName || container.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="text-slate-700">10. Warehouse:</strong>{' '}
                      {item.warehouse || container.warehouse}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    2. {item.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>3. Phone: {item.phone || 'Not provided'}</span>
                    </span>
                    <span className="text-slate-400">
                      · Staff: <strong className="text-slate-700">{item.lastUpdatedBy || 'Staff'}</strong> ({item.lastUpdated})
                    </span>
                  </div>
                </div>

                {/* Status Indicator for Field 6 (Taken) */}
                <div className="self-start sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    6. Taken Status
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      item.takenStatus === 'Taken'
                        ? 'text-emerald-700'
                        : item.takenStatus === 'Partial'
                        ? 'text-amber-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {item.taken}
                  </span>
                </div>
              </div>

              {/* Middle Grid: Fields 4 (CBM), 5 (Amount), 7 (Paid), 8 (Credit), and 9 (Receiver's Name, Phone & Date) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {/* 4. CBM */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    4. CBM
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                    {item.cbm} <span className="text-xs font-normal text-slate-500">m³</span>
                  </span>
                </div>

                {/* 5. Amount */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    5. Amount
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                    {formatMoney(item.amount)}
                  </span>
                </div>

                {/* 7. Paid */}
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    7. Paid
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                    {formatMoney(item.paid)}
                  </span>
                </div>

                {/* 8. Credit */}
                <div
                  className={`p-3 rounded-xl border ${
                    item.credit > 0
                      ? 'bg-rose-50/60 border-rose-200/80'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      item.credit > 0 ? 'text-rose-800' : 'text-slate-500'
                    }`}
                  >
                    8. Credit (Owed)
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black font-mono ${
                      item.credit > 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {formatMoney(item.credit)}
                  </span>
                </div>

                {/* 9. Receiver's (Name, Phone Number & Date) */}
                <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    9. Receiver&apos;s (Name, Tel & Date)
                  </span>
                  {item.receiverName ? (
                    <div className="mt-0.5 text-xs">
                      <span className="font-bold text-slate-900 block truncate">
                        {item.receiverName}
                      </span>
                      <span className="text-slate-600 font-mono text-[11px] block">
                        {item.receiverPhone || 'No Phone'} ·{' '}
                        {item.receiverDate || 'No Date'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block mt-1">
                      Not received / No receiver yet
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() => setSelectedPickupItem(item)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Update Taken & Receiver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentItem(item)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Update Paid & Credit</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setIsAddItemOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit All 10 Fields</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    title="Delete customer record"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    aria-label="Delete customer record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Movement & Update History */}
      <div className="mt-6 sm:mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700 shrink-0" />
            <span>Container Update & Audit Log</span>
          </h2>
          <span className="text-xs text-slate-400">
            {container.history.length} records
          </span>
        </div>

        {container.history.length === 0 ? (
          <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 text-center">
            No updates logged yet.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
            {container.history.slice(0, 15).map((record) => (
              <div
                key={record.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-slate-900 text-sm font-bold">
                      {record.itemName}
                    </strong>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-semibold">
                      Staff: {record.personName}
                    </span>
                  </div>
                  <p className="text-slate-600 break-words">{record.summary}</p>
                </div>

                <div className="text-slate-400 text-[11px] font-mono shrink-0">
                  {record.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit All 10 Fields Modal */}
      {isAddItemOpen && (
        <AddItemModal
          key={editingItem ? editingItem.id : 'new-item'}
          isOpen={isAddItemOpen}
          containerId={container.id}
          containerName={container.name}
          defaultWarehouse={container.warehouse || ''}
          editingItem={editingItem}
          onClose={() => {
            setIsAddItemOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Update Pickup (Taken & Receiver) Modal */}
      {selectedPickupItem && (
        <RemoveItemModal
          key={selectedPickupItem.id}
          isOpen={!!selectedPickupItem}
          item={selectedPickupItem}
          containerId={container.id}
          containerName={container.name}
          onClose={() => setSelectedPickupItem(null)}
        />
      )}

      {/* Update Payment (Paid & Credit) Modal */}
      {selectedPaymentItem && (
        <AddStockModal
          key={selectedPaymentItem.id}
          isOpen={!!selectedPaymentItem}
          item={selectedPaymentItem}
          containerId={container.id}
          containerName={container.name}
          onClose={() => setSelectedPaymentItem(null)}
        />
      )}
    </div>
  );
}
