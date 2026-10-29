'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Container } from './types';
import { formatMoney } from './storage';

function formatReceiverColumn(name: string, phone: string, date: string): string {
  if (!name && !phone && !date) return 'Not Received Yet';
  const parts: string[] = [];
  if (name) parts.push(name);
  if (phone) parts.push(`Tel: ${phone}`);
  if (date) parts.push(`Date: ${date}`);
  return parts.join(' | ');
}

// Export a single container to Excel (.xlsx) with all 10 fields
export function exportSingleContainerToExcel(container: Container): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All 10 Cargo Fields
  const cargoRows = container.items.map((item, idx) => ({
    'S/N': idx + 1,
    '1. Container': item.containerName || container.name,
    '2. Name': item.name,
    '3. Phone Number': item.phone,
    '4. CBM': item.cbm,
    '5. Amount': item.amount,
    '6. Taken': item.taken,
    '7. Paid': item.paid,
    '8. Credit': item.credit,
    "9. Receiver's (Name, Phone & Date)": formatReceiverColumn(
      item.receiverName,
      item.receiverPhone,
      item.receiverDate
    ),
    '9a. Receiver Name': item.receiverName || '-',
    '9b. Receiver Phone': item.receiverPhone || '-',
    '9c. Receiver Date': item.receiverDate || '-',
    '10. Warehouse': item.warehouse || container.warehouse,
    'Updated By (Staff)': item.lastUpdatedBy || container.updatedBy || 'Staff',
    'Last Updated': item.lastUpdated,
  }));

  const wsCargo = XLSX.utils.json_to_sheet(
    cargoRows.length > 0
      ? cargoRows
      : [
          {
            '1. Container': container.name,
            '2. Name': 'No records added yet',
            '3. Phone Number': '-',
            '4. CBM': 0,
            '5. Amount': 0,
            '6. Taken': '-',
            '7. Paid': 0,
            '8. Credit': 0,
            "9. Receiver's (Name, Phone & Date)": '-',
            '10. Warehouse': container.warehouse,
          },
        ]
  );

  wsCargo['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 24 },
    { wch: 16 },
    { wch: 10 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCargo, 'Container Records');

  // Sheet 2: Audit & Update History
  const historyData = container.history.map((h, idx) => ({
    'S/N': idx + 1,
    Container: h.containerName,
    Customer: h.itemName,
    Action: h.action.toUpperCase(),
    Details: h.summary,
    'Staff (Updated By)': h.personName || 'Staff',
    'Date & Time': h.date,
  }));

  if (historyData.length > 0) {
    const wsHistory = XLSX.utils.json_to_sheet(historyData);
    wsHistory['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 24 },
      { wch: 14 },
      { wch: 55 },
      { wch: 20 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Update Log');
  }

  const cleanName = container.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Deep_Down_Logistics_${cleanName}_${dateStr}.xlsx`);
}

// Export ALL containers to a single Excel workbook (.xlsx)
export function exportAllContainersToExcel(containers: Container[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Master 10-Field Sheet across all containers
  const allRows: Record<string, string | number>[] = [];
  containers.forEach((c) => {
    if (c.items.length === 0) {
      allRows.push({
        '1. Container': c.name,
        '2. Name': '(Empty Container)',
        '3. Phone Number': '-',
        '4. CBM': 0,
        '5. Amount': 0,
        '6. Taken': 'Empty',
        '7. Paid': 0,
        '8. Credit': 0,
        "9. Receiver's (Name, Phone & Date)": '-',
        '10. Warehouse': c.warehouse,
        'Staff (Updated By)': c.updatedBy || c.createdBy || 'Staff',
        'Last Updated': c.updatedAt.substring(0, 10),
      });
    } else {
      c.items.forEach((item) => {
        allRows.push({
          '1. Container': item.containerName || c.name,
          '2. Name': item.name,
          '3. Phone Number': item.phone,
          '4. CBM': item.cbm,
          '5. Amount': item.amount,
          '6. Taken': item.taken,
          '7. Paid': item.paid,
          '8. Credit': item.credit,
          "9. Receiver's (Name, Phone & Date)": formatReceiverColumn(
            item.receiverName,
            item.receiverPhone,
            item.receiverDate
          ),
          '10. Warehouse': item.warehouse || c.warehouse,
          'Staff (Updated By)': item.lastUpdatedBy || c.updatedBy || 'Staff',
          'Last Updated': item.lastUpdated,
        });
      });
    }
  });

  const wsMaster = XLSX.utils.json_to_sheet(allRows);
  wsMaster['!cols'] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 10 },
    { wch: 15 },
    { wch: 28 },
    { wch: 15 },
    { wch: 15 },
    { wch: 38 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'All Containers (10 Fields)');

  // Sheet 2: Container Summary
  const summaryRows = containers.map((c, idx) => {
    const totalCbm = c.items.reduce((acc, i) => acc + i.cbm, 0);
    const totalAmount = c.items.reduce((acc, i) => acc + i.amount, 0);
    const totalPaid = c.items.reduce((acc, i) => acc + i.paid, 0);
    const totalCredit = c.items.reduce((acc, i) => acc + i.credit, 0);

    return {
      'S/N': idx + 1,
      '1. Container': c.name,
      '10. Warehouse': c.warehouse,
      'Customer Entries': c.items.length,
      'Total CBM': Number(totalCbm.toFixed(2)),
      'Total Amount': totalAmount,
      'Total Paid': totalPaid,
      'Total Credit': totalCredit,
      'Created By': c.createdBy || 'Staff',
      'Last Updated By': c.updatedBy || 'Staff',
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Container Summary');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Deep_Down_Logistics_All_Containers_${dateStr}.xlsx`);
}

// Helper to draw a 10-column table header in Landscape PDF
function drawPdfTableHeader(doc: jsPDF, y: number): number {
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y - 5, 277, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text('1. Container', 12, y);
  doc.text('2. Name', 45, y);
  doc.text('3. Phone', 82, y);
  doc.text('4. CBM', 108, y);
  doc.text('5. Amount', 123, y);
  doc.text('6. Taken', 146, y);
  doc.text('7. Paid', 184, y);
  doc.text('8. Credit', 206, y);
  doc.text("9. Receiver (Name/Tel/Date)", 226, y);
  doc.text('10. Warehouse', 265, y);

  doc.setTextColor(15, 23, 42);
  return y + 7;
}

// Export a single container to PDF (Landscape for 10 fields)
export function exportSingleContainerToPdf(container: Container): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const dateStr = new Date().toLocaleString();

  const totalCbm = container.items.reduce((s, i) => s + i.cbm, 0);
  const totalAmount = container.items.reduce((s, i) => s + i.amount, 0);
  const totalPaid = container.items.reduce((s, i) => s + i.paid, 0);
  const totalCredit = container.items.reduce((s, i) => s + i.credit, 0);

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`DEEP DOWN LOGISTICS — ${container.name.toUpperCase()}`, 12, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Warehouse: ${container.warehouse}   |   Created by: ${container.createdBy || 'Staff'}   |   Updated by: ${container.updatedBy || 'Staff'}   |   Printed: ${dateStr}`,
    12,
    20
  );
  doc.text(
    `Customers: ${container.items.length}   |   Total CBM: ${totalCbm.toFixed(2)}   |   Total Amount: ${formatMoney(totalAmount)}   |   Total Paid: ${formatMoney(totalPaid)}   |   Total Credit: ${formatMoney(totalCredit)}`,
    12,
    26
  );

  let y = 40;
  y = drawPdfTableHeader(doc, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (container.items.length === 0) {
    doc.text('No customer cargo records inside this container.', 12, y);
  } else {
    container.items.forEach((item, idx) => {
      if (y > 192) {
        doc.addPage('a4', 'landscape');
        y = 20;
        y = drawPdfTableHeader(doc, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y - 4.5, 277, 6.5, 'F');
      }

      const receiverStr = item.receiverName
        ? `${item.receiverName} (${item.receiverPhone || '-'}) ${item.receiverDate || ''}`
        : 'Not collected';

      doc.text((item.containerName || container.name).substring(0, 18), 12, y);
      doc.text(item.name.substring(0, 20), 45, y);
      doc.text((item.phone || '-').substring(0, 15), 82, y);
      doc.text(String(item.cbm), 108, y);
      doc.text(formatMoney(item.amount), 123, y);
      doc.text(item.taken.substring(0, 22), 146, y);
      doc.text(formatMoney(item.paid), 184, y);
      doc.text(formatMoney(item.credit), 206, y);
      doc.text(receiverStr.substring(0, 24), 226, y);
      doc.text((item.warehouse || container.warehouse).substring(0, 14), 265, y);

      y += 6.5;
    });
  }

  const cleanName = container.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Deep_Down_Logistics_${cleanName}_${fileDate}.pdf`);
}

// Export ALL containers to PDF (Landscape for 10 fields)
export function exportAllContainersToPdf(containers: Container[]): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const dateStr = new Date().toLocaleString();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DEEP DOWN LOGISTICS — MASTER CONTAINER & CARGO REPORT', 12, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Containers: ${containers.length}   |   Generated: ${dateStr}`, 12, 20);

  let y = 36;
  y = drawPdfTableHeader(doc, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  let rowIdx = 0;
  containers.forEach((c) => {
    c.items.forEach((item) => {
      if (y > 192) {
        doc.addPage('a4', 'landscape');
        y = 20;
        y = drawPdfTableHeader(doc, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
      }

      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y - 4.5, 277, 6.5, 'F');
      }

      const receiverStr = item.receiverName
        ? `${item.receiverName} (${item.receiverPhone || '-'}) ${item.receiverDate || ''}`
        : 'Not collected';

      doc.text((item.containerName || c.name).substring(0, 18), 12, y);
      doc.text(item.name.substring(0, 20), 45, y);
      doc.text((item.phone || '-').substring(0, 15), 82, y);
      doc.text(String(item.cbm), 108, y);
      doc.text(formatMoney(item.amount), 123, y);
      doc.text(item.taken.substring(0, 22), 146, y);
      doc.text(formatMoney(item.paid), 184, y);
      doc.text(formatMoney(item.credit), 206, y);
      doc.text(receiverStr.substring(0, 24), 226, y);
      doc.text((item.warehouse || c.warehouse).substring(0, 14), 265, y);

      y += 6.5;
      rowIdx++;
    });
  });

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Deep_Down_Logistics_All_Containers_${fileDate}.pdf`);
}
