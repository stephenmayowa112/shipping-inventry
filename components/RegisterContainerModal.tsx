'use client';

import React, { useState } from 'react';
import { ContainerType, ContainerStatus, Shipment } from '@/lib/types';
import { registerContainer } from '@/lib/storage';
import { Package, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface RegisterContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: Shipment[];
}

export function RegisterContainerModal({
  isOpen,
  onClose,
  shipments
}: RegisterContainerModalProps) {
  const [containerNumber, setContainerNumber] = useState('');
  const [type, setType] = useState<ContainerType>('40ft_high_cube');
  const [shippingLine, setShippingLine] = useState('MSC');
  const [shipmentRef, setShipmentRef] = useState(shipments[0]?.referenceNumber || 'SHP-2026-8841');
  const [arrivalDate, setArrivalDate] = useState('2026-10-18');
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [location, setLocation] = useState('Depot Bay A1 - Slot 08');
  const [supplier, setSupplier] = useState('');
  const [customer, setCustomer] = useState('');
  const [status, setStatus] = useState<ContainerStatus>('arrived');
  const [sealNumber, setSealNumber] = useState('SEAL-882901');
  const [maxPayloadKg, setMaxPayloadKg] = useState(28500);
  const [tareWeightKg, setTareWeightKg] = useState(3900);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  // When shipment selected, autofill customer and supplier
  const handleShipmentChange = (ref: string) => {
    setShipmentRef(ref);
    const shp = shipments.find(s => s.referenceNumber === ref);
    if (shp) {
      setCustomer(shp.customerName);
      setSupplier(shp.supplierName);
    }
  };

  const handleContainerTypeChange = (t: ContainerType) => {
    setType(t);
    if (t === '20ft_standard') {
      setMaxPayloadKg(21800);
      setTareWeightKg(2200);
    } else if (t === '40ft_standard') {
      setMaxPayloadKg(26500);
      setTareWeightKg(3750);
    } else if (t === '40ft_high_cube') {
      setMaxPayloadKg(28500);
      setTareWeightKg(3900);
    } else if (t === '40ft_reefer') {
      setMaxPayloadKg(27500);
      setTareWeightKg(4400);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanNumber = containerNumber.toUpperCase().trim();
    if (!cleanNumber || cleanNumber.length < 7) {
      setFeedback({ type: 'error', message: 'Please enter a valid container number (e.g. MSCU7291048).' });
      return;
    }

    try {
      registerContainer({
        containerNumber: cleanNumber,
        type,
        shippingLine,
        shipmentRef: shipmentRef.trim(),
        arrivalDate,
        arrivalTime,
        location: location.trim(),
        supplier: supplier.trim() || 'Global Freight Consignor',
        customer: customer.trim() || 'Regional Logistics Client',
        status,
        sealNumber: sealNumber.trim(),
        maxPayloadKg: Number(maxPayloadKg),
        tareWeightKg: Number(tareWeightKg),
        notes: notes.trim()
      });

      setFeedback({ type: 'success', message: `Container ${cleanNumber} registered successfully!` });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to register container.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Register Inbound Container</h3>
              <p className="text-xs text-slate-500">Initialize unique container tracking profile and arrival data</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {feedback && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Container Number, Shipping Line, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Container Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="e.g. MSCU7291048"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shipping Line
              </label>
              <select
                value={shippingLine}
                onChange={(e) => setShippingLine(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
              >
                <option value="MSC">MSC (Mediterranean Shipping Co)</option>
                <option value="Maersk">Maersk Line</option>
                <option value="CMA CGM">CMA CGM Group</option>
                <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                <option value="COSCO">COSCO Shipping</option>
                <option value="ONE">Ocean Network Express (ONE)</option>
                <option value="Evergreen">Evergreen Marine</option>
                <option value="Yang Ming">Yang Ming</option>
                <option value="ZIM">ZIM Integrated Shipping</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Container Type
              </label>
              <select
                value={type}
                onChange={(e) => handleContainerTypeChange(e.target.value as ContainerType)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="40ft_high_cube">40ft High Cube (HC)</option>
                <option value="40ft_standard">40ft Standard (GP)</option>
                <option value="20ft_standard">20ft Standard (GP)</option>
                <option value="40ft_reefer">40ft Reefer (Refrigerated)</option>
                <option value="open_top">Open Top Container</option>
                <option value="tank">ISO Tank Container</option>
              </select>
            </div>
          </div>

          {/* Associated Shipment, Seal Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associated Shipment Reference
              </label>
              <select
                value={shipmentRef}
                onChange={(e) => handleShipmentChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              >
                {shipments.map(s => (
                  <option key={s.id} value={s.referenceNumber}>
                    {s.referenceNumber} - {s.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bolt Seal Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="e.g. SEAL-881920"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Consignor & Consignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Consignee
              </label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Apex Consumer Electronics Ltd"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier / Consignor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Shenzhen Hi-Tech Industrial Corp"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Location, Arrival Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Depot Location / Yard Bay
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bay A1 - Slot 08"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arrival Date & Time
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-2/3 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900"
                />
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContainerStatus)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="expected">Expected (En Route)</option>
                <option value="arrived">Arrived (At Terminal Gate)</option>
                <option value="unloading">Unloading at Bay</option>
                <option value="stored">Stored / Grounded</option>
              </select>
            </div>
          </div>

          {/* Payload and Tare weights */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Payload Rating (Kg)
              </label>
              <input
                type="number"
                value={maxPayloadKg}
                onChange={(e) => setMaxPayloadKg(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tare Weight (Empty Box Kg)
              </label>
              <input
                type="number"
                value={tareWeightKg}
                onChange={(e) => setTareWeightKg(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terminal Gate Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared green lane, no customs hold."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Registers unique ISO container and links to fleet records.
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Package className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Register Container</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
