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

  const rawContainers = useSyncExternalStore(
    subscribeToStorage,
    getContainers,
    () => INITIAL_CONTAINERS
  );
  const containers = isMounted ? rawContainers : INITIAL_CONTAINERS;

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

  const selectedContainer =
    containers.find((c) => c.id === selectedContainerId) || null;

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleResetDemo = () => {
    resetToDemoData();
    showNotice('Sample data restored.');
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all records?')) {
      clearAllContainers();
      setSelectedContainerId(null);
      showNotice('All records cleared.');
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
    showNotice(`Imported ${count} records from manifest.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
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
        onGoHome={() => {
          setSelectedContainerId(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {noticeMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>{noticeMessage}</span>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-emerald-700 font-bold hover:underline ml-3"
            >
              Close
            </button>
          </div>
        )}

        {activeMode === 'warehouse' ? (
          <WarehouseInventoryView
            records={warehouseRecords}
            history={warehouseHistory}
            containers={containers}
            searchQuery={searchQuery}
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

      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span className="font-bold text-slate-800">Deep Down Logistics</span>

          <div className="flex items-center gap-4">
            <button
              onClick={handleClearAll}
              className="text-slate-500 hover:text-rose-600 hover:underline font-semibold"
            >
              Clear All
            </button>
            <button
              onClick={handleResetDemo}
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
            >
              Reset Sample
            </button>
          </div>
        </div>
      </footer>

      <AddContainerModal
        isOpen={isAddContainerOpen}
        onClose={() => setIsAddContainerOpen(false)}
        onContainerCreated={handleContainerCreated}
      />

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
