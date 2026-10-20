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
  Clock, 
  ArrowDownRight, 
  Edit2,
  Package,
  User,
  ArrowUpRight
} from 'lucide-react';
import { exportSingleContainerToExcel, exportSingleContainerToPdf } from '@/lib/exportUtils';
import { 
  deleteItemFromContainer, 
  updateContainerTitle,
  getLastOperatorName
} from '@/lib/storage';
import { AddItemModal } from './AddItemModal';
import { RemoveItemModal } from './RemoveItemModal';
import { AddStockModal } from './AddStockModal';

interface ContainerDetailViewProps {
  container: Container;
  onBack: () => void;
}

export function ContainerDetailView({ container, onBack }: ContainerDetailViewProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedRemoveItem, setSelectedRemoveItem] = useState<ContainerItem | null>(null);
  const [selectedAddStockItem, setSelectedAddStockItem] = useState<ContainerItem | null>(null);

  // Edit container title/note state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editName, setEditName] = useState(container.name);
  const [editNote, setEditNote] = useState(container.note || '');
  const [editPersonName, setEditPersonName] = useState('');

  // Total count of goods currently in this container
  const totalGoods = container.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleDeleteItem = (item: ContainerItem) => {
    if (window.confirm(`Are you sure you want to completely remove "${item.name}" from this container?`)) {
      deleteItemFromContainer(container.id, item.id);
    }
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPersonName.trim()) return;
    updateContainerTitle(container.id, editName.trim(), editPersonName.trim(), editNote.trim());
    setIsEditingTitle(false);
  };

  const isTitleEditValid = editName.trim().length > 0 && editPersonName.trim().length > 0;

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
          Deep Down Logistics Yard
        </span>
      </div>

      {/* Container Header Banner */}
      <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          <div className="flex-1 min-w-0">
            {!isEditingTitle ? (
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
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
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight break-words">
                    {container.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(container.name);
                      setEditNote(container.note || '');
                      setEditPersonName(getLastOperatorName() || container.updatedBy || '');
                      setIsEditingTitle(true);
                    }}
                    title="Edit container name, note, or updater"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
                    aria-label="Edit container information"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {container.note && (
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
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
                    className="w-full text-base sm:text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
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
                    className="w-full text-base sm:text-sm font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
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

          {/* Action buttons (Mobile-first responsive row) */}
          <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddItemOpen(true)}
              className="order-1 xs:order-3 sm:order-3 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Goods</span>
            </button>

            <div className="flex items-center gap-2 order-2 xs:order-1 sm:order-1">
              <button
                type="button"
                onClick={() => exportSingleContainerToExcel(container)}
                title="Download Excel Spreadsheet of this container"
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors min-h-[42px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => exportSingleContainerToPdf(container)}
                title="Download PDF printout of this container"
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors min-h-[42px]"
              >
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

        </div>

        {/* Big Key Counter */}
        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-700">
              {totalGoods}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Goods Remaining Inside
            </span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {container.items.length} Distinct Products
          </span>
        </div>

      </div>

      {/* Goods Inside Container */}
      <div className="space-y-3">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700 shrink-0" />
            <span>Items Inside Container</span>
          </h2>
          <span className="text-xs text-slate-500">
            Tap <strong>Take Out</strong> when goods leave the container
          </span>
        </div>

        {container.items.length === 0 ? (
          <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
            <p className="text-sm text-slate-500">
              This container is currently empty.
            </p>
            <button
              type="button"
              onClick={() => setIsAddItemOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm min-h-[44px]"
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
                className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all"
              >
                {/* Item Details */}
                <div className="flex items-start sm:items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-800 leading-none">
                      {item.quantity}
                    </span>
                    <span className="text-[9px] font-medium text-emerald-700 truncate max-w-[40px]">
                      {item.unit}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight break-words">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center flex-wrap gap-1 mt-0.5">
                      <span>Unit: <strong className="text-slate-700 font-semibold">{item.unit}</strong></span>
                      {item.addedBy && (
                        <span>• Stocked by: <strong className="text-slate-700 font-semibold">{item.addedBy}</strong></span>
                      )}
                      <span className="text-slate-400">
                        • {item.lastUpdated}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Remove & Add Actions - Mobile touch optimized */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  
                  {/* Take Out Goods Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedRemoveItem(item)}
                    disabled={item.quantity <= 0}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[42px] flex items-center justify-center space-x-1"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Take Out Goods</span>
                  </button>

                  {/* Add More Stock Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedAddStockItem(item)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 text-emerald-900 font-bold text-xs sm:text-sm transition-colors min-h-[42px] flex items-center justify-center space-x-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+ Add Stock</span>
                  </button>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    title="Delete this item"
                    className="min-h-[42px] min-w-[42px] flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors shrink-0"
                    aria-label="Delete item record"
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
      <div className="mt-6 sm:mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700 shrink-0" />
            <span>Goods Taken Out & Update History</span>
          </h2>
          <span className="text-xs text-slate-400">
            {container.history.length} records
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
                <div key={record.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-start space-x-2.5 min-w-0">
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
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          isRemoved 
                            ? 'bg-amber-100 text-amber-900' 
                            : isUpdated
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isRemoved ? 'Took Out' : isUpdated ? 'Updated' : 'Added Stock'}
                        </span>
                        <strong className="text-slate-900 text-sm font-semibold break-words">{record.itemName}</strong>
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
                        <p className="text-slate-500 mt-1 italic break-words">
                          &ldquo;{record.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-slate-500 text-[11px] sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-50">
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
