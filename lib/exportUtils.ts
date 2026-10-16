'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Container, ContainerItem, StockTransaction } from './types';

export function exportToExcel(filename: string, sheets: { sheetName: string; data: Record<string, any>[] }[]): void {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.substring(0, 31));
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportContainersToExcel(containers: Container[], items: ContainerItem[]): void {
  const containerRows = containers.map(c => {
    const cItems = items.filter(i => i.containerId === c.id);
    const totalReceived = cItems.reduce((acc, curr) => acc + curr.receivedQuantity, 0);
    const totalDispatched = cItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);
    const totalBalance = cItems.reduce((acc, curr) => acc + curr.balance, 0);

    return {
      'Container Number': c.containerNumber,
      'Type': c.type.replace('_', ' ').toUpperCase(),
      'Shipping Line': c.shippingLine,
      'Shipment Ref': c.shipmentRef,
      'Status': c.status.replace('_', ' ').toUpperCase(),
      'Location': c.location,
      'Consignor (Supplier)': c.supplier,
      'Consignee (Customer)': c.customer,
      'Arrival Date': c.arrivalDate,
      'Seal Number': c.sealNumber,
      'Items Count': cItems.length,
      'Total Received': totalReceived,
      'Total Dispatched': totalDispatched,
      'Current Balance': totalBalance,
      'Max Payload (kg)': c.maxPayloadKg,
      'Tare Weight (kg)': c.tareWeightKg
    };
  });

  const itemRows = items.map(item => ({
    'Container Number': item.containerNumber,
    'Shipment Ref': item.shipmentRef,
    'Item Name': item.itemName,
    'SKU': item.sku,
    'Category': item.category,
    'Unit': item.unit,
    'Received Qty': item.receivedQuantity,
    'Dispatched Qty': item.dispatchedQuantity,
    'Current Balance': item.balance,
    'Storage Location': item.storageLocation,
    'Condition': item.condition.toUpperCase(),
    'Last Updated': new Date(item.lastUpdated).toLocaleString()
  }));

  exportToExcel(`FreightCore_Containers_Ledger_${new Date().toISOString().split('T')[0]}`, [
    { sheetName: 'Containers Summary', data: containerRows },
    { sheetName: 'Container Inventory', data: itemRows }
  ]);
}

export function exportTransactionsToExcel(transactions: StockTransaction[]): void {
  const rows = transactions.map(t => ({
    'Transaction ID': t.id,
    'Date & Time': new Date(t.timestamp).toLocaleString(),
    'Type': t.type.toUpperCase(),
    'Container Number': t.containerNumber,
    'Shipment Ref': t.shipmentRef,
    'Item Name': t.itemName,
    'SKU': t.sku,
    'Quantity Moved': t.quantity,
    'Unit': t.unit,
    'Balance Before': t.balanceBefore,
    'Balance After': t.balanceAfter,
    'Reference / Waybill': t.referenceNumber,
    'Recipient / Location': t.recipientOrLocation,
    'Authorized Officer': t.authorizedBy,
    'Role': t.officerRole.replace('_', ' ').toUpperCase(),
    'Reason': t.reason || '',
    'Notes': t.notes || ''
  }));

  exportToExcel(`FreightCore_Stock_Movements_${new Date().toISOString().split('T')[0]}`, [
    { sheetName: 'Stock Movements Journal', data: rows }
  ]);
}

export function generateContainerPdf(container: Container, items: ContainerItem[], transactions: StockTransaction[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  // Title & Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, 12, 182, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('FREIGHTCORE LOGISTICS | OFFICIAL CONTAINER MANIFEST & LEDGER', 18, 21);

  y = 34;
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`Container: ${container.containerNumber}`, 14, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | AI Studio PortOps Engine`, 110, y);

  y += 7;
  // Specifications Table
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.setFont('helvetica', 'bold');
  doc.text('Shipping Line:', 18, y + 6);
  doc.text('Shipment Ref:', 18, y + 12);
  doc.text('Arrival Date:', 18, y + 18);
  doc.text('Status:', 18, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.text(`${container.shippingLine} (${container.type.replace('_', ' ')})`, 48, y + 6);
  doc.text(container.shipmentRef, 48, y + 12);
  doc.text(`${container.arrivalDate} @ ${container.arrivalTime || '08:00'}`, 48, y + 18);
  doc.text(container.status.toUpperCase(), 48, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Location / Bay:', 108, y + 6);
  doc.text('Seal Number:', 108, y + 12);
  doc.text('Consignee:', 108, y + 18);
  doc.text('Consignor:', 108, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.text(container.location, 138, y + 6);
  doc.text(container.sealNumber, 138, y + 12);
  doc.text(container.customer, 138, y + 18);
  doc.text(container.supplier, 138, y + 24);

  y += 36;

  // Inventory Table Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTAINER INVENTORY & STOCK BALANCES', 14, y);
  y += 5;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEM NAME & DESCRIPTION', 16, y + 4.8);
  doc.text('SKU', 82, y + 4.8);
  doc.text('UNIT', 114, y + 4.8);
  doc.text('RCVD', 132, y + 4.8);
  doc.text('DSPTD', 150, y + 4.8);
  doc.text('BALANCE', 170, y + 4.8);

  y += 7;
  doc.setFont('helvetica', 'normal');

  items.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6.5, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.text(item.itemName.substring(0, 38), 16, y + 4.5);
    doc.text(item.sku, 82, y + 4.5);
    doc.text(item.unit, 114, y + 4.5);
    doc.text(item.receivedQuantity.toString(), 132, y + 4.5);
    doc.text(item.dispatchedQuantity.toString(), 150, y + 4.5);
    
    // Bold balance
    doc.setFont('helvetica', 'bold');
    if (item.balance > 0) {
      doc.setTextColor(15, 118, 110); // emerald-700
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(item.balance.toString(), 170, y + 4.5);
    doc.setFont('helvetica', 'normal');

    y += 6.5;
  });

  y += 8;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Recent Transaction History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('AUDIT TRAIL & TRANSACTION HISTORY', 14, y);
  y += 5;

  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(7.5);
  doc.text('DATE/TIME', 16, y + 4.8);
  doc.text('TYPE', 46, y + 4.8);
  doc.text('ITEM', 68, y + 4.8);
  doc.text('QTY', 114, y + 4.8);
  doc.text('AFTER', 130, y + 4.8);
  doc.text('OFFICER / ROLE', 148, y + 4.8);

  y += 7;
  doc.setFont('helvetica', 'normal');

  transactions.forEach((tx, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6, 'F');
    }
    doc.setTextColor(51, 65, 85);
    doc.text(new Date(tx.timestamp).toLocaleDateString(), 16, y + 4.2);
    doc.text(tx.type.toUpperCase(), 46, y + 4.2);
    doc.text(tx.itemName.substring(0, 26), 68, y + 4.2);
    doc.text(`${tx.quantity > 0 ? '+' : ''}${tx.quantity}`, 114, y + 4.2);
    doc.text(tx.balanceAfter.toString(), 130, y + 4.2);
    doc.text(`${tx.authorizedBy} (${tx.officerRole})`.substring(0, 22), 148, y + 4.2);
    y += 6;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential Logistics Operations Record. Verified by FreightCore Terminal Inventory System.', 14, 288);

  doc.save(`Container_Manifest_${container.containerNumber}.pdf`);
}
