'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { 
  getContainers, 
  resetToDemoData, 
  clearAllContainers,
  subscribeToStorage, 
  INITIAL_CONTAINERS 
} from '@/lib/storage';
import { SimpleNavbar } from '@/components/SimpleNavbar';
import { ContainerList } from '@/components/ContainerList';
import { ContainerDetailView } from '@/components/ContainerDetailView';
import { AddContainerModal } from '@/components/AddContainerModal';

const emptySubscribe = () => () => {};

export default function Home() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Synchronize state with storage
  const rawContainers = useSyncExternalStore(subscribeToStorage, getContainers, () => INITIAL_CONTAINERS);
  const containers = isMounted ? rawContainers : INITIAL_CONTAINERS;

  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddContainerOpen, setIsAddContainerOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Find currently selected container
  const selectedContainer = containers.find(c => c.id === selectedContainerId) || null;

  const handleResetDemo = () => {
    resetToDemoData();
    setNoticeMessage('Clean production template restored (Container 1 & Container 2).');
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all containers to prepare a blank slate for company handover?')) {
      clearAllContainers();
      setSelectedContainerId(null);
      setNoticeMessage('All containers cleared. Ready for fresh company data entry.');
      setTimeout(() => setNoticeMessage(null), 3500);
    }
  };

  const handleContainerCreated = (newId: string) => {
    setSelectedContainerId(newId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Minimalist Top Navbar */}
      <SimpleNavbar
        containers={containers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddContainer={() => setIsAddContainerOpen(true)}
        onResetDemo={handleResetDemo}
        onGoHome={() => setSelectedContainerId(null)}
        selectedContainerName={selectedContainer?.name}
      />

      {/* Main Container Work Area */}
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

        {/* View Switcher: List vs Specific Container */}
        {selectedContainer ? (
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
          />
        )}

      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Deep Down Logistics</span>
            <span className="text-slate-300">•</span>
            <span>Container & Cargo Management System</span>
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

    </div>
  );
}
