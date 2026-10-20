'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Container } from './types';

// Export a single container to Excel (.xlsx)
export function exportSingleContainerToExcel(container: Container): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  // Sheet 1: Current Items Inside Container
  const itemsData = container.items.map((item, index) => ({
    '#': index + 1,
    'Company': 'Deep Down Logistics',
    'Container': container.name,
    'Item Name': item.name,
    'Current Quantity Left': item.quantity,
    'Unit': item.unit,
    'Added By': item.addedBy || 'Staff',
    'Date Added': item.addedDate,
    'Last Updated': item.lastUpdated,
    'Last Updated By': item.lastUpdatedBy || item.addedBy || 'Staff'
  }));

  const totalGoods = container.items.reduce((sum, item) => sum + item.quantity, 0);

  // Add a summary row at the end
  if (itemsData.length > 0) {
    itemsData.push({
      '#': '' as any,
      'Company': 'Deep Down Logistics',
      'Container': container.name,
      'Item Name': 'TOTAL GOODS IN CONTAINER',
      'Current Quantity Left': totalGoods,
      'Unit': 'items',
      'Added By': '',
      'Date Added': '',
      'Last Updated': '',
      'Last Updated By': ''
    });
  }

  const wsItems = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Goods in Container');

  // Sheet 2: History of Items Removed / Added
  if (container.history && container.history.length > 0) {
    const historyData = container.history.map((h, index) => ({
      '#': index + 1,
      'Company': 'Deep Down Logistics',
      'Date & Time': h.date,
      'Action': h.action === 'removed' ? 'REMOVED / TOOK OUT' : h.action === 'updated' ? 'CONTAINER UPDATED' : 'ADDED STOCK',
      'Item Name': h.itemName,
      'Amount': h.amount,
      'Remaining Balance': h.quantityAfter,
      'Person (Updated/Created By)': h.personName || 'Staff',
      'Note / Reason': h.note || ''
    }));
    const wsHistory = XLSX.utils.json_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Removal & Update Log');
  }

  const cleanName = container.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Deep_Down_Logistics_${cleanName}_Inventory_${dateStr}.xlsx`);
}

// Export ALL containers to Excel (.xlsx)
export function exportAllContainersToExcel(containers: Container[]): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  // Sheet 1: Containers Summary
  const summaryData = containers.map((c, idx) => {
    const totalItemsCount = c.items.length;
    const totalGoodsCount = c.items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      '#': idx + 1,
      'Company': 'Deep Down Logistics',
      'Container Name': c.name,
      'Location / Note': c.note || '—',
      'Created By': c.createdBy || 'Staff',
      'Last Updated By': c.updatedBy || 'Staff',
      'Different Products': totalItemsCount,
      'Total Goods Left': totalGoodsCount,
      'Date Created': c.createdAt ? c.createdAt.slice(0, 10) : '—',
      'Last Updated': c.updatedAt ? c.updatedAt.slice(0, 10) : '—'
    };
  });
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'All Containers');

  // Sheet 2: All Items Across Containers
  const allItemsData: any[] = [];
  containers.forEach(c => {
    c.items.forEach(item => {
      allItemsData.push({
        'Company': 'Deep Down Logistics',
        'Container': c.name,
        'Item Name': item.name,
        'Current Quantity Left': item.quantity,
        'Unit': item.unit,
        'Stocked By': item.addedBy || 'Staff',
        'Last Updated': item.lastUpdated
      });
    });
  });
  const wsAllItems = XLSX.utils.json_to_sheet(allItemsData);
  XLSX.utils.book_append_sheet(wb, wsAllItems, 'All Inventory Items');

  // Sheet 3: Full Log of Removals Across Containers
  const allHistoryData: any[] = [];
  containers.forEach(c => {
    c.history.forEach(h => {
      allHistoryData.push({
        'Company': 'Deep Down Logistics',
        'Date & Time': h.date,
        'Container': c.name,
        'Action': h.action === 'removed' ? 'REMOVED / TOOK OUT' : h.action === 'updated' ? 'CONTAINER UPDATED' : 'ADDED STOCK',
        'Item Name': h.itemName,
        'Amount': h.amount,
        'Remaining Left': h.quantityAfter,
        'Person (Updated/Created By)': h.personName || 'Staff',
        'Note / Reason': h.note || ''
      });
    });
  });
  if (allHistoryData.length > 0) {
    const wsHistory = XLSX.utils.json_to_sheet(allHistoryData);
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Removal & Update History');
  }

  XLSX.writeFile(wb, `Deep_Down_Logistics_All_Containers_${dateStr}.xlsx`);
}

// Generate clean, printable PDF for a single container
export function exportSingleContainerToPdf(container: Container): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  // Header Box - Deep Down Logistics
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, 12, 182, 18, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('DEEP DOWN LOGISTICS', 18, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Container Inventory & Goods Verification Sheet', 18, 26);

  y = 37;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(container.name, 14, y);

  if (container.note) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Location / Note: ${container.note}`, 14, y);
  }

  const totalGoods = container.items.reduce((sum, item) => sum + item.quantity, 0);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Created By: ${container.createdBy || 'Staff'}   |   Last Updated By: ${container.updatedBy || 'Staff'}`, 14, y);

  y += 5.5;
  doc.setTextColor(100, 116, 139);
  doc.text(`Date Printed: ${new Date().toLocaleString()}   |   Total Goods Inside: ${totalGoods}`, 14, y);

  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEMS CURRENTLY INSIDE THIS CONTAINER', 14, y);

  y += 5;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('#', 18, y + 5.5);
  doc.text('ITEM NAME', 28, y + 5.5);
  doc.text('QUANTITY LEFT', 115, y + 5.5);
  doc.text('UNIT', 148, y + 5.5);
  doc.text('STOCKED BY', 168, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (container.items.length === 0) {
    y += 6;
    doc.setTextColor(148, 163, 184);
    doc.text('No goods currently inside this container.', 18, y);
    y += 10;
  } else {
    container.items.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text((index + 1).toString(), 18, y + 5);
      doc.text(item.name.substring(0, 38), 28, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(item.quantity.toString(), 115, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(item.unit, 148, y + 5);
      doc.text((item.addedBy || 'Staff').substring(0, 14), 168, y + 5);
      y += 7;
    });

    // Summary row
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL GOODS REMAINING:', 28, y + 5.2);
    doc.text(totalGoods.toString(), 115, y + 5.2);
    doc.text('items', 148, y + 5.2);
    y += 12;
  }

  // Removals & Additions Log
  if (container.history && container.history.length > 0) {
    if (y > 225) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('RECORD OF RECENT REMOVALS & UPDATES', 14, y);

    y += 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DATE', 17, y + 5.5);
    doc.text('ACTION', 50, y + 5.5);
    doc.text('ITEM', 82, y + 5.5);
    doc.text('QTY', 125, y + 5.5);
    doc.text('LEFT', 140, y + 5.5);
    doc.text('PERSON (BY)', 158, y + 5.5);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    container.history.slice(0, 18).forEach((h, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6.5, 'F');
      }
      doc.setTextColor(51, 65, 85);
      doc.text(h.date, 17, y + 4.5);
      doc.text(h.action === 'removed' ? 'Removed (-)' : h.action === 'updated' ? 'Updated' : 'Added (+)', 50, y + 4.5);
      doc.text(h.itemName.substring(0, 22), 82, y + 4.5);
      doc.text(h.amount > 0 ? h.amount.toString() : '—', 125, y + 4.5);
      doc.text(h.quantityAfter.toString(), 140, y + 4.5);
      doc.text((h.personName || 'Staff').substring(0, 16), 158, y + 4.5);
      y += 6.5;
    });
  }

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Deep Down Logistics — Container Inventory System with Person Verification', 14, 288);

  const cleanName = container.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Deep_Down_Logistics_${cleanName}_Inventory.pdf`);
}

// Generate printable PDF for ALL containers
export function exportAllContainersToPdf(containers: Container[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  // Header Box - Deep Down Logistics
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, 12, 182, 18, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('DEEP DOWN LOGISTICS', 18, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Master Container Inventory Summary', 18, 26);

  y = 37;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}  |  Total Containers: ${containers.length}`, 14, y);

  y += 7;

  containers.forEach((c) => {
    if (y > 235) {
      doc.addPage();
      y = 20;
    }

    const totalGoods = c.items.reduce((sum, item) => sum + item.quantity, 0);

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${c.name} (${totalGoods} items inside)`, 18, y + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Created by: ${c.createdBy || 'Staff'} | Updated by: ${c.updatedBy || 'Staff'}`, 110, y + 6);

    y += 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    if (c.items.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.text('No items recorded in this container.', 18, y);
      y += 8;
    } else {
      c.items.forEach((item) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${item.name}:`, 20, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.quantity} ${item.unit}`, 130, y);
        doc.setFont('helvetica', 'normal');
        y += 5.5;
      });
      y += 4;
    }
  });

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Deep Down Logistics — Container Inventory System', 14, 288);

  doc.save(`Deep_Down_Logistics_Master_Inventory_Summary.pdf`);
}
