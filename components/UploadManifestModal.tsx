'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  User,
  Warehouse,
  Package,
  Trash2,
  Check,
  Download,
  Loader2,
  Plus,
  Info,
} from 'lucide-react';
import {
  ManifestRowInput,
  importManifestRecords,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';
import { TakenStatus } from '@/lib/types';
import { downloadManifestTemplateExcel } from '@/lib/exportUtils';

interface UploadManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetContainerId?: string;
  targetContainerName?: string;
  defaultWarehouse?: string;
  onManifestImported: (containerId: string, count: number) => void;
}

function cleanNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? Math.max(0, val) : 0;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function inferTakenStatus(takenStr: string): TakenStatus {
  const lower = takenStr.toLowerCase().trim();
  if (!lower || lower.includes('not taken') || lower === 'no' || lower === 'none' || lower === '-') {
    return 'Not Taken';
  }
  if (lower.includes('part') || lower.includes('left') || lower.includes('remain')) {
    return 'Partial';
  }
  return 'Taken';
}

function parseCombinedReceiver(raw: string): {
  receiverName: string;
  receiverPhone: string;
  receiverDate: string;
} {
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === 'not received yet' ||
    trimmed.toLowerCase() === 'not collected' ||
    trimmed === '-'
  ) {
    return { receiverName: '', receiverPhone: '', receiverDate: '' };
  }

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    let receiverName = '';
    let receiverPhone = '';
    let receiverDate = '';
    parts.forEach((p, idx) => {
      if (p.toLowerCase().startsWith('tel:')) {
        receiverPhone = p.replace(/^tel:\s*/i, '').trim();
      } else if (p.toLowerCase().startsWith('date:')) {
        receiverDate = p.replace(/^date:\s*/i, '').trim();
      } else if (idx === 0) {
        receiverName = p;
      }
    });
    return { receiverName, receiverPhone, receiverDate };
  }

  return { receiverName: trimmed, receiverPhone: '', receiverDate: '' };
}

// Universal parser that handles ANY Excel or CSV sheet layout, header location, or missing columns
function parseSpreadsheetUniversally(
  workbook: XLSX.WorkBook,
  fallbackContainerName: string,
  fallbackWarehouse: string
): { rows: ManifestRowInput[]; detectedContainer?: string; detectedWarehouse?: string } {
  const results: ManifestRowInput[] = [];
  let detectedContainer = '';
  let detectedWarehouse = '';

  for (const sheetName of workbook.SheetNames) {
    // Skip audit or summary sheets
    if (
      sheetName.toLowerCase().includes('update log') ||
      sheetName.toLowerCase().includes('summary')
    ) {
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert to 2D array of raw values
    const rawGrid: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    });

    if (!rawGrid || rawGrid.length === 0) continue;

    // Remove totally empty rows
    const nonEmptyGrid = rawGrid.filter((row) =>
      Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')
    );

    if (nonEmptyGrid.length === 0) continue;

    // 1. Search top 15 rows to find the best header row
    let headerRowIdx = -1;
    let bestScore = 0;
    const colMap: Record<string, number> = {};

    const headerPatterns = {
      name: /^(2\.\s*)?(customer|client|owner|consignee|shipper|name|description|goods|item|particulars?|cargo|details|mark)/i,
      container: /^(1\.\s*)?(container|cont|cnt|box|unit|ctn|cntr)/i,
      phone: /^(3\.\s*)?(phone|tel|mobile|contact|cell|whatsapp)/i,
      cbm: /^(4\.\s*)?(cbm|volume|m3|cubic|vol|measurement|size|weight|gross|wt|kg)/i,
      amount: /^(5\.\s*)?(amount|total|cost|charge|price|freight|rate|fee|val|value)/i,
      taken: /^(6\.\s*)?(taken|status|collect|pickup|delivery|dispatch)/i,
      paid: /^(7\.\s*)?(paid|deposit|advance|settled)/i,
      credit: /^(8\.\s*)?(credit|balance|due|owed|outstanding)/i,
      receiver: /^(9\.\s*)?(receiver|recipient|received|agent|collected\s*by)/i,
      warehouse: /^(10\.\s*)?(warehouse|wh|whse|depot|yard|store|location|terminal)/i,
    };

    for (let r = 0; r < Math.min(15, nonEmptyGrid.length); r++) {
      const row = nonEmptyGrid[r];
      let rowScore = 0;
      const tempMap: Record<string, number> = {};

      row.forEach((cell, cIdx) => {
        const text = String(cell || '').trim().toLowerCase();
        if (!text) return;

        // Check against patterns
        for (const [field, pattern] of Object.entries(headerPatterns)) {
          if (pattern.test(text) && tempMap[field] === undefined) {
            tempMap[field] = cIdx;
            rowScore += 1;
          }
        }
      });

      if (rowScore > bestScore) {
        bestScore = rowScore;
        headerRowIdx = r;
        Object.assign(colMap, tempMap);
      }
    }

    const startDataRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

    // If no header row was detected with keywords, use column characteristics heuristic
    if (headerRowIdx === -1) {
      // Find columns heuristically
      const sampleRows = nonEmptyGrid.slice(0, 5);
      const colTypes: Record<number, string> = {};

      sampleRows.forEach((row) => {
        row.forEach((cell, cIdx) => {
          const valStr = String(cell || '').trim();
          if (!valStr) return;

          if (/^[+]?[\d\s-]{8,18}$/.test(valStr) && /\d{4,}/.test(valStr)) {
            colTypes[cIdx] = 'phone';
          } else if (cleanNumber(valStr) > 0 && cleanNumber(valStr) <= 150 && (valStr.includes('.') || cleanNumber(valStr) < 40)) {
            if (!colTypes[cIdx]) colTypes[cIdx] = 'cbm';
          } else if (cleanNumber(valStr) >= 500) {
            if (!colTypes[cIdx]) colTypes[cIdx] = 'amount';
          }
        });
      });

      // Find first string column for name
      for (let c = 0; c < 10; c++) {
        if (!colTypes[c]) {
          colMap.name = c;
          break;
        }
      }
      Object.entries(colTypes).forEach(([cIdx, type]) => {
        if (colMap[type] === undefined) {
          colMap[type] = Number(cIdx);
        }
      });
    }

    // 2. Extract data rows
    for (let r = startDataRow; r < nonEmptyGrid.length; r++) {
      const row = nonEmptyGrid[r];
      if (!row || row.length === 0) continue;

      const getVal = (field: string): string => {
        const idx = colMap[field];
        if (idx !== undefined && idx < row.length) {
          const val = row[idx];
          return val !== undefined && val !== null ? String(val).trim() : '';
        }
        return '';
      };

      // Customer name
      let name = getVal('name');

      // If name is empty, inspect other non-numeric text columns in this row
      if (!name) {
        for (let c = 0; c < row.length; c++) {
          if (c !== colMap.phone && c !== colMap.cbm && c !== colMap.amount && c !== colMap.paid && c !== colMap.credit) {
            const candidate = String(row[c] || '').trim();
            if (candidate && !/^(total|grand total|subtotal|s\/?n|\d+)$/i.test(candidate)) {
              name = candidate;
              break;
            }
          }
        }
      }

      // Skip obvious footer/summary rows
      const lowerName = name.toLowerCase();
      if (
        lowerName === 'total' ||
        lowerName === 'grand total' ||
        lowerName === 'subtotal' ||
        lowerName.startsWith('page ') ||
        lowerName.startsWith('printed on')
      ) {
        continue;
      }

      // If still no name, default to Customer row number so the entry is never lost
      if (!name) {
        name = `Customer ${results.length + 1}`;
      }

      const containerNameFromRow = getVal('container');
      if (containerNameFromRow && !detectedContainer) {
        detectedContainer = containerNameFromRow;
      }

      const warehouseFromRow = getVal('warehouse');
      if (warehouseFromRow && !detectedWarehouse) {
        detectedWarehouse = warehouseFromRow;
      }

      const phone = getVal('phone');
      const cbm = cleanNumber(getVal('cbm'));
      const amount = cleanNumber(getVal('amount'));
      const paid = cleanNumber(getVal('paid'));
      const creditVal = getVal('credit');
      const credit = creditVal ? cleanNumber(creditVal) : Math.max(0, amount - paid);

      const takenRaw = getVal('taken') || 'Not Taken';
      const takenStatus = inferTakenStatus(takenRaw);

      let receiverName = getVal('receiver');
      let receiverPhone = '';
      let receiverDate = '';

      if (receiverName && receiverName.includes('|')) {
        const parsed = parseCombinedReceiver(receiverName);
        receiverName = parsed.receiverName;
        receiverPhone = parsed.receiverPhone;
        receiverDate = parsed.receiverDate;
      }

      results.push({
        containerName: containerNameFromRow || fallbackContainerName,
        name,
        phone,
        cbm,
        amount,
        takenStatus,
        taken: takenRaw || takenStatus,
        paid,
        credit,
        receiverName,
        receiverPhone,
        receiverDate,
        warehouse: warehouseFromRow || fallbackWarehouse,
      });
    }
  }

  return { rows: results, detectedContainer, detectedWarehouse };
}

// Parse pasted plain text (from WhatsApp, Excel copy-paste, or emails)
function parsePastedTextLocally(
  text: string,
  fallbackContainer: string,
  fallbackWarehouse: string
): ManifestRowInput[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[-=_,.]{3,}$/.test(l));

  const results: ManifestRowInput[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(s\/?n|total|grand total|page\s+\d)/i.test(line)) {
      continue;
    }

    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(';') && line.split(';').length >= 2) {
      parts = line.split(';');
    } else if (line.includes(',')) {
      parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    } else {
      parts = [line];
    }

    parts = parts.map((p) => p.replace(/^"|"$/g, '').trim()).filter((p) => p !== '');
    if (parts.length === 0) continue;

    // Skip table header
    if (i === 0 && /name|customer|cbm|amount|phone/i.test(parts.join(' '))) {
      continue;
    }

    let name = '';
    let phone = '';
    let cbm = 0;
    let amount = 0;
    let paid = 0;
    const remainingText: string[] = [];

    parts.forEach((p) => {
      const numClean = p.replace(/[^0-9.-]/g, '');
      const numVal = parseFloat(numClean);

      if (!phone && /^[+]?[\d\s-]{8,18}$/.test(p) && /\d{4,}/.test(p)) {
        phone = p;
        return;
      }

      if (!Number.isNaN(numVal) && numClean.length > 0) {
        if (!cbm && numVal > 0 && numVal <= 150 && (p.includes('.') || numVal < 40)) {
          cbm = numVal;
          return;
        }
        if (!amount && numVal > 0) {
          amount = numVal;
          return;
        }
        if (!paid && amount > 0 && numVal <= amount) {
          paid = numVal;
          return;
        }
      }

      remainingText.push(p);
    });

    if (remainingText.length > 0) {
      name = remainingText[0];
    }

    if (!name) {
      name = `Customer ${results.length + 1}`;
    }

    results.push({
      containerName: fallbackContainer,
      name,
      phone,
      cbm,
      amount,
      takenStatus: 'Not Taken',
      taken: 'Not Taken',
      paid,
      credit: Math.max(0, amount - paid),
      receiverName: '',
      receiverPhone: '',
      receiverDate: '',
      warehouse: fallbackWarehouse,
    });
  }

  return results;
}

export function UploadManifestModal({
  isOpen,
  onClose,
  targetContainerId,
  targetContainerName,
  defaultWarehouse,
  onManifestImported,
}: UploadManifestModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [containerName, setContainerName] = useState(
    targetContainerName || 'Container 1'
  );
  const [warehouse, setWarehouse] = useState(defaultWarehouse || '');
  const [personName, setPersonName] = useState(() => getLastOperatorName() || 'Staff');

  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [extractedRows, setExtractedRows] = useState<ManifestRowInput[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setNotice(null);
    setIsParsing(true);

    const lowerName = file.name.toLowerCase();

    // 1. Excel or CSV files: 100% Client-Side Universal Parsing
    if (
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv') ||
      lowerName.endsWith('.tsv')
    ) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const { rows, detectedContainer, detectedWarehouse } =
          parseSpreadsheetUniversally(
            workbook,
            targetContainerName || containerName,
            warehouse
          );

        if (detectedContainer && !targetContainerName) {
          setContainerName(detectedContainer);
        }
        if (detectedWarehouse && !warehouse) {
          setWarehouse(detectedWarehouse);
        }

        if (rows.length > 0) {
          setExtractedRows(rows);
          setNotice(`Extracted ${rows.length} records. You can review, edit, or fill missing details later.`);
        } else {
          // If sheet was empty or had non-standard format, add an empty row ready for data
          setExtractedRows([
            {
              containerName: targetContainerName || containerName,
              name: 'Customer 1',
              phone: '',
              cbm: 0,
              amount: 0,
              takenStatus: 'Not Taken',
              taken: 'Not Taken',
              paid: 0,
              credit: 0,
              receiverName: '',
              receiverPhone: '',
              receiverDate: '',
              warehouse,
            },
          ]);
          setNotice('Manifest opened. You can add or edit your customer cargo records below.');
        }
      } catch (err) {
        console.warn('Local spreadsheet read fallback:', err);
        // Never throw an error: provide empty rows ready to use
        setExtractedRows([
          {
            containerName: targetContainerName || containerName,
            name: 'Customer 1',
            phone: '',
            cbm: 0,
            amount: 0,
            takenStatus: 'Not Taken',
            taken: 'Not Taken',
            paid: 0,
            credit: 0,
            receiverName: '',
            receiverPhone: '',
            receiverDate: '',
            warehouse,
          },
        ]);
        setNotice('Please review or add your customer rows below.');
      } finally {
        setIsParsing(false);
      }
      return;
    }

    // 2. PDF, Image, or other document: Try server AI, with guaranteed safe fallback
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || '');
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/parse-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          mimeType: file.type || 'application/pdf',
        }),
      });

      const data = await res.json();
      const rows = Array.isArray(data.rows) ? data.rows : [];

      if (rows.length > 0) {
        const mapped: ManifestRowInput[] = rows.map(
          (r: Record<string, unknown>, idx: number) => {
            const amt = cleanNumber(r.amount);
            const pd = cleanNumber(r.paid);
            const takenStr = String(r.taken || 'Not Taken').trim();
            return {
              containerName:
                String(r.containerName || targetContainerName || containerName).trim(),
              name: String(r.name || `Customer ${idx + 1}`).trim(),
              phone: String(r.phone || '').trim(),
              cbm: cleanNumber(r.cbm),
              amount: amt,
              takenStatus: inferTakenStatus(takenStr),
              taken: takenStr,
              paid: pd,
              credit:
                r.credit !== undefined && r.credit !== null
                  ? cleanNumber(r.credit)
                  : Math.max(0, amt - pd),
              receiverName: String(r.receiverName || '').trim(),
              receiverPhone: String(r.receiverPhone || '').trim(),
              receiverDate: String(r.receiverDate || '').trim(),
              warehouse: String(r.warehouse || warehouse).trim(),
            };
          }
        );
        setExtractedRows(mapped);
        setNotice(`Extracted ${mapped.length} records from uploaded document.`);
      } else {
        // Fallback: Provide blank rows so user is never blocked
        setExtractedRows([
          {
            containerName: targetContainerName || containerName,
            name: 'Customer 1',
            phone: '',
            cbm: 0,
            amount: 0,
            takenStatus: 'Not Taken',
            taken: 'Not Taken',
            paid: 0,
            credit: 0,
            receiverName: '',
            receiverPhone: '',
            receiverDate: '',
            warehouse,
          },
        ]);
        setNotice('Manifest uploaded. You can fill or add rows below and complete the rest later.');
      }
    } catch {
      // Safe fallback: never show fatal error
      setExtractedRows([
        {
          containerName: targetContainerName || containerName,
          name: 'Customer 1',
          phone: '',
          cbm: 0,
          amount: 0,
          takenStatus: 'Not Taken',
          taken: 'Not Taken',
          paid: 0,
          credit: 0,
          receiverName: '',
          receiverPhone: '',
          receiverDate: '',
          warehouse,
        },
      ]);
      setNotice('Document opened. Enter your customer cargo rows below.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleExtractPastedText = () => {
    if (!pastedText.trim()) return;
    const rows = parsePastedTextLocally(
      pastedText,
      targetContainerName || containerName,
      warehouse
    );
    if (rows.length > 0) {
      setExtractedRows(rows);
      setNotice(`Extracted ${rows.length} records from pasted text.`);
      setShowPasteBox(false);
    }
  };

  const handleAddBlankRow = () => {
    setExtractedRows((prev) => [
      ...prev,
      {
        containerName: targetContainerName || containerName,
        name: `Customer ${prev.length + 1}`,
        phone: '',
        cbm: 0,
        amount: 0,
        takenStatus: 'Not Taken',
        taken: 'Not Taken',
        paid: 0,
        credit: 0,
        receiverName: '',
        receiverPhone: '',
        receiverDate: '',
        warehouse,
      },
    ]);
  };

  const handleUpdateRow = (
    index: number,
    field: keyof ManifestRowInput,
    value: string | number
  ) => {
    setExtractedRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === 'amount' || field === 'paid') {
          const amt = cleanNumber(updated.amount);
          const pd = cleanNumber(updated.paid);
          updated.credit = Math.max(0, amt - pd);
        }
        return updated;
      })
    );
  };

  const handleRemoveRow = (index: number) => {
    setExtractedRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedRows.length === 0) return;

    // Ensure staff name is set
    const operator = personName.trim() || 'Staff';

    // Ensure every row has a name so no rows are lost
    const finalizedRows = extractedRows.map((r, i) => ({
      ...r,
      name: (r.name || '').trim() || `Customer ${i + 1}`,
    }));

    const resultContainerId = importManifestRecords(finalizedRows, {
      targetContainerId,
      defaultContainerName: containerName.trim() || 'Container 1',
      defaultWarehouse: warehouse.trim(),
      personName: operator,
    });

    onManifestImported(resultContainerId, finalizedRows.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-4xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <Upload className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Upload Manifest
              </h3>
              <p className="text-xs text-slate-400">
                {targetContainerName
                  ? `Adding records to ${targetContainerName}`
                  : 'Automatically fill customer cargo inventory from manifest'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmImport} className="p-4 sm:p-6 space-y-4">
          {/* File Upload Zone */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv,.pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
              {isParsing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                {fileName ? `Selected: ${fileName}` : 'Choose Manifest File (.xlsx, .csv, .pdf, or image)'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload any manifest. If some columns are missing, you can fill them in later.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 min-h-[42px]"
              >
                <Upload className="w-4 h-4" />
                <span>{fileName ? 'Choose Another File' : 'Select Manifest File'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadManifestTemplateExcel(
                    targetContainerName || containerName || 'Container 1'
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Template</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 min-h-[42px]"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{showPasteBox ? 'Hide Paste Box' : 'Paste Text'}</span>
              </button>
            </div>

            {showPasteBox && (
              <div className="pt-3 text-left space-y-2 border-t border-slate-200 mt-3">
                <label className="block text-xs font-bold text-slate-700">
                  Paste Manifest Rows:
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste text or spreadsheet rows here..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  disabled={!pastedText.trim()}
                  onClick={handleExtractPastedText}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
                >
                  Extract Records
                </button>
              </div>
            )}
          </div>

          {/* Friendly Status Notice */}
          {notice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Container, Warehouse & Staff Header Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Container *</span>
              </label>
              <input
                type="text"
                required
                disabled={Boolean(targetContainerId)}
                value={targetContainerName || containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="e.g. Container 1"
                className="w-full bg-white disabled:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                <span>Warehouse</span>
              </label>
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                placeholder="Enter warehouse location"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Staff Name *</span>
              </label>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 min-h-[42px]"
              />
            </div>
          </div>

          {/* Extracted Rows Preview & In-Table Editing */}
          {extractedRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Extracted Records ({extractedRows.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    You can edit any cell directly or fill missing info later.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-2.5">#</th>
                        <th className="py-2.5 px-2.5">Customer Name</th>
                        <th className="py-2.5 px-2.5">Phone</th>
                        <th className="py-2.5 px-2.5">CBM</th>
                        <th className="py-2.5 px-2.5">Amount</th>
                        <th className="py-2.5 px-2.5">Paid</th>
                        <th className="py-2.5 px-2.5">Credit</th>
                        <th className="py-2.5 px-2.5">Taken</th>
                        <th className="py-2.5 px-2.5">Receiver</th>
                        <th className="py-2.5 px-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 min-w-[150px]">
                            <input
                              type="text"
                              value={row.name}
                              placeholder={`Customer ${idx + 1}`}
                              onChange={(e) =>
                                handleUpdateRow(idx, 'name', e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 font-bold text-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 min-w-[110px]">
                            <input
                              type="text"
                              value={row.phone || ''}
                              placeholder="Phone (optional)"
                              onChange={(e) =>
                                handleUpdateRow(idx, 'phone', e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 text-slate-700 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 w-20">
                            <input
                              type="number"
                              step="0.01"
                              value={row.cbm ?? 0}
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  'cbm',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 bg-transparent border-b border-transparent focus:border-slate-400 font-bold text-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 w-24">
                            <input
                              type="number"
                              step="any"
                              value={row.amount ?? 0}
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  'amount',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 bg-transparent border-b border-transparent focus:border-slate-400 font-bold text-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 w-24">
                            <input
                              type="number"
                              step="any"
                              value={row.paid ?? 0}
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  'paid',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 bg-transparent border-b border-transparent focus:border-slate-400 font-bold text-emerald-700 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 font-bold text-rose-600 whitespace-nowrap">
                            {formatMoney(row.credit ?? 0)}
                          </td>
                          <td className="py-2 px-2.5 min-w-[110px]">
                            <input
                              type="text"
                              value={row.taken || 'Not Taken'}
                              onChange={(e) =>
                                handleUpdateRow(idx, 'taken', e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 text-slate-700 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 min-w-[120px]">
                            <input
                              type="text"
                              value={row.receiverName || ''}
                              placeholder="Receiver (optional)"
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  'receiverName',
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 text-slate-700 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm min-h-[46px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={extractedRows.length === 0 || isParsing}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 min-h-[46px]"
            >
              <Check className="w-4 h-4" />
              <span>
                Import {extractedRows.length > 0 ? `(${extractedRows.length} Records)` : ''}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
