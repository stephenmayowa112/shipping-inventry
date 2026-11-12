'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Download,
  UserCheck,
  Loader2,
  FileText,
} from 'lucide-react';
import { GoodsCondition, ConfirmationStatus } from '@/lib/types';
import {
  WarehouseRecordInput,
  importWarehouseRecords,
  getLastOperatorName,
  formatMoney,
} from '@/lib/storage';
import { downloadWarehouseTemplateExcel } from '@/lib/exportUtils';

interface UploadWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

function cleanNum(val: unknown): number {
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : Math.max(0, val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  return 0;
}

function parseExcelRowsToWarehouse(
  rawRows: Record<string, unknown>[],
  defaultWarehouse: string,
  defaultPerson: string
): WarehouseRecordInput[] {
  const today = new Date().toISOString().split('T')[0];
  const results: WarehouseRecordInput[] = [];

  for (const row of rawRows) {
    const entries = Object.entries(row);
    if (entries.length === 0) continue;

    const getVal = (patterns: RegExp[]): unknown => {
      for (const p of patterns) {
        const found = entries.find(([k]) => p.test(k.trim().toLowerCase()));
        if (
          found &&
          found[1] !== undefined &&
          found[1] !== null &&
          String(found[1]).trim() !== ''
        ) {
          return found[1];
        }
      }
      return undefined;
    };

    const goodsInStockRaw = getVal([
      /goods.*in.*stock/i,
      /^1\./i,
      /in.?stock/i,
      /^stock$/i,
      /^goods$/i,
    ]);
    const arrivalRaw = getVal([
      /arrival/i,
      /^2\./i,
      /date/i,
    ]);
    const containerRaw = getVal([
      /^container/i,
      /container.*name/i,
      /3a\./i,
    ]);
    const takeoutContainerRaw = getVal([
      /takeout.*container/i,
      /offloaded.*goods/i,
      /^3\./i,
      /3b\./i,
    ]);
    const takeoutWarehouseRaw = getVal([
      /takeout.*warehouse/i,
      /warehouse.*takeout/i,
      /dispatched/i,
      /^4\./i,
    ]);
    const warehouseRaw = getVal([
      /name.*warehouse/i,
      /^warehouse/i,
      /5a\./i,
    ]);
    const offloaderRaw = getVal([
      /offloader/i,
      /5b\./i,
      /^5\./i,
    ]);
    const personRaw = getVal([
      /name.*person/i,
      /^person/i,
      /^6\./i,
      /staff/i,
    ]);
    const confirmRaw = getVal([
      /confirm/i,
      /^7\./i,
    ]);
    const conditionRaw = getVal([
      /condition/i,
      /^8\./i,
      /good.*damaged/i,
    ]);
    const conditionDetailsRaw = getVal([
      /condition.*detail/i,
      /damage.*note/i,
    ]);
    const unaccountedRaw = getVal([
      /unaccounted/i,
      /missing/i,
      /^9\./i,
    ]);
    const creditRaw = getVal([
      /credit/i,
      /balance/i,
      /^10\./i,
    ]);

    const goodsInStock = String(goodsInStockRaw || '').trim();
    const containerName = String(containerRaw || '').trim();
    if (!goodsInStock && !containerName) continue;
    if (/^(total|grand total|subtotal)$/i.test(goodsInStock)) continue;

    const condStr = String(conditionRaw || 'Good').trim();
    let goodsCondition: GoodsCondition = 'Good';
    if (/part/i.test(condStr)) goodsCondition = 'Part Damaged';
    else if (/damage|bad/i.test(condStr)) goodsCondition = 'Damaged';

    const confStr = String(confirmRaw || 'Pending').trim();
    const confirmationStatus: ConfirmationStatus = /confirm|yes|ok|verified/i.test(
      confStr
    )
      ? 'Confirmed'
      : 'Pending';

    const unaccStr = String(unaccountedRaw || 'None (0 Missing)').trim();
    const hasUnaccounted =
      Boolean(unaccStr) && !/^(none|none \(0 missing\)|0|no|nil|-)$/i.test(unaccStr);

    results.push({
      goodsInStock: goodsInStock || 'In Stock',
      goodsArrivalDate: String(arrivalRaw || today).trim(),
      containerName: containerName || 'Container 1',
      takeoutFromContainer: String(takeoutContainerRaw || '-').trim(),
      takeoutFromWarehouse: String(takeoutWarehouseRaw || 'None yet').trim(),
      warehouseName: String(warehouseRaw || defaultWarehouse || 'Main Warehouse').trim(),
      offloaderName: String(offloaderRaw || '-').trim(),
      personName: String(personRaw || defaultPerson || 'Staff').trim(),
      confirmationStatus,
      confirmationNote: '',
      goodsCondition,
      conditionDetails: String(conditionDetailsRaw || goodsCondition).trim(),
      hasUnaccounted,
      unaccountedDetails: unaccStr,
      credit: cleanNum(creditRaw),
    });
  }

  return results;
}

export function UploadWarehouseModal({
  isOpen,
  onClose,
  onImported,
}: UploadWarehouseModalProps) {
  const [personName, setPersonName] = useState(
    () => getLastOperatorName() || ''
  );
  const [defaultWarehouse, setDefaultWarehouse] = useState('Main Warehouse');
  const [rows, setRows] = useState<WarehouseRecordInput[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setError('');
    setFileName(file.name);
    setIsParsing(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          firstSheet,
          { defval: '' }
        );
        const extracted = parseExcelRowsToWarehouse(
          rawJson,
          defaultWarehouse,
          personName
        );
        if (extracted.length > 0) {
          setRows(extracted);
          setIsParsing(false);
          return;
        }
        const csvString = XLSX.utils.sheet_to_csv(firstSheet);
        await parseWithAi({ textContent: csvString });
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = String(reader.result || '');
            resolve(res.includes(',') ? res.split(',')[1] : res);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        await parseWithAi({
          fileBase64: base64,
          mimeType: file.type || 'application/pdf',
        });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not read warehouse sheet.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const parseWithAi = async (payload: {
    textContent?: string;
    fileBase64?: string;
    mimeType?: string;
  }) => {
    try {
      const res = await fetch('/api/parse-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, mode: 'warehouse' }),
      });
      const data = await res.json();
      const rawRows = Array.isArray(data.rows) ? data.rows : [];
      const today = new Date().toISOString().split('T')[0];
      const extracted: WarehouseRecordInput[] = rawRows.map(
        (r: Record<string, unknown>, idx: number) => {
          const unacc = String(r.unaccountedDetails || 'None (0 Missing)').trim();
          const hasUnaccounted =
            Boolean(unacc) && !/^(none|none \(0 missing\)|0|no|nil|-)$/i.test(unacc);
          const condStr = String(r.goodsCondition || 'Good');
          const goodsCondition: GoodsCondition = /part/i.test(condStr)
            ? 'Part Damaged'
            : /damage|bad/i.test(condStr)
            ? 'Damaged'
            : 'Good';
          return {
            goodsInStock: String(r.goodsInStock || `Warehouse Goods ${idx + 1}`).trim(),
            goodsArrivalDate: String(r.goodsArrivalDate || today).trim(),
            containerName: String(r.containerName || `Container ${idx + 1}`).trim(),
            takeoutFromContainer: String(r.takeoutFromContainer || '-').trim(),
            takeoutFromWarehouse: String(
              r.takeoutFromWarehouse || 'None yet'
            ).trim(),
            warehouseName: String(
              r.warehouseName || defaultWarehouse || 'Main Warehouse'
            ).trim(),
            offloaderName: String(r.offloaderName || '-').trim(),
            personName: String(r.personName || personName || 'Staff').trim(),
            confirmationStatus: /confirm/i.test(String(r.confirmationStatus || ''))
              ? 'Confirmed'
              : 'Pending',
            confirmationNote: '',
            goodsCondition,
            conditionDetails: String(r.conditionDetails || goodsCondition).trim(),
            hasUnaccounted,
            unaccountedDetails: unacc,
            credit: cleanNum(r.credit),
          };
        }
      );
      if (extracted.length > 0) {
        setRows(extracted);
      } else {
        setRows([
          {
            goodsInStock: 'Goods 1',
            goodsArrivalDate: new Date().toISOString().split('T')[0],
            containerName: 'Container 1',
            takeoutFromContainer: '',
            takeoutFromWarehouse: 'None yet',
            warehouseName: defaultWarehouse || 'Main Warehouse',
            offloaderName: '',
            personName: personName || 'Staff',
            confirmationStatus: 'Pending',
            goodsCondition: 'Good',
            hasUnaccounted: false,
            unaccountedDetails: 'None (0 Missing)',
            credit: 0,
          },
        ]);
      }
    } catch {
      // Safe fallback
      setRows([
        {
          goodsInStock: 'Goods 1',
          goodsArrivalDate: new Date().toISOString().split('T')[0],
          containerName: 'Container 1',
          takeoutFromContainer: '',
          takeoutFromWarehouse: 'None yet',
          warehouseName: defaultWarehouse || 'Main Warehouse',
          offloaderName: '',
          personName: personName || 'Staff',
          confirmationStatus: 'Pending',
          goodsCondition: 'Good',
          hasUnaccounted: false,
          unaccountedDetails: 'None (0 Missing)',
          credit: 0,
        },
      ]);
    }
  };

  const handleUpdateRow = (
    idx: number,
    field: keyof WarehouseRecordInput,
    val: string | number | boolean
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      setError('Please enter your Name (Compulsory Staff Name) before importing.');
      return;
    }
    if (rows.length === 0) {
      setError('Please upload a warehouse sheet first.');
      return;
    }
    const count = importWarehouseRecords(rows, {
      defaultWarehouseName: defaultWarehouse,
      personName: personName.trim(),
    });
    onImported(count);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-6xl w-full overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Upload Warehouse Inventory Sheet
              </h3>
              <p className="text-[11px] text-slate-300">
                Upload Excel (.xlsx, .csv), PDF, or Photo to automatically create Warehouse Inventory records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Staff & Default Warehouse Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5">
              <label className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-950 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  6. Name of Person (Staff) <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your full name"
                className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Default Warehouse Name
              </label>
              <input
                type="text"
                value={defaultWarehouse}
                onChange={(e) => setDefaultWarehouse(e.target.value)}
                placeholder="Main Warehouse"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                10-Field Warehouse Template
              </span>
              <button
                type="button"
                onClick={downloadWarehouseTemplateExcel}
                className="mt-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Warehouse Excel Template</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Zone */}
          {rows.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all border-slate-300 hover:border-slate-900 bg-slate-50/60 hover:bg-slate-50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                className="hidden"
              />
              {isParsing ? (
                <div className="py-6 flex flex-col items-center space-y-3">
                  <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-900">
                    Extracting Warehouse Inventory Records from {fileName}...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-slate-900">
                      Click to Upload Warehouse Sheet
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports Excel (`.xlsx`, `.xls`), CSV (`.csv`), PDF, or Photo of Warehouse Tally Sheet
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-slate-600">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Excel / CSV</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>PDF Sheet</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Photo / Tally Scan</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extracted Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-emerald-950">
                    {rows.length} Warehouse Records Ready to Import
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRows((prev) => [
                        ...prev,
                        {
                          goodsInStock: '',
                          goodsArrivalDate: new Date().toISOString().split('T')[0],
                          containerName: 'Container 1',
                          takeoutFromContainer: '',
                          takeoutFromWarehouse: 'None yet',
                          warehouseName: defaultWarehouse || 'Main Warehouse',
                          offloaderName: '',
                          personName: personName || 'Staff',
                          confirmationStatus: 'Pending',
                          goodsCondition: 'Good',
                          hasUnaccounted: false,
                          unaccountedDetails: 'None (0 Missing)',
                          credit: 0,
                        },
                      ])
                    }
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRows([])}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                  >
                    <span>Upload Different File</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[340px]">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-2 w-8">#</th>
                      <th className="py-2.5 px-2">1. Goods In-Stock</th>
                      <th className="py-2.5 px-2 w-28">2. Arrival Date</th>
                      <th className="py-2.5 px-2 w-28">3a. Container</th>
                      <th className="py-2.5 px-2">3b. Container Takeout</th>
                      <th className="py-2.5 px-2">4. Warehouse Takeout</th>
                      <th className="py-2.5 px-2 w-32">5. Offloader</th>
                      <th className="py-2.5 px-2 w-28">8. Condition</th>
                      <th className="py-2.5 px-2 w-32">9. Unaccounted</th>
                      <th className="py-2.5 px-2 w-24">10. Credit</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 font-bold text-slate-400">
                          {i + 1}
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={r.goodsInStock}
                            onChange={(e) =>
                              handleUpdateRow(i, 'goodsInStock', e.target.value)
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="date"
                            value={r.goodsArrivalDate}
                            onChange={(e) =>
                              handleUpdateRow(
                                i,
                                'goodsArrivalDate',
                                e.target.value
                              )
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={r.containerName}
                            onChange={(e) =>
                              handleUpdateRow(i, 'containerName', e.target.value)
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={r.takeoutFromContainer}
                            onChange={(e) =>
                              handleUpdateRow(
                                i,
                                'takeoutFromContainer',
                                e.target.value
                              )
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={r.takeoutFromWarehouse}
                            onChange={(e) =>
                              handleUpdateRow(
                                i,
                                'takeoutFromWarehouse',
                                e.target.value
                              )
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={r.offloaderName}
                            onChange={(e) =>
                              handleUpdateRow(i, 'offloaderName', e.target.value)
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={r.goodsCondition}
                            onChange={(e) =>
                              handleUpdateRow(
                                i,
                                'goodsCondition',
                                e.target.value as GoodsCondition
                              )
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold"
                          >
                            <option value="Good">Good</option>
                            <option value="Part Damaged">Part Damaged</option>
                            <option value="Damaged">Damaged</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={r.unaccountedDetails || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateRow(i, 'unaccountedDetails', val);
                              handleUpdateRow(
                                i,
                                'hasUnaccounted',
                                Boolean(val.trim()) &&
                                  !/^(none|0|no|nil|-)$/i.test(val.trim())
                              );
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            value={r.credit}
                            onChange={(e) =>
                              handleUpdateRow(
                                i,
                                'credit',
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setRows((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="text-slate-400 hover:text-rose-600 p-1"
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
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            {rows.length > 0 ? (
              <span>
                Total Credit across {rows.length} rows:{' '}
                <strong className="text-slate-900">
                  {formatMoney(rows.reduce((s, r) => s + (r.credit || 0), 0))}
                </strong>
              </span>
            ) : (
              <span>Upload your warehouse spreadsheet or tally sheet above.</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={rows.length === 0 || isParsing}
              onClick={handleImport}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              Import {rows.length > 0 ? `${rows.length} Warehouse Records` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
