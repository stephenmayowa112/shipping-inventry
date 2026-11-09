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
  AlertCircle,
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

  // Handle "Name | Tel: 080... | Date: 2026-10-28" format from our own Excel export
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

function parseSpreadsheetRowsLocally(
  jsonRows: Record<string, unknown>[]
): ManifestRowInput[] {
  const results: ManifestRowInput[] = [];

  for (const rawRow of jsonRows) {
    const entries = Object.entries(rawRow);
    if (entries.length === 0) continue;

    const getField = (keywords: string[]): string => {
      for (const [key, val] of entries) {
        const k = key.toLowerCase().trim();
        if (keywords.some((kw) => k === kw || k.includes(kw))) {
          return val !== undefined && val !== null ? String(val).trim() : '';
        }
      }
      return '';
    };

    const name = getField([
      '2. name',
      'customer name',
      'cargo owner',
      'consignee',
      'client name',
      'owner name',
      'customer',
      'name',
    ]);

    // Skip empty or header/total rows
    if (
      !name ||
      name.toLowerCase() === 'total' ||
      name.toLowerCase() === 'grand total' ||
      name.toLowerCase() === 'no records added yet' ||
      name.toLowerCase() === '(empty container)'
    ) {
      continue;
    }

    const containerName = getField([
      '1. container',
      'container name',
      'container no',
      'container',
    ]);

    const phone = getField([
      '3. phone',
      'phone number',
      'customer phone',
      'phone',
      'tel',
      'mobile',
      'contact',
    ]);

    const cbmStr = getField(['4. cbm', 'cbm', 'volume', 'cubic']);
    const amountStr = getField([
      '5. amount',
      'total amount',
      'amount',
      'cost',
      'charge',
      'freight',
    ]);
    const takenRaw =
      getField(['6. taken', 'taken', 'collection status', 'collected']) ||
      'Not Taken';
    const paidStr = getField(['7. paid', 'amount paid', 'paid', 'deposit']);
    const creditStr = getField(['8. credit', 'credit', 'balance', 'owed']);

    const sepReceiverName = getField([
      '9a. receiver name',
      'receiver name',
      "receiver's name",
    ]);
    const sepReceiverPhone = getField([
      '9b. receiver phone',
      'receiver phone',
      "receiver's phone",
      'receiver tel',
    ]);
    const sepReceiverDate = getField([
      '9c. receiver date',
      'receiver date',
      "receiver's date",
      'collection date',
    ]);
    const combinedReceiverRaw = getField([
      "9. receiver's",
      '9. receiver',
      'receiver',
    ]);

    let receiverName = sepReceiverName;
    let receiverPhone = sepReceiverPhone;
    let receiverDate = sepReceiverDate;

    if (!receiverName && combinedReceiverRaw) {
      const parsedRcv = parseCombinedReceiver(combinedReceiverRaw);
      receiverName = parsedRcv.receiverName;
      receiverPhone = receiverPhone || parsedRcv.receiverPhone;
      receiverDate = receiverDate || parsedRcv.receiverDate;
    }

    const warehouse = getField([
      '10. warehouse',
      'warehouse',
      'yard',
      'location',
    ]);

    const cbm = cleanNumber(cbmStr);
    const amount = cleanNumber(amountStr);
    const paid = cleanNumber(paidStr);
    const credit = creditStr !== '' ? cleanNumber(creditStr) : Math.max(0, amount - paid);
    const takenStatus = inferTakenStatus(takenRaw);

    results.push({
      containerName,
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
      warehouse,
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
  const [personName, setPersonName] = useState(() => getLastOperatorName());

  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedRows, setExtractedRows] = useState<ManifestRowInput[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  if (!isOpen) return null;

  const parseWithServerAi = async (payload: {
    textContent?: string;
    fileBase64?: string;
    mimeType?: string;
  }) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const res = await fetch('/api/parse-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not extract manifest records.');
      }

      if (
        !targetContainerName &&
        data.detectedContainerName &&
        typeof data.detectedContainerName === 'string' &&
        data.detectedContainerName.trim()
      ) {
        setContainerName(data.detectedContainerName.trim());
      }
      if (
        !warehouse &&
        data.detectedWarehouse &&
        typeof data.detectedWarehouse === 'string' &&
        data.detectedWarehouse.trim()
      ) {
        setWarehouse(data.detectedWarehouse.trim());
      }

      const rawList = Array.isArray(data.rows) ? data.rows : [];
      const mapped: ManifestRowInput[] = rawList
        .filter((r: Record<string, unknown>) => r && typeof r.name === 'string' && r.name.trim())
        .map((r: Record<string, unknown>) => {
          const amount = cleanNumber(r.amount);
          const paid = cleanNumber(r.paid);
          const credit =
            r.credit !== undefined && r.credit !== null
              ? cleanNumber(r.credit)
              : Math.max(0, amount - paid);
          const takenStr =
            typeof r.taken === 'string' && r.taken.trim()
              ? r.taken.trim()
              : 'Not Taken';
          const takenStatus: TakenStatus =
            r.takenStatus === 'Taken' || r.takenStatus === 'Partial'
              ? r.takenStatus
              : inferTakenStatus(takenStr);

          return {
            containerName:
              typeof r.containerName === 'string' ? r.containerName.trim() : '',
            name: String(r.name).trim(),
            phone: typeof r.phone === 'string' ? r.phone.trim() : '',
            cbm: cleanNumber(r.cbm),
            amount,
            takenStatus,
            taken: takenStr,
            paid,
            credit,
            receiverName:
              typeof r.receiverName === 'string' ? r.receiverName.trim() : '',
            receiverPhone:
              typeof r.receiverPhone === 'string' ? r.receiverPhone.trim() : '',
            receiverDate:
              typeof r.receiverDate === 'string' ? r.receiverDate.trim() : '',
            warehouse:
              typeof r.warehouse === 'string' ? r.warehouse.trim() : '',
          };
        });

      if (mapped.length === 0) {
        setParseError(
          'No customer cargo rows were detected in the uploaded manifest. Please check the file or try another format.'
        );
      } else {
        setExtractedRows(mapped);
      }
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : 'Failed to process manifest.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);

    const lowerName = file.name.toLowerCase();

    // 1. Excel or CSV files (.xlsx, .xls, .csv)
    if (
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv')
    ) {
      setIsParsing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        let allLocalRows: ManifestRowInput[] = [];
        const combinedCsvChunks: string[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          // Skip history or summary sheets if present
          if (
            sheetName.toLowerCase().includes('update log') ||
            sheetName.toLowerCase().includes('summary')
          ) {
            return;
          }
          const sheet = workbook.Sheets[sheetName];
          const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet,
            { defval: '' }
          );
          const parsedLocal = parseSpreadsheetRowsLocally(jsonRows);
          allLocalRows = [...allLocalRows, ...parsedLocal];

          const csvText = XLSX.utils.sheet_to_csv(sheet);
          if (csvText.trim()) {
            combinedCsvChunks.push(`--- Sheet: ${sheetName} ---\n${csvText}`);
          }
        });

        if (allLocalRows.length > 0) {
          // Auto-fill container name and warehouse if detected in first row
          const firstWithContainer = allLocalRows.find(
            (r) => r.containerName && r.containerName.trim()
          );
          if (!targetContainerName && firstWithContainer?.containerName) {
            setContainerName(firstWithContainer.containerName);
          }
          const firstWithWarehouse = allLocalRows.find(
            (r) => r.warehouse && r.warehouse.trim()
          );
          if (!warehouse && firstWithWarehouse?.warehouse) {
            setWarehouse(firstWithWarehouse.warehouse);
          }
          setExtractedRows(allLocalRows);
          setIsParsing(false);
        } else if (combinedCsvChunks.length > 0) {
          // Fallback to AI extraction if headers are non-standard
          await parseWithServerAi({
            textContent: combinedCsvChunks.join('\n\n'),
          });
        } else {
          setParseError('The selected spreadsheet appears to be empty.');
          setIsParsing(false);
        }
      } catch (err: unknown) {
        setParseError(
          err instanceof Error
            ? err.message
            : 'Could not read Excel/CSV manifest.'
        );
        setIsParsing(false);
      }
      return;
    }

    // 2. PDF or Image files (.pdf, .png, .jpg, .jpeg, .webp)
    const reader = new FileReader();
    reader.onload = async () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      const base64Data = resultStr.includes(',')
        ? resultStr.split(',')[1]
        : resultStr;
      await parseWithServerAi({
        fileBase64: base64Data,
        mimeType: file.type || 'application/pdf',
      });
    };
    reader.readAsDataURL(file);
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
    if (
      extractedRows.length === 0 ||
      !personName.trim() ||
      (!targetContainerId && !containerName.trim())
    ) {
      return;
    }

    const resultContainerId = importManifestRecords(extractedRows, {
      targetContainerId,
      defaultContainerName: containerName.trim(),
      defaultWarehouse: warehouse.trim(),
      personName: personName.trim(),
    });

    onManifestImported(resultContainerId, extractedRows.length);
    onClose();
  };

  const totalCbm = extractedRows.reduce((s, r) => s + (Number(r.cbm) || 0), 0);
  const totalAmount = extractedRows.reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );
  const totalPaid = extractedRows.reduce(
    (s, r) => s + (Number(r.paid) || 0),
    0
  );
  const totalCredit = extractedRows.reduce(
    (s, r) => s + (Number(r.credit) || 0),
    0
  );

  const isImportValid =
    extractedRows.length > 0 &&
    personName.trim().length > 0 &&
    (Boolean(targetContainerId) || containerName.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-4xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Upload Container Manifest
              </h3>
              <p className="text-[11px] text-slate-500">
                {targetContainerName
                  ? `Automatically add manifest records into ${targetContainerName}`
                  : 'Upload Excel (.xlsx, .csv), PDF, or Manifest Image to auto-create the 10-field list'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmImport} className="p-4 sm:p-6 space-y-5">
          {/* Step 1: Upload File or Download Template */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-50 transition-colors text-center space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,image/*"
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
                {fileName
                  ? `Selected: ${fileName}`
                  : 'Select Manifest File (.xlsx, .xls, .csv, .pdf, or Image)'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-lg mx-auto">
                Automatically extracts all 10 fields: Container, Name, Phone, CBM, Amount, Taken, Paid, Credit, Receiver, and Warehouse.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors min-h-[42px]"
              >
                <Upload className="w-4 h-4" />
                <span>{fileName ? 'Choose Different File' : 'Choose Manifest File'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadManifestTemplateExcel(
                    targetContainerName || containerName || 'Container 1'
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Excel Template</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors min-h-[42px]"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{showPasteBox ? 'Hide Paste Box' : 'Paste Manifest Text'}</span>
              </button>
            </div>

            {showPasteBox && (
              <div className="pt-3 text-left space-y-2 border-t border-slate-200 mt-3">
                <label className="block text-xs font-bold text-slate-700">
                  Paste Manifest Rows (from Excel, WhatsApp, or Word):
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste customer names, phone numbers, CBM, amounts..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  disabled={!pastedText.trim() || isParsing}
                  onClick={() =>
                    parseWithServerAi({ textContent: pastedText.trim() })
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
                >
                  Extract Records from Pasted Text
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isParsing && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs sm:text-sm text-blue-900 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
              <span>
                Reading manifest and extracting customer cargo records into the 10 fields...
              </span>
            </div>
          )}

          {/* Error State */}
          {parseError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs sm:text-sm text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Container, Warehouse & Compulsory Staff Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-600" />
                <span>1. Target Container *</span>
              </label>
              <input
                type="text"
                required
                disabled={Boolean(targetContainerId)}
                value={targetContainerName || containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="e.g. Container 1"
                className="w-full bg-white disabled:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-slate-600" />
                <span>10. Default Warehouse</span>
              </label>
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                placeholder="Enter warehouse location..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Your Name (Staff) *</span>
                </label>
                <span className="text-[10px] font-bold uppercase text-amber-800">
                  Compulsory
                </span>
              </div>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          {/* Preview of Extracted Manifest Rows */}
          {extractedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Manifest Preview ({extractedRows.length} Customer Records Ready)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Total CBM: <strong>{totalCbm.toFixed(2)}</strong> · Total Amount:{' '}
                    <strong>{formatMoney(totalAmount)}</strong> · Total Paid:{' '}
                    <strong className="text-emerald-700">
                      {formatMoney(totalPaid)}
                    </strong>{' '}
                    · Total Credit:{' '}
                    <strong className="text-rose-600">
                      {formatMoney(totalCredit)}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setExtractedRows([])}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Clear Preview
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-2.5">#</th>
                        <th className="py-2.5 px-2.5">2. Name</th>
                        <th className="py-2.5 px-2.5">3. Phone</th>
                        <th className="py-2.5 px-2.5">4. CBM</th>
                        <th className="py-2.5 px-2.5">5. Amount</th>
                        <th className="py-2.5 px-2.5">6. Taken</th>
                        <th className="py-2.5 px-2.5">7. Paid</th>
                        <th className="py-2.5 px-2.5">8. Credit</th>
                        <th className="py-2.5 px-2.5">9. Receiver</th>
                        <th className="py-2.5 px-2.5">10. Warehouse</th>
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
                              onChange={(e) =>
                                handleUpdateRow(idx, 'name', e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 font-bold text-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 min-w-[115px]">
                            <input
                              type="text"
                              value={row.phone || ''}
                              onChange={(e) =>
                                handleUpdateRow(idx, 'phone', e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 font-mono text-slate-700 focus:outline-none"
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
                              className="w-16 bg-transparent border-b border-transparent focus:border-slate-400 font-mono font-bold text-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 w-28">
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
                              className="w-24 bg-transparent border-b border-transparent focus:border-slate-400 font-mono font-bold text-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 min-w-[120px]">
                            <input
                              type="text"
                              value={row.taken || 'Not Taken'}
                              onChange={(e) =>
                                handleUpdateRow(idx, 'taken', e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-400 text-slate-700 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 w-28">
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
                              className="w-24 bg-transparent border-b border-transparent focus:border-slate-400 font-mono font-bold text-emerald-700 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-rose-600 whitespace-nowrap">
                            {formatMoney(row.credit ?? 0)}
                          </td>
                          <td className="py-2 px-2.5 min-w-[130px]">
                            <input
                              type="text"
                              value={row.receiverName || ''}
                              placeholder="None"
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
                          <td className="py-2 px-2.5 min-w-[120px]">
                            <input
                              type="text"
                              value={row.warehouse || warehouse}
                              placeholder="Default"
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  'warehouse',
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
                              title="Remove row"
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

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col-reverse xs:flex-row sm:flex-row items-stretch sm:items-center justify-end gap-2 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors min-h-[44px] text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isImportValid || isParsing}
              className="px-5 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[48px]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                Create List from Manifest ({extractedRows.length} Records)
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
