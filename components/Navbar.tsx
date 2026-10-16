'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/lib/types';
import { 
  Package, 
  Search, 
  PlusCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw, 
  ShieldCheck, 
  UserCheck, 
  Warehouse, 
  Truck, 
  Eye, 
  FileSpreadsheet
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';

interface NavbarProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  activeTab: 'dashboard' | 'containers' | 'shipments' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'containers' | 'shipments' | 'reports') => void;
  onOpenRegisterModal: () => void;
  onOpenStockInModal: () => void;
  onOpenStockOutModal: () => void;
  onOpenSearchModal: () => void;
  onResetData: () => void;
  containersCount: number;
  totalStockBalance: number;
}

export function Navbar({
  currentUser,
  onSelectUser,
  activeTab,
  setActiveTab,
  onOpenRegisterModal,
  onOpenStockInModal,
  onOpenStockOutModal,
  onOpenSearchModal,
  onResetData,
  containersCount,
  totalStockBalance: _totalStockBalance
}: NavbarProps) {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const getRoleIcon = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'warehouse_manager':
        return <Warehouse className="w-3.5 h-3.5 text-blue-600" />;
      case 'inventory_officer':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'dispatch_officer':
        return <Truck className="w-3.5 h-3.5 text-amber-600" />;
      case 'management_viewer':
        return <Eye className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand & Nav Tabs */}
            <div className="flex items-center space-x-6">
              <div 
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => setActiveTab('dashboard')}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
                  <Package className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-base tracking-tight text-slate-900">FreightCore</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                      Inventory
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 tracking-wider uppercase font-medium block">
                    Port & Depot Manager
                  </span>
                </div>
              </div>

              {/* Navigation Tabs - Minimalist clean pills */}
              <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('containers')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    activeTab === 'containers'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Containers</span>
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-700 font-mono font-semibold">
                    {containersCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('shipments')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'shipments'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Shipments
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                    activeTab === 'reports'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Reports</span>
                </button>
              </nav>
            </div>

            {/* Middle: Clean Search bar trigger */}
            <div className="hidden lg:flex items-center">
              <button
                onClick={onOpenSearchModal}
                className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 px-3.5 py-1.5 rounded-lg w-64 transition-all text-left shadow-2xs"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="flex-1 truncate">Search container, SKU, or B/L...</span>
                <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right: Quick Operational Actions & Role Info */}
            <div className="flex items-center space-x-2">
              
              {/* Quick Action Buttons */}
              <div className="hidden sm:flex items-center space-x-1.5">
                <button
                  onClick={onOpenStockInModal}
                  disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stock-In</span>
                </button>

                <button
                  onClick={onOpenStockOutModal}
                  disabled={currentUser.role === 'management_viewer' || currentUser.role === 'inventory_officer'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
                  <span>Stock-Out</span>
                </button>

                <button
                  onClick={onOpenRegisterModal}
                  disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Container</span>
                </button>
              </div>

              {/* Reset to demo */}
              <button
                onClick={onResetData}
                title="Reset demo data"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Active User Role button */}
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-lg bg-slate-100/80 border border-slate-200 hover:bg-slate-200/60 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-2xs">
                  {getRoleIcon(currentUser.role)}
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-medium text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase leading-none">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
              </button>

            </div>

          </div>
        </div>

        {/* Mobile Subnav for tabs */}
        <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200 bg-white text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('containers')}
            className={`px-2.5 py-1 rounded ${activeTab === 'containers' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500'}`}
          >
            Containers ({containersCount})
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-2.5 py-1 rounded ${activeTab === 'shipments' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500'}`}
          >
            Shipments
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 rounded ${activeTab === 'reports' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500'}`}
          >
            Reports
          </button>
        </div>
      </header>

      <RoleSwitcher
        currentUser={currentUser}
        onSelectUser={onSelectUser}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
}
