'use client';

import React, { useState, useMemo } from 'react';
import { Container, ContainerItem, ContainerStatus, UserProfile } from '@/lib/types';
import { exportContainersToExcel } from '@/lib/exportUtils';
import { 
  Package, 
  Search, 
  PlusCircle, 
  LayoutGrid, 
  List, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileSpreadsheet, 
  MapPin, 
  Boxes,
  ArrowRight
} from 'lucide-react';

interface ContainersViewProps {
  containers: Container[];
  items: ContainerItem[];
  currentUser: UserProfile;
  onSelectContainer: (container: Container) => void;
  onOpenRegisterModal: () => void;
  onOpenStockIn: (containerId: string) => void;
  onOpenStockOut: (containerId: string) => void;
}

export function ContainersView({
  containers,
  items,
  currentUser,
  onSelectContainer,
  onOpenRegisterModal,
  onOpenStockIn,
  onOpenStockOut
}: ContainersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shippingLineFilter, setShippingLineFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Compute metrics
  const totalContainers = containers.length;
  const arrivedCount = containers.filter(c => c.status === 'arrived' || c.status === 'unloading').length;
  const storedCount = containers.filter(c => c.status === 'stored').length;
  const partiallyDispatchedCount = containers.filter(c => c.status === 'partially_dispatched').length;
  const completedCount = containers.filter(c => c.status === 'completed').length;

  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      const matchesSearch = 
        c.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.shipmentRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sealNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesLine = shippingLineFilter === 'all' || c.shippingLine === shippingLineFilter;

      return matchesSearch && matchesStatus && matchesLine;
    });
  }, [containers, searchTerm, statusFilter, shippingLineFilter]);

  const getStatusBadge = (status: ContainerStatus) => {
    switch (status) {
      case 'expected':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'arrived':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'unloading':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'stored':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'partially_dispatched':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'departed':
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getShippingLineBadge = (line: string) => {
    switch (line) {
      case 'MSC':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Maersk':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'CMA CGM':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Hapag-Lloyd':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'ONE':
        return 'bg-pink-50 text-pink-800 border-pink-200';
      case 'COSCO':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-slate-800" />
            <span>Container Fleet & Stock Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track individual container contents, goods received, dispatches, and remaining balances
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => exportContainersToExcel(containers, items)}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export (.xlsx)</span>
          </button>

          <button
            onClick={onOpenRegisterModal}
            disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Container</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'all' ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] text-slate-500 font-medium">All Containers</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{totalContainers}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('arrived')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'arrived' ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-600/10 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] text-slate-500 font-medium">Inbound / Arrived</span>
          <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">{arrivedCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('stored')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'stored' ? 'bg-sky-50/50 border-sky-600 ring-1 ring-sky-600/10 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] text-slate-500 font-medium">Stored in Depot</span>
          <div className="text-xl font-bold font-mono text-sky-700 mt-0.5">{storedCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('partially_dispatched')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'partially_dispatched' ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-600/10 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] text-slate-500 font-medium">Partially Dispatched</span>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">{partiallyDispatchedCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'completed' ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600/10 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] text-slate-500 font-medium">Cleared / Empty</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search container #, consignee, seal, or shipment ref..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="all">All Statuses</option>
              <option value="expected">Expected</option>
              <option value="arrived">Arrived</option>
              <option value="unloading">Unloading</option>
              <option value="stored">Stored</option>
              <option value="partially_dispatched">Partially Dispatched</option>
              <option value="completed">Completed / Empty</option>
              <option value="departed">Departed</option>
            </select>

            <select
              value={shippingLineFilter}
              onChange={(e) => setShippingLineFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="all">All Lines</option>
              <option value="MSC">MSC</option>
              <option value="Maersk">Maersk</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="Hapag-Lloyd">Hapag-Lloyd</option>
              <option value="COSCO">COSCO</option>
              <option value="ONE">ONE</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1.5 self-end md:self-auto bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
            title="Grid Cards"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Containers Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContainers.map((container) => {
            const containerItems = items.filter(i => i.containerId === container.id);
            const totalReceived = containerItems.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
            const totalDispatched = containerItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
            const totalBalance = containerItems.reduce((acc, curr) => acc + curr.balance, 0);
            const dispatchPct = totalReceived > 0 ? Math.round((totalDispatched / totalReceived) * 100) : 0;

            return (
              <div
                key={container.id}
                onClick={() => onSelectContainer(container)}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {container.containerNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getShippingLineBadge(container.shippingLine)}`}>
                          {container.shippingLine}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                        {container.type.replace('_', ' ')}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadge(container.status)}`}>
                      {container.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Location & Arrival info */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{container.location}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {container.arrivalDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Consignee:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[160px]">{container.customer}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Shipment Ref:</span>
                      <span className="font-mono text-blue-600 font-semibold">{container.shipmentRef}</span>
                    </div>
                  </div>

                  {/* Inventory Balance Meter */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">On-Hand Balance:</span>
                      <span className="font-mono font-bold text-sm text-emerald-700">
                        {totalBalance.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Rcvd: <strong className="text-slate-700 font-mono">{totalReceived}</strong></span>
                      <span>Dispatched: <strong className="text-amber-700 font-mono">{totalDispatched}</strong> ({dispatchPct}%)</span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-slate-800 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, dispatchPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Cargo preview chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {containerItems.slice(0, 2).map(item => (
                      <span key={item.id} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium truncate max-w-[170px] border border-slate-200/60">
                        {item.itemName} ({item.balance} {item.unit})
                      </span>
                    ))}
                    {containerItems.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono border border-slate-200/60">
                        +{containerItems.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>View Dedicated Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenStockIn(container.id)}
                      disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
                      title="Quick Stock-In"
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenStockOut(container.id)}
                      disabled={currentUser.role === 'management_viewer' || currentUser.role === 'inventory_officer' || totalBalance <= 0}
                      title="Quick Stock-Out"
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Containers Dense Table View */
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-3">Line & Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Shipment Ref</th>
                <th className="py-3 px-3">Consignee</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Received</th>
                <th className="py-3 px-3 text-right">Dispatched</th>
                <th className="py-3 px-4 text-right font-bold text-slate-800">Current Balance</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredContainers.map((c) => {
                const containerItems = items.filter(i => i.containerId === c.id);
                const totalReceived = containerItems.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
                const totalDispatched = containerItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
                const totalBalance = containerItems.reduce((acc, curr) => acc + curr.balance, 0);

                return (
                  <tr 
                    key={c.id} 
                    onClick={() => onSelectContainer(c)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {c.containerNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getShippingLineBadge(c.shippingLine)}`}>
                        {c.shippingLine}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{c.type.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(c.status)} uppercase`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{c.location}</td>
                    <td className="py-3 px-3 font-mono text-blue-600 font-semibold">{c.shipmentRef}</td>
                    <td className="py-3 px-3 text-slate-700 truncate max-w-[150px]">{c.customer}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">{containerItems.length}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{totalReceived.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-700">{totalDispatched.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={totalBalance > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                        {totalBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectContainer(c)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredContainers.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
          <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No containers match the current filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search query or register a new container to begin tracking inventory.
          </p>
          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            Register Container
          </button>
        </div>
      )}

    </div>
  );
}
