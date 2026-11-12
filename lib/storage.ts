'use client';

import {
  Container,
  ContainerItem,
  ItemHistory,
  TakenStatus,
  WarehouseRecord,
  WarehouseHistory,
  GoodsCondition,
  ConfirmationStatus,
} from './types';

const STORAGE_KEY = 'deep_down_containers_handover_v1';
const WAREHOUSE_STORAGE_KEY = 'deep_down_warehouse_records_v1';
const WAREHOUSE_HISTORY_KEY = 'deep_down_warehouse_history_v1';
const OPERATOR_KEY = 'deep_down_operator_name';
export const STORAGE_UPDATE_EVENT = 'deep_down_containers_updated';

export function formatMoney(val: number): string {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function getLastOperatorName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(OPERATOR_KEY) || '';
  } catch {
    return '';
  }
}

export function saveLastOperatorName(name: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    window.localStorage.setItem(OPERATOR_KEY, trimmed);
  } catch {
    // Ignore storage errors
  }
}

export const INITIAL_CONTAINERS: Container[] = [
  {
    id: 'cnt-1',
    name: 'Container 1',
    warehouse: 'Main Warehouse',
    note: 'General Merchandise & Electronics',
    createdBy: 'Stephen Mayowa',
    updatedBy: 'Stephen Mayowa',
    createdAt: '2026-10-20T08:00:00Z',
    updatedAt: '2026-10-28T14:30:00Z',
    items: [
      {
        id: 'itm-101',
        containerId: 'cnt-1',
        containerName: 'Container 1',
        name: 'Alhaji Musa Ibrahim',
        phone: '0803 452 8910',
        cbm: 14.5,
        amount: 1450000,
        takenStatus: 'Taken',
        taken: 'All 45 Cartons Taken',
        paid: 1450000,
        credit: 0,
        receiverName: 'Suleiman Musa',
        receiverPhone: '0806 112 3344',
        receiverDate: '2026-10-27',
        warehouse: 'Main Warehouse',
        addedDate: '2026-10-20',
        lastUpdated: '2026-10-27 15:20',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Stephen Mayowa',
      },
      {
        id: 'itm-102',
        containerId: 'cnt-1',
        containerName: 'Container 1',
        name: 'Chinedu Okafor Ventures',
        phone: '0802 998 1122',
        cbm: 8.2,
        amount: 820000,
        takenStatus: 'Partial',
        taken: '12 of 30 Boxes Taken (18 Left)',
        paid: 500000,
        credit: 320000,
        receiverName: 'Emeka Okafor',
        receiverPhone: '0813 400 7788',
        receiverDate: '2026-10-28',
        warehouse: 'Main Warehouse',
        addedDate: '2026-10-20',
        lastUpdated: '2026-10-28 11:45',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Michael Ade',
      },
      {
        id: 'itm-103',
        containerId: 'cnt-1',
        containerName: 'Container 1',
        name: 'Mrs. Folake Adeyemi',
        phone: '0706 554 3219',
        cbm: 5.0,
        amount: 500000,
        takenStatus: 'Not Taken',
        taken: 'Not Taken (20 Bales in Warehouse)',
        paid: 200000,
        credit: 300000,
        receiverName: '',
        receiverPhone: '',
        receiverDate: '',
        warehouse: 'Main Warehouse',
        addedDate: '2026-10-21',
        lastUpdated: '2026-10-21 09:30',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Stephen Mayowa',
      },
    ],
    history: [
      {
        id: 'hist-103',
        containerId: 'cnt-1',
        containerName: 'Container 1',
        itemId: 'itm-102',
        itemName: 'Chinedu Okafor Ventures',
        action: 'collected',
        summary: 'Taken updated to "12 of 30 Boxes Taken (18 Left)" • Receiver: Emeka Okafor (0813 400 7788) on 2026-10-28',
        personName: 'Michael Ade',
        date: '2026-10-28 11:45',
      },
      {
        id: 'hist-102',
        containerId: 'cnt-1',
        containerName: 'Container 1',
        itemId: 'itm-101',
        itemName: 'Alhaji Musa Ibrahim',
        action: 'payment',
        summary: 'Full payment completed (Paid: 1,450,000, Credit: 0) • Collected by Suleiman Musa',
        personName: 'Stephen Mayowa',
        date: '2026-10-27 15:20',
      },
    ],
  },
  {
    id: 'cnt-2',
    name: 'Container 2',
    warehouse: 'Main Warehouse',
    note: 'Hardware, Auto Parts & Building Materials',
    createdBy: 'Michael Ade',
    updatedBy: 'Michael Ade',
    createdAt: '2026-10-23T10:00:00Z',
    updatedAt: '2026-10-28T16:10:00Z',
    items: [
      {
        id: 'itm-201',
        containerId: 'cnt-2',
        containerName: 'Container 2',
        name: 'Kazeem Auto Spares Ltd',
        phone: '0809 334 5566',
        cbm: 22.0,
        amount: 2200000,
        takenStatus: 'Partial',
        taken: '15 Pallets Taken (10 Remaining)',
        paid: 1500000,
        credit: 700000,
        receiverName: 'Tunde Bakare',
        receiverPhone: '0805 667 8899',
        receiverDate: '2026-10-28',
        warehouse: 'Main Warehouse',
        addedDate: '2026-10-23',
        lastUpdated: '2026-10-28 16:10',
        addedBy: 'Michael Ade',
        lastUpdatedBy: 'Michael Ade',
      },
      {
        id: 'itm-202',
        containerId: 'cnt-2',
        containerName: 'Container 2',
        name: 'Grace Hardware & Tools',
        phone: '0818 223 9090',
        cbm: 6.5,
        amount: 650000,
        takenStatus: 'Not Taken',
        taken: 'Not Taken (Awaiting Clearance)',
        paid: 650000,
        credit: 0,
        receiverName: '',
        receiverPhone: '',
        receiverDate: '',
        warehouse: 'Main Warehouse',
        addedDate: '2026-10-24',
        lastUpdated: '2026-10-24 12:00',
        addedBy: 'Michael Ade',
        lastUpdatedBy: 'Michael Ade',
      },
    ],
    history: [
      {
        id: 'hist-201',
        containerId: 'cnt-2',
        containerName: 'Container 2',
        itemId: 'itm-201',
        itemName: 'Kazeem Auto Spares Ltd',
        action: 'collected',
        summary: 'Part cargo collected (15 Pallets Taken) by Tunde Bakare (0805 667 8899) • Paid: 1,500,000, Credit: 700,000',
        personName: 'Michael Ade',
        date: '2026-10-28 16:10',
      },
    ],
  },
];

let cachedContainers: Container[] | null = null;
let cachedRaw: string | null = null;

function dispatchUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
  }
}

export function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(STORAGE_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function saveContainers(containers: Container[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(containers);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedContainers = containers;
    dispatchUpdate();
  } catch (err) {
    console.error('Failed to save containers:', err);
  }
}

export function getContainers(): Container[] {
  if (typeof window === 'undefined') return INITIAL_CONTAINERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const serialized = JSON.stringify(INITIAL_CONTAINERS);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      cachedRaw = serialized;
      cachedContainers = INITIAL_CONTAINERS;
      return INITIAL_CONTAINERS;
    }
    if (raw !== cachedRaw || !cachedContainers) {
      cachedRaw = raw;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedContainers = parsed;
      } else {
        cachedContainers = INITIAL_CONTAINERS;
      }
    }
  } catch {
    cachedContainers = INITIAL_CONTAINERS;
  }
  return cachedContainers || INITIAL_CONTAINERS;
}

export function addContainer(
  name: string,
  warehouse: string,
  personName: string,
  note?: string
): Container {
  const containers = [...getContainers()];
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);

  const cleanName = name.trim() || `Container ${containers.length + 1}`;
  const cleanWarehouse = warehouse.trim();
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newContainer: Container = {
    id: `cnt-${Date.now()}`,
    name: cleanName,
    warehouse: cleanWarehouse,
    note: note?.trim() || undefined,
    createdBy: person,
    updatedBy: person,
    items: [],
    history: [
      {
        id: `hist-${Date.now()}`,
        containerId: `cnt-${Date.now()}`,
        containerName: cleanName,
        itemName: 'Container Registered',
        action: 'added',
        summary: cleanWarehouse
          ? `Container "${cleanName}" registered at ${cleanWarehouse}`
          : `Container "${cleanName}" registered`,
        personName: person,
        date: nowStr,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  containers.unshift(newContainer);
  saveContainers(containers);
  return newContainer;
}

export function updateContainer(
  id: string,
  name: string,
  warehouse: string,
  personName: string,
  note?: string
): void {
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const containers = getContainers().map((c) => {
    if (c.id !== id) return c;

    const cleanName = name.trim() || c.name;
    const cleanWarehouse = warehouse.trim();

    const updatedItems = c.items.map((item) => ({
      ...item,
      containerName: cleanName,
    }));

    const historyEntry: ItemHistory = {
      id: `hist-${Date.now()}`,
      containerId: c.id,
      containerName: cleanName,
      itemName: 'Container Details',
      action: 'updated',
      summary: cleanWarehouse
        ? `Updated container name to "${cleanName}" • Warehouse: "${cleanWarehouse}"`
        : `Updated container name to "${cleanName}"`,
      personName: person,
      date: nowStr,
    };

    return {
      ...c,
      name: cleanName,
      warehouse: cleanWarehouse,
      note: note !== undefined ? note.trim() : c.note,
      updatedBy: person,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
      history: [historyEntry, ...c.history],
    };
  });

  saveContainers(containers);
}

export function deleteContainer(id: string): void {
  const containers = getContainers().filter((c) => c.id !== id);
  saveContainers(containers);
}

export interface CargoInputData {
  name: string; // 2. Customer Name
  phone: string; // 3. Phone Number
  cbm: number; // 4. CBM
  amount: number; // 5. Amount
  takenStatus: TakenStatus; // 6. Taken status
  taken: string; // 6. Taken description/quantity
  paid: number; // 7. Paid
  credit?: number; // 8. Credit (auto-computed if omitted)
  receiverName: string; // 9a. Receiver Name
  receiverPhone: string; // 9b. Receiver Phone
  receiverDate: string; // 9c. Receiver Date
  warehouse: string; // 10. Warehouse
  personName: string; // Compulsory operator name
}

export function addCargoItem(containerId: string, input: CargoInputData): void {
  const person = input.personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const amount = Math.max(0, Number(input.amount) || 0);
  const paid = Math.max(0, Number(input.paid) || 0);
  const credit =
    input.credit !== undefined
      ? Math.max(0, Number(input.credit))
      : Math.max(0, amount - paid);
  const cbm = Math.max(0, Number(input.cbm) || 0);
  const takenText = input.taken.trim() || input.takenStatus;

  const containers = getContainers().map((c) => {
    if (c.id !== containerId) return c;

    const newItem: ContainerItem = {
      id: `itm-${Date.now()}`,
      containerId: c.id,
      containerName: c.name,
      name: input.name.trim(),
      phone: input.phone.trim(),
      cbm,
      amount,
      takenStatus: input.takenStatus,
      taken: takenText,
      paid,
      credit,
      receiverName: input.receiverName.trim(),
      receiverPhone: input.receiverPhone.trim(),
      receiverDate: input.receiverDate.trim(),
      warehouse: input.warehouse.trim() || c.warehouse || '',
      addedDate: nowStr.split(' ')[0],
      lastUpdated: nowStr,
      addedBy: person,
      lastUpdatedBy: person,
    };

    const receiverSummary = newItem.receiverName
      ? ` • Receiver: ${newItem.receiverName} (${newItem.receiverPhone || 'No phone'}) on ${newItem.receiverDate || 'N/A'}`
      : '';

    const newHistory: ItemHistory = {
      id: `hist-${Date.now()}`,
      containerId: c.id,
      containerName: c.name,
      itemId: newItem.id,
      itemName: newItem.name,
      action: 'added',
      summary: `Added customer record • CBM: ${cbm} • Amount: ${formatMoney(amount)} • Paid: ${formatMoney(paid)} • Credit: ${formatMoney(credit)} • Taken: ${takenText}${newItem.warehouse ? ` • Warehouse: ${newItem.warehouse}` : ''}${receiverSummary}`,
      personName: person,
      date: nowStr,
    };

    return {
      ...c,
      updatedBy: person,
      items: [newItem, ...c.items],
      history: [newHistory, ...c.history],
      updatedAt: new Date().toISOString(),
    };
  });

  saveContainers(containers);
}

export function updateCargoItem(
  containerId: string,
  itemId: string,
  updates: Partial<Omit<CargoInputData, 'personName'>> & {
    personName: string;
    actionType?: 'updated' | 'payment' | 'collected';
    changeNote?: string;
  }
): void {
  const person = updates.personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const containers = getContainers().map((c) => {
    if (c.id !== containerId) return c;

    const existing = c.items.find((i) => i.id === itemId);
    if (!existing) return c;

    const amount =
      updates.amount !== undefined
        ? Math.max(0, Number(updates.amount) || 0)
        : existing.amount;
    const paid =
      updates.paid !== undefined
        ? Math.max(0, Number(updates.paid) || 0)
        : existing.paid;
    const credit =
      updates.credit !== undefined
        ? Math.max(0, Number(updates.credit))
        : Math.max(0, amount - paid);
    const cbm =
      updates.cbm !== undefined
        ? Math.max(0, Number(updates.cbm) || 0)
        : existing.cbm;
    const takenStatus =
      updates.takenStatus !== undefined
        ? updates.takenStatus
        : existing.takenStatus;
    const taken =
      updates.taken !== undefined
        ? updates.taken.trim() || takenStatus
        : existing.taken;

    const updatedItem: ContainerItem = {
      ...existing,
      name:
        updates.name !== undefined
          ? updates.name.trim() || existing.name
          : existing.name,
      phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
      cbm,
      amount,
      takenStatus,
      taken,
      paid,
      credit,
      receiverName:
        updates.receiverName !== undefined
          ? updates.receiverName.trim()
          : existing.receiverName,
      receiverPhone:
        updates.receiverPhone !== undefined
          ? updates.receiverPhone.trim()
          : existing.receiverPhone,
      receiverDate:
        updates.receiverDate !== undefined
          ? updates.receiverDate.trim()
          : existing.receiverDate,
      warehouse:
        updates.warehouse !== undefined
          ? updates.warehouse.trim()
          : existing.warehouse,
      lastUpdated: nowStr,
      lastUpdatedBy: person,
    };

    const updatedItems = c.items.map((i) =>
      i.id === itemId ? updatedItem : i
    );

    let summary = updates.changeNote || '';
    if (!summary) {
      const parts: string[] = [];
      if (updates.taken !== undefined || updates.takenStatus !== undefined) {
        parts.push(`Taken: "${updatedItem.taken}"`);
      }
      if (updates.receiverName !== undefined && updatedItem.receiverName) {
        parts.push(
          `Receiver: ${updatedItem.receiverName} (${updatedItem.receiverPhone || 'No phone'}) on ${updatedItem.receiverDate || nowStr.split(' ')[0]}`
        );
      }
      if (updates.paid !== undefined || updates.amount !== undefined) {
        parts.push(
          `Financials: Amount ${formatMoney(updatedItem.amount)}, Paid ${formatMoney(updatedItem.paid)}, Credit ${formatMoney(updatedItem.credit)}`
        );
      }
      if (
        updates.warehouse !== undefined &&
        updates.warehouse !== existing.warehouse
      ) {
        parts.push(`Warehouse: ${updatedItem.warehouse}`);
      }
      summary =
        parts.length > 0
          ? parts.join(' • ')
          : `Updated record details for ${updatedItem.name}`;
    }

    const historyEntry: ItemHistory = {
      id: `hist-${Date.now()}`,
      containerId: c.id,
      containerName: c.name,
      itemId: updatedItem.id,
      itemName: updatedItem.name,
      action: updates.actionType || 'updated',
      summary,
      personName: person,
      date: nowStr,
    };

    return {
      ...c,
      updatedBy: person,
      items: updatedItems,
      history: [historyEntry, ...c.history],
      updatedAt: new Date().toISOString(),
    };
  });

  saveContainers(containers);
}

export function deleteItem(containerId: string, itemId: string): void {
  const containers = getContainers().map((c) => {
    if (c.id !== containerId) return c;
    return {
      ...c,
      items: c.items.filter((i) => i.id !== itemId),
      updatedAt: new Date().toISOString(),
    };
  });
  saveContainers(containers);
}

export const deleteItemFromContainer = deleteItem;
export const updateContainerTitle = updateContainer;

export interface ManifestRowInput {
  containerName?: string;
  name: string;
  phone?: string;
  cbm?: number;
  amount?: number;
  takenStatus?: TakenStatus;
  taken?: string;
  paid?: number;
  credit?: number;
  receiverName?: string;
  receiverPhone?: string;
  receiverDate?: string;
  warehouse?: string;
}

export function importManifestRecords(
  rows: ManifestRowInput[],
  options: {
    targetContainerId?: string;
    defaultContainerName: string;
    defaultWarehouse: string;
    personName: string;
  }
): string {
  const person = options.personName.trim() || 'Staff';
  saveLastOperatorName(person);

  const nowIso = new Date().toISOString();
  const nowStr = nowIso.replace('T', ' ').substring(0, 16);
  const dateOnly = nowStr.split(' ')[0];

  // Ensure all rows are preserved even if customer name was not in the manifest yet
  const validRows = rows
    .filter((r) => {
      // Keep row if it has any data
      const hasAnyField =
        (r.name && r.name.trim().length > 0) ||
        (r.phone && r.phone.trim().length > 0) ||
        (r.cbm !== undefined && Number(r.cbm) > 0) ||
        (r.amount !== undefined && Number(r.amount) > 0) ||
        (r.paid !== undefined && Number(r.paid) > 0) ||
        (r.receiverName && r.receiverName.trim().length > 0) ||
        (r.taken && r.taken.trim().length > 0);
      return hasAnyField;
    })
    .map((r, i) => ({
      ...r,
      name: (r.name || '').trim() || `Customer ${i + 1}`,
    }));

  if (validRows.length === 0) return options.targetContainerId || '';

  const containers = [...getContainers()];
  let primaryContainerId = options.targetContainerId || '';

  if (options.targetContainerId) {
    // Import directly into the specified container
    const idx = containers.findIndex((c) => c.id === options.targetContainerId);
    if (idx !== -1) {
      const target = containers[idx];
      const newItems: ContainerItem[] = validRows.map((r, i) => {
        const amount = Math.max(0, Number(r.amount) || 0);
        const paid = Math.max(0, Number(r.paid) || 0);
        const credit =
          r.credit !== undefined && !Number.isNaN(Number(r.credit))
            ? Math.max(0, Number(r.credit))
            : Math.max(0, amount - paid);
        const cbm = Math.max(0, Number(r.cbm) || 0);
        const takenStatus: TakenStatus =
          r.takenStatus === 'Taken' || r.takenStatus === 'Partial'
            ? r.takenStatus
            : 'Not Taken';
        const taken = (r.taken || '').trim() || takenStatus;

        return {
          id: `itm-${Date.now()}-${i}`,
          containerId: target.id,
          containerName: target.name,
          name: r.name.trim(),
          phone: (r.phone || '').trim(),
          cbm,
          amount,
          takenStatus,
          taken,
          paid,
          credit,
          receiverName: (r.receiverName || '').trim(),
          receiverPhone: (r.receiverPhone || '').trim(),
          receiverDate: (r.receiverDate || '').trim(),
          warehouse:
            (r.warehouse || '').trim() ||
            options.defaultWarehouse.trim() ||
            target.warehouse ||
            '',
          addedDate: dateOnly,
          lastUpdated: nowStr,
          addedBy: person,
          lastUpdatedBy: person,
        };
      });

      const historyEntry: ItemHistory = {
        id: `hist-${Date.now()}`,
        containerId: target.id,
        containerName: target.name,
        itemName: 'Manifest Uploaded',
        action: 'added',
        summary: `Imported ${newItems.length} customer cargo records from uploaded manifest`,
        personName: person,
        date: nowStr,
      };

      containers[idx] = {
        ...target,
        warehouse: options.defaultWarehouse.trim() || target.warehouse,
        updatedBy: person,
        updatedAt: nowIso,
        items: [...newItems, ...target.items],
        history: [historyEntry, ...target.history],
      };
      primaryContainerId = target.id;
    }
  } else {
    // Group rows by container name (or fallback to options.defaultContainerName)
    const fallbackName =
      options.defaultContainerName.trim() ||
      `Container ${containers.length + 1}`;
    const groups = new Map<string, ManifestRowInput[]>();

    validRows.forEach((row) => {
      const cName = (row.containerName || '').trim() || fallbackName;
      const existingGroup = groups.get(cName) || [];
      existingGroup.push(row);
      groups.set(cName, existingGroup);
    });

    let groupIndex = 0;
    groups.forEach((groupRows, cName) => {
      const existingIdx = containers.findIndex(
        (c) => c.name.toLowerCase() === cName.toLowerCase()
      );
      const containerId =
        existingIdx !== -1
          ? containers[existingIdx].id
          : `cnt-${Date.now()}-${groupIndex}`;

      if (!primaryContainerId) {
        primaryContainerId = containerId;
      }

      const warehouseForContainer =
        options.defaultWarehouse.trim() ||
        (groupRows.find((r) => r.warehouse && r.warehouse.trim())?.warehouse || '').trim() ||
        (existingIdx !== -1 ? containers[existingIdx].warehouse : '');

      const newItems: ContainerItem[] = groupRows.map((r, i) => {
        const amount = Math.max(0, Number(r.amount) || 0);
        const paid = Math.max(0, Number(r.paid) || 0);
        const credit =
          r.credit !== undefined && !Number.isNaN(Number(r.credit))
            ? Math.max(0, Number(r.credit))
            : Math.max(0, amount - paid);
        const cbm = Math.max(0, Number(r.cbm) || 0);
        const takenStatus: TakenStatus =
          r.takenStatus === 'Taken' || r.takenStatus === 'Partial'
            ? r.takenStatus
            : 'Not Taken';
        const taken = (r.taken || '').trim() || takenStatus;

        return {
          id: `itm-${Date.now()}-${groupIndex}-${i}`,
          containerId,
          containerName: existingIdx !== -1 ? containers[existingIdx].name : cName,
          name: r.name.trim(),
          phone: (r.phone || '').trim(),
          cbm,
          amount,
          takenStatus,
          taken,
          paid,
          credit,
          receiverName: (r.receiverName || '').trim(),
          receiverPhone: (r.receiverPhone || '').trim(),
          receiverDate: (r.receiverDate || '').trim(),
          warehouse: (r.warehouse || '').trim() || warehouseForContainer,
          addedDate: dateOnly,
          lastUpdated: nowStr,
          addedBy: person,
          lastUpdatedBy: person,
        };
      });

      const historyEntry: ItemHistory = {
        id: `hist-${Date.now()}-${groupIndex}`,
        containerId,
        containerName: existingIdx !== -1 ? containers[existingIdx].name : cName,
        itemName: 'Manifest Uploaded',
        action: 'added',
        summary: `Created/updated from uploaded manifest with ${newItems.length} customer records`,
        personName: person,
        date: nowStr,
      };

      if (existingIdx !== -1) {
        const target = containers[existingIdx];
        containers[existingIdx] = {
          ...target,
          warehouse: warehouseForContainer || target.warehouse,
          updatedBy: person,
          updatedAt: nowIso,
          items: [...newItems, ...target.items],
          history: [historyEntry, ...target.history],
        };
      } else {
        const newContainer: Container = {
          id: containerId,
          name: cName,
          warehouse: warehouseForContainer,
          createdBy: person,
          updatedBy: person,
          items: newItems,
          history: [historyEntry],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        containers.unshift(newContainer);
      }

      groupIndex++;
    });
  }

  saveContainers(containers);
  return primaryContainerId;
}

// ==========================================
// WAREHOUSE INVENTORY STORAGE & CRUD
// ==========================================

export const INITIAL_WAREHOUSE_RECORDS: WarehouseRecord[] = [
  {
    id: 'wh-rec-1',
    goodsInStock: '38 Boxes & 20 Bales in Stock',
    goodsArrivalDate: '2026-10-20',
    containerName: 'Container 1',
    takeoutFromContainer: '95 Total Packages Offloaded (45 Cartons, 30 Boxes, 20 Bales)',
    takeoutFromWarehouse: '57 Packages Dispatched (45 Cartons + 12 Boxes Taken)',
    warehouseName: 'Main Warehouse',
    offloaderName: 'Ibrahim Danjuma',
    personName: 'Stephen Mayowa',
    confirmationStatus: 'Confirmed',
    confirmationNote: 'Tally sheet verified after offloading',
    goodsCondition: 'Good',
    conditionDetails: 'All cartons and bales arrived intact in good condition',
    hasUnaccounted: false,
    unaccountedDetails: 'None (0 Missing)',
    credit: 620000,
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-28T11:45:00Z',
    lastUpdatedBy: 'Michael Ade',
  },
  {
    id: 'wh-rec-2',
    goodsInStock: '10 Pallets Auto Parts & 18 Crates Hardware in Stock',
    goodsArrivalDate: '2026-10-23',
    containerName: 'Container 2',
    takeoutFromContainer: '43 Total Units Offloaded (25 Pallets, 18 Crates)',
    takeoutFromWarehouse: '15 Pallets Dispatched to Receiver',
    warehouseName: 'Main Warehouse',
    offloaderName: 'Sunday Eze',
    personName: 'Michael Ade',
    confirmationStatus: 'Pending',
    confirmationNote: 'Awaiting final inspection of 1 missing carton claim',
    goodsCondition: 'Part Damaged',
    conditionDetails: '2 outer wooden crates slightly dented during transit; remaining 41 units in good condition',
    hasUnaccounted: true,
    unaccountedDetails: '1 Small Accessory Carton Unaccounted',
    credit: 700000,
    createdAt: '2026-10-23T11:00:00Z',
    updatedAt: '2026-10-28T16:15:00Z',
    lastUpdatedBy: 'Michael Ade',
  },
];

export const INITIAL_WAREHOUSE_HISTORY: WarehouseHistory[] = [
  {
    id: 'wh-hist-2',
    recordId: 'wh-rec-2',
    containerName: 'Container 2',
    action: 'updated',
    summary:
      'Updated Takeout from Warehouse to "15 Pallets Dispatched to Receiver" • Condition: Part Damaged • Unaccounted: 1 Small Accessory Carton Unaccounted • Credit: 700,000',
    personName: 'Michael Ade',
    date: '2026-10-28 16:15',
  },
  {
    id: 'wh-hist-1',
    recordId: 'wh-rec-1',
    containerName: 'Container 1',
    action: 'confirmed',
    summary:
      'Confirmed warehouse tally for Container 1 • Offloader: Ibrahim Danjuma • Goods Condition: Good • Unaccounted: None • Credit: 620,000',
    personName: 'Stephen Mayowa',
    date: '2026-10-27 15:30',
  },
];

let cachedWarehouseRecords: WarehouseRecord[] | null = null;
let cachedWarehouseRaw: string | null = null;
let cachedWarehouseHistory: WarehouseHistory[] | null = null;
let cachedWarehouseHistoryRaw: string | null = null;

function saveWarehouseRecords(records: WarehouseRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(records);
    window.localStorage.setItem(WAREHOUSE_STORAGE_KEY, serialized);
    cachedWarehouseRaw = serialized;
    cachedWarehouseRecords = records;
    dispatchUpdate();
  } catch (err) {
    console.error('Failed to save warehouse records:', err);
  }
}

function saveWarehouseHistory(history: WarehouseHistory[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(history);
    window.localStorage.setItem(WAREHOUSE_HISTORY_KEY, serialized);
    cachedWarehouseHistoryRaw = serialized;
    cachedWarehouseHistory = history;
    dispatchUpdate();
  } catch (err) {
    console.error('Failed to save warehouse history:', err);
  }
}

export function getWarehouseRecords(): WarehouseRecord[] {
  if (typeof window === 'undefined') return INITIAL_WAREHOUSE_RECORDS;
  try {
    const raw = window.localStorage.getItem(WAREHOUSE_STORAGE_KEY);
    if (!raw) {
      const serialized = JSON.stringify(INITIAL_WAREHOUSE_RECORDS);
      window.localStorage.setItem(WAREHOUSE_STORAGE_KEY, serialized);
      cachedWarehouseRaw = serialized;
      cachedWarehouseRecords = INITIAL_WAREHOUSE_RECORDS;
      return INITIAL_WAREHOUSE_RECORDS;
    }
    if (raw !== cachedWarehouseRaw || !cachedWarehouseRecords) {
      cachedWarehouseRaw = raw;
      const parsed = JSON.parse(raw);
      cachedWarehouseRecords = Array.isArray(parsed)
        ? parsed
        : INITIAL_WAREHOUSE_RECORDS;
    }
  } catch {
    cachedWarehouseRecords = INITIAL_WAREHOUSE_RECORDS;
  }
  return cachedWarehouseRecords || INITIAL_WAREHOUSE_RECORDS;
}

export function getWarehouseHistory(): WarehouseHistory[] {
  if (typeof window === 'undefined') return INITIAL_WAREHOUSE_HISTORY;
  try {
    const raw = window.localStorage.getItem(WAREHOUSE_HISTORY_KEY);
    if (!raw) {
      const serialized = JSON.stringify(INITIAL_WAREHOUSE_HISTORY);
      window.localStorage.setItem(WAREHOUSE_HISTORY_KEY, serialized);
      cachedWarehouseHistoryRaw = serialized;
      cachedWarehouseHistory = INITIAL_WAREHOUSE_HISTORY;
      return INITIAL_WAREHOUSE_HISTORY;
    }
    if (raw !== cachedWarehouseHistoryRaw || !cachedWarehouseHistory) {
      cachedWarehouseHistoryRaw = raw;
      const parsed = JSON.parse(raw);
      cachedWarehouseHistory = Array.isArray(parsed)
        ? parsed
        : INITIAL_WAREHOUSE_HISTORY;
    }
  } catch {
    cachedWarehouseHistory = INITIAL_WAREHOUSE_HISTORY;
  }
  return cachedWarehouseHistory || INITIAL_WAREHOUSE_HISTORY;
}

export interface WarehouseRecordInput {
  goodsInStock: string;
  goodsArrivalDate: string;
  containerName: string;
  takeoutFromContainer: string;
  takeoutFromWarehouse: string;
  warehouseName: string;
  offloaderName: string;
  personName: string;
  confirmationStatus: ConfirmationStatus;
  confirmationNote?: string;
  goodsCondition: GoodsCondition;
  conditionDetails?: string;
  hasUnaccounted: boolean;
  unaccountedDetails?: string;
  credit: number;
}

export function addWarehouseRecord(input: WarehouseRecordInput): WarehouseRecord {
  const person = input.personName.trim() || 'Staff';
  saveLastOperatorName(person);

  const nowIso = new Date().toISOString();
  const nowStr = nowIso.replace('T', ' ').substring(0, 16);
  const dateOnly = nowStr.split(' ')[0];

  const credit = Math.max(0, Number(input.credit) || 0);
  const containerName = input.containerName.trim() || 'Container';
  const unaccountedDetails = input.hasUnaccounted
    ? (input.unaccountedDetails || '').trim() || 'Missing goods reported'
    : (input.unaccountedDetails || '').trim() || 'None (0 Missing)';

  const newRecord: WarehouseRecord = {
    id: `wh-rec-${Date.now()}`,
    goodsInStock: input.goodsInStock.trim() || 'In Stock',
    goodsArrivalDate: input.goodsArrivalDate.trim() || dateOnly,
    containerName,
    takeoutFromContainer: input.takeoutFromContainer.trim() || '-',
    takeoutFromWarehouse: input.takeoutFromWarehouse.trim() || 'None yet',
    warehouseName: input.warehouseName.trim() || 'Main Warehouse',
    offloaderName: input.offloaderName.trim() || '-',
    personName: person,
    confirmationStatus: input.confirmationStatus,
    confirmationNote: (input.confirmationNote || '').trim(),
    goodsCondition: input.goodsCondition,
    conditionDetails:
      (input.conditionDetails || '').trim() || input.goodsCondition,
    hasUnaccounted: input.hasUnaccounted,
    unaccountedDetails,
    credit,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastUpdatedBy: person,
  };

  const records = [newRecord, ...getWarehouseRecords()];
  saveWarehouseRecords(records);

  const histEntry: WarehouseHistory = {
    id: `wh-hist-${Date.now()}`,
    recordId: newRecord.id,
    containerName: newRecord.containerName,
    action: 'added',
    summary: `Added warehouse record for ${newRecord.containerName} • Stock: "${newRecord.goodsInStock}" • Offloader: ${newRecord.offloaderName} • Condition: ${newRecord.goodsCondition} • Unaccounted: ${newRecord.unaccountedDetails} • Credit: ${formatMoney(newRecord.credit)}`,
    personName: person,
    date: nowStr,
  };
  saveWarehouseHistory([histEntry, ...getWarehouseHistory()]);

  return newRecord;
}

export function updateWarehouseRecord(
  id: string,
  updates: Partial<WarehouseRecordInput> & { personName: string; changeNote?: string }
): void {
  const person = updates.personName.trim() || 'Staff';
  saveLastOperatorName(person);

  const nowIso = new Date().toISOString();
  const nowStr = nowIso.replace('T', ' ').substring(0, 16);

  let updatedContainerName = 'Container';
  let summaryText = updates.changeNote || '';

  const records = getWarehouseRecords().map((rec) => {
    if (rec.id !== id) return rec;

    const hasUnaccounted =
      updates.hasUnaccounted !== undefined
        ? updates.hasUnaccounted
        : rec.hasUnaccounted;

    let unaccountedDetails = rec.unaccountedDetails;
    if (updates.unaccountedDetails !== undefined) {
      unaccountedDetails =
        updates.unaccountedDetails.trim() ||
        (hasUnaccounted ? 'Missing goods reported' : 'None (0 Missing)');
    } else if (
      updates.hasUnaccounted !== undefined &&
      !updates.hasUnaccounted
    ) {
      unaccountedDetails = 'None (0 Missing)';
    }

    const updated: WarehouseRecord = {
      ...rec,
      goodsInStock:
        updates.goodsInStock !== undefined
          ? updates.goodsInStock.trim() || rec.goodsInStock
          : rec.goodsInStock,
      goodsArrivalDate:
        updates.goodsArrivalDate !== undefined
          ? updates.goodsArrivalDate.trim() || rec.goodsArrivalDate
          : rec.goodsArrivalDate,
      containerName:
        updates.containerName !== undefined
          ? updates.containerName.trim() || rec.containerName
          : rec.containerName,
      takeoutFromContainer:
        updates.takeoutFromContainer !== undefined
          ? updates.takeoutFromContainer.trim()
          : rec.takeoutFromContainer,
      takeoutFromWarehouse:
        updates.takeoutFromWarehouse !== undefined
          ? updates.takeoutFromWarehouse.trim()
          : rec.takeoutFromWarehouse,
      warehouseName:
        updates.warehouseName !== undefined
          ? updates.warehouseName.trim()
          : rec.warehouseName,
      offloaderName:
        updates.offloaderName !== undefined
          ? updates.offloaderName.trim()
          : rec.offloaderName,
      personName: person,
      confirmationStatus:
        updates.confirmationStatus !== undefined
          ? updates.confirmationStatus
          : rec.confirmationStatus,
      confirmationNote:
        updates.confirmationNote !== undefined
          ? updates.confirmationNote.trim()
          : rec.confirmationNote,
      goodsCondition:
        updates.goodsCondition !== undefined
          ? updates.goodsCondition
          : rec.goodsCondition,
      conditionDetails:
        updates.conditionDetails !== undefined
          ? updates.conditionDetails.trim()
          : rec.conditionDetails,
      hasUnaccounted,
      unaccountedDetails,
      credit:
        updates.credit !== undefined
          ? Math.max(0, Number(updates.credit) || 0)
          : rec.credit,
      updatedAt: nowIso,
      lastUpdatedBy: person,
    };

    updatedContainerName = updated.containerName;
    if (!summaryText) {
      summaryText = `Updated warehouse record (${updated.containerName}) • Stock: "${updated.goodsInStock}" • Warehouse Takeout: "${updated.takeoutFromWarehouse}" • Condition: ${updated.goodsCondition} • Confirmation: ${updated.confirmationStatus} • Unaccounted: ${updated.unaccountedDetails} • Credit: ${formatMoney(updated.credit)}`;
    }

    return updated;
  });

  saveWarehouseRecords(records);

  const histEntry: WarehouseHistory = {
    id: `wh-hist-${Date.now()}`,
    recordId: id,
    containerName: updatedContainerName,
    action:
      updates.confirmationStatus === 'Confirmed' ? 'confirmed' : 'updated',
    summary: summaryText || `Updated warehouse record for ${updatedContainerName}`,
    personName: person,
    date: nowStr,
  };
  saveWarehouseHistory([histEntry, ...getWarehouseHistory()]);
}

export function deleteWarehouseRecord(id: string, personName = 'Staff'): void {
  const existing = getWarehouseRecords().find((r) => r.id === id);
  const filtered = getWarehouseRecords().filter((r) => r.id !== id);
  saveWarehouseRecords(filtered);

  if (existing) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const histEntry: WarehouseHistory = {
      id: `wh-hist-${Date.now()}`,
      recordId: id,
      containerName: existing.containerName,
      action: 'deleted',
      summary: `Removed warehouse record for ${existing.containerName} (Stock: ${existing.goodsInStock})`,
      personName: personName.trim() || 'Staff',
      date: nowStr,
    };
    saveWarehouseHistory([histEntry, ...getWarehouseHistory()]);
  }
}

export function importWarehouseRecords(
  rows: Partial<WarehouseRecordInput>[],
  options: {
    defaultWarehouseName: string;
    personName: string;
  }
): number {
  const person = options.personName.trim() || 'Staff';
  saveLastOperatorName(person);

  const nowIso = new Date().toISOString();
  const nowStr = nowIso.replace('T', ' ').substring(0, 16);
  const dateOnly = nowStr.split(' ')[0];

  const validRows = rows.filter(
    (r) =>
      (r.goodsInStock && r.goodsInStock.trim()) ||
      (r.containerName && r.containerName.trim()) ||
      (r.takeoutFromContainer && r.takeoutFromContainer.trim())
  );

  if (validRows.length === 0) return 0;

  const newRecords: WarehouseRecord[] = validRows.map((r, idx) => {
    const hasUnaccounted =
      Boolean(r.hasUnaccounted) ||
      (Boolean(r.unaccountedDetails) &&
        !/^(none|0|no|nil|-|false)$/i.test((r.unaccountedDetails || '').trim()));

    const unaccountedDetails = (r.unaccountedDetails || '').trim() ||
      (hasUnaccounted ? 'Missing goods reported' : 'None (0 Missing)');

    const conditionRaw = (r.goodsCondition || 'Good').toString();
    let goodsCondition: GoodsCondition = 'Good';
    if (/part/i.test(conditionRaw) || /mixed/i.test(conditionRaw)) {
      goodsCondition = 'Part Damaged';
    } else if (/damage|bad|broken|poor/i.test(conditionRaw)) {
      goodsCondition = 'Damaged';
    }

    const confirmRaw = (r.confirmationStatus || 'Pending').toString();
    const confirmationStatus: ConfirmationStatus = /confirm|yes|verified|ok|done/i.test(
      confirmRaw
    )
      ? 'Confirmed'
      : 'Pending';

    return {
      id: `wh-rec-${Date.now()}-${idx}`,
      goodsInStock: (r.goodsInStock || '').trim() || 'In Stock',
      goodsArrivalDate: (r.goodsArrivalDate || '').trim() || dateOnly,
      containerName: (r.containerName || '').trim() || `Container ${idx + 1}`,
      takeoutFromContainer: (r.takeoutFromContainer || '').trim() || '-',
      takeoutFromWarehouse: (r.takeoutFromWarehouse || '').trim() || 'None yet',
      warehouseName:
        (r.warehouseName || '').trim() ||
        options.defaultWarehouseName.trim() ||
        'Main Warehouse',
      offloaderName: (r.offloaderName || '').trim() || '-',
      personName: (r.personName || '').trim() || person,
      confirmationStatus,
      confirmationNote: (r.confirmationNote || '').trim(),
      goodsCondition,
      conditionDetails: (r.conditionDetails || '').trim() || goodsCondition,
      hasUnaccounted,
      unaccountedDetails,
      credit: Math.max(0, Number(r.credit) || 0),
      createdAt: nowIso,
      updatedAt: nowIso,
      lastUpdatedBy: person,
    };
  });

  const allRecords = [...newRecords, ...getWarehouseRecords()];
  saveWarehouseRecords(allRecords);

  const histEntry: WarehouseHistory = {
    id: `wh-hist-${Date.now()}`,
    recordId: newRecords[0].id,
    containerName: 'Warehouse Import',
    action: 'added',
    summary: `Imported ${newRecords.length} warehouse inventory records from uploaded sheet`,
    personName: person,
    date: nowStr,
  };
  saveWarehouseHistory([histEntry, ...getWarehouseHistory()]);

  return newRecords.length;
}

export function resetToDemoData(): void {
  saveContainers(INITIAL_CONTAINERS);
  saveWarehouseRecords(INITIAL_WAREHOUSE_RECORDS);
  saveWarehouseHistory(INITIAL_WAREHOUSE_HISTORY);
}

export function clearAllContainers(): void {
  saveContainers([]);
  saveWarehouseRecords([]);
  saveWarehouseHistory([]);
}


