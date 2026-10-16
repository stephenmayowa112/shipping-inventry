'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { 
  getContainers, 
  getShipments, 
  getContainerItems, 
  getTransactions, 
  getCurrentUser, 
  setCurrentUser, 
  resetToDemoData, 
  subscribeToStorage 
} from '@/lib/storage';
import { 
  INITIAL_CONTAINERS, 
  INITIAL_SHIPMENTS, 
  INITIAL_ITEMS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_USERS 
} from '@/lib/initialData';
import { Container, Shipment } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { ContainersView } from '@/components/ContainersView';
import { ShipmentsView } from '@/components/ShipmentsView';
import { ReportsView } from '@/components/ReportsView';
import { ContainerDetailModal } from '@/components/ContainerDetailModal';
import { RegisterContainerModal } from '@/components/RegisterContainerModal';
import { StockInModal } from '@/components/StockInModal';
import { StockOutModal } from '@/components/StockOutModal';
import { StockTransferModal } from '@/components/StockTransferModal';
import { StockAdjustmentModal } from '@/components/StockAdjustmentModal';
import { SearchCommandDialog } from '@/components/SearchCommandDialog';

const emptySubscribe = () => () => {};

export default function Home() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Use React's useSyncExternalStore for external state synchronization
  const rawContainers = useSyncExternalStore(subscribeToStorage, getContainers, () => INITIAL_CONTAINERS);
  const rawShipments = useSyncExternalStore(subscribeToStorage, getShipments, () => INITIAL_SHIPMENTS);
  const rawItems = useSyncExternalStore(subscribeToStorage, getContainerItems, () => INITIAL_ITEMS);
  const rawTransactions = useSyncExternalStore(subscribeToStorage, getTransactions, () => INITIAL_TRANSACTIONS);
  const rawUser = useSyncExternalStore(subscribeToStorage, getCurrentUser, () => INITIAL_USERS[0]);

  // Use initial data until mounted to guarantee 100% hydration matching
  const containers = isMounted ? rawContainers : INITIAL_CONTAINERS;
  const shipments = isMounted ? rawShipments : INITIAL_SHIPMENTS;
  const items = isMounted ? rawItems : INITIAL_ITEMS;
  const transactions = isMounted ? rawTransactions : INITIAL_TRANSACTIONS;
  const currentUser = isMounted ? rawUser : INITIAL_USERS[0];

  const [activeTab, setActiveTab] = useState<'dashboard' | 'containers' | 'shipments' | 'reports'>('dashboard');

  // Modals state
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const selectedContainer = containers.find(c => c.id === selectedContainerId) || null;

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showResetNotice, setShowResetNotice] = useState(false);

  // Pre-selected IDs for context-aware operations
  const [activeTargetContainerId, setActiveTargetContainerId] = useState<string | undefined>(undefined);
  const [activeTargetItemId, setActiveTargetItemId] = useState<string | undefined>(undefined);

  // Global Keyboard Shortcut Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalStockBalance = items.reduce((acc, curr) => acc + curr.balance, 0);

  // Handlers for contextual modal launches
  const handleOpenStockIn = (containerId?: string) => {
    setActiveTargetContainerId(containerId);
    setIsStockInModalOpen(true);
  };

  const handleOpenStockOut = (containerId?: string, itemId?: string) => {
    setActiveTargetContainerId(containerId);
    setActiveTargetItemId(itemId);
    setIsStockOutModalOpen(true);
  };

  const handleOpenTransfer = (containerId?: string, itemId?: string) => {
    setActiveTargetContainerId(containerId);
    setActiveTargetItemId(itemId);
    setIsTransferModalOpen(true);
  };

  const handleOpenAdjustment = (containerId?: string, itemId?: string) => {
    setActiveTargetContainerId(containerId);
    setActiveTargetItemId(itemId);
    setIsAdjustmentModalOpen(true);
  };

  const handleSelectContainerByNumber = (cntNum: string) => {
    const match = containers.find(c => c.containerNumber === cntNum);
    if (match) {
      setSelectedContainerId(match.id);
    } else {
      setActiveTab('containers');
    }
  };

  const handleSelectShipmentRef = (_shipmentRef: string) => {
    setSelectedContainerId(null);
    setActiveTab('shipments');
  };

  const handleTriggerReset = () => {
    resetToDemoData();
    setShowResetNotice(true);
    setTimeout(() => setShowResetNotice(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={(u) => setCurrentUser(u)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenStockInModal={() => handleOpenStockIn()}
        onOpenStockOutModal={() => handleOpenStockOut()}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onResetData={handleTriggerReset}
        containersCount={containers.length}
        totalStockBalance={totalStockBalance}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showResetNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
            <span>Demo dataset restored successfully with initial containers, shipments, and inventory.</span>
            <button onClick={() => setShowResetNotice(false)} className="text-emerald-700 font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            containers={containers}
            shipments={shipments}
            items={items}
            transactions={transactions}
            currentUser={currentUser}
            onSelectContainer={(c) => setSelectedContainerId(c.id)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenStockInModal={() => handleOpenStockIn()}
            onOpenStockOutModal={() => handleOpenStockOut()}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'containers' && (
          <ContainersView
            containers={containers}
            items={items}
            currentUser={currentUser}
            onSelectContainer={(c) => setSelectedContainerId(c.id)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenStockIn={(id) => handleOpenStockIn(id)}
            onOpenStockOut={(id) => handleOpenStockOut(id)}
          />
        )}

        {activeTab === 'shipments' && (
          <ShipmentsView
            shipments={shipments}
            containers={containers}
            currentUser={currentUser}
            onSelectContainerNumber={handleSelectContainerByNumber}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            containers={containers}
            items={items}
            transactions={transactions}
            onSelectContainer={(c) => setSelectedContainerId(c.id)}
          />
        )}
      </main>

      {/* Minimalist Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">FreightCore Container & Depot Inventory System</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">ISO 6346 Container Tracking Engine</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Active Staff: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')})</span>
            <span className="text-slate-300">•</span>
            <button 
              onClick={handleTriggerReset}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </footer>

      {/* Dedicated Container Profile / Inventory Ledger Modal */}
      <ContainerDetailModal
        container={selectedContainer}
        items={items}
        transactions={transactions}
        currentUser={currentUser}
        isOpen={!!selectedContainer}
        onClose={() => setSelectedContainerId(null)}
        onOpenStockIn={(id) => handleOpenStockIn(id)}
        onOpenStockOut={(id, itmId) => handleOpenStockOut(id, itmId)}
        onOpenTransfer={(id, itmId) => handleOpenTransfer(id, itmId)}
        onOpenAdjustment={(id, itmId) => handleOpenAdjustment(id, itmId)}
        onSelectShipmentRef={handleSelectShipmentRef}
      />

      {/* Container Registration Modal */}
      <RegisterContainerModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        shipments={shipments}
      />

      {/* Stock-In Modal */}
      <StockInModal
        key={`stock-in-${activeTargetContainerId || 'default'}-${isStockInModalOpen}`}
        isOpen={isStockInModalOpen}
        onClose={() => {
          setIsStockInModalOpen(false);
          setActiveTargetContainerId(undefined);
        }}
        containers={containers}
        shipments={shipments}
        existingItems={items}
        currentUser={currentUser}
        initialContainerId={activeTargetContainerId}
      />

      {/* Stock-Out Modal */}
      <StockOutModal
        key={`stock-out-${activeTargetContainerId || 'default'}-${activeTargetItemId || 'default'}-${isStockOutModalOpen}`}
        isOpen={isStockOutModalOpen}
        onClose={() => {
          setIsStockOutModalOpen(false);
          setActiveTargetContainerId(undefined);
          setActiveTargetItemId(undefined);
        }}
        containers={containers}
        items={items}
        currentUser={currentUser}
        initialContainerId={activeTargetContainerId}
        initialItemId={activeTargetItemId}
      />

      {/* Stock Transfer Modal */}
      <StockTransferModal
        key={`stock-transfer-${activeTargetContainerId || 'default'}-${activeTargetItemId || 'default'}-${isTransferModalOpen}`}
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setActiveTargetContainerId(undefined);
          setActiveTargetItemId(undefined);
        }}
        containers={containers}
        items={items}
        currentUser={currentUser}
        initialContainerId={activeTargetContainerId}
        initialItemId={activeTargetItemId}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        key={`stock-adj-${activeTargetContainerId || 'default'}-${activeTargetItemId || 'default'}-${isAdjustmentModalOpen}`}
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setActiveTargetContainerId(undefined);
          setActiveTargetItemId(undefined);
        }}
        containers={containers}
        items={items}
        currentUser={currentUser}
        initialContainerId={activeTargetContainerId}
        initialItemId={activeTargetItemId}
      />

      {/* Universal Search Command Modal */}
      <SearchCommandDialog
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        containers={containers}
        shipments={shipments}
        items={items}
        onSelectContainer={(c) => setSelectedContainerId(c.id)}
        onSelectShipment={(_s) => {
          setActiveTab('shipments');
        }}
      />

    </div>
  );
}
