'use client';

import React, { useState, useMemo } from 'react';
import { Container, ContainerItem, StockTransaction } from '@/lib/types';
import { exportToExcel, exportTransactionsToExcel } from '@/lib/exportUtils';
import { jsPDF } from 'jspdf';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Boxes, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  SlidersHorizontal, 
  CheckCircle2
} from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';

interface ReportsViewProps {
  containers: Container[];
  items: ContainerItem[];
  transactions: StockTransaction[];
  onSelectContainer: (container: Container) => void;
}

export function ReportsView({
  containers,
  items,
  transactions,
  onSelectContainer: _onSelectContainer
}: ReportsViewProps) {
  const [reportType, setReportType] = useState<
    'container_inventory' | 'stock_in' | 'stock_out' | 'current_stock' | 'clearance' | 'discrepancy'
  >('container_inventory');

  const [filterContainerId, setFilterContainerId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Container Inventory Data
  const containerInventoryRows = useMemo(() => {
    return items.filter(item => {
      const matchesContainer = filterContainerId === 'all' || item.containerId === filterContainerId;
      const matchesSearch = 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.containerNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesContainer && matchesSearch;
    });
  }, [items, filterContainerId, searchTerm]);

  // 2. Stock-In Transactions
  const stockInRows = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'stock_in') return false;
      const matchesContainer = filterContainerId === 'all' || t.containerId === filterContainerId;
      const matchesSearch = 
        t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesContainer && matchesSearch;
    });
  }, [transactions, filterContainerId, searchTerm]);

  // 3. Stock-Out Transactions
  const stockOutRows = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'stock_out') return false;
      const matchesContainer = filterContainerId === 'all' || t.containerId === filterContainerId;
      const matchesSearch = 
        t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipientOrLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesContainer && matchesSearch;
    });
  }, [transactions, filterContainerId, searchTerm]);

  // 4. Container Clearance / Turnaround (Containers with 0 balance or completed)
  const clearanceRows = useMemo(() => {
    return containers.map(c => {
      const cItems = items.filter(i => i.containerId === c.id);
      const totalReceived = cItems.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
      const totalDispatched = cItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
      const totalBalance = cItems.reduce((acc, curr) => acc + curr.balance, 0);
      const isCleared = totalBalance === 0 && totalReceived > 0;

      return {
        container: c,
        totalReceived,
        totalDispatched,
        totalBalance,
        isCleared,
        clearanceStatus: isCleared ? 'Fully Cleared / Ready for Line Return' : totalDispatched > 0 ? 'Partially Dispatched' : 'Active Storage'
      };
    }).filter(row => {
      const matchesSearch = 
        row.container.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.container.customer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [containers, items, searchTerm]);

  // 5. Discrepancy & Adjustment Report
  const discrepancyRows = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'adjustment') return false;
      const matchesContainer = filterContainerId === 'all' || t.containerId === filterContainerId;
      const matchesSearch = 
        t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.reason && t.reason.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesContainer && matchesSearch;
    });
  }, [transactions, filterContainerId, searchTerm]);

  // Excel Export Handler
  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (reportType === 'container_inventory' || reportType === 'current_stock') {
      const exportData = containerInventoryRows.map(i => ({
        'Container #': i.containerNumber,
        'Shipment Ref': i.shipmentRef,
        'Item Name': i.itemName,
        'SKU': i.sku,
        'Category': i.category,
        'Unit': i.unit,
        'Received Qty': i.receivedQuantity,
        'Dispatched Qty': i.dispatchedQuantity,
        'Current Balance': i.balance,
        'Storage Location': i.storageLocation,
        'Condition': i.condition.toUpperCase(),
        'Last Movement': new Date(i.lastUpdated).toISOString().slice(0, 16)
      }));
      exportToExcel(`FreightCore_Container_Inventory_Report_${timestamp}`, [
        { sheetName: 'Container Inventory', data: exportData }
      ]);
    } else if (reportType === 'stock_in') {
      exportTransactionsToExcel(stockInRows);
    } else if (reportType === 'stock_out') {
      exportTransactionsToExcel(stockOutRows);
    } else if (reportType === 'clearance') {
      const exportData = clearanceRows.map(r => ({
        'Container Number': r.container.containerNumber,
        'Shipping Line': r.container.shippingLine,
        'Shipment Ref': r.container.shipmentRef,
        'Consignee': r.container.customer,
        'Total Received': r.totalReceived,
        'Total Dispatched': r.totalDispatched,
        'Current Balance': r.totalBalance,
        'Turnaround Status': r.clearanceStatus,
        'Depot Location': r.container.location,
        'Arrival Date': r.container.arrivalDate
      }));
      exportToExcel(`FreightCore_Container_Clearance_Turnaround_${timestamp}`, [
        { sheetName: 'Clearance Turnaround', data: exportData }
      ]);
    } else if (reportType === 'discrepancy') {
      const exportData = discrepancyRows.map(d => ({
        'Transaction ID': d.id,
        'Date & Time': new Date(d.timestamp).toISOString().slice(0, 16),
        'Container #': d.containerNumber,
        'Item Name': d.itemName,
        'SKU': d.sku,
        'Variance (Delta)': d.quantity,
        'Unit': d.unit,
        'Balance Before': d.balanceBefore,
        'Balance After': d.balanceAfter,
        'Reason for Discrepancy': d.reason || '',
        'Authorized Manager': d.authorizedBy,
        'Notes': d.notes || ''
      }));
      exportToExcel(`FreightCore_Discrepancy_Adjustment_Audit_${timestamp}`, [
        { sheetName: 'Discrepancy Audit', data: exportData }
      ]);
    }
  };

  // PDF Export Handler
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let y = 18;

    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 269, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`FREIGHTCORE LOGISTICS | ${reportType.replace('_', ' ').toUpperCase()} REPORT`, 18, 21);

    y = 34;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 16)} | AI Studio PortOps Management Engine`, 14, y);

    y += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 269, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    if (reportType === 'container_inventory' || reportType === 'current_stock') {
      doc.text('CONTAINER #', 16, y + 5.5);
      doc.text('ITEM NAME & DESCRIPTION', 52, y + 5.5);
      doc.text('SKU', 130, y + 5.5);
      doc.text('UNIT', 160, y + 5.5);
      doc.text('RCVD', 185, y + 5.5);
      doc.text('DSPTD', 205, y + 5.5);
      doc.text('BALANCE', 225, y + 5.5);
      doc.text('LOCATION', 250, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      containerInventoryRows.slice(0, 30).forEach((row, idx) => {
        if (y > 185) {
          doc.addPage();
          y = 20;
        }
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 269, 6.5, 'F');
        }
        doc.setTextColor(30, 41, 59);
        doc.text(row.containerNumber, 16, y + 4.5);
        doc.text(row.itemName.substring(0, 38), 52, y + 4.5);
        doc.text(row.sku, 130, y + 4.5);
        doc.text(row.unit, 160, y + 4.5);
        doc.text(row.receivedQuantity.toString(), 185, y + 4.5);
        doc.text(row.dispatchedQuantity.toString(), 205, y + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.text(row.balance.toString(), 225, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(row.storageLocation.substring(0, 18), 250, y + 4.5);
        y += 6.5;
      });
    } else {
      doc.text('DATE/TIME', 16, y + 5.5);
      doc.text('CONTAINER #', 48, y + 5.5);
      doc.text('ITEM NAME', 80, y + 5.5);
      doc.text('QTY', 150, y + 5.5);
      doc.text('AFTER', 170, y + 5.5);
      doc.text('REF / WAYBILL', 190, y + 5.5);
      doc.text('AUTHORIZING OFFICER', 235, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      const dataToExport = reportType === 'stock_in' ? stockInRows : reportType === 'stock_out' ? stockOutRows : discrepancyRows;
      dataToExport.slice(0, 30).forEach((t, idx) => {
        if (y > 185) {
          doc.addPage();
          y = 20;
        }
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 269, 6.5, 'F');
        }
        doc.setTextColor(30, 41, 59);
        doc.text(t.timestamp.slice(0, 10), 16, y + 4.5);
        doc.text(t.containerNumber, 48, y + 4.5);
        doc.text(t.itemName.substring(0, 32), 80, y + 4.5);
        doc.text(`${t.quantity > 0 ? '+' : ''}${t.quantity} ${t.unit}`, 150, y + 4.5);
        doc.text(t.balanceAfter.toString(), 170, y + 4.5);
        doc.text(t.referenceNumber, 190, y + 4.5);
        doc.text(t.authorizedBy, 235, y + 4.5);
        y += 6.5;
      });
    }

    doc.save(`FreightCore_${reportType}_Report.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-slate-800" />
            <span>Operations & Inventory Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export container inventory balances, stock movements, and reconciliation journals
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Print Friendly View"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Report Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setReportType('container_inventory')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'container_inventory'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4 text-blue-600 mb-1" />
          <span className="font-semibold text-xs block text-slate-900">Container Inventory</span>
          <span className="text-[10px] text-slate-500">Balances by container</span>
        </button>

        <button
          onClick={() => setReportType('stock_in')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'stock_in'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4 text-emerald-600 mb-1" />
          <span className="font-semibold text-xs block text-slate-900">Stock-In Journal</span>
          <span className="text-[10px] text-slate-500">Inbound receipts log</span>
        </button>

        <button
          onClick={() => setReportType('stock_out')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'stock_out'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4 text-amber-600 mb-1" />
          <span className="font-semibold text-xs block text-slate-900">Stock-Out Journal</span>
          <span className="text-[10px] text-slate-500">Outbound dispatches</span>
        </button>

        <button
          onClick={() => setReportType('current_stock')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'current_stock'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4 text-indigo-600 mb-1" />
          <span className="font-semibold text-xs block text-slate-900">Current Stock</span>
          <span className="text-[10px] text-slate-500">On-hand warehouse stock</span>
        </button>

        <button
          onClick={() => setReportType('clearance')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'clearance'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-teal-600 mb-1" />
          <span className="font-semibold text-xs block text-slate-900">Turnaround Report</span>
          <span className="text-[10px] text-slate-500">Cleared & empty boxes</span>
        </button>

        <button
          onClick={() => setReportType('discrepancy')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'discrepancy'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900/10 shadow-xs text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-600 mb-1" />
          <span className="font-semibold text-xs block text-slate-900">Discrepancies</span>
          <span className="text-[10px] text-slate-500">Authorized variances</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report items, refs, container #..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <select
            value={filterContainerId}
            onChange={(e) => setFilterContainerId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-mono focus:outline-none"
          >
            <option value="all">All Containers</option>
            {containers.map(c => (
              <option key={c.id} value={c.id}>{c.containerNumber} ({c.shippingLine})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        
        {/* Container Inventory & Current Stock Table */}
        {(reportType === 'container_inventory' || reportType === 'current_stock') && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Received</th>
                <th className="py-3 px-3 text-right">Dispatched</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Current Balance</th>
                <th className="py-3 px-3">Storage Location</th>
                <th className="py-3 px-3">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {containerInventoryRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {row.containerNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{row.itemName}</td>
                  <td className="py-3 px-3 font-mono text-blue-600 font-medium">{row.sku}</td>
                  <td className="py-3 px-3 text-slate-600">{row.category}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                      {row.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">{row.receivedQuantity}</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-700">{row.dispatchedQuantity}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                    <span className={row.balance > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                      {row.balance}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{row.storageLocation}</td>
                  <td className="py-3 px-3 uppercase text-[10px] text-slate-500 font-semibold">{row.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Stock-In Table */}
        {reportType === 'stock_in' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-4">Goods Item</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Received Qty</th>
                <th className="py-3 px-3 text-right">Balance After</th>
                <th className="py-3 px-3">Receipt Ref #</th>
                <th className="py-3 px-4">Receiving Officer</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stockInRows.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500">{formatDisplayDate(tx.timestamp)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.containerNumber}</td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{tx.itemName}</td>
                  <td className="py-3 px-3 font-mono text-blue-600">{tx.sku}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">+{tx.quantity} {tx.unit}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">{tx.balanceAfter}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{tx.referenceNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{tx.authorizedBy} ({tx.officerRole})</td>
                  <td className="py-3 px-4 text-slate-500 italic text-[11px] truncate max-w-xs">{tx.notes || tx.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Stock-Out Table */}
        {reportType === 'stock_out' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-4">Goods Item</th>
                <th className="py-3 px-3 text-right">Dispatched Qty</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-3">Recipient / Customer</th>
                <th className="py-3 px-3">Waybill / Gate Pass</th>
                <th className="py-3 px-4">Dispatch Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stockOutRows.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500">{formatDisplayDate(tx.timestamp)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.containerNumber}</td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{tx.itemName}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">-{tx.quantity} {tx.unit}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">{tx.balanceAfter}</td>
                  <td className="py-3 px-3 text-slate-800 font-medium">{tx.recipientOrLocation}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{tx.referenceNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{tx.authorizedBy} ({tx.officerRole})</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Clearance / Turnaround Table */}
        {reportType === 'clearance' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-3">Shipping Line</th>
                <th className="py-3 px-3">Shipment Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-right">Total Received</th>
                <th className="py-3 px-3 text-right">Total Dispatched</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Balance</th>
                <th className="py-3 px-4">Clearance Status</th>
                <th className="py-3 px-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {clearanceRows.map(r => (
                <tr key={r.container.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.container.containerNumber}</td>
                  <td className="py-3 px-3 text-slate-600">{r.container.shippingLine}</td>
                  <td className="py-3 px-3 font-mono text-blue-600">{r.container.shipmentRef}</td>
                  <td className="py-3 px-3 text-slate-700">{r.container.customer}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">{r.totalReceived}</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-700">{r.totalDispatched}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                    <span className={r.totalBalance === 0 ? 'text-emerald-700 font-bold' : 'text-slate-800'}>{r.totalBalance}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      r.isCleared 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {r.clearanceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{r.container.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Discrepancy & Adjustment Table */}
        {reportType === 'discrepancy' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Container #</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Variance Delta</th>
                <th className="py-3 px-3 text-right">Balance Before → After</th>
                <th className="py-3 px-4">Reason for Adjustment</th>
                <th className="py-3 px-4">Authorized Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {discrepancyRows.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500">{formatDisplayDate(tx.timestamp)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.containerNumber}</td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{tx.itemName}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{tx.sku}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {tx.balanceBefore} → <strong className="text-slate-900">{tx.balanceAfter}</strong>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{tx.reason}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{tx.authorizedBy} ({tx.officerRole})</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}
