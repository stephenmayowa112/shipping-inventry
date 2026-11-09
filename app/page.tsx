'use client';

import React, { useState, useSyncExternalStore } from 'react';
import {
  getContainers,
  getWarehouseRecords,
  getWarehouseHistory,
  resetToDemoData,
  clearAllContainers,
  subscribeToStorage,
  INITIAL_CONTAINERS,
  INITIAL_WAREHOUSE_RECORDS,
  INITIAL_WAREHOUSE_HISTORY,
} from '@/lib/storage';
import { SimpleNavbar, InventoryMode } from '@/components/SimpleNavbar';
import { ContainerList } from '@/components/ContainerList';
import { ContainerDetailView } from '@/components/ContainerDetailView';
import { AddContainerModal } from '@/components/AddContainerModal';
import { UploadManifestModal } from '@/components/UploadManifestModal';
import { WarehouseInventoryView } from '@/components/WarehouseInventoryView';

const emptySubscribe = () => () => {};

export default function Home() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Synchronize Customer Container state with storage
  const rawContainers = useSyncExternalStore(
    subscribeToStorage,
    getContainers,
    () => INITIAL_CONTAINERS
  );
  const containers = isMounted ? rawContainers : INITIAL_CONTAINERS;

  // Synchronize Warehouse Inventory state with storage
  const rawWarehouseRecords = useSyncExternalStore(
    subscribeToStorage,
    getWarehouseRecords,
    () => INITIAL_WAREHOUSE_RECORDS
  );
  const warehouseRecords = isMounted
    ? rawWarehouseRecords
    : INITIAL_WAREHOUSE_RECORDS;

  const rawWarehouseHistory = useSyncExternalStore(
    subscribeToStorage,
    getWarehouseHistory,
    () => INITIAL_WAREHOUSE_HISTORY
  );
  const warehouseHistory = isMounted
    ? rawWarehouseHistory
    : INITIAL_WAREHOUSE_HISTORY;

  const [activeMode, setActiveMode] = useState<InventoryMode>('customer');
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddContainerOpen, setIsAddContainerOpen] = useState(false);
  const [isUploadManifestOpen, setIsUploadManifestOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Find currently selected container
  const selectedContainer =
    containers.find((c) => c.id === selectedContainerId) || null;

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleResetDemo = () => {
    resetToDemoData();
    showNotice(
      'Clean baseline templates restored for both Customer Cargo and Warehouse Inventory.'
    );
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Clear all Customer Containers and Warehouse Records to prepare a blank slate for company handover?'
      )
    ) {
      clearAllContainers();
      setSelectedContainerId(null);
      showNotice(
        'All Customer and Warehouse records cleared. Ready for fresh company data entry.'
      );
    }
  };

  const handleContainerCreated = (newId: string) => {
    setActiveMode('customer');
    setSelectedContainerId(newId);
  };

  const handleManifestImported = (containerId: string, count: number) => {
    setActiveMode('customer');
    if (containerId) {
      setSelectedContainerId(containerId);
    }
    showNotice(
      `Successfully imported ${count} customer cargo records from uploaded manifest.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar with Mode Switcher */}
      <SimpleNavbar
        activeMode={activeMode}
        onModeChange={(mode) => {
          setActiveMode(mode);
          setSearchQuery('');
        }}
        containers={containers}
        warehouseRecords={warehouseRecords}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddContainer={() => setIsAddContainerOpen(true)}
        onOpenUploadManifest={() => setIsUploadManifestOpen(true)}
        onResetDemo={handleResetDemo}
        onGoHome={() => {
          setSelectedContainerId(null);
        }}
        selectedContainerName={selectedContainer?.name}
      />

      {/* Main Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Notice feedback message */}
        {noticeMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
            <span>{noticeMessage}</span>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-emerald-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mode Switcher: Customer Cargo Inventory vs Warehouse Inventory */}
        {activeMode === 'warehouse' ? (
          <WarehouseInventoryView
            records={warehouseRecords}
            history={warehouseHistory}
            containers={containers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNotify={showNotice}
          />
        ) : selectedContainer ? (
          <ContainerDetailView
            container={selectedContainer}
            onBack={() => setSelectedContainerId(null)}
          />
        ) : (
          <ContainerList
            containers={containers}
            searchQuery={searchQuery}
            onSelectContainer={(c) => setSelectedContainerId(c.id)}
            onOpenAddContainer={() => setIsAddContainerOpen(true)}
            onOpenUploadManifest={() => setIsUploadManifestOpen(true)}
          />
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Deep Down Logistics</span>
            <span className="text-slate-300">•</span>
            <span>Customer Cargo & Warehouse Inventory System</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[11px]">
            <span>Production Handover Ready</span>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleClearAll}
              className="text-slate-600 hover:text-rose-600 hover:underline font-semibold"
              title="Clear all records to start completely blank for company handover"
            >
              Clear for Handover
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleResetDemo}
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
              title="Load clean baseline template"
            >
              Reset Template
            </button>
          </div>
        </div>
      </footer>

      {/* Add Container Modal */}
      <AddContainerModal
        isOpen={isAddContainerOpen}
        onClose={() => setIsAddContainerOpen(false)}
        onContainerCreated={handleContainerCreated}
      />

      {/* Upload Manifest Modal */}
      {isUploadManifestOpen && (
        <UploadManifestModal
          isOpen={isUploadManifestOpen}
          onClose={() => setIsUploadManifestOpen(false)}
          targetContainerId={selectedContainer?.id}
          targetContainerName={selectedContainer?.name}
          defaultWarehouse={selectedContainer?.warehouse || ''}
          onManifestImported={handleManifestImported}
        />
      )}
    </div>
  );
}
