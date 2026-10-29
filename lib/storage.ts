'use client';

import { Container, ContainerItem, ItemHistory, TakenStatus } from './types';

const STORAGE_KEY = 'deep_down_containers_v4';
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
    name: 'Container 1 (MSKU-904821 - 40ft)',
    warehouse: 'Warehouse A - Main Yard',
    note: 'Arrived Monday morning — General Merchandise & Electronics',
    createdBy: 'Stephen Mayowa',
    updatedBy: 'Stephen Mayowa',
    createdAt: '2026-10-20T08:00:00Z',
    updatedAt: '2026-10-28T14:30:00Z',
    items: [
      {
        id: 'itm-101',
        containerId: 'cnt-1',
        containerName: 'Container 1 (MSKU-904821 - 40ft)',
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
        warehouse: 'Warehouse A - Main Yard',
        addedDate: '2026-10-20',
        lastUpdated: '2026-10-27 15:20',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Stephen Mayowa',
      },
      {
        id: 'itm-102',
        containerId: 'cnt-1',
        containerName: 'Container 1 (MSKU-904821 - 40ft)',
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
        warehouse: 'Warehouse A - Main Yard',
        addedDate: '2026-10-20',
        lastUpdated: '2026-10-28 11:45',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Michael Ade',
      },
      {
        id: 'itm-103',
        containerId: 'cnt-1',
        containerName: 'Container 1 (MSKU-904821 - 40ft)',
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
        warehouse: 'Warehouse A - Main Yard',
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
        containerName: 'Container 1 (MSKU-904821 - 40ft)',
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
        containerName: 'Container 1 (MSKU-904821 - 40ft)',
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
    name: 'Container 2 (CMAU-441092 - 40ft)',
    warehouse: 'Warehouse B - Annex',
    note: 'Hardware, Auto Parts & Building Materials',
    createdBy: 'Michael Ade',
    updatedBy: 'Michael Ade',
    createdAt: '2026-10-23T10:00:00Z',
    updatedAt: '2026-10-28T16:10:00Z',
    items: [
      {
        id: 'itm-201',
        containerId: 'cnt-2',
        containerName: 'Container 2 (CMAU-441092 - 40ft)',
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
        warehouse: 'Warehouse B - Annex',
        addedDate: '2026-10-23',
        lastUpdated: '2026-10-28 16:10',
        addedBy: 'Michael Ade',
        lastUpdatedBy: 'Michael Ade',
      },
      {
        id: 'itm-202',
        containerId: 'cnt-2',
        containerName: 'Container 2 (CMAU-441092 - 40ft)',
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
        warehouse: 'Warehouse B - Annex',
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
        containerName: 'Container 2 (CMAU-441092 - 40ft)',
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
  const cleanWarehouse = warehouse.trim() || 'Main Warehouse';
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
        summary: `Container "${cleanName}" registered at ${cleanWarehouse}`,
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
    const cleanWarehouse = warehouse.trim() || c.warehouse;

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
      summary: `Updated container name to "${cleanName}" • Warehouse: "${cleanWarehouse}"`,
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
  const credit = input.credit !== undefined ? Math.max(0, Number(input.credit)) : Math.max(0, amount - paid);
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
      warehouse: input.warehouse.trim() || c.warehouse,
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
      summary: `Added customer record • CBM: ${cbm} • Amount: ${formatMoney(amount)} • Paid: ${formatMoney(paid)} • Credit: ${formatMoney(credit)} • Taken: ${takenText} • Warehouse: ${newItem.warehouse}${receiverSummary}`,
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

    const amount = updates.amount !== undefined ? Math.max(0, Number(updates.amount) || 0) : existing.amount;
    const paid = updates.paid !== undefined ? Math.max(0, Number(updates.paid) || 0) : existing.paid;
    const credit =
      updates.credit !== undefined
        ? Math.max(0, Number(updates.credit))
        : Math.max(0, amount - paid);
    const cbm = updates.cbm !== undefined ? Math.max(0, Number(updates.cbm) || 0) : existing.cbm;
    const takenStatus = updates.takenStatus !== undefined ? updates.takenStatus : existing.takenStatus;
    const taken = updates.taken !== undefined ? updates.taken.trim() || takenStatus : existing.taken;

    const updatedItem: ContainerItem = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() || existing.name : existing.name,
      phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
      cbm,
      amount,
      takenStatus,
      taken,
      paid,
      credit,
      receiverName: updates.receiverName !== undefined ? updates.receiverName.trim() : existing.receiverName,
      receiverPhone: updates.receiverPhone !== undefined ? updates.receiverPhone.trim() : existing.receiverPhone,
      receiverDate: updates.receiverDate !== undefined ? updates.receiverDate.trim() : existing.receiverDate,
      warehouse: updates.warehouse !== undefined ? updates.warehouse.trim() || c.warehouse : existing.warehouse,
      lastUpdated: nowStr,
      lastUpdatedBy: person,
    };

    const updatedItems = c.items.map((i) => (i.id === itemId ? updatedItem : i));

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
      if (updates.warehouse !== undefined && updates.warehouse !== existing.warehouse) {
        parts.push(`Warehouse: ${updatedItem.warehouse}`);
      }
      summary = parts.length > 0 ? parts.join(' • ') : `Updated record details for ${updatedItem.name}`;
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

export function resetToDemoData(): void {
  saveContainers(INITIAL_CONTAINERS);
}

export function clearAllContainers(): void {
  saveContainers([]);
}
