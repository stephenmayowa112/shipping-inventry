'use client';

import React, { useState } from 'react';
import { Container, ContainerItem } from '@/lib/types';
import { 
  ArrowLeft, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowDownRight,
  Package,
  Edit2,
  User
} from 'lucide-react';
import { exportSingleContainerToExcel, exportSingleContainerToPdf } from '@/lib/exportUtils';
import { deleteItem, updateContainer, getLastOperatorName } from '@/lib/storage';
import { AddItemModal } from './AddItemModal';
import { RemoveItemModal } from './RemoveItemModal';
import { AddStockModal } from './AddStockModal';

interface ContainerDetailViewProps {
  container: Container;
  onBack: () => void;
}

export function ContainerDetailView({
  container,
  onBack
}: ContainerDetailViewProps) {
  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedRemoveItem, setSelectedRemoveItem] = useState<ContainerItem | null>(null);
  const [selectedAddStockItem, setSelectedAddStockItem] = useState<ContainerItem | null>(null);

  // Editing container title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editName, setEditName] = useState(container.name);
  const [editNote, setEditNote] = useState(container.note || '');
  const [editPersonName, setEditPersonName] = useState('');

  // Quick feedback banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalGoods = container.items.reduce((sum, item) => sum + item.quantity, 0);

  // Delete item
  const handleDeleteItem = (item: ContainerItem) => {
    if (window.confirm(`Delete "${item.name}" from this container?`)) {
      deleteItem(container.id, item.id);
      showToast(`Deleted "${item.name}".`);
    }
  };

  // Save container name edit
  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPersonName.trim()) return;
    updateContainer(container.id, editName, editPersonName, editNote);
    setIsEditingTitle(false);
    showToast(`Container updated by ${editPersonName.trim()}.`);
  };

  const isTitleEditValid = editName.trim().length > 0 && editPersonName.trim().length > 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to All Containers</span>
        </button>
      </div>

      {/* Instant Notification Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Container Header Banner */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex-1">
            {!isEditingTitle ? (
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Deep Down Logistics
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Created by: <strong className="text-slate-700 font-semibold">{container.createdBy || 'Staff'}</strong></span>
                  </span>
                  {container.updatedBy && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      • Updated by: <strong className="text-slate-700 font-semibold">{container.updatedBy}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {container.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditName(container.name);
                      setEditNote(container.note || '');
                      setEditPersonName(getLastOperatorName() || container.updatedBy || '');
                      setIsEditingTitle(true);
                    }}
                    title="Edit container name, note, or updater"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {container.note && (
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{container.note}</span>
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveTitle} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-lg">
                <span className="text-xs font-bold text-slate-900 block">
                  Update Container Information
                </span>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Container Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm sm:text-base font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Your Name (Person Updating) *</span>
                    </label>
                    <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Compulsory
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={editPersonName}
                    onChange={(e) => setEditPersonName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xs sm:text-sm font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Location or Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Optional location or note"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!isTitleEditValid}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => exportSingleContainerToExcel(container)}
              title="Download Excel Spreadsheet of this container"
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => exportSingleContainerToPdf(container)}
              title="Download PDF printout of this container"
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Goods</span>
            </button>
          </div>

        </div>

        {/* Big Key Counter */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-700">
              {totalGoods}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Goods Remaining Inside
            </span>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {container.items.length} Distinct Products
          </span>
        </div>

      </div>

      {/* Goods Inside Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700" />
            <span>Items Inside Container</span>
          </h2>
          <span className="text-xs text-slate-500">
            Click <strong>Take Out</strong> when goods are removed from container
          </span>
        </div>

        {container.items.length === 0 ? (
          <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
            <p className="text-sm text-slate-500">
              This container is currently empty.
            </p>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Item</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {container.items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                {/* Item Details */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                      {item.quantity}
                    </span>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Unit: <span className="font-semibold text-slate-700">{item.unit}</span>
                        {item.addedBy && (
                          <span className="ml-2">
                            • Stocked by: <span className="font-semibold text-slate-700">{item.addedBy}</span>
                          </span>
                        )}
                        <span className="ml-2 text-slate-400">
                          (Updated: {item.lastUpdated})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove & Add Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  
                  {/* Take Out Goods Button */}
                  <button
                    onClick={() => setSelectedRemoveItem(item)}
                    disabled={item.quantity <= 0}
                    className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    - Take Out Goods
                  </button>

                  {/* Add More Stock Button */}
                  <button
                    onClick={() => setSelectedAddStockItem(item)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs sm:text-sm transition-colors"
                  >
                    + Add Stock
                  </button>

                  {/* Delete Item */}
                  <button
                    onClick={() => handleDeleteItem(item)}
                    title="Delete this item"
                    className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Movement & Removal History */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <span>Goods Taken Out & Update History</span>
          </h2>
          <span className="text-xs text-slate-400">
            {container.history.length} audit records
          </span>
        </div>

        {container.history.length === 0 ? (
          <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 text-center">
            No removals or stock movements logged yet.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
            {container.history.slice(0, 15).map((record) => {
              const isRemoved = record.action === 'removed';
              const isUpdated = record.action === 'updated';

              return (
                <div key={record.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                      isRemoved 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : isUpdated
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {isRemoved ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : isUpdated ? (
                        <Edit2 className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          isRemoved 
                            ? 'bg-amber-100 text-amber-900' 
                            : isUpdated
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isRemoved ? 'Took Out' : isUpdated ? 'Updated' : 'Added Stock'}
                        </span>
                        <strong className="text-slate-900 text-sm font-semibold">{record.itemName}</strong>
                        {record.amount > 0 && (
                          <span className="font-mono font-bold text-slate-800">
                            ({isRemoved ? `-${record.amount}` : `+${record.amount}`})
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>By: {record.personName}</span>
                        </span>
                      </div>
                      {record.note && (
                        <p className="text-slate-500 mt-1 italic">
                          &ldquo;{record.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-slate-500 text-[11px] sm:text-right shrink-0">
                    <span className="font-mono font-semibold text-slate-800">
                      Balance: {record.quantityAfter}
                    </span>
                    <span>{record.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemOpen}
        containerId={container.id}
        containerName={container.name}
        onClose={() => setIsAddItemOpen(false)}
      />

      {/* Remove Item Modal */}
      <RemoveItemModal
        isOpen={!!selectedRemoveItem}
        item={selectedRemoveItem}
        containerId={container.id}
        containerName={container.name}
        onClose={() => setSelectedRemoveItem(null)}
      />

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={!!selectedAddStockItem}
        item={selectedAddStockItem}
        containerId={container.id}
        containerName={container.name}
        onClose={() => setSelectedAddStockItem(null)}
      />

    </div>
  );
}
