'use client';

import React from 'react';
import { Container, Shipment, ContainerItem, StockTransaction, UserProfile } from '@/lib/types';
import { 
  Boxes, 
  Ship, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Clock, 
  MapPin, 
  PlusCircle, 
  ArrowRight,
  Warehouse
} from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface DashboardViewProps {
  containers: Container[];
  shipments: Shipment[];
  items: ContainerItem[];
  transactions: StockTransaction[];
  currentUser: UserProfile;
  onSelectContainer: (container: Container) => void;
  onOpenRegisterModal: () => void;
  onOpenStockInModal: () => void;
  onOpenStockOutModal: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'containers' | 'shipments' | 'reports') => void;
}

export function DashboardView({
  containers,
  shipments,
  items,
  transactions,
  currentUser,
  onSelectContainer,
  onOpenRegisterModal,
  onOpenStockInModal,
  onOpenStockOutModal,
  onNavigateToTab
}: DashboardViewProps) {
  // Aggregate Metrics
  const totalContainers = containers.length;
  const atDepotContainers = containers.filter(c => c.status !== 'departed' && c.status !== 'completed').length;
  const awaitingUnloading = containers.filter(c => c.status === 'expected' || c.status === 'arrived' || c.status === 'unloading').length;
  const partiallyReleased = containers.filter(c => c.status === 'partially_dispatched').length;
  const totalShipments = shipments.length;

  const totalReceivedUnits = items.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
  const totalDispatchedUnits = items.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
  const currentTotalStockBalance = items.reduce((acc, curr) => acc + curr.balance, 0);
  const overallTurnaroundRate = totalReceivedUnits > 0 ? Math.round((totalDispatchedUnits / totalReceivedUnits) * 100) : 0;

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  // Active containers (top 4 needing attention)
  const priorityContainers = containers
    .filter(c => c.status !== 'completed' && c.status !== 'departed')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-semibold text-blue-600 uppercase tracking-wider">
              Warehouse & Terminal Control
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Container & Inventory Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operating as <strong className="text-slate-800 font-medium">{currentUser.name}</strong> ({currentUser.department}) • Role: <span className="font-mono text-slate-700 uppercase font-semibold">{currentUser.role.replace('_', ' ')}</span>
          </p>
        </div>

        {/* Action launch buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenRegisterModal}
            disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Container</span>
          </button>

          <button
            onClick={onOpenStockInModal}
            disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Record Stock-In</span>
          </button>

          <button
            onClick={onOpenStockOutModal}
            disabled={currentUser.role === 'management_viewer' || currentUser.role === 'inventory_officer'}
            className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
            <span>Dispatch Cargo</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics - Clean minimalist cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Containers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Containers at Depot</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-3">
            <span className="text-3xl font-bold font-mono text-slate-900">{atDepotContainers}</span>
            <span className="text-xs text-slate-500">of {totalContainers} registered</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            <span className="text-blue-700 font-semibold">{awaitingUnloading} awaiting unloading</span> or inspection
          </p>
        </div>

        {/* KPI 2: Total Current Stock */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On-Hand Stock Balance</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-3">
            <span className="text-3xl font-bold font-mono text-emerald-700">{currentTotalStockBalance.toLocaleString()}</span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Received: <strong className="text-slate-800 font-medium">{totalReceivedUnits.toLocaleString()}</strong> across all lines
          </p>
        </div>

        {/* KPI 3: Total Dispatched */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched Cargo</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-3">
            <span className="text-3xl font-bold font-mono text-amber-700">{totalDispatchedUnits.toLocaleString()}</span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Turnaround: <strong className="text-amber-800 font-mono font-semibold">{overallTurnaroundRate}%</strong> of received stock
          </p>
        </div>

        {/* KPI 4: Active Shipments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shipments Handled</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-3">
            <span className="text-3xl font-bold font-mono text-slate-900">{totalShipments}</span>
            <span className="text-xs text-slate-500">consignments</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            <span className="text-indigo-700 font-semibold">{partiallyReleased} containers</span> partially released
          </p>
        </div>

      </div>

      {/* Main Grid: Containers At Depot & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Active Containers Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-slate-700" />
                <span>Active Containers at Depot</span>
              </h2>
              <p className="text-xs text-slate-500">Click any container to view dedicated stock ledger and movements</p>
            </div>
            <button
              onClick={() => onNavigateToTab('containers')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All ({totalContainers})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {priorityContainers.map((c) => {
              const cItems = items.filter(i => i.containerId === c.id);
              const totalRec = cItems.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
              const totalDsp = cItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
              const totalBal = cItems.reduce((acc, curr) => acc + curr.balance, 0);
              const pct = totalRec > 0 ? Math.round((totalDsp / totalRec) * 100) : 0;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectContainer(c)}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-xs shadow-2xs cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {c.containerNumber}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {c.shippingLine}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {c.location}
                      </span>
                      <span className="font-mono text-[11px] text-blue-600 font-semibold">{c.shipmentRef}</span>
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Balance On-Hand:</span>
                        <span className="font-mono font-bold text-emerald-700">{totalBal.toLocaleString()} units</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="bg-slate-800 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>Received: {totalRec}</span>
                        <span>Dispatched: {totalDsp} ({pct}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 truncate max-w-[170px]">{c.customer}</span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>Open Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Minimalist Operating Note */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Container-Level Balance Tracking
            </span>
            <p className="text-slate-500 leading-relaxed">
              Every container maintains its own separate stock ledger. Goods dispatched are automatically subtracted from the container&apos;s balance, preventing over-dispatching and ensuring accurate physical warehouse counts.
            </p>
          </div>
        </div>

        {/* Right Column: Recent Stock Movements Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>Recent Activity Feed</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              All Reports
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            {recentTransactions.map((tx) => {
              const isStockIn = tx.type === 'stock_in';
              const isStockOut = tx.type === 'stock_out';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
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
                      <span className="font-mono font-bold text-slate-900">{tx.containerNumber}</span>
                    </div>

                    <span className={`font-mono font-bold text-xs ${
                      isStockIn ? 'text-emerald-700' : isStockOut ? 'text-amber-700' : 'text-slate-800'
                    }`}>
                      {tx.type === 'stock_in' ? `+${tx.quantity}` : tx.type === 'stock_out' ? `-${tx.quantity}` : `${tx.quantity > 0 ? '+' : ''}${tx.quantity}`} {tx.unit}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 truncate">
                    {tx.itemName}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-1">
                    <span className="truncate max-w-[140px]">{tx.recipientOrLocation}</span>
                    <span className="font-mono text-slate-700 font-semibold">Bal: {tx.balanceAfter}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>By: {tx.authorizedBy}</span>
                    <span>{formatTimeOnly(tx.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
