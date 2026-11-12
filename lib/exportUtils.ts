'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Container, WarehouseRecord, WarehouseHistory } from './types';
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

// Download a clean 10-column Excel Manifest Template for uploading
export function downloadManifestTemplateExcel(defaultContainerName = 'Container 1'): void {
  const wb = XLSX.utils.book_new();
  const sampleRows = [
    {
      '1. Container': defaultContainerName,
      '2. Name': 'Alhaji Musa Ibrahim',
      '3. Phone Number': '0803 452 8910',
      '4. CBM': 14.5,
      '5. Amount': 1450000,
      '6. Taken': 'Not Taken',
      '7. Paid': 500000,
      '8. Credit': 950000,
      '9a. Receiver Name': '',
      '9b. Receiver Phone': '',
      '9c. Receiver Date': '',
      '10. Warehouse': 'Kotonu',
    },
    {
      '1. Container': defaultContainerName,
      '2. Name': 'Chinedu Okafor Ventures',
      '3. Phone Number': '0802 998 1122',
      '4. CBM': 8.2,
      '5. Amount': 820000,
      '6. Taken': 'All Collected',
      '7. Paid': 820000,
      '8. Credit': 0,
      '9a. Receiver Name': 'Emeka Okafor',
      '9b. Receiver Phone': '0813 400 7788',
      '9c. Receiver Date': new Date().toISOString().split('T')[0],
      '10. Warehouse': 'Masalachi first',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 26 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Manifest Template');
  XLSX.writeFile(wb, 'Deep_Down_Logistics_Manifest_Template.xlsx');
}

// ====================================================
// WAREHOUSE INVENTORY EXPORTS (EXCEL, PDF & TEMPLATE)
// ====================================================

export function exportWarehouseRecordsToExcel(
  records: WarehouseRecord[],
  history: WarehouseHistory[] = []
): void {
  const wb = XLSX.utils.book_new();

  const rows = records.map((r, idx) => ({
    'S/N': idx + 1,
    '1. Goods In-Stock': r.goodsInStock,
    '2. Goods Arrival (Date)': r.goodsArrivalDate,
    '3. Takeout from Container': `${r.containerName}: ${r.takeoutFromContainer}`,
    'Container Name': r.containerName,
    'Offloaded Goods': r.takeoutFromContainer,
    '4. Takeout from Warehouse': r.takeoutFromWarehouse,
    '5. Name of Warehouse / Container Offloader': `${r.warehouseName} | Offloader: ${r.offloaderName}`,
    'Warehouse Name': r.warehouseName,
    'Container Offloader': r.offloaderName,
    '6. Name of Person': r.personName,
    '7. Confirmation': r.confirmationNote
      ? `${r.confirmationStatus} (${r.confirmationNote})`
      : r.confirmationStatus,
    '8. Goods Condition (Good/Damaged)':
      r.conditionDetails && r.conditionDetails !== r.goodsCondition
        ? `${r.goodsCondition} — ${r.conditionDetails}`
        : r.goodsCondition,
    '9. Unaccounted (Missing Goods)': r.unaccountedDetails,
    '10. Credit': r.credit,
    'Last Updated By': r.lastUpdatedBy || r.personName,
    'Last Updated': r.updatedAt.replace('T', ' ').substring(0, 16),
  }));

  const wsRecords = XLSX.utils.json_to_sheet(
    rows.length > 0
      ? rows
      : [
          {
            '1. Goods In-Stock': 'No warehouse records yet',
            '2. Goods Arrival (Date)': '-',
            '3. Takeout from Container': '-',
            '4. Takeout from Warehouse': '-',
            '5. Name of Warehouse / Container Offloader': '-',
            '6. Name of Person': '-',
            '7. Confirmation': '-',
            '8. Goods Condition (Good/Damaged)': '-',
            '9. Unaccounted (Missing Goods)': '-',
            '10. Credit': 0,
          },
        ]
  );

  wsRecords['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 18 },
    { wch: 38 },
    { wch: 18 },
    { wch: 30 },
    { wch: 30 },
    { wch: 36 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 26 },
    { wch: 30 },
    { wch: 26 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRecords, 'Warehouse Inventory');

  if (history.length > 0) {
    const histRows = history.map((h, idx) => ({
      'S/N': idx + 1,
      Container: h.containerName,
      Action: h.action.toUpperCase(),
      Details: h.summary,
      'Name of Person': h.personName,
      'Date & Time': h.date,
    }));
    const wsHist = XLSX.utils.json_to_sheet(histRows);
    wsHist['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 14 },
      { wch: 60 },
      { wch: 20 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsHist, 'Warehouse Log');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Deep_Down_Logistics_Warehouse_Inventory_${dateStr}.xlsx`);
}

function drawWarehousePdfHeader(doc: jsPDF, y: number): number {
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y - 5, 277, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  doc.text('1. Goods In-Stock', 12, y);
  doc.text('2. Arrival', 46, y);
  doc.text('3. Container Takeout', 66, y);
  doc.text('4. Warehouse Takeout', 105, y);
  doc.text('5. Warehouse / Offloader', 142, y);
  doc.text('6. Person', 180, y);
  doc.text('7. Confirm', 202, y);
  doc.text('8. Condition', 221, y);
  doc.text('9. Unaccounted', 244, y);
  doc.text('10. Credit', 269, y);

  doc.setTextColor(15, 23, 42);
  return y + 7;
}

export function exportWarehouseRecordsToPdf(records: WarehouseRecord[]): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const dateStr = new Date().toLocaleString();

  const totalCredit = records.reduce((s, r) => s + r.credit, 0);
  const confirmedCount = records.filter((r) => r.confirmationStatus === 'Confirmed').length;
  const damagedCount = records.filter((r) => r.goodsCondition !== 'Good').length;
  const unaccountedCount = records.filter((r) => r.hasUnaccounted).length;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DEEP DOWN LOGISTICS — WAREHOUSE INVENTORY RECORDS', 12, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Total Records: ${records.length}   |   Confirmed: ${confirmedCount}/${records.length}   |   Damaged/Part-Damaged: ${damagedCount}   |   With Unaccounted Goods: ${unaccountedCount}   |   Total Credit: ${formatMoney(totalCredit)}`,
    12,
    19
  );
  doc.text(`Printed: ${dateStr}`, 12, 25);

  let y = 38;
  y = drawWarehousePdfHeader(doc, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  if (records.length === 0) {
    doc.text('No warehouse inventory records recorded yet.', 12, y);
  } else {
    records.forEach((r, idx) => {
      if (y > 192) {
        doc.addPage('a4', 'landscape');
        y = 20;
        y = drawWarehousePdfHeader(doc, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y - 4.5, 277, 6.5, 'F');
      }

      const containerTakeout = `${r.containerName}: ${r.takeoutFromContainer}`;
      const whOffloader = `${r.warehouseName} / ${r.offloaderName}`;

      doc.text(r.goodsInStock.substring(0, 20), 12, y);
      doc.text(r.goodsArrivalDate.substring(0, 12), 46, y);
      doc.text(containerTakeout.substring(0, 23), 66, y);
      doc.text(r.takeoutFromWarehouse.substring(0, 22), 105, y);
      doc.text(whOffloader.substring(0, 22), 142, y);
      doc.text(r.personName.substring(0, 13), 180, y);
      doc.text(r.confirmationStatus.substring(0, 11), 202, y);
      doc.text(r.goodsCondition.substring(0, 13), 221, y);
      doc.text(r.unaccountedDetails.substring(0, 15), 244, y);
      doc.text(formatMoney(r.credit), 269, y);

      y += 6.5;
    });
  }

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Deep_Down_Logistics_Warehouse_Inventory_${fileDate}.pdf`);
}

export function downloadWarehouseTemplateExcel(): void {
  const wb = XLSX.utils.book_new();
  const sampleRows = [
    {
      '1. Goods In-Stock': '38 Boxes & 20 Bales in Stock',
      '2. Goods Arrival (Date)': new Date().toISOString().split('T')[0],
      'Container Name': 'Container 1',
      '3. Takeout from Container': '95 Total Packages Offloaded',
      '4. Takeout from Warehouse': '57 Packages Dispatched',
      '5a. Name of Warehouse': 'Kotonu',
      '5b. Container Offloader': 'Ibrahim Danjuma',
      '6. Name of Person': 'Stephen Mayowa',
      '7. Confirmation': 'Confirmed',
      '8. Goods Condition (Good/Damaged)': 'Good',
      'Condition Details': 'All cartons intact',
      '9. Unaccounted': 'None (0 Missing)',
      '10. Credit': 620000,
    },
    {
      '1. Goods In-Stock': '10 Pallets & 18 Crates in Stock',
      '2. Goods Arrival (Date)': new Date().toISOString().split('T')[0],
      'Container Name': 'Container 2',
      '3. Takeout from Container': '43 Total Units Offloaded',
      '4. Takeout from Warehouse': '15 Pallets Dispatched',
      '5a. Name of Warehouse': 'Masalachi first',
      '5b. Container Offloader': 'Sunday Eze',
      '6. Name of Person': 'Michael Ade',
      '7. Confirmation': 'Pending',
      '8. Goods Condition (Good/Damaged)': 'Part Damaged',
      'Condition Details': '2 outer wooden crates dented',
      '9. Unaccounted': '1 Small Carton Missing',
      '10. Credit': 700000,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 26 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Warehouse Template');
  XLSX.writeFile(wb, 'Deep_Down_Logistics_Warehouse_Template.xlsx');
}


