'use client';

import React, { useState } from 'react';
import { Container, ContainerItem } from '@/lib/types';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowDownRight,
  Package,
  Edit2
} from 'lucide-react';
import { exportSingleContainerToExcel, exportSingleContainerToPdf } from '@/lib/exportUtils';
import { removeItemFromContainer, addStockToItem, deleteItem, updateContainer } from '@/lib/storage';
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

  // Quick feedback banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalGoods = container.items.reduce((sum, item) => sum + item.quantity, 0);

  // Quick 1-tap decrement
  const handleQuickDecrement = (item: ContainerItem) => {
    if (item.quantity <= 0) return;
    removeItemFromContainer(container.id, item.id, 1, 'Quick 1-item take out');
    showToast(`Removed 1 ${item.unit} of "${item.name}". ${item.quantity - 1} left.`);
  };

  // Quick 1-tap increment
  const handleQuickIncrement = (item: ContainerItem) => {
    addStockToItem(container.id, item.id, 1, 'Quick 1-item stock add');
    showToast(`Added 1 ${item.unit} to "${item.name}". ${item.quantity + 1} total.`);
  };

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
    if (!editName.trim()) return;
    updateContainer(container.id, editName, editNote);
    setIsEditingTitle(false);
    showToast('Container details updated.');
  };

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
          
          <div>
            {!isEditingTitle ? (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 inline-block mb-1">
                  Deep Down Logistics
                </span>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {container.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditName(container.name);
                      setEditNote(container.note || '');
                      setIsEditingTitle(true);
                    }}
                    title="Edit container name or note"
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
              <form onSubmit={handleSaveTitle} className="space-y-2 max-w-md">
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-base sm:text-lg font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                />
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Optional location or note"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-xs"
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

      {/* Main Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700" />
            <span>Items Inside {container.name}</span>
          </h2>
          <span className="text-xs text-slate-500">
            Click <strong>Take Out</strong> when you remove an item
          </span>
        </div>

        {container.items.length === 0 ? (
          /* Empty container */
          <div className="text-center py-12 px-4 bg-white border border-dashed border-slate-300 rounded-2xl">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No goods inside this container yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add the goods currently packed in this container to know your exact count.
            </p>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm"
            >
              + Add First Item
            </button>
          </div>
        ) : (
          /* Items List */
          <div className="space-y-3">
            {container.items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Item Details */}
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span>Added: {item.addedDate}</span>
                    <span>•</span>
                    <span>Updated: {item.lastUpdated}</span>
                  </div>
                </div>

                {/* Big Quantity Display */}
                <div className="flex items-baseline space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 sm:self-center">
                  <span className={`text-2xl sm:text-3xl font-black font-mono ${item.quantity > 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    {item.quantity}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {item.unit} left
                  </span>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  
                  {/* Quick 1-tap [- 1] */}
                  <button
                    onClick={() => handleQuickDecrement(item)}
                    disabled={item.quantity <= 0}
                    title="Quickly take out 1"
                    className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-amber-100 border border-slate-200 text-amber-900 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4 inline" />
                    <span className="hidden sm:inline ml-0.5">1</span>
                  </button>

                  {/* Main Take Out Button */}
                  <button
                    onClick={() => setSelectedRemoveItem(item)}
                    disabled={item.quantity <= 0}
                    className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    - Take Out Goods
                  </button>

                  {/* Quick 1-tap [+ 1] */}
                  <button
                    onClick={() => handleQuickIncrement(item)}
                    title="Quickly add 1"
                    className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-emerald-100 border border-slate-200 text-emerald-900 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4 inline" />
                    <span className="hidden sm:inline ml-0.5">1</span>
                  </button>

                  {/* Add More Stock Button */}
                  <button
                    onClick={() => setSelectedAddStockItem(item)}
                    className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    + Add More
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
            <span>Goods Taken Out & Movement History</span>
          </h2>
          <span className="text-xs text-slate-400">
            {container.history.length} records logged
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

              return (
                <div key={record.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                      isRemoved 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {isRemoved ? <ArrowDownRight className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          isRemoved ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isRemoved ? 'Took Out' : 'Added'}
                        </span>
                        <strong className="text-slate-900 text-sm font-semibold">{record.itemName}</strong>
                        <span className="font-mono font-bold text-slate-800">
                          ({isRemoved ? `-${record.amount}` : `+${record.amount}`})
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
                      Remaining Left: {record.quantityAfter}
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
