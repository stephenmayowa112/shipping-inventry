'use client';

import React, { useState } from 'react';
import { Container, ContainerItem, WAREHOUSE_NAMES } from '@/lib/types';
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
  CheckCircle2,
  Upload,
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
import { UploadManifestModal } from './UploadManifestModal';

interface ContainerDetailViewProps {
  container: Container;
  onBack: () => void;
}

export function ContainerDetailView({
  container,
  onBack,
}: ContainerDetailViewProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isUploadManifestOpen, setIsUploadManifestOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContainerItem | null>(null);
  const [selectedPickupItem, setSelectedPickupItem] =
    useState<ContainerItem | null>(null);
  const [selectedPaymentItem, setSelectedPaymentItem] =
    useState<ContainerItem | null>(null);

  // Edit container title/warehouse state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editName, setEditName] = useState(container.name);
  const [editWarehouse, setEditWarehouse] = useState(container.warehouse || '');
  const [editNote, setEditNote] = useState(container.note || '');
  const [editPersonName, setEditPersonName] = useState('');

  const handleDeleteItem = (item: ContainerItem) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
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
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Containers</span>
        </button>
      </div>

      {/* Container Header & Action Buttons */}
      <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {!isEditingTitle ? (
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 break-words">
                    {container.name}
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
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                    title="Edit Container"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Warehouse className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Warehouse: {container.warehouse || 'Not Set'}</span>
                  </span>
                  <span>
                    Updated by:{' '}
                    <strong className="text-slate-800">
                      {container.updatedBy || container.createdBy || 'Staff'}
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSaveTitle}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-lg"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Container Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm font-bold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    required
                    value={editWarehouse || WAREHOUSE_NAMES[0]}
                    onChange={(e) => setEditWarehouse(e.target.value)}
                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 min-h-[44px]"
                  >
                    {editWarehouse &&
                      !WAREHOUSE_NAMES.includes(editWarehouse) && (
                        <option value={editWarehouse}>{editWarehouse}</option>
                      )}
                    {WAREHOUSE_NAMES.map((wh) => (
                      <option key={wh} value={wh}>
                        {wh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Your Name (Staff Updating) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPersonName}
                    onChange={(e) => setEditPersonName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-sm font-medium bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 min-h-[44px]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!isTitleEditValid}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold min-h-[42px]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold min-h-[42px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Responsive Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportSingleContainerToExcel(container)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => exportSingleContainerToPdf(container)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadManifestOpen(true)}
              className="col-span-2 sm:col-span-1 px-4 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 min-h-[46px]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Manifest</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddItemOpen(true);
              }}
              className="col-span-2 sm:col-span-1 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-1.5 min-h-[46px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Cargo List */}
      {container.items.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm sm:text-base font-bold text-slate-700">
            No customer records in this container yet.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setIsUploadManifestOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm min-h-[46px]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Manifest</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddItemOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm min-h-[46px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Large screens) */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-3">Container</th>
                    <th className="py-3.5 px-3">Name</th>
                    <th className="py-3.5 px-3">Phone</th>
                    <th className="py-3.5 px-3 text-right">CBM</th>
                    <th className="py-3.5 px-3 text-right">Amount</th>
                    <th className="py-3.5 px-3">Taken</th>
                    <th className="py-3.5 px-3 text-right">Paid</th>
                    <th className="py-3.5 px-3 text-right">Credit</th>
                    <th className="py-3.5 px-3">Receiver (Name, Phone & Date)</th>
                    <th className="py-3.5 px-3">Warehouse</th>
                    <th className="py-3.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {container.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                        {item.containerName || container.name}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {item.name}
                        <span className="block text-[11px] font-normal text-slate-400">
                          By: {item.lastUpdatedBy || 'Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        {item.phone || '-'}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 text-right whitespace-nowrap">
                        {item.cbm}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="py-3.5 px-3">
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
                      <td className="py-3.5 px-3 font-bold text-emerald-700 text-right whitespace-nowrap">
                        {formatMoney(item.paid)}
                      </td>
                      <td
                        className={`py-3.5 px-3 font-bold text-right whitespace-nowrap ${
                          item.credit > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {formatMoney(item.credit)}
                      </td>
                      <td className="py-3.5 px-3">
                        {item.receiverName ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {item.receiverName}
                            </span>
                            <span className="text-slate-500 text-xs block">
                              {item.receiverPhone || '-'} ·{' '}
                              {item.receiverDate || '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not collected</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        {item.warehouse || container.warehouse}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPickupItem(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs"
                          >
                            Pickup
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentItem(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs"
                          >
                            Pay
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setIsAddItemOpen(true);
                            }}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
            {container.items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5"
              >
                {/* Customer Name & Phone */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 break-words">
                      {item.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 mt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.phone || 'No phone'}</span>
                      </span>
                      <span>
                        Warehouse:{' '}
                        <strong className="text-slate-800">
                          {item.warehouse || container.warehouse}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                      item.takenStatus === 'Taken'
                        ? 'bg-emerald-50 text-emerald-800'
                        : item.takenStatus === 'Partial'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.takenStatus}
                  </span>
                </div>

                {/* Key Fields Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-sm">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      CBM
                    </span>
                    <span className="font-black text-slate-900">
                      {item.cbm}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Amount
                    </span>
                    <span className="font-black text-slate-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60">
                    <span className="text-[11px] font-bold uppercase text-emerald-800 block">
                      Paid
                    </span>
                    <span className="font-black text-emerald-700">
                      {formatMoney(item.paid)}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl ${
                      item.credit > 0 ? 'bg-rose-50/70' : 'bg-slate-50'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase block ${
                        item.credit > 0 ? 'text-rose-800' : 'text-slate-400'
                      }`}
                    >
                      Credit
                    </span>
                    <span
                      className={`font-black ${
                        item.credit > 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {formatMoney(item.credit)}
                    </span>
                  </div>
                </div>

                {/* Taken & Receiver Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Taken
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.taken}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Receiver (Name, Phone & Date)
                    </span>
                    {item.receiverName ? (
                      <span className="font-semibold text-slate-900 block">
                        {item.receiverName} ({item.receiverPhone || '-'}) ·{' '}
                        {item.receiverDate || '-'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Not collected yet</span>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPickupItem(item)}
                    className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[42px]"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Update Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentItem(item)}
                    className="px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[42px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update Payment</span>
                  </button>

                  <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setIsAddItemOpen(true);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[42px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="min-h-[42px] min-w-[42px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

      {/* Simple Activity Log */}
      {container.history.length > 0 && (
        <div className="pt-4 space-y-2.5">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Recent Updates</span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {container.history.slice(0, 8).map((record) => (
              <div
                key={record.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <div>
                  <strong className="text-slate-900 font-bold">
                    {record.itemName}
                  </strong>{' '}
                  <span className="text-slate-500">
                    (by {record.personName})
                  </span>
                  <p className="text-slate-600 mt-0.5">{record.summary}</p>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {record.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
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

      {isUploadManifestOpen && (
        <UploadManifestModal
          isOpen={isUploadManifestOpen}
          onClose={() => setIsUploadManifestOpen(false)}
          targetContainerId={container.id}
          targetContainerName={container.name}
          defaultWarehouse={container.warehouse || ''}
          onManifestImported={() => setIsUploadManifestOpen(false)}
        />
      )}
    </div>
  );
}
