'use client';

import React, { useState } from 'react';
import { Container, ContainerItem, StockTransaction, UserProfile, ContainerStatus } from '@/lib/types';
import { updateContainerStatus } from '@/lib/storage';
import { exportContainersToExcel, generateContainerPdf } from '@/lib/exportUtils';
import { 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  FileText, 
  QrCode, 
  X, 
  Calendar, 
  MapPin, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Boxes
} from 'lucide-react';
import { formatDisplayDate, formatDisplayDateOnly } from '@/lib/utils';

interface ContainerDetailModalProps {
  container: Container | null;
  items: ContainerItem[];
  transactions: StockTransaction[];
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenStockIn: (containerId: string) => void;
  onOpenStockOut: (containerId: string, itemId?: string) => void;
  onOpenTransfer: (containerId: string, itemId?: string) => void;
  onOpenAdjustment: (containerId: string, itemId?: string) => void;
  onSelectShipmentRef: (shipmentRef: string) => void;
}

export function ContainerDetailModal({
  container,
  items,
  transactions,
  currentUser,
  isOpen,
  onClose,
  onOpenStockIn,
  onOpenStockOut,
  onOpenTransfer,
  onOpenAdjustment,
  onSelectShipmentRef
}: ContainerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'barcode'>('inventory');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !container) return null;

  const containerItems = items.filter(i => i.containerId === container.id);
  const containerTransactions = transactions.filter(t => t.containerId === container.id);

  const totalReceived = containerItems.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
  const totalDispatched = containerItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
  const totalBalance = containerItems.reduce((acc, curr) => acc + curr.balance, 0);
  const dispatchPercentage = totalReceived > 0 ? Math.round((totalDispatched / totalReceived) * 100) : 0;

  const handleStatusChange = (newStatus: ContainerStatus) => {
    updateContainerStatus(container.id, newStatus);
    setIsUpdatingStatus(false);
  };

  const getStatusBadge = (status: ContainerStatus) => {
    switch (status) {
      case 'expected':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'arrived':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'unloading':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'stored':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'partially_dispatched':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'departed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getConditionBadge = (condition: ContainerItem['condition']) => {
    switch (condition) {
      case 'intact':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'minor_damage':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'damaged':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs shrink-0">
              <Boxes className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-slate-900">
                  {container.containerNumber}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(container.status)} uppercase tracking-wider`}>
                  {container.status.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                  {container.shippingLine}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {container.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {container.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Arrived: {container.arrivalDate} {container.arrivalTime}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  Seal: {container.sealNumber}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-center">
            {/* Quick Export buttons */}
            <button
              onClick={() => generateContainerPdf(container, containerItems, containerTransactions)}
              title="Download Container Manifest & Stock Ledger PDF"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exportContainersToExcel([container], containerItems)}
              title="Export Container Inventory to Excel (.xlsx)"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Operational Specs Bar */}
        <div className="bg-slate-50/60 px-6 py-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Consignee (Customer)</span>
            <span className="font-semibold text-slate-800 truncate block">{container.customer}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Consignor (Supplier)</span>
            <span className="font-semibold text-slate-800 truncate block">{container.supplier}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Linked Shipment</span>
            <button
              onClick={() => onSelectShipmentRef(container.shipmentRef)}
              className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              {container.shipmentRef}
            </button>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Weight Specs</span>
            <span className="font-mono text-slate-700">
              Tare: {(container.tareWeightKg / 1000).toFixed(1)}t • Max: {(container.maxPayloadKg / 1000).toFixed(1)}t
            </span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-xs font-medium">Total Received</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-slate-900">{totalReceived.toLocaleString()}</span>
              <span className="text-[11px] text-slate-500">units</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-xs font-medium">Total Dispatched</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-amber-700">{totalDispatched.toLocaleString()}</span>
              <span className="text-[11px] text-amber-700 font-medium">{dispatchPercentage}% released</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-xs font-medium">Current Stock Balance</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-xl font-bold font-mono ${totalBalance > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {totalBalance.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">on hand</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Discharge Status</span>
              <span className="text-[10px] font-mono text-slate-800 font-semibold">
                {totalBalance === 0 ? 'CLEARED' : totalDispatched > 0 ? 'PARTIAL' : 'FULL STOCK'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-slate-800 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, dispatchPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation & Action Launchpad */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'inventory' 
                  ? 'bg-slate-100 text-slate-900 shadow-2xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Container Inventory ({containerItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'history' 
                  ? 'bg-slate-100 text-slate-900 shadow-2xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Movement History ({containerTransactions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('barcode')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'barcode' 
                  ? 'bg-slate-100 text-slate-900 shadow-2xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode Manifest</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStockIn(container.id)}
              disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Stock-In</span>
            </button>

            <button
              onClick={() => onOpenStockOut(container.id)}
              disabled={currentUser.role === 'management_viewer' || currentUser.role === 'inventory_officer' || totalBalance <= 0}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
              <span>- Stock-Out</span>
            </button>

            {/* Change Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-1"
              >
                <span>Status</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {isUpdatingStatus && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Set Status:</div>
                  {(['expected', 'arrived', 'unloading', 'stored', 'partially_dispatched', 'completed', 'departed'] as ContainerStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between ${
                        container.status === st ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span className="capitalize">{st.replace('_', ' ')}</span>
                      {container.status === st && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: Container Inventory Contents */}
        {activeTab === 'inventory' && (
          <div className="p-6 overflow-y-auto flex-1">
            {containerItems.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-slate-800">No goods recorded in this container yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Register goods received from shipment {container.shipmentRef} into this container to track inventory.
                </p>
                <button
                  onClick={() => onOpenStockIn(container.id)}
                  disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                >
                  Record First Stock-In
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Item & SKU</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Unit</th>
                      <th className="py-3 px-3 text-right">Received</th>
                      <th className="py-3 px-3 text-right">Dispatched</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-800">Current Balance</th>
                      <th className="py-3 px-3">Storage Location</th>
                      <th className="py-3 px-3">Condition</th>
                      <th className="py-3 px-3 text-center">Row Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {containerItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{item.itemName}</div>
                          <div className="text-[11px] font-mono text-blue-600 mt-0.5">{item.sku}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{item.category}</td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                          {item.receivedQuantity.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-700">
                          {item.dispatchedQuantity.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                          <span className={item.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            {item.balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                          {item.storageLocation}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getConditionBadge(item.condition)} uppercase`}>
                            {item.condition.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => onOpenStockOut(container.id, item.id)}
                              disabled={item.balance <= 0 || currentUser.role === 'management_viewer' || currentUser.role === 'inventory_officer'}
                              title="Dispatch from this item"
                              className="p-1 rounded hover:bg-slate-100 text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUpFromLine className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenTransfer(container.id, item.id)}
                              disabled={item.balance <= 0 || currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
                              title="Transfer location"
                              className="p-1 rounded hover:bg-slate-100 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenAdjustment(container.id, item.id)}
                              disabled={currentUser.role !== 'admin' && currentUser.role !== 'warehouse_manager'}
                              title={
                                currentUser.role === 'admin' || currentUser.role === 'warehouse_manager'
                                  ? 'Reconcile / Adjust Stock Variance'
                                  : 'Requires Warehouse Manager or Admin'
                              }
                              className="p-1 rounded hover:bg-slate-100 text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chronological Movement History */}
        {activeTab === 'history' && (
          <div className="p-6 overflow-y-auto flex-1">
            {containerTransactions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No stock transactions logged for this container yet.
              </div>
            ) : (
              <div className="space-y-3">
                {containerTransactions.map((tx) => {
                  const isStockIn = tx.type === 'stock_in';
                  const isStockOut = tx.type === 'stock_out';
                  const isTransfer = tx.type === 'transfer';
                  const isAdjustment = tx.type === 'adjustment';

                  return (
                    <div 
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg border mt-0.5 ${
                          isStockIn 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : isStockOut 
                            ? 'bg-amber-50 border-amber-200 text-amber-700' 
                            : isTransfer 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}>
                          {isStockIn && <ArrowDownToLine className="w-4 h-4" />}
                          {isStockOut && <ArrowUpFromLine className="w-4 h-4" />}
                          {isTransfer && <ArrowLeftRight className="w-4 h-4" />}
                          {isAdjustment && <SlidersHorizontal className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{tx.itemName}</span>
                            <span className="font-mono text-blue-600 text-[11px] font-semibold">{tx.sku}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                              isStockIn 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isStockOut 
                                ? 'bg-amber-100 text-amber-800' 
                                : isTransfer 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {tx.type.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-slate-600 mt-1">
                            Ref: <span className="font-mono text-slate-900 font-semibold">{tx.referenceNumber}</span> • 
                            Location/Recipient: <span className="text-slate-800 font-medium">{tx.recipientOrLocation}</span>
                          </p>

                          {tx.reason && (
                            <p className="text-slate-500 text-[11px] italic mt-0.5">
                              &ldquo;{tx.reason}&rdquo; {tx.notes && `— ${tx.notes}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 shrink-0">
                        <div className="text-right">
                          <span className={`font-mono text-sm font-bold ${
                            tx.quantity > 0 && isStockIn ? 'text-emerald-700' : isStockOut ? 'text-amber-700' : 'text-slate-900'
                          }`}>
                            {tx.type === 'stock_in' ? `+${tx.quantity}` : tx.type === 'stock_out' ? `-${tx.quantity}` : `${tx.quantity > 0 ? '+' : ''}${tx.quantity}`} {tx.unit}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Balance: {tx.balanceBefore} → <strong className="text-slate-900">{tx.balanceAfter}</strong>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 text-right mt-1">
                          <span>{formatDisplayDate(tx.timestamp)}</span>
                          <span className="block font-medium text-slate-700">By: {tx.authorizedBy} ({tx.officerRole})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Barcode & QR Label Sheet */}
        {activeTab === 'barcode' && (
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            <div className="max-w-md mx-auto bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm font-mono text-center">
              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
                  TERMINAL YARD TALLY MANIFEST
                </span>
                <h3 className="text-2xl font-black tracking-widest mt-1">
                  {container.containerNumber}
                </h3>
                <span className="text-xs font-bold text-slate-700">
                  {container.shippingLine} • {container.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Barcode Visual simulation */}
              <div className="my-4 py-3 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center">
                <div className="h-16 w-64 flex items-stretch justify-center space-x-1">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`bg-slate-900 ${i % 3 === 0 ? 'w-1.5' : i % 5 === 0 ? 'w-2' : 'w-0.5'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs tracking-widest font-mono font-bold mt-2">
                  *{container.containerNumber}*
                </span>
              </div>

              <div className="text-left text-xs space-y-1.5 border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipment Ref:</span>
                  <span className="font-bold">{container.shipmentRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Arrival Date:</span>
                  <span className="font-bold">{container.arrivalDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Depot Bay / Slot:</span>
                  <span className="font-bold">{container.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seal Serial:</span>
                  <span className="font-bold">{container.sealNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignee:</span>
                  <span className="font-bold truncate max-w-[200px]">{container.customer}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span>Current Inventory Units:</span>
                  <span className="text-emerald-700">{totalBalance} units</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="mt-6 w-full py-2.5 rounded-lg bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Print Terminal Tally Label
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Container ID: {container.id} • Created: {formatDisplayDateOnly(container.createdAt)}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          >
            Close Page
          </button>
        </div>

      </div>
    </div>
  );
}
