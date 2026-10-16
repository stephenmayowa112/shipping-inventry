'use client';

import React, { useState } from 'react';
import { Shipment, Container, ShipmentStatus, UserProfile } from '@/lib/types';
import { createShipment } from '@/lib/storage';
import { 
  Ship, 
  Search, 
  PlusCircle, 
  FileText, 
  Anchor, 
  Boxes, 
  ArrowRight, 
  Download, 
  X
} from 'lucide-react';

interface ShipmentsViewProps {
  shipments: Shipment[];
  containers: Container[];
  currentUser: UserProfile;
  onSelectContainerNumber: (containerNumber: string) => void;
}

export function ShipmentsView({
  shipments,
  containers,
  currentUser,
  onSelectContainerNumber
}: ShipmentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Shipment form state
  const [referenceNumber, setReferenceNumber] = useState('SHP-2026-9501');
  const [billOfLading, setBillOfLading] = useState('BL-MEDU882190');
  const [customerName, setCustomerName] = useState('');
  const [customerContactName, setCustomerContactName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [originPort, setOriginPort] = useState('Shanghai (Yangshan), China');
  const [destinationPort, setDestinationPort] = useState('Rotterdam Port, Netherlands');
  const [expectedArrival, setExpectedArrival] = useState('2026-10-24');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [totalGrossWeightKg, setTotalGrossWeightKg] = useState(25000);
  const [associatedContainers, setAssociatedContainers] = useState<string>('');

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.billOfLading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.associatedContainerNumbers.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'in_transit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'arrived':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'customs_cleared':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'stored':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially_dispatched':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !supplierName) return;

    const containersList = associatedContainers
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0);

    createShipment({
      referenceNumber: referenceNumber.trim(),
      billOfLading: billOfLading.trim(),
      customerName: customerName.trim(),
      customerContact: {
        name: customerContactName.trim() || 'Logistics Coordinator',
        phone: customerPhone.trim() || '+1 (555) 000-0000',
        email: customerEmail.trim() || 'contact@client.com'
      },
      supplierName: supplierName.trim(),
      originPort: originPort.trim(),
      destinationPort: destinationPort.trim(),
      expectedArrival,
      status: 'arrived',
      associatedContainerNumbers: containersList,
      description: description.trim() || 'Standard Commercial Cargo Consignment',
      totalGrossWeightKg: Number(totalGrossWeightKg)
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Ship className="w-6 h-6 text-slate-800" />
            <span>Master Shipment Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consignment bills of lading, international origins, customer manifests, and attached containers
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={currentUser.role === 'management_viewer' || currentUser.role === 'dispatch_officer'}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Shipment Record</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shipment ref, B/L, consignee, or container #..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 self-end md:self-auto focus:outline-none"
        >
          <option value="all">All Shipment Statuses</option>
          <option value="in_transit">In Transit</option>
          <option value="arrived">Arrived</option>
          <option value="customs_cleared">Customs Cleared</option>
          <option value="stored">Stored</option>
          <option value="partially_dispatched">Partially Dispatched</option>
          <option value="completed">Completed / Closed</option>
        </select>
      </div>

      {/* Shipment Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredShipments.map((shipment) => {
          return (
            <div
              key={shipment.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs space-y-3.5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {shipment.referenceNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadge(shipment.status)}`}>
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-600 font-semibold block mt-0.5">
                    B/L: {shipment.billOfLading}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Gross Weight</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {(shipment.totalGrossWeightKg / 1000).toFixed(1)} Metric Tons
                  </span>
                </div>
              </div>

              {/* Route & Ports */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Anchor className="w-4 h-4 text-slate-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Port of Origin</span>
                    <span className="font-medium text-slate-800">{shipment.originPort}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Destination Port</span>
                  <span className="font-medium text-slate-800">{shipment.destinationPort}</span>
                </div>
              </div>

              {/* Cargo description */}
              <p className="text-xs text-slate-600 line-clamp-2">
                {shipment.description}
              </p>

              {/* Parties & Dates */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">Consignee (Customer)</span>
                  <span className="font-semibold text-slate-800">{shipment.customerName}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{shipment.customerContact.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">Consignor (Supplier)</span>
                  <span className="font-semibold text-slate-800">{shipment.supplierName}</span>
                  <span className="text-[11px] text-slate-500 block">Arrived: {shipment.actualArrival || shipment.expectedArrival}</span>
                </div>
              </div>

              {/* Associated Containers Chips */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                  Associated Containers ({shipment.associatedContainerNumbers.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {shipment.associatedContainerNumbers.map(cntNum => {
                    const match = containers.find(c => c.containerNumber === cntNum);
                    return (
                      <button
                        key={cntNum}
                        onClick={() => onSelectContainerNumber(cntNum)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 transition-colors"
                      >
                        <Boxes className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cntNum}</span>
                        {match && (
                          <span className="text-[10px] font-sans px-1 rounded bg-slate-200 text-slate-600 font-normal">
                            {match.status.replace('_', ' ')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attached documents */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{shipment.documents.length} Shipping Documents Verified</span>
                </div>
                <button
                  onClick={() => setSelectedShipment(shipment)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  View Details & Files →
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Shipment Details & Documents Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedShipment.referenceNumber}</h3>
                <span className="text-xs text-slate-500">Bill of Lading: {selectedShipment.billOfLading}</span>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="p-1 rounded text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Contact:</span>
                  <span className="font-semibold text-slate-800">{selectedShipment.customerContact.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone & Email:</span>
                  <span className="font-mono text-slate-700">{selectedShipment.customerContact.phone} • {selectedShipment.customerContact.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Voyage Route:</span>
                  <span className="text-slate-800 font-medium">{selectedShipment.originPort} → {selectedShipment.destinationPort}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2 uppercase text-[10px] tracking-wider">Verified Shipping Documents</h4>
                <div className="space-y-2">
                  {selectedShipment.documents.map(doc => (
                    <div key={doc.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <div>
                          <span className="font-medium text-slate-800 block">{doc.name}</span>
                          <span className="text-[10px] text-slate-500">{doc.type} • {doc.fileSize} • Uploaded {doc.uploadDate}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setDownloadNotice(`Downloading verified manifest document: ${doc.name}`);
                          setTimeout(() => setDownloadNotice(null), 3000);
                        }}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {downloadNotice && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] flex items-center justify-between">
                    <span>{downloadNotice}</span>
                    <button onClick={() => setDownloadNotice(null)} className="font-bold ml-2">✕</button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Shipment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-xl my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <Ship className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">Create Shipment Record</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Shipment Reference</label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bill of Lading #</label>
                  <input
                    type="text"
                    required
                    value={billOfLading}
                    onChange={(e) => setBillOfLading(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer / Consignee</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Apex Consumer Electronics"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier / Consignor</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Shenzhen Hi-Tech Industrial"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Port of Origin</label>
                  <input
                    type="text"
                    value={originPort}
                    onChange={(e) => setOriginPort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Port</label>
                  <input
                    type="text"
                    value={destinationPort}
                    onChange={(e) => setDestinationPort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Goods Cargo Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Precision machinery components in wooden crates"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Associated Container Numbers (comma separated)
                </label>
                <input
                  type="text"
                  value={associatedContainers}
                  onChange={(e) => setAssociatedContainers(e.target.value)}
                  placeholder="e.g. MSCU7291048, MAEU4829104"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:outline-none focus:bg-white focus:border-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
